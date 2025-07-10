import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { randomBytes } from "crypto";

// Add User type to Express.User
declare global {
  namespace Express {
    interface User extends SelectUser {}
    interface Session {
      googleOAuthRedirectURL?: string;
    }
  }
}

export function setupAuth(app: Express) {
  // Set up session middleware
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Local authentication removed - Google OAuth only
  
  // Configure Google Strategy for OAuth authentication
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    console.log("Setting up Google OAuth strategy");
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: "https://002e5d43-a381-4918-add1-5924ea8b7b98-00-cpsta0jzi56w.picard.replit.dev/api/auth/google/callback",
          scope: ["profile", "email"]
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            console.log("Google auth callback. Profile:", profile.id, profile.displayName);
            
            // Check if user exists with Google ID
            let user = await storage.getUserByGoogleId(profile.id);
            
            if (!user) {
              // Check if user exists with the same email
              if (profile.emails && profile.emails.length > 0) {
                const email = profile.emails[0].value;
                const existingUser = await storage.getUserByEmail(email);
                
                if (existingUser) {
                  // Update existing user with Google ID
                  console.log("Linking Google account to existing user:", existingUser.id);
                  user = await storage.updateUserGoogleId(existingUser.id, profile.id);
                } else {
                  // Create new user with Google info
                  console.log("Creating new user from Google profile");
                  
                  // Generate unique username from email or name
                  let username = email?.split('@')[0] || profile.displayName?.replace(/\s+/g, '') || '';
                  
                  // Check if username exists and append random numbers if needed
                  const existingUsername = await storage.getUserByUsername(username);
                  if (existingUsername) {
                    username = `${username}${Math.floor(Math.random() * 1000)}`;
                  }
                  
                  // Create new user
                  user = await storage.createUser({
                    username,
                    name: profile.displayName || "Google User",
                    email: email,
                    google_id: profile.id,
                    role: "Viewer" // Default role
                  });
                }
              } else {
                return done(new Error("Google profile didn't provide email information"));
              }
            }
            
            // Don't send password to client
            const { password: _, ...userWithoutPassword } = user;
            return done(null, userWithoutPassword as Express.User);
          } catch (error) {
            console.error("Error in Google auth callback:", error);
            return done(error);
          }
        }
      )
    );
  } else {
    console.warn("Google OAuth credentials missing, Google login will not be available");
  }

  // Serialize user to session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      
      // Don't send password to client
      const { password: _, ...userWithoutPassword } = user;
      done(null, userWithoutPassword as Express.User);
    } catch (error) {
      done(error);
    }
  });

  // Traditional login/register routes removed - Google OAuth only

  // Logout route
  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Failed to logout" });
      }
      
      return res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // Google OAuth login route with dynamic redirect URL construction
  app.get("/api/auth/google", (req, res) => {
    // Get the hostname from the request
    const hostname = req.hostname;
    const protocol = req.protocol;
    console.log(`Using hostname: ${hostname} and protocol: ${protocol} for Google OAuth redirect`);
    
    // Construct the full callback URL
    const redirectURL = `${protocol}://${hostname}/api/auth/google/callback`;
    console.log(`Constructed redirect URL: ${redirectURL}`);
    
    // Store the redirect URL in the session for verification during callback
    (req.session as any).googleOAuthRedirectURL = redirectURL;
    
    // Manually build the Google OAuth URL
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.append('client_id', process.env.GOOGLE_CLIENT_ID!);
    authUrl.searchParams.append('redirect_uri', redirectURL);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', 'profile email');
    authUrl.searchParams.append('prompt', 'select_account');
    
    const fullAuthUrl = authUrl.toString();
    console.log(`Redirecting to Google OAuth URL: ${fullAuthUrl}`);
    
    // Redirect the user to Google's auth page
    res.redirect(fullAuthUrl);
  });

  // Google OAuth callback route with dynamic redirect handling
  app.get("/api/auth/google/callback", async (req, res) => {
    try {
      const { code } = req.query;
      const redirectURL = (req.session as any).googleOAuthRedirectURL;
      
      if (!code) {
        console.error("No authorization code received from Google");
        return res.redirect('/auth?error=google_auth_failed');
      }
      
      if (!redirectURL) {
        console.error("No redirect URL found in session");
        return res.redirect('/auth?error=session_expired');
      }
      
      console.log(`Received authorization code from Google, exchanging for tokens using redirectURL: ${redirectURL}`);
      
      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: code as string,
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          redirect_uri: redirectURL,
          grant_type: 'authorization_code'
        })
      });
      
      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        console.error(`Token exchange failed: ${errorData}`);
        return res.redirect('/auth?error=token_exchange_failed');
      }
      
      const tokens = await tokenResponse.json();
      console.log("Successfully obtained access token from Google");
      
      // Fetch user profile with the access token
      const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });
      
      if (!profileResponse.ok) {
        console.error("Failed to fetch Google profile");
        return res.redirect('/auth?error=profile_fetch_failed');
      }
      
      const profile = await profileResponse.json();
      console.log(`Google profile fetched: ${profile.id}, ${profile.name}`);
      
      // Process user data
      let user = await storage.getUserByGoogleId(profile.id);
            
      if (!user) {
        // Check if user exists with the same email
        if (profile.email) {
          const existingUser = await storage.getUserByEmail(profile.email);
          
          if (existingUser) {
            // Update existing user with Google ID
            console.log(`Linking Google account to existing user: ${existingUser.id}`);
            user = await storage.updateUserGoogleId(existingUser.id, profile.id);
          } else {
            // Create new user with Google info
            console.log("Creating new user from Google profile");
            
            // Generate unique username from email or name
            let username = profile.email?.split('@')[0] || profile.name?.replace(/\s+/g, '') || '';
            
            // Check if username exists and append random numbers if needed
            const existingUsername = await storage.getUserByUsername(username);
            if (existingUsername) {
              username = `${username}${Math.floor(Math.random() * 1000)}`;
            }
            
            // Create new user
            user = await storage.createUser({
              username,
              name: profile.name || "Google User",
              email: profile.email,
              password: null,
              google_id: profile.id,
              role: "Viewer" // Default role
            });
          }
        } else {
          console.error("Google profile didn't provide email information");
          return res.redirect('/auth?error=missing_email');
        }
      }
      
      // Log in the user
      req.login(user, (err) => {
        if (err) {
          console.error("Error logging in user after Google auth:", err);
          return res.redirect('/auth?error=login_failed');
        }
        console.log(`Successfully logged in user after Google auth: ${user.id}`);
        res.redirect('/');
      });
      
    } catch (error) {
      console.error("Error handling Google OAuth callback:", error);
      res.redirect('/auth?error=server_error');
    }
  });

  // Get current user route
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    return res.status(200).json(req.user);
  });

  // Middleware to check if user is authenticated
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    next();
  };

  // Role-based access control middleware
  const requireRole = (allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const userRole = req.user?.role;
      if (!userRole || !allowedRoles.includes(userRole)) {
        return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
      }
      
      next();
    };
  };

  // Return middlewares that can be used in routes
  return {
    requireAuth,
    requireRole
  };
}
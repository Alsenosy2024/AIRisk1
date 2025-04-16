import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { randomBytes } from "crypto";

// Add User type to Express.User
declare global {
  namespace Express {
    interface User extends SelectUser {}
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

  // Configure LocalStrategy for username/password authentication
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Invalid username or password" });
        }

        const isPasswordValid = await storage.verifyPassword(password, user.password || "");
        if (!isPasswordValid) {
          return done(null, false, { message: "Invalid username or password" });
        }

        // Don't send password to client
        const { password: _, ...userWithoutPassword } = user;
        return done(null, userWithoutPassword as Express.User);
      } catch (error) {
        return done(error);
      }
    })
  );

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

  // Register route - create a new user
  app.post("/api/register", async (req, res, next) => {
    try {
      console.log("Registration attempt with data:", JSON.stringify(req.body, null, 2));
      const { username, password, name, email } = req.body;
      
      if (!username || !password || !name || !email) {
        console.log("Registration failed - missing fields:", { username: !!username, password: !!password, name: !!name, email: !!email });
        return res.status(400).json({ message: "All fields are required" });
      }

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        console.log("Registration failed - username already exists:", username);
        return res.status(409).json({ message: "Username already exists" });
      }

      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        console.log("Registration failed - email already exists:", email);
        return res.status(409).json({ message: "Email already exists" });
      }

      console.log("Hashing password and creating user");
      // Hash password and create user
      const hashedPassword = await storage.hashPassword(password);
      console.log("Password hashed successfully");
      
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        name,
        email,
        role: "Viewer" // Default role for new users
      });
      console.log("User created successfully:", user.id);

      // Send welcome email to the user
      try {
        const { sendConfirmationEmail } = await import("./services/email-service");
        const emailResult = await sendConfirmationEmail(email, name);
        
        if (emailResult.success) {
          console.log("Welcome email sent successfully");
        } else {
          console.warn("Failed to send welcome email");
        }
        
        // Include email preview URL in development environment
        const devEmailPreview = process.env.NODE_ENV !== 'production' && emailResult.previewUrl 
          ? { devEmailPreview: emailResult.previewUrl } 
          : {};
          
        // Log the user in after registration
        req.login(user, (err) => {
          if (err) {
            console.error("Login after registration failed:", err);
            return next(err);
          }
          
          console.log("User logged in after registration:", user.id);
          // Return user without password
          const { password: _, ...userWithoutPassword } = user;
          return res.status(201).json({
            ...userWithoutPassword,
            ...devEmailPreview
          });
        });
      } catch (emailError) {
        console.error("Error sending welcome email:", emailError);
        
        // Continue with login even if email sending fails
        req.login(user, (err) => {
          if (err) {
            console.error("Login after registration failed:", err);
            return next(err);
          }
          
          console.log("User logged in after registration:", user.id);
          // Return user without password
          const { password: _, ...userWithoutPassword } = user;
          return res.status(201).json(userWithoutPassword);
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({ 
        message: "Internal server error", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Login route
  app.post("/api/login", (req, res, next) => {
    console.log("Login attempt with data:", JSON.stringify(req.body, null, 2));
    
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error("Login authentication error:", err);
        return next(err);
      }
      
      if (!user) {
        console.log("Login failed - Invalid credentials:", info?.message);
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      
      console.log("User authenticated successfully, proceeding to login");
      req.login(user, (err) => {
        if (err) {
          console.error("Login session creation error:", err);
          return next(err);
        }
        
        console.log("Login successful for user:", user.id);
        return res.status(200).json(user);
      });
    })(req, res, next);
  });

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
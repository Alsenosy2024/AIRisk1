import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser
} from 'firebase/auth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';

// Type for our auth user (from our database, not Firebase)
type User = {
  id: number;
  username: string;
  name: string;
  email: string;
  role: "Admin" | "Risk Manager" | "Project Manager" | "Viewer";
  firebase_uid: string;
};

// Auth context type
type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: Error | null;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogleAuth: () => Promise<void>;
  logout: () => Promise<void>;
};

// Create the auth context
export const FirebaseAuthContext = createContext<AuthContextType | null>(null);

// Provider component
export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const { toast } = useToast();

  // Handle user authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      
      if (fbUser) {
        try {
          // Get the ID token
          const idToken = await fbUser.getIdToken();
          
          // Verify with our backend and get user data
          const res = await apiRequest('POST', '/api/auth/verify-token', { idToken });
          
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Failed to verify user');
          }
          
          const userData = await res.json();
          setUser(userData);
        } catch (err) {
          console.error('Error setting user:', err);
          setError(err instanceof Error ? err : new Error('An unknown error occurred'));
          setUser(null);
          
          toast({
            title: 'Authentication Error',
            description: err instanceof Error ? err.message : 'Failed to authenticate user',
            variant: 'destructive',
          });
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [toast]);

  // Sign up with email/password
  const signUp = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Create user in Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Get the ID token
      const idToken = await userCredential.user.getIdToken();
      
      // Register with our backend
      const res = await apiRequest('POST', '/api/auth/register', { 
        idToken, 
        email, 
        name 
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to register user');
      }
      
      const userData = await res.json();
      setUser(userData);
      
      toast({
        title: 'Account created',
        description: 'Your account has been created successfully.',
      });
    } catch (err) {
      console.error('Signup error:', err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      
      toast({
        title: 'Signup failed',
        description: err instanceof Error ? err.message : 'Failed to create account',
        variant: 'destructive',
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign in with email/password
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Sign in with Firebase
      await signInWithEmailAndPassword(auth, email, password);
      
      // Note: Actual user data will be set by the auth state observer
      
      toast({
        title: 'Logged in',
        description: 'You have been logged in successfully.',
      });
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      
      toast({
        title: 'Login failed',
        description: err instanceof Error ? err.message : 'Failed to log in',
        variant: 'destructive',
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Google
  const signInWithGoogleAuth = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      
      // Get the ID token
      const idToken = await userCredential.user.getIdToken();
      
      // Authenticate with our backend
      const res = await apiRequest('POST', '/api/auth/google-auth', { 
        idToken,
        email: userCredential.user.email,
        name: userCredential.user.displayName || userCredential.user.email?.split('@')[0] || 'User'
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to authenticate with Google');
      }
      
      const userData = await res.json();
      setUser(userData);
      
      toast({
        title: 'Logged in with Google',
        description: 'You have been logged in successfully.',
      });
    } catch (err) {
      console.error('Google auth error:', err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      
      toast({
        title: 'Google login failed',
        description: err instanceof Error ? err.message : 'Failed to log in with Google',
        variant: 'destructive',
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Log out
  const logout = async () => {
    try {
      setLoading(true);
      
      // Sign out from Firebase
      await signOut(auth);
      
      // Sign out from our backend
      await apiRequest('POST', '/api/auth/logout');
      
      setUser(null);
      
      toast({
        title: 'Logged out',
        description: 'You have been logged out successfully.',
      });
    } catch (err) {
      console.error('Logout error:', err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      
      toast({
        title: 'Logout failed',
        description: err instanceof Error ? err.message : 'Failed to log out',
        variant: 'destructive',
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    signUp,
    signIn,
    signInWithGoogleAuth,
    logout
  };

  return (
    <FirebaseAuthContext.Provider value={value}>
      {children}
    </FirebaseAuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useFirebaseAuth() {
  const context = useContext(FirebaseAuthContext);
  
  if (!context) {
    throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider');
  }
  
  return context;
}
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth, signInWithGoogle, signInWithEmail, signUpWithEmail, signOutUser } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Type definitions
type AuthContextType = {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogleAuth: () => Promise<void>;
  logout: () => Promise<void>;
};

type FirebaseAuthProviderProps = {
  children: ReactNode;
};

// Create the Auth Context
const FirebaseAuthContext = createContext<AuthContextType | null>(null);

// Auth Provider component
export function FirebaseAuthProvider({ children }: FirebaseAuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Sync user with Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // User is signed in, sync with backend
        try {
          // Get the ID token
          const idToken = await firebaseUser.getIdToken();
          
          // Send to backend for session verification/creation
          await apiRequest("POST", "/api/auth/verify-token", { idToken });
        } catch (error) {
          console.error("Error syncing user with backend:", error);
        }
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sign up function
  const signUp = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      const user = await signUpWithEmail(email, password, name);
      
      // Get the ID token
      const idToken = await user.getIdToken();
      
      // Register with backend
      await apiRequest("POST", "/api/auth/register", { 
        idToken,
        name,
        email 
      });
      
      toast({
        title: "Account created",
        description: "You have been signed up successfully!",
      });
    } catch (error: any) {
      console.error("Sign up error:", error);
      toast({
        title: "Sign up failed",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const userCredential = await signInWithEmail(email, password);
      
      // Get the ID token
      const idToken = await userCredential.user.getIdToken();
      
      // Verify with backend
      await apiRequest("POST", "/api/auth/verify-token", { idToken });
      
      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      });
    } catch (error: any) {
      console.error("Sign in error:", error);
      toast({
        title: "Sign in failed",
        description: error.message || "Failed to sign in. Please check your credentials.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Google sign in function
  const signInWithGoogleAuth = async () => {
    try {
      setLoading(true);
      const userCredential = await signInWithGoogle();
      
      // Get the ID token
      const idToken = await userCredential.user.getIdToken();
      
      // Send to backend
      await apiRequest("POST", "/api/auth/google-auth", { 
        idToken,
        name: userCredential.user.displayName || '',
        email: userCredential.user.email || '' 
      });
      
      toast({
        title: "Google sign in successful",
        description: "You have been signed in with Google.",
      });
    } catch (error: any) {
      console.error("Google sign in error:", error);
      toast({
        title: "Google sign in failed",
        description: error.message || "Failed to sign in with Google.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      await signOutUser();
      
      // Notify backend
      await apiRequest("POST", "/api/auth/logout", {});
      
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    } catch (error: any) {
      console.error("Logout error:", error);
      toast({
        title: "Sign out failed",
        description: error.message || "Failed to sign out.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <FirebaseAuthContext.Provider
      value={{
        user,
        loading,
        signUp,
        signIn,
        signInWithGoogleAuth,
        logout,
      }}
    >
      {children}
    </FirebaseAuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useFirebaseAuth() {
  const context = useContext(FirebaseAuthContext);
  if (!context) {
    throw new Error("useFirebaseAuth must be used within a FirebaseAuthProvider");
  }
  return context;
}
import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type User = {
  id: number;
  username: string;
  name: string;
  email: string;
  role: "Admin" | "Risk Manager" | "Project Manager" | "Viewer";
};

type LoginCredentials = {
  username: string;
  password: string;
};

type AuthContextType = {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAdmin: boolean;
  isRiskManager: boolean;
  isProjectManager: boolean;
  hasEditPermission: boolean;
  hasDeletePermission: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  // For the demo, we'll auto-login a user on page load
  // In a real app, you would check for an existing session
  useEffect(() => {
    // Auto-login for the demo
    if (!user) {
      login({ username: "riskmgr", password: "risk123" }).catch(() => {
        toast({
          title: "Demo Login",
          description: "Using default user account for demonstration",
        });
      });
    }
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await apiRequest("POST", "/api/login", credentials);
      const userData = await response.json();
      setUser(userData);
      toast({
        title: "Logged in successfully",
        description: `Welcome, ${userData.name}`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || "Please check your credentials",
      });
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
  };

  // Compute permission flags based on user role
  const isAdmin = user?.role === "Admin";
  const isRiskManager = user?.role === "Risk Manager" || isAdmin;
  const isProjectManager = user?.role === "Project Manager" || isRiskManager;
  const hasEditPermission = isProjectManager;
  const hasDeletePermission = isRiskManager;
  
  const isLoading = false; // For demo, we're not actually loading, but you would check query status in a real app

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        logout, 
        isLoading,
        isAdmin,
        isRiskManager,
        isProjectManager,
        hasEditPermission,
        hasDeletePermission
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

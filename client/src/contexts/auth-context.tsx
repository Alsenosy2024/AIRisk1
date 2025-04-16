import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Types
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

type RegisterCredentials = {
  username: string;
  password: string;
  name: string;
  email: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  isRiskManager: boolean;
  isProjectManager: boolean;
  hasEditPermission: boolean;
  hasDeletePermission: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
};

// Create the auth context
export const AuthContext = createContext<AuthContextType | null>(null);

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Check if user is already logged in
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/user', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Login function
  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    
    try {
      const response = await apiRequest('POST', '/api/login', credentials);
      const userData = await response.json();
      setUser(userData);
      
      // Invalidate any cached data that might depend on authentication
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
      toast({
        title: 'Login successful',
        description: `Welcome back, ${userData.name}`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to login';
      
      toast({
        title: 'Login failed',
        description: message,
        variant: 'destructive',
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (credentials: RegisterCredentials) => {
    setIsLoading(true);
    
    try {
      const response = await apiRequest('POST', '/api/register', credentials);
      const userData = await response.json();
      setUser(userData);
      
      // Invalidate any cached data that might depend on authentication
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
      toast({
        title: 'Registration successful',
        description: `Welcome, ${userData.name}`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to register';
      
      toast({
        title: 'Registration failed',
        description: message,
        variant: 'destructive',
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setIsLoading(true);
    
    try {
      await apiRequest('POST', '/api/logout');
      
      setUser(null);
      queryClient.clear();
      
      toast({
        title: 'Logged out',
        description: 'You have been logged out successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to logout';
      
      toast({
        title: 'Logout failed',
        description: message,
        variant: 'destructive',
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Derive role-based permissions
  const isAdmin = Boolean(user && user.role === 'Admin');
  const isRiskManager = Boolean(user && (user.role === 'Admin' || user.role === 'Risk Manager'));
  const isProjectManager = Boolean(user && (user.role === 'Admin' || user.role === 'Risk Manager' || user.role === 'Project Manager'));
  const hasEditPermission = isProjectManager;
  const hasDeletePermission = isRiskManager;

  // Create context value
  const value: AuthContextType = {
    user,
    isLoading,
    isAdmin,
    isRiskManager,
    isProjectManager,
    hasEditPermission,
    hasDeletePermission,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
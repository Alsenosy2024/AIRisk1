import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Loader2 } from "lucide-react";

export default function ResetPasswordPage() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Extract token from URL
    const queryParams = new URLSearchParams(window.location.search);
    const tokenParam = queryParams.get("token");
    
    if (!tokenParam) {
      setError("Invalid or missing reset token");
      setIsLoading(false);
      return;
    }
    
    setToken(tokenParam);
    setIsLoading(false);
  }, []);
  
  // If no token or error, redirect to auth page after 3 seconds
  useEffect(() => {
    if ((!token && !isLoading) || error) {
      const timer = setTimeout(() => {
        navigate("/auth");
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [token, isLoading, error, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p>Loading...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
            <p className="mb-4">{error}</p>
            <p className="text-sm text-muted-foreground">
              Redirecting you to login page...
            </p>
          </div>
        ) : token ? (
          <ResetPasswordForm token={token} />
        ) : null}
      </div>
    </div>
  );
}
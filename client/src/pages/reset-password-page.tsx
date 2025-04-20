import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const passwordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof passwordSchema>;

export default function ResetPasswordPage() {
  const [, navigate] = useLocation();
  const [_, params] = useRoute("/reset-password");
  const { toast } = useToast();
  
  const [token, setToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get token from URL query params
    const query = new URLSearchParams(window.location.search);
    const tokenFromQuery = query.get("token");
    
    if (!tokenFromQuery) {
      setError("Reset token is missing. Please request a new password reset link.");
      return;
    }
    
    console.log("Token found in URL:", tokenFromQuery);
    setToken(tokenFromQuery);
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (!token) {
      setError("Reset token is missing. Please request a new password reset link.");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    console.log("Submitting reset password with token:", token);
    
    try {
      const response = await apiRequest("POST", "/api/reset-password", {
        token,
        newPassword: data.password,
      });
      
      console.log("Reset password response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Reset password error:", errorData);
        throw new Error(errorData.message || "Something went wrong");
      }
      
      const result = await response.json();
      console.log("Reset password success:", result);
      
      setIsSuccessful(true);
      
      toast({
        title: "Password reset successful",
        description: "Your password has been reset successfully. You can now login with your new password.",
        variant: "default",
      });
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        navigate("/auth");
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      console.error("Reset password error details:", err);
      setError(errorMessage);
      
      toast({
        title: "Password reset failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Reset Your Password</CardTitle>
          <CardDescription>
            Create a new password for your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {isSuccessful ? (
            <div className="py-6 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-xl font-medium">Password Reset Successful</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Your password has been reset successfully.
                <br />
                Redirecting you to the login page...
              </p>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter your new password"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Confirm your new password"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button
                  type="submit"
                  className="w-full mt-6"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting Password...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <Button
            variant="link"
            onClick={() => navigate("/auth")}
            disabled={isSubmitting}
          >
            Back to Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
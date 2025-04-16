import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Loader2, ExternalLink } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type FormValues = z.infer<typeof formSchema>;

export function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setError(null);
    setPreviewUrl(null);
    
    try {
      const response = await apiRequest("POST", "/api/forgot-password", data);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Something went wrong");
      }
      
      const result = await response.json();
      setIsSubmitted(true);
      
      // Handle dev mode with Ethereal Email preview URL
      if (result.devMode && result.previewUrl) {
        setPreviewUrl(result.previewUrl);
      }
      
      toast({
        title: "Reset email sent",
        description: "If your email exists in our system, you will receive reset instructions shortly.",
        variant: "default",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      
      toast({
        title: "Request failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Reset Password</CardTitle>
        <CardDescription>
          Enter your email to receive a password reset link
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isSubmitted ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="your.email@example.com" 
                        {...field} 
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </form>
          </Form>
        ) : (
          <div className="py-4 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-medium">Check your email</h3>
            <p className="text-sm text-muted-foreground mt-2">
              We've sent a password reset link to your email address.
              <br />The link will expire in 1 hour.
            </p>
            
            {previewUrl && (
              <div className="mt-6 p-4 bg-muted rounded-md border text-left">
                <h4 className="font-medium mb-2 flex items-center gap-1">
                  <span>Development Mode</span>
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Since we're using Ethereal Email for testing, you can view the email here:
                </p>
                <a 
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary flex items-center gap-1 text-sm hover:underline"
                >
                  View Email <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-center border-t pt-4">
        <Button 
          variant="ghost" 
          onClick={onBack}
          disabled={isSubmitting}
        >
          Back to login
        </Button>
      </CardFooter>
    </Card>
  );
}
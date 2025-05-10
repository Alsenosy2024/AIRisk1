import { z } from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Loader2, ExternalLink } from "lucide-react";
import { FcGoogle } from "react-icons/fc";

// Register form schema
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
});

type RegisterFormProps = {
  onSuccess?: () => void;
};

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [, navigate] = useLocation();
  const { registerMutation } = useAuth();
  const { toast } = useToast();
  const [emailPreviewUrl, setEmailPreviewUrl] = useState<string | null>(null);

  // Register form
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
      email: "",
    },
  });

  // Handle register form submission
  const onRegisterSubmit = async (values: z.infer<typeof registerSchema>) => {
    try {
      const result = await registerMutation.mutateAsync(values);
      
      // Check if there's a preview URL for the confirmation email
      if (result && 'devEmailPreview' in result) {
        setEmailPreviewUrl(result.devEmailPreview as string);
        
        toast({
          title: "Registration successful",
          description: "A confirmation email has been sent. Check the preview link below.",
        });
      } else {
        toast({
          title: "Registration successful",
          description: `Welcome, ${result.name}! A confirmation email has been sent to your address.`,
        });
      }
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Registration error:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>
          Register a new account to get started
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            id="register-form"
            onSubmit={form.handleSubmit(onRegisterSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="John Doe"
                      {...field}
                      autoComplete="name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      {...field}
                      autoComplete="email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="johndoe"
                      {...field}
                      autoComplete="username"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="******"
                      {...field}
                      autoComplete="new-password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
          {emailPreviewUrl && (
            <Alert className="mt-4">
              <AlertTitle>Confirmation Email Preview</AlertTitle>
              <AlertDescription className="flex flex-col gap-2">
                <p>A confirmation email has been sent. Since you're in development mode, you can preview it here:</p>
                <a 
                  href={emailPreviewUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary flex items-center hover:underline"
                >
                  View Email Preview <ExternalLink className="ml-1 h-4 w-4" />
                </a>
              </AlertDescription>
            </Alert>
          )}
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <Button
          type="submit"
          form="register-form"
          className="w-full"
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait
            </>
          ) : (
            "Create Account"
          )}
        </Button>
        
        <div className="relative flex items-center justify-center my-2">
          <div className="absolute border-t border-gray-300 w-full"></div>
          <span className="relative px-2 bg-white text-sm text-gray-500">or</span>
        </div>
        
        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center justify-center gap-2 border-gray-300 hover:bg-gray-50"
          onClick={() => window.location.href = "/api/auth/google"}
        >
          <FcGoogle className="h-5 w-5" />
          <span>Sign up with Google</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
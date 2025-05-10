import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

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
import { Loader2 } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { ForgotPasswordForm } from "./forgot-password-form";

// Login form schema
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormProps = {
  onSuccess?: () => void;
};

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [, navigate] = useLocation();
  const { loginMutation } = useAuth();
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Login form
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Handle login form submission
  const onLoginSubmit = async (values: z.infer<typeof loginSchema>) => {
    try {
      await loginMutation.mutateAsync(values);
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  if (showForgotPassword) {
    return <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            id="login-form"
            onSubmit={form.handleSubmit(onLoginSubmit)}
            className="space-y-4"
          >
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
                      autoComplete="current-password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <Button
          type="submit"
          form="login-form"
          className="w-full"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait
            </>
          ) : (
            "Sign In"
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
          <span>Sign in with Google</span>
        </Button>
        
        <Button
          variant="link"
          className="px-0 text-sm"
          onClick={() => setShowForgotPassword(true)}
        >
          Forgot your password?
        </Button>
      </CardFooter>
    </Card>
  );
}
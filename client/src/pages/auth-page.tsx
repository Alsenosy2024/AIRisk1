import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [location, navigate] = useLocation();
  const { user } = useAuth();

  // Check URL for tab parameter on initial load
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam === 'register') {
      setActiveTab("register");
    }
  }, []);

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Column - Form */}
      <div className="flex items-center justify-center w-full lg:w-1/2 px-4 py-12">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Risk Management Portal</h1>
            <p className="mt-2 text-muted-foreground">
              Sign in to your account or create a new one
            </p>
          </div>

          <Tabs
            defaultValue="login"
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "login" | "register")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <LoginForm onSuccess={() => navigate("/")} />
            </TabsContent>

            <TabsContent value="register">
              <RegisterForm onSuccess={() => navigate("/")} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right Column - Hero Image/Content */}
      <div className="hidden lg:flex w-1/2 bg-gray-100 dark:bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-primary-foreground/30" />
        <div className="relative z-10 flex flex-col justify-center items-center px-12 py-24 text-center">
          <h2 className="text-4xl font-bold mb-4">Intelligent Risk Management</h2>
          <p className="text-xl mb-8">
            Manage, track, and analyze risks with our AI-powered platform
          </p>
          <div className="grid grid-cols-2 gap-6 w-full max-w-2xl">
            <div className="bg-background/80 backdrop-blur-sm p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-2">AI Risk Analysis</h3>
              <p>Get intelligent insights and recommendations for your risks</p>
            </div>
            <div className="bg-background/80 backdrop-blur-sm p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-2">Comprehensive Dashboard</h3>
              <p>Visualize and track all your risks in one central location</p>
            </div>
            <div className="bg-background/80 backdrop-blur-sm p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-2">Export Reports</h3>
              <p>Generate detailed PDF reports for stakeholders and meetings</p>
            </div>
            <div className="bg-background/80 backdrop-blur-sm p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-2">Collaboration</h3>
              <p>Work together with your team to manage and mitigate risks</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
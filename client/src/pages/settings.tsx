import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/theme-provider";
import { apiRequest } from "@/lib/queryClient";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { PaymentBrandStrip } from "@/components/payments/payment-brand-strip";

// Schema for profile settings form
const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  bio: z.string().optional(),
});

// Schema for notification settings form
const notificationFormSchema = z.object({
  emailNotifications: z.boolean(),
  criticalRiskAlerts: z.boolean(),
  statusChangeAlerts: z.boolean(),
  weeklyDigest: z.boolean(),
});

// Schema for appearance settings form
const appearanceFormSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  fontSize: z.enum(["small", "medium", "large"]),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type NotificationFormValues = z.infer<typeof notificationFormSchema>;
type AppearanceFormValues = z.infer<typeof appearanceFormSchema>;

type PaymentConfig = {
  baseUrl: string;
  publicKey: string;
  integrationIdCapture: string;
  integrationIdUsd: string;
  currency: string;
  supportedCurrencies: string[];
};

export default function Settings() {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [preferredCurrency, setPreferredCurrency] = useState<string | undefined>(undefined);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      bio: "",
    },
  });

  // Notification form
  const notificationForm = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      emailNotifications: true,
      criticalRiskAlerts: true,
      statusChangeAlerts: false,
      weeklyDigest: true,
    },
  });

  // Appearance form
  const appearanceForm = useForm<AppearanceFormValues>({
    resolver: zodResolver(appearanceFormSchema),
    defaultValues: {
      theme: theme as "light" | "dark" | "system",
      fontSize: "medium",
    },
  });

  // Profile form submission
  const onProfileSubmit = (data: ProfileFormValues) => {
    toast({
      title: "Profile Updated",
      description: "Your profile settings have been saved.",
    });
  };

  // Notification form submission
  const onNotificationSubmit = (data: NotificationFormValues) => {
    toast({
      title: "Notification Preferences Updated",
      description: "Your notification settings have been saved.",
    });
  };

  // Appearance form submission
  const onAppearanceSubmit = (data: AppearanceFormValues) => {
    setTheme(data.theme);
    toast({
      title: "Appearance Settings Updated",
      description: "Your appearance settings have been saved.",
    });
  };

  useEffect(() => {
    let isActive = true;

    const fetchPaymentConfig = async () => {
      setPaymentLoading(true);
      setPaymentError(null);

      try {
        const query = preferredCurrency ? `?currency=${preferredCurrency}` : "";
        const response = await apiRequest("GET", `/api/payment/config${query}`);
        const data: PaymentConfig = await response.json();

        if (!isActive) return;
        setPaymentConfig(data);

        if (!preferredCurrency && data.currency) {
          setPreferredCurrency(data.currency);
        }
      } catch (error) {
        if (!isActive) return;
        const message =
          error instanceof Error
            ? error.message
            : "Unable to load payment settings. Please verify your Paymob credentials.";

        setPaymentError(message);
        toast({
          title: "Payment settings unavailable",
          description: message,
          variant: "destructive",
        });
      } finally {
        if (isActive) {
          setPaymentLoading(false);
        }
      }
    };

    fetchPaymentConfig();

    return () => {
      isActive = false;
    };
  }, [preferredCurrency, toast]);

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      {sidebarVisible && <Sidebar />}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={toggleSidebar} />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          {/* Page Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
            <p className="text-gray-600 mt-1">Manage your account and application preferences</p>
          </div>

          {/* Settings Tabs */}
          <Tabs defaultValue="profile" className="max-w-4xl">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
            </TabsList>

            {/* Profile Settings */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile</CardTitle>
                  <CardDescription>Manage your personal information and account settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                      <FormField
                        control={profileForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" />
                            </FormControl>
                            <FormDescription>
                              This email will be used for notifications and account-related communications.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bio</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormDescription>
                              A brief description about yourself or your role.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit">Save Profile</Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notification Settings */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>Configure how you receive alerts and updates</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...notificationForm}>
                    <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-6">
                      <FormField
                        control={notificationForm.control}
                        name="emailNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Email Notifications</FormLabel>
                              <FormDescription>
                                Receive notifications via email
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={notificationForm.control}
                        name="criticalRiskAlerts"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Critical Risk Alerts</FormLabel>
                              <FormDescription>
                                Get notified when critical risks are created or updated
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={notificationForm.control}
                        name="statusChangeAlerts"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Status Change Alerts</FormLabel>
                              <FormDescription>
                                Get notified when a risk status changes
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={notificationForm.control}
                        name="weeklyDigest"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Weekly Digest</FormLabel>
                              <FormDescription>
                                Receive a weekly summary of risk activities
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <Button type="submit">Save Notification Settings</Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Appearance Settings */}
            <TabsContent value="appearance">
              <Card>
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>Customize how the application looks and feels</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...appearanceForm}>
                    <form onSubmit={appearanceForm.handleSubmit(onAppearanceSubmit)} className="space-y-6">
                      <FormField
                        control={appearanceForm.control}
                        name="theme"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Theme</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select theme" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="light">Light</SelectItem>
                                <SelectItem value="dark">Dark</SelectItem>
                                <SelectItem value="system">System</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Select a theme for the application interface.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={appearanceForm.control}
                        name="fontSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Font Size</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select font size" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="small">Small</SelectItem>
                                <SelectItem value="medium">Medium (Default)</SelectItem>
                                <SelectItem value="large">Large</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Adjust text size throughout the application.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit">Save Appearance Settings</Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Billing & Payment Settings */}
            <TabsContent value="billing">
              <Card>
                <CardHeader>
                  <CardTitle>Billing & Payments</CardTitle>
                  <CardDescription>
                    Align your checkout UI with Paymob and surface USD pricing for subscriptions.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-800">Accepted cards</p>
                      <p className="text-sm text-gray-600">
                        Updated Visa and Mastercard styling keeps the payment strip crisp and legible.
                      </p>
                    </div>
                    <PaymentBrandStrip />
                  </div>

                  <Separator />

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-800">Subscription currency</p>
                        <p className="text-sm text-gray-600">
                          Users will see prices in {paymentConfig?.currency ?? "USD"} based on your Paymob integration.
                        </p>
                      </div>
                      <Select
                        value={preferredCurrency ?? paymentConfig?.currency ?? "USD"}
                        onValueChange={setPreferredCurrency}
                        disabled={paymentLoading || !paymentConfig}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          {(paymentConfig?.supportedCurrencies || ["USD"]).map((currency) => (
                            <SelectItem key={currency} value={currency}>
                              {currency}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">
                        Currency preference is shared with the API without exposing your Paymob secret key.
                      </p>
                    </div>

                    <div className="space-y-3 rounded-lg border bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-800">Gateway configuration</p>
                        <Badge variant="outline">USD-first</Badge>
                      </div>

                      {paymentLoading ? (
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-4 w-28" />
                        </div>
                      ) : paymentConfig ? (
                        <div className="space-y-3 text-sm text-gray-700">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-gray-600">Gateway URL</span>
                            <code className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-800">
                              {paymentConfig.baseUrl}
                            </code>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-gray-600">Public key</span>
                            <code className="max-w-[220px] truncate rounded bg-gray-100 px-2 py-1 text-xs text-gray-800">
                              {paymentConfig.publicKey}
                            </code>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-gray-600">Capture integration</span>
                            <code className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-800">
                              {paymentConfig.integrationIdCapture}
                            </code>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-gray-600">USD integration</span>
                            <code className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-800">
                              {paymentConfig.integrationIdUsd}
                            </code>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-gray-600">Displayed currency</span>
                            <Badge>{paymentConfig.currency}</Badge>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-red-600">
                          {paymentError ?? "Payment configuration is not available yet."}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm text-gray-600">
                    Paymob environment variables are read from server-side secrets and never exposed to the browser.
                  </p>
                  <Badge variant="secondary">Secure checkout ready</Badge>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

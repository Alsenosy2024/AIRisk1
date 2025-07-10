import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import RiskRegister from "@/pages/risk-register";
import AIGenerator from "@/pages/ai-generator";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import RiskIntelligence from "@/pages/risk-intelligence";
import Projects from "@/pages/projects";
import { ThemeProvider } from "@/components/theme-provider";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/risks" component={RiskRegister} />
      <Route path="/projects" component={Projects} />
      <Route path="/ai-generator" component={AIGenerator} />
      <Route path="/intelligence" component={RiskIntelligence} />
      <Route path="/reports" component={Reports} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <Router />
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

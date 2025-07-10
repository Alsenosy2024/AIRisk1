import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Menu, 
  Bell, 
  Search, 
  HelpCircle 
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  toggleSidebar: () => void;
}

export function Header({ toggleSidebar }: HeaderProps) {
  const [location, navigate] = useLocation();
  
  // Map routes to page titles
  const pageTitles: Record<string, string> = {
    "/": "Dashboard",
    "/risks": "Risk Register",
    "/projects": "Projects",
    "/ai-generator": "AI Risk Generator",
    "/intelligence": "Risk Intelligence",
    "/reports": "Reports",
    "/settings": "Settings",
  };

  return (
    <header className="bg-white/95 backdrop-blur-sm shadow-sm z-10 border-b border-gray-100 sticky top-0">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all duration-200"
              onClick={toggleSidebar}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex flex-col">
              <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
                {pageTitles[location] || "Page"}
              </h1>
              <div className="text-xs text-gray-500 font-medium">
                AI-Powered Risk Management
              </div>
            </div>

            {/* Enhanced Search Bar */}
            <div className="hidden lg:flex items-center max-w-lg w-full ml-8">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <Input 
                  type="search" 
                  placeholder="Search risks, projects, insights..." 
                  className="pl-11 pr-4 py-2.5 bg-gray-50/70 border-gray-200 text-sm w-full focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-400 transition-all duration-200"
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <HelpButton />
            <NotificationBell />
          </div>
        </div>
      </div>
    </header>
  );
}

function HelpButton() {
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all duration-200 hidden sm:flex"
    >
      <HelpCircle className="h-5 w-5" />
      <span className="sr-only">Help & Support</span>
    </Button>
  );
}

function NotificationBell() {
  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="icon" 
        className="text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all duration-200"
      >
        <span className="sr-only">View notifications</span>
        <Bell className="h-5 w-5" />
        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center text-[10px] text-white font-bold shadow-lg animate-pulse">
          3
        </span>
      </Button>
    </div>
  );
}



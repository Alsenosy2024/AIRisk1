import { useState } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { 
  ShieldAlert, 
  LayoutDashboard, 
  ClipboardList, 
  Bot, 
  FileText, 
  Settings, 
  LogOut,
  ChevronRight
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="hidden md:flex flex-col w-64 bg-gray-900 text-white transition-all duration-300">
      {/* App Logo & Title */}
      <div className="p-5 flex items-center border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <ShieldAlert className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-semibold tracking-tight">RiskAI Pro</span>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6">
        <div className="px-3 mb-6">
          <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Main
          </h3>
        </div>
        <nav className="px-3 space-y-1">
          <NavItem
            href="/"
            icon={<LayoutDashboard className="mr-3 h-5 w-5" />}
            label="Dashboard"
            isActive={location === "/"}
          />
          <NavItem
            href="/risks"
            icon={<ClipboardList className="mr-3 h-5 w-5" />}
            label="Risk Register"
            isActive={location === "/risks"}
          />
          <NavItem
            href="/ai-generator"
            icon={<Bot className="mr-3 h-5 w-5" />}
            label="AI Generator"
            isActive={location === "/ai-generator"}
          />
          <NavItem
            href="/reports"
            icon={<FileText className="mr-3 h-5 w-5" />}
            label="Reports"
            isActive={location === "/reports"}
          />
        </nav>
        
        <div className="px-3 mt-8 mb-6">
          <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Settings
          </h3>
        </div>
        <nav className="px-3 space-y-1">
          <NavItem
            href="/settings"
            icon={<Settings className="mr-3 h-5 w-5" />}
            label="Settings"
            isActive={location === "/settings"}
          />
        </nav>
      </div>
      
      {/* User Profile */}
      <div className="p-4 border-t border-gray-800 bg-gray-800 bg-opacity-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Avatar className="h-9 w-9 mr-3 border-2 border-blue-500">
              <AvatarImage src="" />
              <AvatarFallback className="bg-blue-600 text-white">{user?.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-white">{user?.name || "User"}</p>
              <p className="text-xs text-gray-400">{user?.role || "Guest"}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-gray-400 hover:text-white hover:bg-gray-700 rounded-full"
            onClick={() => logout()}
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

function NavItem({ href, icon, label, isActive }: NavItemProps) {
  // Use onClick with window.location instead of nested <a> tags to avoid DOM nesting errors
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.href = href;
  };

  return (
    <div
      className={cn(
        "flex items-center px-4 py-3 rounded-md cursor-pointer transition-colors group",
        isActive
          ? "text-white bg-blue-600 bg-opacity-90"
          : "text-gray-300 hover:bg-gray-800 hover:text-white"
      )}
      onClick={handleClick}
    >
      {icon}
      <span className="flex-1">{label}</span>
      {isActive && <ChevronRight className="h-4 w-4 text-white opacity-70" />}
    </div>
  );
}

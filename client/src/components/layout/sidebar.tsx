import { useState } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { cn } from "@/lib/utils";
// Authentication removed - direct access granted
import { 
  ShieldAlert, 
  LayoutDashboard, 
  ClipboardList, 
  Bot, 
  FileText, 
  Settings, 
  LogOut,
  ChevronRight,
  Lightbulb,
  FolderKanban
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const [location, navigate] = useLocation();
  // Default user - authentication removed
  const user = { name: "Default User", email: "user@example.com" };

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
      
      {/* Main Navigation */}
      <>
        {/* Navigation for all users */}
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
                href="/projects"
                icon={<FolderKanban className="mr-3 h-5 w-5" />}
                label="Projects"
                isActive={location === "/projects"}
              />
              <NavItem
                href="/ai-generator"
                icon={<Bot className="mr-3 h-5 w-5" />}
                label="AI Generator"
                isActive={location === "/ai-generator"}
              />
              <NavItem
                href="/intelligence"
                icon={<Lightbulb className="mr-3 h-5 w-5" />}
                label="Risk Intelligence"
                isActive={location === "/intelligence"}
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
          
          {/* User Profile for authenticated users */}
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
              {/* Logout removed - no authentication */}
            </div>
          </div>
        </>
      {/* Authentication removed - all users have access */}
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
  // Use Link from wouter instead of window.location for client-side routing
  const [_, navigate] = useLocation();

  const handleClick = () => {
    navigate(href);
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

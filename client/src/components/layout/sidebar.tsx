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
    <div className="hidden md:flex flex-col w-72 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 text-white transition-all duration-300 shadow-2xl">
      {/* App Logo & Title */}
      <div className="p-6 flex items-center border-b border-gray-700/50">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
            <ShieldAlert className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight">RiskAI Pro</span>
            <span className="text-xs text-blue-200 font-medium">Enterprise Edition</span>
          </div>
        </div>
      </div>
      
      {/* Main Navigation */}
      <>
        {/* Navigation for all users */}
          <div className="flex-1 overflow-y-auto py-6">
            <div className="px-4 mb-6">
              <h3 className="px-4 text-xs font-bold text-gray-300 uppercase tracking-wider">
                Analytics
              </h3>
            </div>
            <nav className="px-4 space-y-2">
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
            
            <div className="px-4 mt-8 mb-6">
              <h3 className="px-4 text-xs font-bold text-gray-300 uppercase tracking-wider">
                Configuration
              </h3>
            </div>
            <nav className="px-4 space-y-2">
              <NavItem
                href="/settings"
                icon={<Settings className="mr-3 h-5 w-5" />}
                label="Settings"
                isActive={location === "/settings"}
              />
            </nav>
          </div>
          
          {/* User Profile Section */}
          <div className="p-5 border-t border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-700/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Avatar className="h-11 w-11 mr-4 border-2 border-blue-400 shadow-lg">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold">
                    {user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-white">{user?.name || "Demo User"}</p>
                  <p className="text-xs text-blue-200 font-medium">Risk Manager</p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-400 font-medium">Online</span>
              </div>
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
  const [_, navigate] = useLocation();

  const handleClick = () => {
    navigate(href);
  };

  return (
    <div
      className={cn(
        "flex items-center px-4 py-3.5 rounded-xl cursor-pointer transition-all duration-300 group relative overflow-hidden",
        isActive
          ? "text-white bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-500/25 transform scale-[1.02]"
          : "text-gray-300 hover:bg-gray-700/50 hover:text-white hover:transform hover:scale-105"
      )}
      onClick={handleClick}
    >
      <div className={cn(
        "transition-all duration-300",
        isActive ? "text-white" : "text-gray-400 group-hover:text-blue-400"
      )}>
        {icon}
      </div>
      <span className="flex-1 font-medium">{label}</span>
      {isActive && (
        <div className="flex items-center">
          <div className="h-2 w-2 bg-white rounded-full mr-2 animate-pulse"></div>
          <ChevronRight className="h-4 w-4 text-white/80" />
        </div>
      )}
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent pointer-events-none"></div>
      )}
    </div>
  );
}

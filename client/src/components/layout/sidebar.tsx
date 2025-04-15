import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { 
  ShieldAlert, 
  LayoutDashboard, 
  ClipboardList, 
  Bot, 
  FileText, 
  Settings, 
  LogOut 
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="hidden md:flex flex-col w-64 bg-gray-800 text-white transition-all duration-300">
      <div className="p-4 flex items-center border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="h-6 w-6 text-blue-500" />
          <span className="text-xl font-semibold">RiskAI Pro</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <nav className="px-2 py-4 space-y-1">
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
          <NavItem
            href="/settings"
            icon={<Settings className="mr-3 h-5 w-5" />}
            label="Settings"
            isActive={location === "/settings"}
          />
        </nav>
      </div>
      
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Avatar className="h-8 w-8 mr-3">
              <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" />
              <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-white">{user?.name || "User"}</p>
              <p className="text-xs text-gray-400">{user?.role || "Guest"}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-gray-400 hover:text-white"
            onClick={() => logout()}
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
  return (
    <Link href={href}>
      <a
        className={cn(
          "flex items-center px-4 py-3 rounded-md group",
          isActive
            ? "text-white bg-gray-700"
            : "text-gray-300 hover:bg-gray-700"
        )}
      >
        {icon}
        <span>{label}</span>
      </a>
    </Link>
  );
}

import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, Bell, User, X } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";

interface HeaderProps {
  toggleSidebar: () => void;
}

export function Header({ toggleSidebar }: HeaderProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  
  // Map routes to page titles
  const pageTitles: Record<string, string> = {
    "/": "Dashboard",
    "/risks": "Risk Register",
    "/ai-generator": "AI Risk Generator",
    "/reports": "Reports",
    "/settings": "Settings",
  };

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-gray-500 hover:text-gray-600 hover:bg-gray-100"
              onClick={toggleSidebar}
            >
              <Menu className="h-6 w-6" />
            </Button>
            <h1 className="ml-3 text-xl font-semibold text-gray-800">
              {pageTitles[location] || "Page"}
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <NotificationBell />
            <UserMenu user={user} onLogout={logout} />
          </div>
        </div>
      </div>
    </header>
  );
}

function NotificationBell() {
  return (
    <div className="relative">
      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-500">
        <span className="sr-only">View notifications</span>
        <Bell className="h-6 w-6" />
        <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 flex items-center justify-center text-xs text-white font-semibold">3</span>
      </Button>
    </div>
  );
}

interface UserMenuProps {
  user: any;
  onLogout: () => void;
}

function UserMenu({ user, onLogout }: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative rounded-full h-8 w-8 p-0" aria-label="User menu">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
              alt="User"
            />
            <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" onClick={onLogout}>
          <X className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

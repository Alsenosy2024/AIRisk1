import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Menu, 
  Bell, 
  User, 
  LogOut, 
  Settings, 
  Search, 
  HelpCircle 
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  toggleSidebar: () => void;
}

export function Header({ toggleSidebar }: HeaderProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
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
    <header className="bg-white shadow-sm z-10 border-b border-gray-200">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-full"
              onClick={toggleSidebar}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="hidden sm:block text-xl font-bold text-gray-800">
              {pageTitles[location] || "Page"}
            </h1>

            {/* Search Bar for Larger Screens */}
            <div className="hidden lg:flex items-center max-w-md w-full">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <Input 
                  type="search" 
                  placeholder="Search risks, projects..." 
                  className="pl-10 py-2 bg-gray-50 border-gray-100 text-sm rounded-full w-full focus-visible:ring-blue-500"
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-3">
            <HelpButton />
            <NotificationBell />
            <UserMenu user={user} onLogout={() => logoutMutation.mutate()} />
          </div>
        </div>
      </div>
    </header>
  );
}

function HelpButton() {
  return (
    <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full hidden sm:flex">
      <HelpCircle className="h-5 w-5" />
    </Button>
  );
}

function NotificationBell() {
  return (
    <div className="relative">
      <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full">
        <span className="sr-only">View notifications</span>
        <Bell className="h-5 w-5" />
        <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-blue-600 flex items-center justify-center text-[10px] text-white font-semibold">3</span>
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
        <Button variant="ghost" className="relative rounded-full p-1 flex items-center gap-2 hover:bg-gray-100">
          <Avatar className="h-8 w-8 border-2 border-blue-100">
            <AvatarImage
              src=""
              alt="User"
            />
            <AvatarFallback className="bg-blue-600 text-white font-medium">{user?.name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <span className="hidden md:inline text-sm font-medium text-gray-700 max-w-[100px] truncate">
            {user?.name || "User"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 mt-1">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.name || "User"}</p>
            <p className="text-xs leading-none text-gray-500">{user?.email || "user@example.com"}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600" onClick={onLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

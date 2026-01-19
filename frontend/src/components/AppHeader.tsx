// src/components/AppHeader.tsx

import React from 'react';
import { Button } from "@/components/ui/button";
import { Calendar, FileText, CircleUser as UserCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import QuickThemeToggle from "@/components/QuickThemeToggle";

interface UserProfile {
  picture?: string;
}

interface AppHeaderProps {
  userProfile: UserProfile | null | undefined;
  setIsDrawerOpen: (open: boolean) => void;
  navigateToCalendar: () => void;
}

// 💥 CRITICAL: Wrap the component in React.memo
const AppHeader: React.FC<AppHeaderProps> = React.memo(({
  userProfile,
  setIsDrawerOpen,
  navigateToCalendar,
}) => {
  return (
    <header className="bg-gradient-hero border-b shadow-elegant">
      <div className="container mx-auto px-4 py-2 min-h-0">
        <div className="flex items-center justify-between min-h-0">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white leading-tight">
                NotesApp
              </h1>
              <p className="text-white/80 text-xs leading-tight">
                Capture your thoughts beautifully
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={navigateToCalendar} // Stable prop
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 px-2 py-1"
              title="calendar"
            >
              <Calendar className="h-4 w-4 mr-1" />
              <span className="text-sm">Calendar</span>
            </Button>
            <div className="[&_button]:text-white [&_button]:hover:bg-white/10">
              <QuickThemeToggle />
            </div>
            <Button
              onClick={() => setIsDrawerOpen(true)} // Stable setter
              variant="ghost"
              className="p-0 h-auto"
              title="Profile"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={userProfile?.picture}
                  alt="Profile Picture"
                />
                <AvatarFallback>
                  <UserCircle className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
});

AppHeader.displayName = 'AppHeader';
export default AppHeader;
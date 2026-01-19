import React from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePreferences, ThemeMode } from "@/context/PreferencesContext";

const QuickThemeToggle = React.memo(() => {
  const { preferences, updatePreference } = usePreferences();

  const themeOptions: { mode: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'light', label: 'Light', icon: <Sun className="h-4 w-4 mr-2" /> },
    { mode: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4 mr-2" /> },
    { mode: 'system', label: 'System', icon: <Monitor className="h-4 w-4 mr-2" /> },
  ];

  const currentIcon = preferences.themeMode === 'light'
    ? <Sun className="h-4 w-4" />
    : preferences.themeMode === 'dark'
    ? <Moon className="h-4 w-4" />
    : <Monitor className="h-4 w-4" />;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          {currentIcon}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {themeOptions.map((option) => (
          <DropdownMenuItem
            key={option.mode}
            onClick={() => updatePreference('themeMode', option.mode)}
            className="flex items-center cursor-pointer"
          >
            {option.icon}
            {option.label}
            {preferences.themeMode === option.mode && (
              <span className="ml-auto text-xs">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

QuickThemeToggle.displayName = 'QuickThemeToggle';
export default QuickThemeToggle;

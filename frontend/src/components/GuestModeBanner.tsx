import React from 'react';
import { CircleAlert as AlertCircle, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/context/AuthContext';

interface GuestModeBannerProps {
  onSignUp?: () => void;
}

const GuestModeBanner: React.FC<GuestModeBannerProps> = ({ onSignUp }) => {
  const { logout } = useAuthContext();

  return (
    <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-amber-500/30 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-amber-500/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
              Guest Mode
            </span>
            <span className="text-xs text-amber-600/80 dark:text-amber-400/80">
              Data is stored locally and will be lost when you log out
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300"
            onClick={() => {
              logout();
              if (onSignUp) onSignUp();
            }}
          >
            <LogIn className="h-3 w-3 mr-1" />
            Sign Up
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GuestModeBanner;

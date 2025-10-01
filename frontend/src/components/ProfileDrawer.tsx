import { User, Crown, Sparkles, Shield, Zap, LogOut } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthContext } from "../context/AuthContext";
import { decodeJWT } from "../lib/jwt";

interface ProfileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProfileDrawer({ open, onOpenChange }: ProfileDrawerProps) {
  const { token, logout } = useAuthContext();
  
  const payload = token ? decodeJWT(token) : null;
  const username = payload?.username || "User";
  const userInitials = username.substring(0, 2).toUpperCase();

  const premiumFeatures = [
    {
      icon: Sparkles,
      title: "Ad-Free Experience",
      description: "Enjoy distraction-free note-taking",
    },
    {
      icon: Shield,
      title: "Advanced Security",
      description: "End-to-end encryption for your notes",
    },
    {
      icon: Zap,
      title: "Priority Support",
      description: "Get help whenever you need it",
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[500px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-l border-white/10 text-white">
        <SheetHeader className="space-y-6 pb-6 border-b border-white/10">
          <SheetTitle className="text-2xl font-display font-bold text-white">
            Profile
          </SheetTitle>
          
          {/* Premium Profile Section */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl">
            <div className="flex items-start gap-4 mb-4">
              <Avatar className="h-16 w-16 border-2 border-primary shadow-glow">
                <AvatarImage src="" alt={username} />
                <AvatarFallback className="bg-gradient-primary text-white text-xl font-bold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h3 className="text-xl font-display font-bold text-white mb-2">
                  {username}
                </h3>
                <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0 shadow-lg">
                  <Crown className="h-3 w-3 mr-1" />
                  Premium User
                </Badge>
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Premium Features */}
        <div className="py-6 space-y-4">
          <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">
            Your Premium Benefits
          </h4>
          
          {premiumFeatures.map((feature, index) => (
            <div
              key={index}
              className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-smooth group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/20 rounded-lg group-hover:bg-primary/30 transition-smooth">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h5 className="font-semibold text-white mb-1">
                    {feature.title}
                  </h5>
                  <p className="text-sm text-white/60">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-6 border-t border-white/10">
          <Button
            className="w-full bg-gradient-primary hover:opacity-90 shadow-glow font-semibold py-6 rounded-xl text-base"
            size="lg"
          >
            <Crown className="h-5 w-5 mr-2" />
            Manage Subscription
          </Button>
          
          <Button
            onClick={() => {
              logout();
              onOpenChange(false);
            }}
            variant="outline"
            className="w-full border-red-500/30 bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 font-semibold py-6 rounded-xl text-base backdrop-blur-md"
            size="lg"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Logout
          </Button>
        </div>

        {/* Footer */}
        <div className="pt-6 mt-6 border-t border-white/10">
          <p className="text-xs text-white/50 text-center">
            Member since {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

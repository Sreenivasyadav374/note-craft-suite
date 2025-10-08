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
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useToast } from "@/hooks/use-toast";
import ProfilePictureUpload from "./ProfilePictureUpload";

interface ProfileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProfileDrawer({ open, onOpenChange }: ProfileDrawerProps) {
  const { token, logout, isAuthenticated, googleLogin, userProfile, loading, updateProfilePicture } = useAuthContext();
  const { toast } = useToast();

  const payload = token ? decodeJWT(token) : null;
  const username = userProfile?.name || payload?.username || "User";
  const userEmail = userProfile?.email || payload?.email || "";
  const userPicture = userProfile?.picture;
  const userInitials = username.substring(0, 2).toUpperCase();

  const handleUploadSuccess = (imageUrl: string) => {
    updateProfilePicture(imageUrl);
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      const res = await googleLogin(credentialResponse.credential);
      if (res.token) {
        toast({
          title: "Welcome!",
          description: "Successfully signed in with Google",
        });
        onOpenChange(false);
      } else if (res.error) {
        toast({
          title: "Sign-in failed",
          description: res.error,
          variant: "destructive",
        });
      }
    }
  };

  const handleGoogleError = () => {
    toast({
      title: "Sign-in failed",
      description: "Failed to sign in with Google. Please try again.",
      variant: "destructive",
    });
  };

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
      <SheetContent className="w-[400px] sm:w-[540px] bg-gradient-hero border-l border-border/50 text-foreground overflow-y-auto">
        <SheetHeader className="space-y-4 pb-4 border-b border-border/50">
          <SheetTitle className="text-3xl font-bold text-foreground">
            {isAuthenticated ? "Profile" : "Welcome"}
          </SheetTitle>

          {!isAuthenticated ? (
            <div className="bg-gradient-card rounded-2xl p-8 border border-border/50 shadow-card">
              <div className="text-center mb-6">
                <div className="mx-auto w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mb-4 shadow-glow">
                  <User className="h-10 w-10 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Sign In to Continue
                </h3>
                <p className="text-sm text-muted-foreground">
                  Access your notes and features
                </p>
              </div>

              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="filled_blue"
                  size="large"
                  text="signin_with"
                  shape="rectangular"
                  logo_alignment="left"
                />
              </div>
            </div>
          ) : (
            <div className="bg-gradient-card rounded-2xl p-5 border border-border/50 shadow-card">
              <ProfilePictureUpload
                currentPicture={userPicture}
                username={username}
                onUploadSuccess={handleUploadSuccess}
              />

              <div className="mt-5 pt-5 border-t border-border/50 text-center">
                <h3 className="text-xl font-bold text-foreground mb-1">
                  {username}
                </h3>
                {userEmail && (
                  <p className="text-sm text-muted-foreground mb-3">{userEmail}</p>
                )}
                <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0 shadow-sm">
                  <Crown className="h-3 w-3 mr-1" />
                  Premium User
                </Badge>
              </div>
            </div>
          )}
        </SheetHeader>

        {isAuthenticated && (
          <>
            <div className="py-5 space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Your Premium Benefits
              </h4>

              {premiumFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="bg-gradient-card backdrop-blur-sm rounded-xl p-4 border border-border/50 hover:shadow-card transition-smooth group"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-smooth">
                      <feature.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-semibold text-foreground mb-0.5 text-sm">
                        {feature.title}
                      </h5>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2.5 pt-5 border-t border-border/50">
              <Button
                className="w-full bg-gradient-primary hover:opacity-90 shadow-glow font-semibold py-5 rounded-xl text-base"
                size="lg"
              >
                <Crown className="h-4 w-4 mr-2" />
                Manage Subscription
              </Button>

              <Button
                onClick={() => {
                  logout();
                  onOpenChange(false);
                }}
                variant="outline"
                className="w-full border-red-500/30 bg-red-600/10 hover:bg-red-600/20 text-red-600 hover:text-red-700 font-semibold py-5 rounded-xl text-base"
                size="lg"
                disabled={loading}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </>
        )}

        <div className="pt-5 mt-5 border-t border-border/50">
          <p className="text-xs text-muted-foreground text-center">
            Member since {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

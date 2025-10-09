import { useState } from "react";
import { Mail, User, Key, Shield, Calendar, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuthContext } from "../context/AuthContext";
import { decodeJWT } from "../lib/jwt";
import { useToast } from "@/hooks/use-toast";
import AppPreferences from "./AppPreferences";

export default function AccountSettings() {
  const { token, userProfile, changePassword } = useAuthContext();
  const { toast } = useToast();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const payload = token ? decodeJWT(token) : null;
  const username = userProfile?.name || payload?.username || "User";
  const email = userProfile?.email || "";
  const isGoogleUser = !!userProfile?.picture && userProfile.picture.includes('googleusercontent.com');
  
  // Calculate member since date (from token creation or localStorage)
  const memberSince = localStorage.getItem('memberSince') || new Date().toISOString();
  const joinDate = new Date(memberSince);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    const result = await changePassword(currentPassword, newPassword);
    setLoading(false);

    if (result.success) {
      toast({
        title: "Password changed",
        description: "Your password has been updated successfully."
      });
      setIsChangingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      toast({
        title: "Failed to change password",
        description: result.error || "Please check your current password.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Account Settings Section */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Account Settings
        </h4>

      {/* Account Details */}
      <div className="bg-gradient-card rounded-xl p-5 border border-border/50 space-y-4">
        <h5 className="font-semibold text-foreground flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          Account Details
        </h5>
        
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border border-border/50">
            <User className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Username</p>
              <p className="text-sm font-medium text-foreground truncate">{username}</p>
            </div>
          </div>

          {email && (
            <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border border-border/50">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium text-foreground truncate">{email}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border border-border/50">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Member Since</p>
              <p className="text-sm font-medium text-foreground">
                {joinDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Authentication Method */}
      <div className="bg-gradient-card rounded-xl p-5 border border-border/50 space-y-4">
        <h5 className="font-semibold text-foreground flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          Authentication Method
        </h5>
        
        <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border border-border/50">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              {isGoogleUser ? 'Google Sign-In' : 'Email & Password'}
            </p>
            <p className="text-xs text-muted-foreground">
              {isGoogleUser ? 'Authenticated via Google OAuth' : 'Traditional authentication'}
            </p>
          </div>
        </div>
      </div>

      {/* Password Change - Only for non-Google users */}
      {!isGoogleUser && (
        <div className="bg-gradient-card rounded-xl p-5 border border-border/50 space-y-4">
          <h5 className="font-semibold text-foreground flex items-center gap-2">
            <Key className="h-4 w-4 text-primary" />
            Password Management
          </h5>

          {!isChangingPassword ? (
            <Button
              onClick={() => setIsChangingPassword(true)}
              variant="outline"
              className="w-full"
              size="sm"
            >
              Change Password
            </Button>
          ) : (
            <form onSubmit={handlePasswordChange} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="current-password" className="text-xs">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="h-9"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-xs">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-9"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-xs">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-9"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" size="sm" disabled={loading} className="flex-1">
                  {loading ? "Updating..." : "Update Password"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
      </div>

      <Separator />

      {/* App Preferences Section */}
      <AppPreferences />
    </div>
  );
}

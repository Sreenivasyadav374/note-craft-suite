import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

// Define the preloading function
// The path must match the one used in React.lazy in App.tsx
const preloadNotesApp = () => {
  // This starts the download in the background
  // Since AuthPage is in /pages and NotesApp is in /components
  import("../components/NotesApp");
};

const AuthPage: React.FC = () => {
  const { login, register, isAuthenticated } = useAuthContext();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
        preloadNotesApp();
        toast({ title: "Logged in", description: "Welcome back!" });
      } else {
        await register(email, password);
        toast({ title: "Account created", description: "You can now log in." });
        setIsLogin(true);
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Authentication failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/notes" replace />;
  }
  return (
    <div className="min-h-screen flex items-center justify-center px-0 sm:px-0">
      <div className="w-full max-w-xs sm:max-w-md px-4 sm:px-0">
        <Card className="w-full shadow-elegant">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              {isLogin ? "Login to NoteCraft" : "Register for NoteCraft"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button
                type="submit"
                className="w-full bg-gradient-primary"
                disabled={loading}
              >
                {loading ? "Please wait..." : isLogin ? "Login" : "Register"}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <button
                type="button"
                className="text-primary underline text-sm"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin
                  ? "Don't have an account? Register"
                  : "Already have an account? Login"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/Auth";
import NotesPage from "./pages/Notes";
import ProtectedExample from "./pages/ProtectedExample";
import NotesApp from "./components/NotesApp";
import { useAuthContext, AuthProvider } from "./context/AuthContext";

const queryClient = new QueryClient();

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, initializing } = useAuthContext();
  const location = useLocation();
  if (initializing) {
    // Optionally render a spinner or null while auth state is loading
    return null;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

const App = () => {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<AuthPage />} />
              <Route path="/register" element={<AuthPage />} />
              <Route path="/notes" element={<RequireAuth><NotesPage /></RequireAuth>} />
              <Route path="/" element={<RequireAuth><NotesPage /></RequireAuth>} />
              <Route path="/protected" element={<ProtectedExample />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
};

function NotesAppWrapper() {
  const { isAuthenticated, token } = useAuthContext();
  console.log('NotesAppWrapper:', { isAuthenticated, token });
  if (isAuthenticated) {
    return <NotesApp />;
  }
  // Prevent rendering AuthPage if already authenticated; render nothing
  return null;
}

export default App;

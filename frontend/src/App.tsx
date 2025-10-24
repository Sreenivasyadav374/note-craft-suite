import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { useAuthContext, AuthProvider } from "./context/AuthContext";
import { NotesProvider } from "./context/NotesContext";
import { PreferencesProvider } from "./context/PreferencesContext";
import { ConnectionProvider } from "./context/ConnectionContext";

import React, { Suspense } from "react";

const LazyNotesApp = React.lazy(() => import("./components/NotesApp"));
const LazyNotesPage = React.lazy(() => import("./pages/Notes"));
const LazyCalendarView = React.lazy(() => import("./pages/CalendarView"));

// Keep these as they are likely smaller and needed immediately:
import AuthPage from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ProtectedExample from "./pages/ProtectedExample";
import Index from "./pages/Index";

// ... (Context imports and GOOGLE_CLIENT_ID remain the same)

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

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
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <ConnectionProvider>
          <PreferencesProvider>
            <NotesProvider>
              <QueryClientProvider client={queryClient}>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    {/* 2. Wrap Routes in Suspense for loading state */}
                    <Suspense
                      fallback={
                        <div className="flex justify-center items-center h-screen text-lg">
                          Loading Application...
                        </div>
                      }
                    >
                      <Routes>
                        <Route path="/login" element={<AuthPage />} />
                        <Route path="/register" element={<AuthPage />} />

                        {/* Use Lazy components for the main routes */}
                        <Route
                          path="/notes"
                          element={
                            <RequireAuth>
                              <LazyNotesApp />
                            </RequireAuth>
                          }
                        />
                        <Route
                          path="/calendar"
                          element={
                            <RequireAuth>
                              <LazyCalendarView />
                            </RequireAuth>
                          }
                        />
                        <Route
                          path="/"
                          element={
                            <RequireAuth>
                              <LazyNotesPage />
                            </RequireAuth>
                          }
                        />

                        <Route
                          path="/protected"
                          element={<ProtectedExample />}
                        />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </BrowserRouter>
                </TooltipProvider>
              </QueryClientProvider>
            </NotesProvider>
          </PreferencesProvider>
        </ConnectionProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
};

export default App;

import { useState, useEffect, useRef } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { useNavigate, useLocation,Navigate } from 'react-router-dom';

// // Dynamically load the Spline viewer script only once
// function useSplineScript() {
//   useEffect(() => {
//     if (!document.querySelector('script[data-spline-viewer]')) {
//       const script = document.createElement('script');
//       script.type = 'module';
//       script.src = 'https://unpkg.com/@splinetool/viewer@1.10.36/build/spline-viewer.js';
//       script.setAttribute('data-spline-viewer', 'true');
//       document.body.appendChild(script);
//     }
//   }, []);
// }


//   useSplineScript();
export default function AuthPage() {
  const { register, login, error, loading, isAuthenticated } = useAuthContext();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const navigate = useNavigate();
  const location = useLocation();

   if (isAuthenticated) {
    return <Navigate to="/notes" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      await login(username, password);
      //navigate('/notes', { replace: true });
    } else {
      await register(username, password);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-luxury">
      {/* Animated luxury background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Main luxury gradient overlay */}
        <div className="absolute inset-0 bg-gradient-hero opacity-90"></div>
        
        {/* Floating luxury orbs */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-primary-glow/20 to-primary-accent/20 rounded-full mix-blend-multiply filter blur-3xl animate-[float_8s_ease-in-out_infinite]"></div>
        <div className="absolute top-40 right-40 w-80 h-80 bg-gradient-to-l from-primary-accent/15 to-primary-glow/15 rounded-full mix-blend-multiply filter blur-2xl animate-[float_10s_ease-in-out_infinite_reverse]"></div>
        <div className="absolute bottom-32 left-32 w-72 h-72 bg-gradient-to-br from-primary-glow/25 to-primary-accent/10 rounded-full mix-blend-multiply filter blur-3xl animate-[float_9s_ease-in-out_infinite_1s]"></div>
        
        {/* Luxury mesh gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-accent/5 via-transparent to-primary-glow/5"></div>
        
        {/* Animated luxury particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary-accent rounded-full animate-pulse opacity-60"></div>
        <div className="absolute top-3/4 left-1/3 w-1 h-1 bg-primary-glow rounded-full animate-ping opacity-40"></div>
        <div className="absolute top-2/3 right-1/4 w-3 h-3 bg-primary-accent rounded-full animate-bounce opacity-30"></div>
      </div>

      {/* Premium Auth Card */}
      <div className="relative z-10 w-full max-w-md animate-fade-in"
           style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
        <div className="w-full p-8 rounded-3xl bg-card/95 backdrop-blur-2xl border border-border/20 shadow-luxury transition-all duration-700 hover:shadow-glow hover:scale-[1.02] animate-scale-in"
             style={{
               animationDelay: '0.5s',
               animationFillMode: 'both',
               background: 'rgba(255, 255, 255, 0.95)',
               backdropFilter: 'blur(20px) saturate(180%)',
               WebkitBackdropFilter: 'blur(20px) saturate(180%)',
             }}>
          
          {/* Luxury Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-display font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent tracking-tight">
              {mode === 'login' ? 'Welcome Back' : 'Join Us'}
            </h1>
            <p className="text-muted-foreground font-medium">
              {mode === 'login' ? 'Sign in to your account' : 'Create your luxury account'}
            </p>
          </div>

          {/* Premium Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <input
                  className="w-full h-12 px-4 bg-input/50 border border-border/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent placeholder:text-muted-foreground font-medium text-sm transition-all duration-300 hover:border-border/50"
                  placeholder="Enter your username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                />
              </div>
              <div>
                <input
                  className="w-full h-12 px-4 bg-input/50 border border-border/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent placeholder:text-muted-foreground font-medium text-sm transition-all duration-300 hover:border-border/50"
                  placeholder="Enter your password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium text-center">
                {error}
              </div>
            )}

            <button
              className="w-full h-12 rounded-xl font-semibold text-base bg-gradient-primary text-primary-foreground shadow-elegant hover:shadow-glow hover:scale-[1.02] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-accent disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  <span>Please wait...</span>
                </div>
              ) : (
                mode === 'login' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          {/* Switch Mode */}
          <div className="mt-8 text-center">
            <button
              className="font-medium text-sm text-muted-foreground hover:text-primary-accent transition-colors duration-200"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            >
              {mode === 'login' ? (
                <>Don't have an account? <span className="text-primary-accent font-semibold">Sign up</span></>
              ) : (
                <>Already have an account? <span className="text-primary-accent font-semibold">Sign in</span></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
    <div className="relative min-h-screen w-full flex items-center justify-end overflow-hidden bg-hero-pattern bg-cover bg-no-repeat">
      {/* Animated floating elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-primary rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-[float_6s_ease-in-out_infinite]"></div>
        <div className="absolute top-40 right-40 w-96 h-96 bg-gradient-primary rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-[float_8s_ease-in-out_infinite_reverse]"></div>
        <div className="absolute bottom-32 left-32 w-80 h-80 bg-gradient-hero rounded-full mix-blend-multiply filter blur-xl opacity-25 animate-[float_7s_ease-in-out_infinite_0.5s]"></div>
        
        {/* Animated particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full animate-pulse opacity-60"></div>
        <div className="absolute top-3/4 left-1/3 w-1 h-1 bg-primary rounded-full animate-ping opacity-40"></div>
        <div className="absolute top-2/3 right-1/4 w-3 h-3 bg-primary rounded-full animate-bounce opacity-30"></div>
        
        {/* Grid overlay with animation */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/5 to-transparent animate-pulse"></div>
      </div>

      {/* Login/Register Form Overlay - right side with entrance animation */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-md mr-12 lg:mr-24 xl:mr-32 animate-fade-in"
           style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
        <div
          className="max-w-sm w-full p-6 rounded-2xl glass-form transition-all duration-500 shadow-elegant border border-gray-900/80 hover:-translate-y-2 hover:scale-[1.03] hover:shadow-glow backdrop-blur-xl animate-scale-in"
          style={{
            background: 'rgba(30, 30, 30, 0.22)',
            boxShadow: '0 12px 40px 0 rgba(0,0,0,0.55), 0 1.5px 8px 0 rgba(80,80,80,0.18)',
            backdropFilter: 'blur(18px) saturate(180%)',
            WebkitBackdropFilter: 'blur(18px) saturate(180%)',
            border: '1.5px solid rgba(30,30,30,0.5)',
            animationDelay: '0.6s',
            animationFillMode: 'both'
          }}
        >
          <h2 className="text-3xl font-extrabold mb-6 text-center bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent drop-shadow-lg tracking-tight">
            {mode === 'login' ? 'Login' : 'Register'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              className="w-full border border-gray-800 bg-gradient-to-r from-black via-gray-800 to-gray-900 placeholder:text-gray-400 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700 font-medium text-base shadow-md backdrop-blur text-white"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
            />
            <input
              className="w-full border border-gray-800 bg-gradient-to-r from-black via-gray-800 to-gray-900 placeholder:text-gray-400 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700 font-medium text-base shadow-md backdrop-blur text-white"
              placeholder="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            {error && <div className="text-red-500 font-semibold text-center text-sm mb-2">{error}</div>}
            <button
              className="w-full py-2 rounded-lg font-bold text-lg bg-gradient-to-r from-black via-gray-800 to-gray-900 text-white shadow-lg hover:scale-[1.03] hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-700/60"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Loading...' : mode === 'login' ? 'Login' : 'Register'}
            </button>
          </form>
          <div className="mt-6 text-center">
            {mode === 'login' ? (
              <button
                className="font-semibold text-base text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text hover:underline hover:opacity-80 transition-all duration-150"
                onClick={() => setMode('register')}
              >
                Need an account? Register
              </button>
            ) : (
              <button
                className="font-semibold text-base text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text hover:underline hover:opacity-80 transition-all duration-150"
                onClick={() => setMode('login')}
              >
                Already have an account? Login
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

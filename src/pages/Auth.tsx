import { useState, useEffect, useRef } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';

// Dynamically load the Spline viewer script only once
function useSplineScript() {
  useEffect(() => {
    if (!document.querySelector('script[data-spline-viewer]')) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://unpkg.com/@splinetool/viewer@1.10.36/build/spline-viewer.js';
      script.setAttribute('data-spline-viewer', 'true');
      document.body.appendChild(script);
    }
  }, []);
}

export default function AuthPage() {
  // Call the hook here to ensure the script is loaded
  useSplineScript();

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
    } else {
      await register(username, password);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-end overflow-hidden">
      {/* Fullscreen Spline 3D Viewer as background */}
      <div className="absolute inset-0 w-full h-full z-0">
        <spline-viewer
          url="https://prod.spline.design/CtOm6IUSxT5Ztq6n/scene.splinecode"
          style={{ width: '100vw', height: '100vh', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }}
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>
      {/* Login/Register Form Overlay - right side */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-md mr-12 lg:mr-24 xl:mr-32">
        <div
          className="max-w-sm w-full p-6 rounded-2xl glass-form transition-transform duration-300 shadow-3d border border-gray-900/80 hover:-translate-y-2 hover:scale-[1.03] hover:shadow-3d-lg"
          style={{
            background: 'rgba(30, 30, 30, 0.22)',
            boxShadow: '0 12px 40px 0 rgba(0,0,0,0.55), 0 1.5px 8px 0 rgba(80,80,80,0.18)',
            backdropFilter: 'blur(18px) saturate(180%)',
            WebkitBackdropFilter: 'blur(18px) saturate(180%)',
            border: '1.5px solid rgba(30,30,30,0.5)',
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
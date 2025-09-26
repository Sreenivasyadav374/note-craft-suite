import { useState } from 'react';
import { register, login } from '../lib/api';

export function useAuth() {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('token')
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    const res = await register(username, password);
    setLoading(false);
    if (res.error) setError(res.error);
    return res;
  };

  const handleLogin = async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    const res = await login(username, password);
    setLoading(false);
    if (res.token) {
      setToken(res.token);
      localStorage.setItem('token', res.token);
    } else if (res.error) {
      setError(res.error);
    }
    return res;
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
  };

  return {
    token,
    loading,
    error,
    register: handleRegister,
    login: handleLogin,
    logout: handleLogout,
    isAuthenticated: !!token,
  };
}

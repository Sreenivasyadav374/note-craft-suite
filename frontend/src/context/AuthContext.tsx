import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { register as apiRegister, login as apiLogin, googleLogin as apiGoogleLogin, getProfilePicture } from '../lib/api';
import { decodeJWT } from '../lib/jwt';

export interface AuthContextType {
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  initializing: boolean;
  userProfile: { name: string; email: string; picture?: string } | null;
  register: (username: string, password: string) => Promise<any>;
  login: (username: string, password: string) => Promise<any>;
  googleLogin: (credential: string) => Promise<any>;
  logout: () => void;
  updateProfilePicture: (pictureUrl: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [refreshTokenValue, setRefreshTokenValue] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [userProfile, setUserProfile] = useState<{ name: string; email: string; picture?: string } | null>(null);

  // On mount, restore token and refreshToken from localStorage, then set initializing to false
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedRefresh = localStorage.getItem('refreshToken');
    const storedProfile = localStorage.getItem('userProfile');
    setToken(storedToken);
    setRefreshTokenValue(storedRefresh);
    if (storedProfile) {
      try {
        setUserProfile(JSON.parse(storedProfile));
      } catch (e) {
        console.error('Failed to parse user profile', e);
      }
    }

    // Fetch profile picture if token exists
    if (storedToken) {
      getProfilePicture(storedToken)
        .then(profileData => {
          if (profileData.profilePicture) {
            const currentProfile = storedProfile ? JSON.parse(storedProfile) : {};
            const updatedProfile = { ...currentProfile, picture: profileData.profilePicture };
            setUserProfile(updatedProfile);
            localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
          }
        })
        .catch(error => {
          console.error('Failed to fetch profile picture on mount:', error);
        });
    }

    setInitializing(false);
  }, []);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    if (refreshTokenValue) {
      localStorage.setItem('refreshToken', refreshTokenValue);
    } else {
      localStorage.removeItem('refreshToken');
    }
    // Check token expiration and auto-refresh
    if (token) {
      const payload = decodeJWT(token);
      if (payload && payload.exp) {
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp < now) {
          // Try to refresh
          if (refreshTokenValue) {
            import('../lib/refresh').then(({ refreshToken }) => {
              refreshToken(refreshTokenValue).then(res => {
                if (res.token) setToken(res.token);
                else setToken(null);
              });
            });
          } else {
            setToken(null);
          }
        } else {
          setTimeout(() => setToken(null), (payload.exp - now) * 1000);
        }
      }
    }
  }, [token, refreshTokenValue]);

  const register = async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    const res = await apiRegister(username, password);
    setLoading(false);
    if (res.error) setError(res.error);
    return res;
  };

  const login = async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    const res = await apiLogin(username, password);
    setLoading(false);
    if (res.token) {
      setToken(res.token);
      if (res.refreshToken) setRefreshTokenValue(res.refreshToken);
      // Set basic user profile from username
      const profile = { name: username, email: username };
      setUserProfile(profile);
      localStorage.setItem('userProfile', JSON.stringify(profile));

      // Fetch profile picture after login
      try {
        const profileData = await getProfilePicture(res.token);
        if (profileData.profilePicture) {
          const updatedProfile = { ...profile, picture: profileData.profilePicture };
          setUserProfile(updatedProfile);
          localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
        }
      } catch (error) {
        console.error('Failed to fetch profile picture:', error);
      }
    } else if (res.error) {
      setError(res.error);
    }
    return res;
  };

  const googleLogin = async (credential: string) => {
    setLoading(true);
    setError(null);
    const res = await apiGoogleLogin(credential);
    setLoading(false);
    if (res.token) {
      setToken(res.token);
      if (res.refreshToken) setRefreshTokenValue(res.refreshToken);
      // Set user profile from Google data
      if (res.user) {
        const profile = {
          name: res.user.name,
          email: res.user.email,
          picture: res.user.picture
        };
        setUserProfile(profile);
        localStorage.setItem('userProfile', JSON.stringify(profile));
      }
    } else if (res.error) {
      setError(res.error);
    }
    return res;
  };

  const logout = () => {
    if (refreshTokenValue) {
      import('../lib/logout').then(({ logoutApi }) => {
        logoutApi(refreshTokenValue);
      });
    }
    setToken(null);
    setRefreshTokenValue(null);
    setUserProfile(null);
    localStorage.removeItem('userProfile');
  };

  const updateProfilePicture = (pictureUrl: string) => {
    if (userProfile) {
      const updatedProfile = { ...userProfile, picture: pictureUrl };
      setUserProfile(updatedProfile);
      localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
    }
  };

  return (
    <AuthContext.Provider value={{ token, refreshToken: refreshTokenValue, isAuthenticated: !!token, loading, error, initializing, userProfile, register, login, googleLogin, logout, updateProfilePicture }}>
      {!initializing && children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}

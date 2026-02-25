import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import api, { setAuthStorage, writeTokens, clearAllTokens, readToken, readRefreshToken } from '../services/api';

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organization?: any;
  availableLocations?: any[];
  availableBranches?: any[]; // Branches/Locations within the current organization
  currentBranchId?: string | null;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ---- Helper: Decode JWT payload to get expiry ----
  const getTokenExpiry = (token: string): number | null => {
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return decoded.exp ? decoded.exp * 1000 : null; // Convert to ms
    } catch {
      return null;
    }
  };

  const isTokenValid = (token: string | null): boolean => {
    if (!token) return false;
    const expiry = getTokenExpiry(token);
    if (!expiry) return false;
    // Valid if more than 5 minutes (300s) until expiry
    return expiry > Date.now() + 5 * 60 * 1000;
  };

  const isTokenNearExpiry = (token: string | null): boolean => {
    if (!token) return true;
    const expiry = getTokenExpiry(token);
    if (!expiry) return true;
    // Near expiry if less than 10 minutes remaining
    return expiry < Date.now() + 10 * 60 * 1000;
  };

  // ---- Cached user in localStorage ----
  const getCachedUser = (): User | null => {
    try {
      const cached = localStorage.getItem('cachedUser');
      if (cached) return JSON.parse(cached);
    } catch { }
    return null;
  };

  const cacheUser = (userData: User | null) => {
    try {
      if (userData) {
        localStorage.setItem('cachedUser', JSON.stringify(userData));
      } else {
        localStorage.removeItem('cachedUser');
      }
    } catch { }
  };

  const token = readToken();
  const tokenValid = isTokenValid(token);
  const cachedUser = (token && tokenValid) ? getCachedUser() : null;

  // If token is valid AND we have cached user → no loading at all
  const [user, setUser] = useState<User | null>(cachedUser);
  const [loading, setLoading] = useState<boolean>(token ? !cachedUser : false);
  const refreshTimer = useRef<number | null>(null);
  const navigate = useNavigate();

  const updateUser = (userData: User | null) => {
    setUser(userData);
    cacheUser(userData);
  };

  const refreshMe = async () => {
    try {
      const token = readToken();
      if (!token) {
        updateUser(null);
        return;
      }
      const res = await api.get('/users/me', { suppressErrorToast: true } as any);
      if (res?.data) {
        updateUser(res.data);
      } else {
        updateUser(null);
      }
    } catch {
      updateUser(null);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      // Safety timeout - ensure loading is set to false after 10 seconds max
      const safetyTimeout = setTimeout(() => {
        console.warn('Auth bootstrap timeout - forcing loading to false');
        setLoading(false);
      }, 10000);

      try {
        // Multi-location: Check for token in URL (Seamless switching)
        const params = new URLSearchParams(window.location.search);
        const urlToken = params.get('token');
        if (urlToken) {
          writeTokens(urlToken, '');
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        const currentToken = readToken();
        if (!currentToken) {
          updateUser(null);
          setLoading(false);
          clearTimeout(safetyTimeout);
          return;
        }

        const valid = isTokenValid(currentToken);
        const hasCached = !!getCachedUser();

        // ✅ FAST PATH: Token is valid + cached user exists → skip ALL API calls
        if (valid && hasCached) {
          setLoading(false);
          clearTimeout(safetyTimeout);
          // Schedule a refresh based on token expiry (background, no UI blocking)
          const expiry = getTokenExpiry(currentToken);
          if (expiry) {
            const remainingSeconds = Math.floor((expiry - Date.now()) / 1000);
            scheduleRefresh(remainingSeconds);
          }
          return; // ← No API calls at all!
        }

        // If token is invalid, clear it and stop loading
        if (!valid) {
          console.log('Token invalid or expired, clearing auth state');
          clearAllTokens();
          updateUser(null);
          setLoading(false);
          clearTimeout(safetyTimeout);
          return;
        }

        // 🔄 SLOW PATH: No cache but valid token → must call APIs
        try {
          const res = await api.get('/users/me', { suppressErrorToast: true } as any);
          if (res?.data) {
            updateUser(res.data);

            // Refresh token in background if near expiry
            if (isTokenNearExpiry(currentToken)) {
              const rt = readRefreshToken();
              if (rt) {
                api.post('/auth/refresh-token', { refreshToken: rt } as any)
                  .then((r: any) => {
                    const accessToken = r.data?.accessToken;
                    const refreshToken = r.data?.refreshToken;
                    const expiresIn = Number(r.data?.expiresIn) || 3600;
                    if (accessToken) {
                      writeTokens(accessToken, refreshToken);
                      scheduleRefresh(expiresIn);
                    }
                  })
                  .catch(() => { });
              }
            } else {
              // Token is still fresh, just schedule next refresh
              const expiry = getTokenExpiry(currentToken);
              if (expiry) {
                const remainingSeconds = Math.floor((expiry - Date.now()) / 1000);
                scheduleRefresh(remainingSeconds);
              }
            }
          } else {
            clearAllTokens();
            updateUser(null);
          }
        } catch (_e) {
          console.error('Auth bootstrap API error:', _e);
          clearAllTokens();
          updateUser(null);
        }
      } finally {
        clearTimeout(safetyTimeout);
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const clearRefreshTimer = () => {
    if (refreshTimer.current) {
      window.clearTimeout(refreshTimer.current);
      refreshTimer.current = null;
    }
  };

  const scheduleRefresh = (expiresInSeconds: number) => {
    clearRefreshTimer();
    // refresh 60 seconds before expiry, clamp to minimum 30s
    const delayMs = Math.max((expiresInSeconds - 60) * 1000, 30000);
    refreshTimer.current = window.setTimeout(async () => {
      try {
        const rt = readRefreshToken();
        if (!rt) throw new Error('no refresh token');
        const r = await api.post('/auth/refresh-token', { refreshToken: rt } as any);
        const accessToken = (r.data as any)?.accessToken;
        const refreshToken = (r.data as any)?.refreshToken;
        const newExpiresIn = Number((r.data as any)?.expiresIn) || 3600;
        if (accessToken) {
          writeTokens(accessToken, refreshToken);
          scheduleRefresh(newExpiresIn);
        }
      } catch (e) {
        // On failure, logout gracefully
        clearAllTokens();
        updateUser(null);
        navigate('/login');
      }
    }, delayMs) as any;
  };

  const login = async (email: string, password: string, rememberMe?: boolean) => {
    try {
      const response = await api.post('/auth/login', { email: String(email).trim().toLowerCase(), password }, { suppressErrorToast: true } as any);
      const data: any = response.data || {};
      const accessToken = data?.accessToken;
      if (!accessToken) {
        throw new Error('No access token in response');
      }
      // Respect Remember Me setting
      setAuthStorage(rememberMe ? 'local' : 'session');
      writeTokens(accessToken, data?.refreshToken);
      const expiresIn = Number(data?.expiresIn) || 3600;
      scheduleRefresh(expiresIn);
      // Use user data from login response directly (avoids redundant /users/me round-trip)
      const loginUser = data?.user;
      if (loginUser) {
        // Merge available locations/branches from login response
        const fullUser = {
          ...loginUser,
          availableLocations: data?.availableLocations || [],
          availableBranches: data?.availableBranches || [],
        };
        updateUser(fullUser);
        const role = String(fullUser?.role || '').toLowerCase();
        const hasOrganization = !!fullUser?.organizationId || !!fullUser?.organization?.id;

        // Patients without organization need to choose a hospital first
        if (role === 'patient' && !hasOrganization) {
          navigate('/choose-hospital');
        } else if (role === 'admin' || role === 'super_admin') {
          navigate('/dashboard');
        } else if (role === 'doctor') {
          navigate('/dashboard');
        } else if (role === 'nurse') {
          navigate('/dashboard');
        } else if (role === 'receptionist') {
          navigate('/dashboard');
        } else if (role === 'pharmacist') {
          navigate('/pharmacy');
        } else if (role === 'lab_technician') {
          navigate('/laboratory/dashboard');
        } else if (role === 'accountant') {
          navigate('/billing/management');
        } else if (role === 'patient') {
          navigate('/portal');
        } else {
          navigate('/dashboard');
        }

        // Background: refresh full profile for any additional fields
        api.get('/users/me', { suppressErrorToast: true } as any)
          .then((me: any) => { if (me?.data) updateUser(me.data); })
          .catch(() => { /* silent - login user data is sufficient */ });
      } else {
        message.error('Failed to retrieve user profile');
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || error?.message || 'Login failed');
      throw error;
    }
  };

  const register = async (userData: any) => {
    try {
      await api.post('/auth/register', userData, { suppressErrorToast: true } as any);
      message.success('Registration successful! Please login.');
      navigate('/login');
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Registration failed');
      throw error;
    }
  };

  const logout = async () => {
    try {
      const rt = readRefreshToken();
      if (rt) {
        await api.post('/auth/logout', { refreshToken: rt } as any, { suppressErrorToast: true } as any);
      } else {
        await api.post('/auth/logout', {}, { suppressErrorToast: true } as any);
      }
    } catch { }
    clearAllTokens();
    updateUser(null);
    clearRefreshTimer();
    navigate('/login');
  };

  const loadingScreen = (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      width: '100vw',
      background: 'linear-gradient(135deg, #f0f4ff 0%, #e8edf5 50%, #f5f7fa 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
        padding: '48px',
        borderRadius: '20px',
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'pulse 2s ease-in-out infinite',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '20px',
            fontWeight: 700,
            color: '#1a5276',
            letterSpacing: '-0.3px',
          }}>
            Ayphen Care
          </div>
          <div style={{
            fontSize: '13px',
            color: '#64748b',
            marginTop: '6px',
          }}>
            Loading your workspace...
          </div>
        </div>
        <div style={{
          width: '120px',
          height: '3px',
          borderRadius: '2px',
          background: '#e2e8f0',
          overflow: 'hidden',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: '40%',
            borderRadius: '2px',
            background: 'linear-gradient(90deg, #1a5276, #2980b9)',
            animation: 'loadingBar 1.5s ease-in-out infinite',
          }} />
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        @keyframes loadingBar {
          0% { left: -40%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshMe }}>
      {loading ? loadingScreen : children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

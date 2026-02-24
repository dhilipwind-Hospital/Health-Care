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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const refreshTimer = useRef<number | null>(null);
  const navigate = useNavigate();

  const refreshMe = async () => {
    try {
      setLoading(true);
      const token = readToken();
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const res = await api.get('/users/me', { suppressErrorToast: true } as any);
      if (res?.data) {
        setUser(res.data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // On initial load, if a token exists, fetch the current user
    const bootstrap = async () => {
      setLoading(true);

      // Multi-location: Check for token in URL (Seamless switching)
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');
      if (urlToken) {
        // Save token and clean URL
        writeTokens(urlToken, ''); // Refresh token might be missing but access token allows login
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      const token = readToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/users/me', { suppressErrorToast: true } as any);
        if (res?.data) {
          setUser(res.data);
          // Attempt to refresh soon after load to obtain expiresIn and schedule
          try {
            const rt = readRefreshToken();
            if (!rt) throw new Error('no refresh token');
            const r = await api.post('/auth/refresh-token', { refreshToken: rt } as any);
            const accessToken = (r.data as any)?.accessToken;
            const refreshToken = (r.data as any)?.refreshToken;
            const expiresIn = Number((r.data as any)?.expiresIn) || 3600;
            if (accessToken) {
              writeTokens(accessToken, refreshToken);
              scheduleRefresh(expiresIn);
            }
          } catch {
            // ignore silent refresh error during bootstrap
          }
        } else {
          clearAllTokens();
        }
      } catch (_e) {
        clearAllTokens();
      } finally {
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
        setUser(null);
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
      // Always fetch current profile to ensure role and context are accurate
      try {
        const me = await api.get('/users/me', { suppressErrorToast: true } as any);
        if (me?.data) {
          setUser(me.data);
          const role = String(me.data?.role || '').toLowerCase();
          const hasOrganization = !!me.data?.organizationId;

          // Patients without organization need to choose a hospital first
          if (role === 'patient' && !hasOrganization) {
            navigate('/choose-hospital');
          } else if (role === 'admin' || role === 'super_admin') {
            navigate('/dashboard');
          } else if (role === 'doctor') {
            navigate('/dashboard'); // Unified dashboard
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
        } else {
          message.error('Failed to retrieve user profile');
        }
      } catch (e) {
        console.error('Profile fetch failed:', e);
        // Stay on login page so user sees the error
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
    setUser(null);
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

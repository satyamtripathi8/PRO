import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authApi } from '../lib/api';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  image?: string | null;
}

interface SignupResult {
  requiresVerification: boolean;
  email?: string;
  user?: User;
}

interface LoginResult {
  requiresVerification: boolean;
  email?: string;
  user?: User;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  signup: (email: string, name: string, password: string) => Promise<SignupResult>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendOTP: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const res = await authApi.me();
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string): Promise<LoginResult> => {
    const res = await authApi.login({ email, password });
    if (res.data?.requiresVerification) {
      return { requiresVerification: true, email: res.data.email };
    }
    setUser(res.data.user);
    return { requiresVerification: false, user: res.data.user };
  };

  const signup = async (email: string, name: string, password: string): Promise<SignupResult> => {
    const res = await authApi.signup({ email, name, password });
    if (res.data?.requiresVerification) {
      return { requiresVerification: true, email: res.data.email };
    }
    setUser(res.data.user);
    return { requiresVerification: false, user: res.data.user };
  };

  const verifyEmail = async (email: string, code: string) => {
    const res = await authApi.verifyEmail({ email, code });
    setUser(res.data.user);
  };

  const resendOTP = async (email: string) => {
    await authApi.resendOTP({ email });
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, verifyEmail, resendOTP, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

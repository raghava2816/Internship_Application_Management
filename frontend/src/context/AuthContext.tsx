import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface UserType {
  id: string;
  name: string;
  email: string;
  role: string;
  skills?: string[];
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  bio?: string;
  settings?: {
    theme: 'light' | 'dark' | 'system';
    notifications: {
      email: boolean;
      push: boolean;
      deadlineReminderDays: number;
    };
  };
}

interface AuthContextType {
  user: UserType | null;
  token: string | null;
  loading: boolean;
  isOfflineMode: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  socialLogin: (provider: 'google' | 'github', id: string, email: string, name: string, avatarUrl?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updatedData: Partial<UserType>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


const API_URL = '/api/auth';

const defaultMockUser: UserType = {
  id: '660f54b68449c25fbc7e63b1',
  name: 'Demo Applicant',
  email: 'demo@tracker.com',
  role: 'user',
  skills: ['React', 'TypeScript', 'Node.js', 'MongoDB', 'TailwindCSS', 'Vite', 'Framer Motion'],
  linkedinUrl: 'https://linkedin.com/in/demo-applicant',
  githubUrl: 'https://github.com/demo-applicant',
  portfolioUrl: 'https://demo.dev',
  bio: 'Passionate frontend developer seeking a summer software engineering internship.',
  settings: {
    theme: 'dark',
    notifications: {
      email: true,
      push: true,
      deadlineReminderDays: 3
    }
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`${API_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setUser(res.data.user);
          setIsOfflineMode(false);
        }
      } catch (error) {
        console.warn('⚠️ Server unavailable. Restoring local mock profile session.');
        setIsOfflineMode(true);
        // Load mock credentials if session exists in localStorage
        const storedMock = localStorage.getItem('mock_user_session');
        if (storedMock) {
          setUser(JSON.parse(storedMock));
        } else {
          setUser(defaultMockUser);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/login`, { email, password });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        setIsOfflineMode(false);
      }
    } catch (error: any) {
      console.warn('⚠️ Could not connect to API server. Operating in offline mock mode.');
      // Offline mode authenticate
      setIsOfflineMode(true);
      if (email === 'admin@tracker.com') {
        const adminUser = { ...defaultMockUser, id: '660f54b68449c25fbc7e63b2', name: 'Admin Host', role: 'admin', email: 'admin@tracker.com' };
        localStorage.setItem('token', 'mock_admin_token');
        localStorage.setItem('mock_user_session', JSON.stringify(adminUser));
        setToken('mock_admin_token');
        setUser(adminUser);
      } else {
        // Fallback email password login
        const loggedUser = { ...defaultMockUser, email, name: email.split('@')[0] };
        localStorage.setItem('token', 'mock_user_token');
        localStorage.setItem('mock_user_session', JSON.stringify(loggedUser));
        setToken('mock_user_token');
        setUser(loggedUser);
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/register`, { name, email, password });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        setIsOfflineMode(false);
      }
    } catch (error) {
      console.warn('⚠️ Register failed to hit server. Saving mock state locally.');
      setIsOfflineMode(true);
      const newUser: UserType = {
        id: 'user_' + Math.random().toString(36).substring(2, 9),
        name,
        email,
        role: 'user',
        skills: [],
        settings: {
          theme: 'dark',
          notifications: { email: true, push: true, deadlineReminderDays: 3 }
        }
      };
      localStorage.setItem('token', 'mock_user_token');
      localStorage.setItem('mock_user_session', JSON.stringify(newUser));
      setToken('mock_user_token');
      setUser(newUser);
    } finally {
      setLoading(false);
    }
  };

  const socialLogin = async (provider: 'google' | 'github', id: string, email: string, name: string, avatarUrl?: string) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/social-login`, { provider, id, email, name, avatarUrl });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        setIsOfflineMode(false);
      }
    } catch (error) {
      console.warn(`⚠️ Social login via server failed. Operating in offline mock mode for ${provider}.`);
      setIsOfflineMode(true);
      const newUser: UserType = {
        id: id || 'social_' + Math.random().toString(36).substring(2, 9),
        name,
        email,
        role: 'user',
        skills: [],
        settings: {
          theme: 'dark',
          notifications: { email: true, push: true, deadlineReminderDays: 3 }
        }
      };
      localStorage.setItem('token', 'mock_social_token');
      localStorage.setItem('mock_user_session', JSON.stringify(newUser));
      setToken('mock_social_token');
      setUser(newUser);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('mock_user_session');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (updatedData: Partial<UserType>) => {
    if (isOfflineMode || !token || token.startsWith('mock_')) {
      const merged = { ...user, ...updatedData } as UserType;
      setUser(merged);
      localStorage.setItem('mock_user_session', JSON.stringify(merged));
      return;
    }

    try {
      const res = await axios.put(`${API_URL}/profile`, updatedData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setUser(res.data.user);
      }
    } catch (error) {
      const merged = { ...user, ...updatedData } as UserType;
      setUser(merged);
      localStorage.setItem('mock_user_session', JSON.stringify(merged));
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, isOfflineMode, login, register, socialLogin, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

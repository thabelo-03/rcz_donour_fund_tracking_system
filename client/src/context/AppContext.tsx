import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../api';
import { User } from '../types';

interface AppContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

const AppContext = createContext<AppContextType>({} as AppContextType);

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('rcz_token'));
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (token) {
      authAPI.getMe()
        .then(u => { setUser(u); setLoading(false); })
        .catch(() => { localStorage.removeItem('rcz_token'); setToken(null); setLoading(false); });
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await authAPI.login(email, password);
    localStorage.setItem('rcz_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('rcz_token');
    setToken(null);
    setUser(null);
  };

  const toggleSidebar = () => setSidebarCollapsed(p => !p);

  return (
    <AppContext.Provider value={{
      user, token, login, logout,
      isAuthenticated: !!token && !!user,
      loading, sidebarCollapsed, toggleSidebar
    }}>
      {children}
    </AppContext.Provider>
  );
};

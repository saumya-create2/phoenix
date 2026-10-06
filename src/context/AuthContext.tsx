/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.js';
import { api } from '../services/api.js';

/**
 * AuthContext:
 * - No hardcoded admin credentials or role overrides in frontend JavaScript.
 * - Role (`user.role`) is hydrated strictly from the backend `/api/auth/me`
 *   endpoint, which reads from the relational database (`users` + `roles`).
 */
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<User>;
  adminLogin: (email: string, pass: string) => Promise<User>;
  register: (data: any) => Promise<User>;
  updateProfile: (data: { name: string; phone: string; address?: string; city?: string }) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const token = localStorage.getItem('stayease_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      setUser(res.user);
    } catch {
      localStorage.removeItem('stayease_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, pass: string): Promise<User> => {
    const res = await api.login(email, pass);
    localStorage.setItem('stayease_token', res.token);
    setUser(res.user);
    return res.user;
  };

  const adminLogin = async (email: string, pass: string): Promise<User> => {
    const res = await api.adminLogin(email, pass);
    localStorage.setItem('stayease_token', res.token);
    setUser(res.user);
    return res.user;
  };

  const register = async (data: any): Promise<User> => {
    const res = await api.register(data);
    localStorage.setItem('stayease_token', res.token);
    setUser(res.user);
    return res.user;
  };

  const updateProfile = async (data: {
    name: string;
    phone: string;
    address?: string;
    city?: string;
  }): Promise<User> => {
    const res = await api.updateProfile(data);
    setUser(res.user);
    return res.user;
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignore network errors during logout cleanup
    }
    localStorage.removeItem('stayease_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        adminLogin,
        register,
        updateProfile,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

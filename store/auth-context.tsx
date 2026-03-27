import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, type RegisterRequest } from '@/api/auth';
import type { UserResponse } from '@/api/types';
import { usersApi } from '@/api/users';

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserResponse | null;
  login: (login: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<{ email: string }>;
  confirmEmail: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserResponse | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        setIsAuthenticated(true);
        try {
          const { data } = await usersApi.getMe();
          setUser(data);
        } catch {
          // token might be expired, interceptor will handle refresh
        }
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function login(loginVal: string, password: string) {
    const { data } = await authApi.login({ login: loginVal, password });
    await AsyncStorage.setItem('accessToken', data.accessToken);
    await AsyncStorage.setItem('refreshToken', data.refreshToken);
    setIsAuthenticated(true);
    const { data: me } = await usersApi.getMe();
    setUser(me);
  }

  async function register(registerData: RegisterRequest): Promise<{ email: string }> {
    const { data } = await authApi.register(registerData);
    return { email: data.email };
  }

  async function confirmEmail(email: string, code: string) {
    const { data } = await authApi.confirmEmail(email, code);
    await AsyncStorage.setItem('accessToken', data.accessToken);
    await AsyncStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
    setIsAuthenticated(true);
  }

  async function logout() {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (refreshToken) await authApi.logout(refreshToken);
    } catch {
      // ignore logout errors
    } finally {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
      setIsAuthenticated(false);
      setUser(null);
    }
  }

  async function refreshUser() {
    try {
      const { data } = await usersApi.getMe();
      setUser(data);
    } catch {
      // ignore
    }
  }

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isLoading, user, login, register, confirmEmail, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

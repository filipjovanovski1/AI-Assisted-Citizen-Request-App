import React, { createContext, useContext, useState } from 'react';
import type { UserDto } from '../types';
import { authApi } from '../services/api';

interface RegisterPayload {
  username: string;
  firstName: string;
  lastName: string;
  embg?: string;
  password: string;
}

interface AuthContextType {
  user: UserDto | null;
  login: (username: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserDto | null>(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? (JSON.parse(stored) as UserDto) : null;
    } catch {
      return null;
    }
  });

  const login = async (username: string, password: string) => {
    const data = await authApi.login({ username, password });
    setUser(data);
    localStorage.setItem('user', JSON.stringify(data));
  };

  const register = async (payload: RegisterPayload) => {
    const data = await authApi.register(payload);
    setUser(data);
    localStorage.setItem('user', JSON.stringify(data));
  };

  const logout = () => {
    authApi.logout().catch(() => {});
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {throw new Error('useAuth must be used within AuthProvider');}
  return ctx;
};

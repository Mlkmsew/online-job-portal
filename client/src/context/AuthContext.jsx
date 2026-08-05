import { createContext, useEffect, useState } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      try {
        const currentUser = await authService.getMe();
        setUser(currentUser);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  const login = async (credentials) => {
    const response = await authService.login(credentials);
    setUser(response.user);
    return response;
  };

  const register = async (payload) => {
    const response = await authService.register(payload);
    setUser(response.user);
    return response;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-lg font-medium text-gray-700 dark:text-gray-200">Loading...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

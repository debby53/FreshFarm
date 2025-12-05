import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import client from '../services/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('ff_token'));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('ff_user');
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem('ff_token', token);
      client.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      localStorage.removeItem('ff_token');
      delete client.defaults.headers.common.Authorization;
    }
  }, [token]);

  const login = (authResponse) => {
    setToken(authResponse.token);
    setUser(authResponse.user);
    localStorage.setItem('ff_user', JSON.stringify(authResponse.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('ff_user');
  };

  const value = useMemo(
    () => ({
      token,
      user,
      login,
      logout
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);


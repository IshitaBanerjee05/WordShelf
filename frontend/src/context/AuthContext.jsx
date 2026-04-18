import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('wordshelf_token'));
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  // Validate existing token on mount
  useEffect(() => {
    const validateToken = async () => {
      const storedToken = localStorage.getItem('wordshelf_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        setUser(res.data);
        setToken(storedToken);
      } catch {
        // Token invalid or expired
        localStorage.removeItem('wordshelf_token');
        localStorage.removeItem('wordshelf_user');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, []);

  const login = useCallback(async (username, password) => {
    // FastAPI OAuth2 expects form data
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const res = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const { access_token } = res.data;
    localStorage.setItem('wordshelf_token', access_token);
    setToken(access_token);

    // Fetch user profile
    const userRes = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    setUser(userRes.data);
    localStorage.setItem('wordshelf_user', JSON.stringify(userRes.data));

    return userRes.data;
  }, []);

  const register = useCallback(async (username, email, password) => {
    await api.post('/auth/register', { username, email, password });
    // Auto-login after registration
    return login(username, password);
  }, [login]);

  const logout = useCallback(() => {
    localStorage.removeItem('wordshelf_token');
    localStorage.removeItem('wordshelf_user');
    setUser(null);
    setToken(null);
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;

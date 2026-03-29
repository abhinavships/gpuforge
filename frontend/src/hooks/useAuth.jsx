import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from './useAPI.js';

const AuthContext = createContext(null);
const ToastContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    if (api.getToken()) {
      api.me().then(d => { setUser(d.user); setLoading(false); }).catch(() => { api.clearToken(); setLoading(false); });
    } else setLoading(false);
  }, []);

  const login = async (username, password) => {
    const data = await api.login(username, password);
    api.setToken(data.token);
    setUser(data.user);
    return data;
  };

  const register = async (username, email, password) => {
    const data = await api.register(username, email, password);
    api.setToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try { await api.logout(); } catch(e) {}
    api.clearToken();
    setUser(null);
  };

  const refreshUser = async () => {
    if (api.getToken()) {
      const d = await api.me();
      setUser(d.user);
    }
  };

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    React.createElement(ToastContext.Provider, { value: { addToast } },
      React.createElement(AuthContext.Provider, { value: { user, loading, login, register, logout, refreshUser } },
        children,
        React.createElement(ToastContainer, { toasts, dismiss: dismissToast })
      )
    )
  );
}

function ToastContainer({ toasts, dismiss }) {
  if (toasts.length === 0) return null;
  return React.createElement('div', { className: 'toast-container' },
    toasts.map(t => React.createElement('div', {
      key: t.id,
      className: `toast toast-${t.type}`,
      onClick: () => dismiss(t.id),
      style: { cursor: 'pointer' }
    },
      React.createElement('span', { style: { fontSize: 18 } },
        t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : t.type === 'achievement' ? '🏆' : 'ℹ️'
      ),
      React.createElement('span', null, t.message)
    ))
  );
}

export function useAuth() { return useContext(AuthContext); }
export function useToast() { return useContext(ToastContext); }

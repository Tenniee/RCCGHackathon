import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { authAPI } from "../api";
 
const AuthContext = createContext(null);
 
export function AuthProvider({ children }) {
  const [user, setUser]     = useState(() => {
    const stored = localStorage.getItem("rccg_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken]   = useState(() => localStorage.getItem("rccg_token") || null);
  const [loading, setLoading] = useState(false);
 
  // Refresh user from server on mount (to pick up is_verified changes)
  useEffect(() => {
    if (token && user) {
      authAPI.me()
        .then((res) => {
          setUser(res.data);
          localStorage.setItem("rccg_user", JSON.stringify(res.data));
        })
        .catch(() => {});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
 
  const login = useCallback(async (phone, password) => {
    setLoading(true);
    try {
      const res = await authAPI.login({ phone, password });
      const { access_token, user: userData } = res.data;
      localStorage.setItem("rccg_token", access_token);
      localStorage.setItem("rccg_user", JSON.stringify(userData));
      setToken(access_token);
      setUser(userData);
      return userData;
    } finally {
      setLoading(false);
    }
  }, []);
 
  const logout = useCallback(() => {
    localStorage.removeItem("rccg_token");
    localStorage.removeItem("rccg_user");
    setToken(null);
    setUser(null);
  }, []);
 
  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem("rccg_user", JSON.stringify(next));
      return next;
    });
  }, []);
 
  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
 
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}

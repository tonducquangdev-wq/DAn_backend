import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("life_planner_token") || null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem("life_planner_theme") || "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.setAttribute("data-bs-theme", theme);
    localStorage.setItem("life_planner_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  };

  useEffect(() => {
    if (token) {
      api.getMe()
        .then(res => {
          if (res.success) {
            setUser(res.data);
            if (res.data.theme_mode && res.data.theme_mode !== "system") {
              setTheme(res.data.theme_mode);
            }
          } else {
            logout();
          }
        })
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    if (res.success) {
      localStorage.setItem("life_planner_token", res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
    }
    return res;
  };

  const adminLogin = async (email, password) => {
    const res = await api.adminLogin({ email, password });
    if (res.success) {
      localStorage.setItem("life_planner_token", res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
    }
    return res;
  };

  const register = async (name, email, password) => {
    const res = await api.register({ name, email, password });
    if (res.success) {
      localStorage.setItem("life_planner_token", res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
    }
    return res;
  };

  const logout = () => {
    localStorage.removeItem("life_planner_token");
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      if (res.success) {
        setUser(res.data);
      }
    } catch (e) {
      console.error("Lỗi làm mới thông tin user:", e);
    }
  };

  const isAdmin = user?.role === "admin";
  const isTutor = user?.role === "tutor";
  const isPT = user?.role === "pt";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        theme,
        toggleTheme,
        login,
        adminLogin,
        register,
        logout,
        setUser,
        refreshUser,
        isAdmin,
        isTutor,
        isPT
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

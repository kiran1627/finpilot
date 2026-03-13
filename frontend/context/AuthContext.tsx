"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { authAPI } from "@/services/auth";

type User = {
  id: string;
  email: string;
  provider: string;
  user_type: string;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  register: (email: string, password: string, userType?: string) => Promise<void>;
  updateUserType: (userType: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user;

  const clearExecutionSnapshots = () => {
    localStorage.removeItem("lastAutonomyExecution");

    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("lastAutonomyExecution:")) {
        localStorage.removeItem(key);
      }
    });
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setLoading(false);
      return;
    }

    authAPI
      .getMe()
      .then((res) => {
        setUser(res.data);
      })
      .catch(() => {
        localStorage.removeItem("access_token");
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (username: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    const res = await authAPI.login(formData);
    localStorage.setItem("access_token", res.data.access_token);

    const userRes = await authAPI.getMe();
    setUser(userRes.data);
  };

  const register = async (email: string, password: string, userType = "professional") => {
    const res = await authAPI.register({ email, password, user_type: userType });
    localStorage.setItem("access_token", res.data.access_token);
    setUser(res.data.user);
  };

  const updateUserType = async (userType: string) => {
    const res = await authAPI.updateUserType({ user_type: userType });
    setUser(res.data);
  };

  const googleLogin = async (idToken: string) => {
    const res = await authAPI.googleOAuth({ id_token: idToken });
    localStorage.setItem("access_token", res.data.access_token);
    setUser(res.data.user);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    clearExecutionSnapshots();
    setUser(null);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        googleLogin,
        register,
        updateUserType,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};

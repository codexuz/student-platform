"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { authAPI, setUserStore, storage } from "@/lib/api";

interface User {
  id: string; // UUID
  username: string;
  phone: string;
  roles: string[];
  permissions?: string[];
  sessionId?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}

type UserRole = "student" | "teacher";

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: UserRole | null;
  loading: boolean;
  login: (
    username: string,
    password: string,
    role: UserRole,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (userData: User) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Public routes that don't require authentication
  const publicRoutes = [
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
  ];

  const checkAuth = async () => {
    try {
      const storedToken = await storage.getItem("userToken");
      const storedUser = await storage.getItem("userData");

      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        const storedRole = (await storage.getItem(
          "userRole",
        )) as UserRole | null;
        setToken(storedToken);
        setUser(parsedUser);
        setRole(storedRole || "student");

        // Verify token is still valid
        const isValid = await authAPI.checkAuthStatus();
        if (!isValid) {
          await logout();
        }
      } else if (!publicRoutes.includes(pathname)) {
        router.push("/auth/login");
      }
    } catch (error) {
      if (!publicRoutes.includes(pathname)) {
        router.push("/auth/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (
    username: string,
    password: string,
    loginRole: UserRole = "student",
  ) => {
    try {
      const response = await authAPI.login(username, password, loginRole);

      if (response && response.access_token) {
        setToken(response.access_token);
        setUser(response.user);
        setRole(loginRole);
        router.push(loginRole === "teacher" ? "/dashboard" : "/home");
        return { success: true };
      }

      return { success: false, error: "Invalid credentials" };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Login failed",
      };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
    } finally {
      setToken(null);
      setUser(null);
      setRole(null);
      router.push("/auth/login");
    }
  };

  const updateUser = (userData: User) => {
    setUser(userData);
  };

  const updateToken = (newToken: string) => {
    setToken(newToken);
  };

  const clearUser = () => {
    setUser(null);
    setToken(null);
    setRole(null);
  };

  // Set user store for API calls
  useEffect(() => {
    if (user) {
      setUserStore({
        getUserProfile: user,
        setToken: updateToken,
        setUser: updateUser,
        clearUser: clearUser,
      });
    }
  }, [user]);

  const value = {
    user,
    token,
    role,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

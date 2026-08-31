import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { getMe } from "../services/auth.service";
import type { User } from "../types/types";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;

  setAuth: (token: string, user: User) => void;

  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);

  const [token, setToken] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");

    if (!storedToken) {
      setLoading(false);
      return;
    }

    setToken(storedToken);

    getMe()
      .then((user) => {
        setUser(user);
      })
      .catch(() => {
        localStorage.removeItem("token");

        setToken(null);
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  function setAuth(newToken: string, newUser: User) {
    localStorage.setItem("token", newToken);

    setToken(newToken);
    setUser(newUser);
  }

  function logout() {
    localStorage.removeItem("token");

    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        setAuth,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}

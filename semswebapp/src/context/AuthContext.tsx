import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { tokenStore } from "../lib/api";
import * as authService from "../services/auth.service";
import type { User, UserSegment } from "../types";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  register: (fullName: string, email: string, password: string, segment?: UserSegment) => Promise<void>;
  updateProfile: (patch: Partial<User>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const USER_KEY = "sems-user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  });
  const [loading, setLoading] = useState(false);

  // Si hay token pero no usuario en memoria, intenta recuperar el perfil.
  useEffect(() => {
    if (tokenStore.get() && !user) {
      authService
        .getMe()
        .then((u) => {
          setUser(u);
          localStorage.setItem(USER_KEY, JSON.stringify(u));
        })
        .catch(() => {});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const persist = (token: string, u: User) => {
    tokenStore.set(token);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await authService.login(email, password);
      persist(res.token, res.user);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (idToken: string) => {
    setLoading(true);
    try {
      const res = await authService.loginWithGoogle(idToken);
      persist(res.token, res.user);
    } finally {
      setLoading(false);
    }
  };

  const register = async (fullName: string, email: string, password: string, segment?: UserSegment) => {
    setLoading(true);
    try {
      const res = await authService.register(fullName, email, password, segment);
      persist(res.token, res.user);
    } finally {
      setLoading(false);
    }
  };

  // Actualiza datos del perfil en memoria y en localStorage (nombre, segmento…).
  const updateProfile = (patch: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      localStorage.setItem(USER_KEY, JSON.stringify(next));
      return next;
    });
  };

    const logout = () => {
    tokenStore.clear();
    localStorage.removeItem(USER_KEY);
    setUser(null);
    // Redirección dura: garantiza volver al login sin depender del router
    // ni de quién llame a logout (limpia además todo el estado en memoria).
    window.location.replace("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, register, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
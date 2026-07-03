import axios from "axios";

// Flag de modo demo: por defecto activo salvo que se ponga "false".
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== "false";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8089";

const TOKEN_KEY = "sems-token";

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

// Instancia de axios apuntando al API Gateway.
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Agrega el JWT a cada petición.
const SEND_AUTH = true;
api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (SEND_AUTH && token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Si el backend responde 401, limpiamos sesión y vamos al login.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      tokenStore.clear();
      if (!location.pathname.startsWith("/login")) location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Pequeño helper para simular latencia en modo demo.
export const delay = (ms = 450) => new Promise((r) => setTimeout(r, ms));

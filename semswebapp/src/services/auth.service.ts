import { api, DEMO_MODE, delay, tokenStore } from "../lib/api";
import { demoUser } from "../lib/demo";
import type { AuthResponse, User, UserSegment } from "../types";

// Rol por defecto al registrarse desde la web (usuario normal del hogar).
const DEFAULT_ROLE = "RESIDENT";

// Forma REAL de la respuesta del IAM en /auth/login y /auth/register.
interface IamAuthResponse {
  token: string;
  userId: string;
  emailAddress: string;
  roles: string[];
  segment?: string;
}

function normSegment(s: unknown): UserSegment | undefined {
  const u = String(s ?? "").toUpperCase();
  return u === "HOMEOWNER" || u === "TENANT" ? (u as UserSegment) : undefined;
}

// El IAM no guarda nombre, así que armamos uno para mostrar a partir del correo.
function displayNameFromEmail(email: string): string {
  const local = (email || "").split("@")[0] || "Usuario";
  return local.charAt(0).toUpperCase() + local.slice(1);
}

function mapUser(res: IamAuthResponse): User {
  return {
    id: res.userId,
    email: res.emailAddress,
    fullName: displayNameFromEmail(res.emailAddress),
    role: (res.roles?.[0] as User["role"]) ?? "RESIDENT",
    segment: normSegment(res.segment),
  };
}

// Reconstruye el usuario desde el payload del JWT (sin validar firma).
function decodeToken(token: string): User | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      id: payload.userId ?? payload.sub ?? "",
      email: payload.email ?? payload.emailAddress ?? "",
      fullName: displayNameFromEmail(payload.email ?? payload.emailAddress ?? ""),
      role: (payload.roles?.[0] as User["role"]) ?? "RESIDENT",
    };
  } catch {
    return null;
  }
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  if (DEMO_MODE) {
    await delay();
    return { token: "demo-token", user: { ...demoUser, email: email || demoUser.email } };
  }
  const { data } = await api.post<IamAuthResponse>("/api/v1/auth/login", {
    emailAddress: email,
    password,
  });
  return { token: data.token, user: mapUser(data) };
}

// Login con Google: el frontend obtiene un ID token (GIS) y el IAM lo verifica.
export async function loginWithGoogle(idToken: string): Promise<AuthResponse> {
  if (DEMO_MODE) {
    await delay();
    return { token: "demo-token", user: demoUser };
  }
  const { data } = await api.post<IamAuthResponse>("/api/v1/auth/google", { idToken });
  return { token: data.token, user: mapUser(data) };
}

export async function register(
  fullName: string,
  email: string,
  password: string,
  segment?: UserSegment
): Promise<AuthResponse> {
  if (DEMO_MODE) {
    await delay();
    return { token: "demo-token", user: { ...demoUser, fullName, email, segment } };
  }
  // El IAM registra con emailAddress + password + role + segment.
  await api.post("/api/v1/auth/register", {
    emailAddress: email,
    password,
    role: DEFAULT_ROLE,
    segment,
  });
  // Tras registrar, iniciamos sesión para obtener el token.
  const res = await login(email, password);
  // El nombre lo escribió el usuario (el IAM no lo guarda); el segmento lo trae el login.
  return fullName ? { ...res, user: { ...res.user, fullName } } : res;
}

export async function getMe(): Promise<User> {
  if (DEMO_MODE) {
    await delay(200);
    return demoUser;
  }
  // Reconstruimos el usuario desde el JWT guardado (evita depender de /users/me).
  const token = tokenStore.get();
  const user = token ? decodeToken(token) : null;
  if (!user) throw new Error("No hay sesión válida");
  return user;
}

// --- Recuperación de cuenta y verificación (RF-NOT-03 / RF-AUTH-01) ---

// Inicia la recuperación: el IAM publica el evento y Alert manda el correo.
export async function forgotPassword(email: string): Promise<void> {
  if (DEMO_MODE) { await delay(400); return; }
  await api.post("/api/v1/auth/forgot-password", { emailAddress: email });
}

// Establece una nueva contraseña usando el token del correo.
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  if (DEMO_MODE) { await delay(400); return; }
  await api.post("/api/v1/auth/reset-password", { token, newPassword });
}

// Verifica (activa) la cuenta con el token del correo.
export async function verifyAccount(token: string): Promise<void> {
  if (DEMO_MODE) { await delay(400); return; }
  await api.get("/api/v1/auth/verify", { params: { token } });
}
import { api, DEMO_MODE, delay, tokenStore } from "../lib/api";
import { demoUser } from "../lib/demo";
import type { AuthResponse, User } from "../types";

// Rol por defecto al registrarse desde la web (usuario normal del hogar).
// ⚠️ Debe ser un valor válido del enum RoleName de tu IAM.
//    Confirmado que existe ADMIN; si tu enum no tiene ADMIN, cámbialo
//    por el rol correcto que muestre el schema de Swagger.
const DEFAULT_ROLE = "ADMIN";

// Forma REAL de la respuesta del IAM en /auth/login y /auth/register.
interface IamAuthResponse {
  token: string;
  userId: string;
  emailAddress: string;
  roles: string[];
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
    role: (res.roles?.[0] as User["role"]) ?? "ADMIN",
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
      role: (payload.roles?.[0] as User["role"]) ?? "ADMIN",
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

export async function register(
  fullName: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  if (DEMO_MODE) {
    await delay();
    return { token: "demo-token", user: { ...demoUser, fullName, email } };
  }
  // El IAM registra con emailAddress + password + role.
  await api.post("/api/v1/auth/register", {
    emailAddress: email,
    password,
    role: DEFAULT_ROLE,
  });
  // Tras registrar, iniciamos sesión para obtener el token.
  const res = await login(email, password);
  // Usamos el nombre que el usuario escribió en el formulario (el IAM no lo guarda).
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
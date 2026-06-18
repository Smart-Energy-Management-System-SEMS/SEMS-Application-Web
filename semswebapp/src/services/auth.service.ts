import { api, DEMO_MODE, delay } from "../lib/api";
import { demoUser } from "../lib/demo";
import type { AuthResponse, User } from "../types";

export async function login(email: string, _password: string): Promise<AuthResponse> {
  if (DEMO_MODE) {
    await delay();
    return { token: "demo-token", user: { ...demoUser, email: email || demoUser.email } };
  }
  const { data } = await api.post<AuthResponse>("/api/v1/auth/login", { email, password: _password });
  return data;
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
  const { data } = await api.post<AuthResponse>("/api/v1/auth/register", { fullName, email, password });
  return data;
}

export async function getMe(): Promise<User> {
  if (DEMO_MODE) {
    await delay(200);
    return demoUser;
  }
  const { data } = await api.get<User>("/api/v1/users/me");
  return data;
}

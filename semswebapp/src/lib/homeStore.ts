// Perfil del hogar y metas de consumo. Se guardan localmente por usuario
// (los microservicios aún no exponen estos datos; fácil de migrar a backend).

export interface HomeProfile {
  housingType: string; // "HOUSE" | "APARTMENT" | "ROOM"
  rooms: number;
  location: string;
}

export interface Goals {
  monthlyKwh: number;
  perDevice: Record<string, number>; // deviceId -> meta kWh
}

const profileKey = (userId: string) => `sems-home-${userId}`;
const goalsKey = (userId: string) => `sems-goals-${userId}`;

export function getHomeProfile(userId: string): HomeProfile {
  try {
    const raw = localStorage.getItem(profileKey(userId));
    if (raw) return JSON.parse(raw) as HomeProfile;
  } catch {
    /* noop */
  }
  return { housingType: "HOUSE", rooms: 3, location: "" };
}

export function saveHomeProfile(userId: string, p: HomeProfile) {
  localStorage.setItem(profileKey(userId), JSON.stringify(p));
}

export function getGoals(userId: string): Goals {
  try {
    const raw = localStorage.getItem(goalsKey(userId));
    if (raw) return JSON.parse(raw) as Goals;
  } catch {
    /* noop */
  }
  return { monthlyKwh: 0, perDevice: {} };
}

export function saveGoals(userId: string, g: Goals) {
  localStorage.setItem(goalsKey(userId), JSON.stringify(g));
}
import { api, DEMO_MODE, delay } from "../lib/api";
import { demoAlerts, demoThresholds, demoPreferences } from "../lib/demoExtra";
import { listDevices } from "./devices.service";
import type {
  Alert,
  AlertSeverity,
  AlertStatus,
  AlertType,
  Threshold,
  NotificationPreference,
} from "../types/alerts";

// Alert Service (vía API Gateway). Si el gateway usa otro prefijo, cámbialo aquí.
const BASE = "/api/v1";

// --- Helpers de normalización (el backend usa snake_case / minúsculas) ---
function str(...vals: unknown[]): string {
  for (const v of vals) if (typeof v === "string" && v) return v;
  return "";
}
function normSeverity(s: unknown): AlertSeverity {
  const u = String(s ?? "").toUpperCase();
  return u === "HIGH" || u === "MEDIUM" || u === "LOW" ? (u as AlertSeverity) : "MEDIUM";
}
function normStatus(s: unknown): AlertStatus {
  switch (String(s ?? "").toLowerCase()) {
    case "resolved":
    case "closed":
    case "dismissed":
      return "RESOLVED";
    case "acknowledged":
      return "ACKNOWLEDGED";
    default:
      return "ACTIVE"; // open / pending / active
  }
}
function normType(t: unknown): AlertType {
  const s = String(t ?? "").toLowerCase();
  if (s.includes("anomaly")) return "ANOMALY";
  if (s.includes("inactiv")) return "INACTIVITY";
  return "THRESHOLD";
}

interface RawAlert {
  alert_id: string;
  alert_type?: string;
  device_id?: string;
  message?: string;
  severity?: string;
  status?: string;
  title?: string;
  triggered_at?: string;
}
interface RawThreshold {
  threshold_id: string;
  device_id?: string;
  threshold_name?: string;
  threshold_value?: number;
  active?: boolean;
}
interface RawPreference {
  preference_id?: string;
  channel?: string;
  enabled?: boolean;
  min_severity?: string;
}

const channelLabel: Record<string, string> = {
  EMAIL: "Correo electrónico",
  SMS: "SMS",
  PUSH: "Notificación push",
};

export async function getAlerts(userId: string): Promise<Alert[]> {
  if (DEMO_MODE) {
    await delay();
    return demoAlerts;
  }
  const [{ data }, devices] = await Promise.all([
    api.get<RawAlert[]>(`${BASE}/users/${userId}/alerts`),
    listDevices(userId).catch(() => []),
  ]);
  const nameById = new Map(devices.map((d) => [d.deviceId, d.deviceName]));
  return (data ?? []).map((a) => {
    const id = str(a.device_id);
    return {
      id: str(a.alert_id),
      type: normType(a.alert_type),
      title: str(a.title, a.message, "Alerta"),
      deviceName: nameById.get(id) || (id ? `Dispositivo ${id.slice(0, 6)}` : ""),
      message: str(a.message),
      severity: normSeverity(a.severity),
      status: normStatus(a.status),
      createdAt: str(a.triggered_at).slice(0, 16).replace("T", " "),
    };
  });
}

// Cuenta de alertas sin resolver (para el KPI del dashboard).
export async function getUnreadAlertCount(userId: string): Promise<number> {
  if (DEMO_MODE) return demoAlerts.filter((a) => a.status !== "RESOLVED").length;
  try {
    const { data } = await api.get<RawAlert[]>(`${BASE}/users/${userId}/alerts`);
    return (data ?? []).filter((a) => normStatus(a.status) !== "RESOLVED").length;
  } catch {
    return 0;
  }
}

export async function updateAlertStatus(id: string, status: AlertStatus): Promise<void> {
  if (DEMO_MODE) {
    await delay(200);
    return;
  }
  // El backend espera el estado en minúsculas; al resolver enviamos resolved_at.
  const backendStatus = status === "RESOLVED" ? "resolved" : status === "ACKNOWLEDGED" ? "acknowledged" : "open";
  const body: Record<string, unknown> = { status: backendStatus };
  if (status === "RESOLVED") body.resolved_at = new Date().toISOString();
  await api.patch(`${BASE}/alerts/${id}/status`, body);
}

export async function getThresholds(userId: string): Promise<Threshold[]> {
  if (DEMO_MODE) {
    await delay();
    return demoThresholds;
  }
  const [{ data }, devices] = await Promise.all([
    api.get<RawThreshold[]>(`${BASE}/users/${userId}/thresholds`),
    listDevices(userId).catch(() => []),
  ]);
  const nameById = new Map(devices.map((d) => [d.deviceId, d.deviceName]));
  return (data ?? []).map((t) => {
    const id = str(t.device_id);
    return {
      id: str(t.threshold_id),
      deviceName: nameById.get(id) || str(t.threshold_name) || (id ? `Dispositivo ${id.slice(0, 6)}` : "Umbral"),
      maxKwhPerDay: t.threshold_value ?? 0,
      enabled: Boolean(t.active),
    };
  });
}
// Crea un umbral de consumo para un dispositivo del usuario.
export async function createThreshold(payload: {
  userId: string;
  deviceId: string;
  thresholdName: string;
  thresholdValue: number;
  metric?: string;
  operator?: string;
}): Promise<void> {
  if (DEMO_MODE) {
    await delay(300);
    return;
  }
  await api.post(`${BASE}/thresholds`, {
    user_id: payload.userId,
    device_id: payload.deviceId,
    threshold_name: payload.thresholdName,
    threshold_value: payload.thresholdValue,
    metric: payload.metric ?? "consumption_kwh",
    operator: payload.operator ?? ">",
    active: true,
  });
}
export async function getNotificationPreferences(userId: string): Promise<NotificationPreference[]> {
  if (DEMO_MODE) {
    await delay(250);
    return demoPreferences;
  }
  const { data } = await api.get<RawPreference[]>(`${BASE}/users/${userId}/notification-preferences`);
  return (data ?? []).map((p) => {
    const channel = (String(p.channel ?? "email").toUpperCase() as NotificationPreference["channel"]);
    return {
      channel,
      label: channelLabel[channel] ?? channel,
      enabled: Boolean(p.enabled),
    };
  });
}

export async function updateNotificationPreference(
  userId: string,
  channel: NotificationPreference["channel"],
  enabled: boolean
): Promise<void> {
  if (DEMO_MODE) {
    await delay(150);
    return;
  }
  await api.post(`${BASE}/notification-preferences`, {
    user_id: userId,
    channel: channel.toLowerCase(),
    enabled,
    min_severity: "medium",
  });
}
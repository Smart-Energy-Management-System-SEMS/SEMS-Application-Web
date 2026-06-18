import { api, DEMO_MODE, delay } from "../lib/api";
import { demoAlerts, demoThresholds, demoPreferences } from "../lib/demoExtra";
import type { Alert, AlertStatus, Threshold, NotificationPreference } from "../types/alerts";

// Alert Service expuesto en el Gateway bajo /api/v1/alerts-service/**
const BASE = "/api/v1/alerts-service/api/v1";

export async function getAlerts(): Promise<Alert[]> {
  if (DEMO_MODE) {
    await delay();
    return demoAlerts;
  }
  const { data } = await api.get<Alert[]>(`${BASE}/users/me/alerts`);
  return data;
}

export async function updateAlertStatus(id: string, status: AlertStatus): Promise<void> {
  if (DEMO_MODE) {
    await delay(200);
    return;
  }
  await api.patch(`${BASE}/alerts/${id}/status`, { status });
}

export async function getThresholds(): Promise<Threshold[]> {
  if (DEMO_MODE) {
    await delay();
    return demoThresholds;
  }
  const { data } = await api.get<Threshold[]>(`${BASE}/users/me/thresholds`);
  return data;
}

export async function getNotificationPreferences(): Promise<NotificationPreference[]> {
  if (DEMO_MODE) {
    await delay(250);
    return demoPreferences;
  }
  const { data } = await api.get<NotificationPreference[]>(`${BASE}/users/me/notification-preferences`);
  return data;
}

export async function updateNotificationPreference(
  channel: NotificationPreference["channel"],
  enabled: boolean
): Promise<void> {
  if (DEMO_MODE) {
    await delay(150);
    return;
  }
  await api.post(`${BASE}/notification-preferences`, { channel, enabled });
}
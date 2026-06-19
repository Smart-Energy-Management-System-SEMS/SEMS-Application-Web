import { api, DEMO_MODE, delay } from "../lib/api";
import { demoReadings, demoConsumption, demoMeters } from "../lib/demo";
import type { EnergyReading, DeviceConsumption, EnergyMeter } from "../types";

// El gateway enruta los recursos directamente bajo /api/v1 (sin segmento /energy).
const BASE = "/api/v1";

interface RawReading { energy_kwh: number; timestamp: string; estimated_cost?: number; }
interface RawConsumption { device_id: string; device_name: string; total_kwh: number; cost_estimate_soles: number; }
interface RawMeter { id: string; meter_serial: string; model: string; status: string; }

export async function getReadings(userId: string, days = 14): Promise<EnergyReading[]> {
  if (DEMO_MODE) { await delay(); return demoReadings(days); }
  const { data } = await api.get<RawReading[]>(`${BASE}/energy-readings/user/${userId}`, { params: { limit: 200 } });
  const cutoff = Date.now() - days * 86_400_000;
  const byDay = new Map<string, { kwh: number; cost: number }>();
  for (const r of data ?? []) {
    const t = new Date(r.timestamp).getTime();
    if (isNaN(t) || t < cutoff) continue;
    const day = r.timestamp.slice(0, 10);
    const acc = byDay.get(day) ?? { kwh: 0, cost: 0 };
    acc.kwh += r.energy_kwh ?? 0;
    acc.cost += r.estimated_cost ?? 0;
    byDay.set(day, acc);
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, kwh: +v.kwh.toFixed(2), cost: +v.cost.toFixed(2) }));
}

export async function getDeviceConsumption(userId: string): Promise<DeviceConsumption[]> {
  if (DEMO_MODE) { await delay(); return demoConsumption; }
  const { data } = await api.get<RawConsumption[]>(`${BASE}/device-consumptions/user/${userId}`, { params: { limit: 50 } });
  const list = data ?? [];
  const total = list.reduce((s, c) => s + (c.total_kwh ?? 0), 0) || 1;
  return list.map((c) => ({
    deviceId: c.device_id,
    deviceName: c.device_name,
    kwh: +(c.total_kwh ?? 0).toFixed(1),
    cost: +(c.cost_estimate_soles ?? 0).toFixed(2),
    pct: Math.round(((c.total_kwh ?? 0) / total) * 100),
  }));
}

export async function getMeters(userId: string): Promise<EnergyMeter[]> {
  if (DEMO_MODE) { await delay(250); return demoMeters; }
  const { data } = await api.get<RawMeter[]>(`${BASE}/energy-meters/user/${userId}`);
  return (data ?? []).map((m) => ({
    meterId: m.id,
    name: m.model || m.meter_serial,
    active: m.status === "active",
    lastReadingKwh: 0,
  }));
}
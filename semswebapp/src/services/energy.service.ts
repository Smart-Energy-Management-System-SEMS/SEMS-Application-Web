import { api, DEMO_MODE, delay } from "../lib/api";
import { demoReadings, demoConsumption, demoMeters } from "../lib/demo";
import { listDevices } from "./devices.service";
import { getTariff, DEFAULT_TARIFF } from "../lib/tariff";
import type { EnergyReading, DeviceConsumption, EnergyMeter } from "../types";
import { getHomeProfile } from "../lib/homeStore";
// Energy Monitoring Service (vía API Gateway, recursos bajo /api/v1).
const BASE = "/api/v1";

// Precio referencial S/ por kWh si el servicio de pricing no responde.
const FALLBACK_PRICE = DEFAULT_TARIFF;
interface RawReading { device_id: string; energy_kwh: number; timestamp: string; estimated_cost?: number; }
interface RawConsumption { device_id: string; device_name: string; total_kwh: number; cost_estimate_soles: number; }
interface RawMeter { id: string; meter_serial: string; model: string; status: string; }

async function getReadingsRaw(userId: string, limit = 200): Promise<RawReading[]> {
  const { data } = await api.get<RawReading[]>(`${BASE}/energy-readings/user/${userId}`, { params: { limit } });
  return data ?? [];
}

// Precio actual por kWh. Si el jefe de casa configuró una tarifa, esa manda;
// si no, usamos la del servicio de energía y, en último caso, el fallback.
export async function getPricePerKwh(): Promise<number> {
  const custom = getTariff();
  if (custom) return custom;
  if (DEMO_MODE) return FALLBACK_PRICE;
  try {
    const { data } = await api.get<{ price_per_kwh: number }>(`${BASE}/energy/pricing/current`);
    return data?.price_per_kwh || FALLBACK_PRICE;
  } catch {
    return FALLBACK_PRICE;
  }
}

export async function getReadings(userId: string, days = 14): Promise<EnergyReading[]> {
  if (DEMO_MODE) { await delay(); return demoReadings(days); }
  const readings = await getReadingsRaw(userId);
  const price = await getPricePerKwh();
  const cutoff = Date.now() - days * 86_400_000;
  const byDay = new Map<string, { kwh: number; cost: number }>();
  for (const r of readings) {
    const t = new Date(r.timestamp).getTime();
    if (isNaN(t) || t < cutoff) continue;
    const day = r.timestamp.slice(0, 10);
    const acc = byDay.get(day) ?? { kwh: 0, cost: 0 };
    acc.kwh += r.energy_kwh ?? 0;
    acc.cost += r.estimated_cost ?? (r.energy_kwh ?? 0) * price;
    byDay.set(day, acc);
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, kwh: +v.kwh.toFixed(2), cost: +v.cost.toFixed(2) }));
}
export interface PeriodComparison {
  currentKwh: number;
  previousKwh: number;
  currentCost: number;
  previousCost: number;
  deltaPct: number; // variación % del actual respecto al anterior
}

// Compara el periodo actual (últimos N días) contra el anterior equivalente.
export async function getPeriodComparison(userId: string, days = 7): Promise<PeriodComparison> {
  const readings = await getReadings(userId, days * 2); // agregadas por día
  const cutoffMs = Date.now() - days * 86_400_000;
  let currentKwh = 0, previousKwh = 0, currentCost = 0, previousCost = 0;
  for (const r of readings) {
    const t = new Date(r.date).getTime();
    if (isNaN(t)) continue;
    if (t >= cutoffMs) {
      currentKwh += r.kwh;
      currentCost += r.cost;
    } else {
      previousKwh += r.kwh;
      previousCost += r.cost;
    }
  }
  const deltaPct = previousKwh > 0 ? ((currentKwh - previousKwh) / previousKwh) * 100 : 0;
  return {
    currentKwh: +currentKwh.toFixed(2),
    previousKwh: +previousKwh.toFixed(2),
    currentCost: +currentCost.toFixed(2),
    previousCost: +previousCost.toFixed(2),
    deltaPct: +deltaPct.toFixed(1),
  };
}
export async function getDeviceConsumption(userId: string): Promise<DeviceConsumption[]> {
  if (DEMO_MODE) { await delay(); return demoConsumption; }

    // Dispositivos vigentes del usuario: sirven para poner nombre y para
  // descartar los que ya fueron eliminados (no deben seguir apareciendo).
  const devices = await listDevices(userId).catch(() => []);
  const nameById = new Map(devices.map((d) => [d.deviceId, d.deviceName]));
  const exists = (id: string) => devices.length === 0 || nameById.has(id);

  // 1) Agregados oficiales del backend (si hay). Si el endpoint falla
  //    (p. ej. 500), lo ignoramos y caemos a la estimación por lecturas.
  let agg: RawConsumption[] = [];
  try {
    const { data } = await api.get<RawConsumption[]>(
      `${BASE}/device-consumptions/user/${userId}`,
      { params: { limit: 50 } }
    );
    agg = data ?? [];
  } catch {
    agg = [];
  }
  agg = agg.filter((c) => exists(c.device_id));
  if (agg.length > 0) {
    const total = agg.reduce((s, c) => s + (c.total_kwh ?? 0), 0) || 1;
    return agg.map((c) => ({
      deviceId: c.device_id,
      deviceName: nameById.get(c.device_id) ?? c.device_name,
      kwh: +(c.total_kwh ?? 0).toFixed(2),
      cost: +(c.cost_estimate_soles ?? 0).toFixed(2),
      pct: Math.round(((c.total_kwh ?? 0) / total) * 100),
    }));
  }

  // 2) Estimación: agrupa las lecturas por dispositivo.
  const [readings, price] = await Promise.all([
    getReadingsRaw(userId),
    getPricePerKwh(),
  ]);
  const kwhByDevice = new Map<string, number>();
  for (const r of readings) {
    if (!exists(r.device_id)) continue; // ignoramos lecturas de dispositivos eliminados
    kwhByDevice.set(r.device_id, (kwhByDevice.get(r.device_id) ?? 0) + (r.energy_kwh ?? 0));
  }
  const total = [...kwhByDevice.values()].reduce((s, k) => s + k, 0) || 1;
  return [...kwhByDevice.entries()]
    .sort(([, a], [, b]) => b - a)
    .map(([deviceId, kwh]) => ({
      deviceId,
      deviceName: nameById.get(deviceId) ?? `Dispositivo ${deviceId.slice(0, 6)}`,
      kwh: +kwh.toFixed(3),
      cost: +(kwh * price).toFixed(2),
      pct: Math.round((kwh / total) * 100),
    }));
}

function mapMeter(m: RawMeter): EnergyMeter {
  return {
    meterId: m.id,
    name: m.model || m.meter_serial,
    active: m.status === "active",
    lastReadingKwh: 0,
  };
}

export async function getMeters(userId: string): Promise<EnergyMeter[]> {
  if (DEMO_MODE) {
    await delay(250);
    return demoMeters;
  }
  const { data } = await api.get<RawMeter[]>(`${BASE}/energy-meters/user/${userId}`);
  return (data ?? []).map(mapMeter);
}

// Vincula (registra y asocia) un medidor EOS al hogar/cuenta del residente.
// El Energy-Monitoring exige brand y location además del serial.
export async function linkMeter(userId: string, serial: string, model = "EOS"): Promise<EnergyMeter> {
  if (DEMO_MODE) {
    await delay(300);
    return { meterId: crypto.randomUUID(), name: model || serial, active: true, lastReadingKwh: 0 };
  }
  // Ubicación: usamos la del perfil del hogar si el usuario la configuró.
  const location = getHomeProfile(userId).location || "Hogar";
  const { data } = await api.post<RawMeter>(`${BASE}/energy-meters`, {
    user_id: userId,
    meter_serial: serial,
    model,
    brand: "EOS",
    location,
    status: "active",
  });
  return mapMeter(data);
}

// Desvincula el medidor de la cuenta.
export async function unlinkMeter(meterId: string): Promise<void> {
  if (DEMO_MODE) {
    await delay(200);
    return;
  }
  await api.delete(`${BASE}/energy-meters/${meterId}`);
}
// --- Resúmenes por periodo (RF-MON-06): semana y mes ---
export interface PeriodSummary {
  key: string;   // clave interna (2026-S27 / 2026-07)
  label: string; // etiqueta legible
  kwh: number;
  cost: number;
}
export interface ConsumptionSummary {
  weekly: PeriodSummary[];
  monthly: PeriodSummary[];
}

// Semana ISO (año-semana) a partir de una fecha.
function isoWeekKey(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7; // lunes=0
  date.setUTCDate(date.getUTCDate() - dayNum + 3); // jueves de esa semana
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((date.getTime() - firstThursday.getTime()) / 86_400_000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return `${date.getUTCFullYear()}-S${String(week).padStart(2, "0")}`;
}

// Agrupa las lecturas diarias en resúmenes por semana y por mes.
export async function getConsumptionSummary(userId: string, days = 90): Promise<ConsumptionSummary> {
  const readings = await getReadings(userId, days); // [{date, kwh, cost}] por día
  const weekMap = new Map<string, PeriodSummary>();
  const monthMap = new Map<string, PeriodSummary>();

  for (const r of readings) {
    const d = new Date(r.date + "T00:00:00");
    if (isNaN(d.getTime())) continue;

    const wk = isoWeekKey(d);
    const w = weekMap.get(wk) ?? { key: wk, label: wk.replace("-S", " · Sem "), kwh: 0, cost: 0 };
    w.kwh += r.kwh; w.cost += r.cost;
    weekMap.set(wk, w);

    const mo = r.date.slice(0, 7); // YYYY-MM
    const m = monthMap.get(mo) ?? { key: mo, label: mo, kwh: 0, cost: 0 };
    m.kwh += r.kwh; m.cost += r.cost;
    monthMap.set(mo, m);
  }

  const round = (arr: PeriodSummary[]) =>
    arr.map((p) => ({ ...p, kwh: +p.kwh.toFixed(2), cost: +p.cost.toFixed(2) }));

  return {
    weekly: round([...weekMap.values()]).slice(-8),   // últimas 8 semanas
    monthly: round([...monthMap.values()]).slice(-6), // últimos 6 meses
  };
}
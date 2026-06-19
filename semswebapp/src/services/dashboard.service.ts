import { DEMO_MODE, delay } from "../lib/api";
import { demoSummary } from "../lib/demo";
import type { DashboardSummary } from "../types";
import { getDeviceConsumption, getReadings } from "./energy.service";
import { listDevices } from "./devices.service";
import { getUnreadAlertCount } from "./alerts.service";
export async function getDashboardSummary(userId: string): Promise<DashboardSummary> {
  if (DEMO_MODE) { await delay(300); return demoSummary; }
 const [consumptionRes, devicesRes, readingsRes, alertsRes] = await Promise.allSettled([
    getDeviceConsumption(userId),
    listDevices(userId),
    getReadings(userId, 30),
    getUnreadAlertCount(userId),
  ]);
    const consumption = consumptionRes.status === "fulfilled" ? consumptionRes.value : [];
  const devices = devicesRes.status === "fulfilled" ? devicesRes.value : [];
  const readings = readingsRes.status === "fulfilled" ? readingsRes.value : [];
  const unreadAlerts = alertsRes.status === "fulfilled" ? alertsRes.value : 0;const consumptionKwh = consumption.reduce((s, c) => s + c.kwh, 0);
  const readingsKwh = readings.reduce((s, r) => s + r.kwh, 0);
  const currentMonthCost = consumption.reduce((s, c) => s + c.cost, 0);
  const totalKwh = consumptionKwh || readingsKwh;
  const activeDevices = devices.filter((d) => d.status === "ACTIVE").length;
  return {
    currentMonthCost: +currentMonthCost.toFixed(2),
    savingAmount: 0,
    savingPct: 0,
    projectedCost: +currentMonthCost.toFixed(2),
    totalKwh: +totalKwh.toFixed(2),
    activeDevices,
    unreadAlerts,
  };
}
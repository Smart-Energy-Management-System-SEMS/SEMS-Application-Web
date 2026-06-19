import { DEMO_MODE, delay } from "../lib/api";
import { demoSummary } from "../lib/demo";
import type { DashboardSummary } from "../types";
import { getDeviceConsumption } from "./energy.service";
import { listDevices } from "./devices.service";

export async function getDashboardSummary(userId: string): Promise<DashboardSummary> {
  if (DEMO_MODE) { await delay(300); return demoSummary; }
  const [consumptionRes, devicesRes] = await Promise.allSettled([
    getDeviceConsumption(userId),
    listDevices(userId),
  ]);
  const consumption = consumptionRes.status === "fulfilled" ? consumptionRes.value : [];
  const devices = devicesRes.status === "fulfilled" ? devicesRes.value : [];
  const currentMonthCost = consumption.reduce((s, c) => s + c.cost, 0);
  const totalKwh = consumption.reduce((s, c) => s + c.kwh, 0);
  const activeDevices = devices.filter((d) => d.status === "ACTIVE").length;
  return {
    currentMonthCost: +currentMonthCost.toFixed(2),
    savingAmount: 0,
    savingPct: 0,
    projectedCost: +currentMonthCost.toFixed(2),
    totalKwh: +totalKwh.toFixed(0),
    activeDevices,
    unreadAlerts: 0,
  };
}
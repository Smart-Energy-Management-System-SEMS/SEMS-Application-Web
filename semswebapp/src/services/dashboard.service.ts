import { DEMO_MODE, delay } from "../lib/api";
import { demoSummary } from "../lib/demo";
import type { DashboardSummary } from "../types";
import { getReadings } from "./energy.service";
import { getBillPrediction } from "./analytics.service";

// El resumen del dashboard se compone agregando datos de varios servicios.
export async function getDashboardSummary(): Promise<DashboardSummary> {
  if (DEMO_MODE) {
    await delay(300);
    return demoSummary;
  }
  const [readings, prediction] = await Promise.all([getReadings(30), getBillPrediction()]);
  const totalKwh = readings.reduce((s, r) => s + r.kwh, 0);
  const currentMonthCost = readings.reduce((s, r) => s + r.cost, 0);
  return {
    currentMonthCost: +currentMonthCost.toFixed(2),
    savingAmount: 0,
    savingPct: 0,
    projectedCost: prediction.projectedCost,
    totalKwh: +totalKwh.toFixed(0),
    activeDevices: 0,
    unreadAlerts: 0,
  };
}

import { api, DEMO_MODE, delay } from "../lib/api";
import {
  demoRecommendations,
  demoAnomalies,
  demoBillPrediction,
  demoRankings,
} from "../lib/demo";
import type {
  Recommendation,
  Anomaly,
  BillPrediction,
  ConsumptionRanking,
} from "../types";

// Analytics Service (vía API Gateway, mantiene el prefijo /api/v1/analytics).
const BASE = "/api/v1/analytics";

// Helpers tolerantes a distintos nombres de campo.
function num(...vals: unknown[]): number {
  for (const v of vals) if (typeof v === "number" && !isNaN(v)) return v;
  return 0;
}
function str(...vals: unknown[]): string {
  for (const v of vals) if (typeof v === "string" && v) return v;
  return "";
}
function normSeverity(s: unknown): "LOW" | "MEDIUM" | "HIGH" {
  const u = String(s ?? "").toUpperCase();
  return u === "HIGH" || u === "MEDIUM" || u === "LOW" ? (u as "LOW" | "MEDIUM" | "HIGH") : "LOW";
}

export async function getRecommendations(userId: string): Promise<Recommendation[]> {
  if (DEMO_MODE) {
    await delay();
    return demoRecommendations;
  }
  const { data } = await api.get<Record<string, unknown>[]>(`${BASE}/recommendations/user/${userId}`);
  return (data ?? []).map((r) => ({
    id: str(r.id, r.recommendation_id),
    title: str(r.title, r.name, "Recomendación"),
    detail: str(r.description, r.detail, r.message),
    estimatedSaving: num(
      r.estimated_saving_soles, r.estimated_savings_soles, r.estimated_savings,
      r.estimated_saving, r.savings_soles, r.savings
    ),
    applied: Boolean(r.applied ?? r.is_applied ?? false),
  }));
}

export async function applyRecommendation(id: string): Promise<void> {
  if (DEMO_MODE) {
    await delay(200);
    return;
  }
  await api.patch(`${BASE}/recommendations/${id}/apply`);
}

export async function getAnomalies(userId: string): Promise<Anomaly[]> {
  if (DEMO_MODE) {
    await delay();
    return demoAnomalies;
  }
  const { data } = await api.get<Record<string, unknown>[]>(`${BASE}/anomalies/user/${userId}`);
  return (data ?? []).map((a) => ({
    id: str(a.id, a.anomaly_id),
    deviceName: str(a.device_name, a.device_id, "Dispositivo"),
    description: str(a.description, a.message, a.detail),
    severity: normSeverity(a.severity),
    detectedAt: str(a.detected_at, a.created_at),
    resolved: Boolean(a.resolved ?? a.is_resolved ?? false),
  }));
}

export async function getBillPrediction(userId: string): Promise<BillPrediction | null> {
  if (DEMO_MODE) {
    await delay(300);
    return demoBillPrediction;
  }
  const { data } = await api.get<unknown>(`${BASE}/bill-predictions/user/${userId}`);
  const p = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | undefined;
  if (!p) return null;
  let confidence = num(p.confidence, p.confidence_score);
  if (confidence > 1) confidence = confidence / 100; // normaliza si viene 0-100
  return {
    projectedCost: num(p.projected_cost_soles, p.predicted_cost_soles, p.predicted_cost, p.projected_cost, p.estimated_cost),
    projectedKwh: num(p.projected_kwh, p.predicted_kwh, p.estimated_kwh),
    confidence,
    closingDate: str(p.period_end, p.closing_date, p.prediction_date) || "fin de mes",
  };
}

export async function getRankings(userId: string): Promise<ConsumptionRanking[]> {
  if (DEMO_MODE) {
    await delay();
    return demoRankings;
  }
  const { data } = await api.get<Record<string, unknown>[]>(`${BASE}/consumption-rankings/user/${userId}`);
  return (data ?? []).map((r, i) => ({
    rank: num(r.rank, r.position) || i + 1,
    deviceName: str(r.device_name, r.device_id, "Dispositivo"),
    kwh: num(r.total_kwh, r.kwh, r.consumption_kwh),
    cost: num(r.cost_estimate_soles, r.cost_soles, r.cost),
  }));
}
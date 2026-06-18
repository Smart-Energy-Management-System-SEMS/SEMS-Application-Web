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

export async function getRecommendations(): Promise<Recommendation[]> {
  if (DEMO_MODE) {
    await delay();
    return demoRecommendations;
  }
  const { data } = await api.get<Recommendation[]>("/api/v1/analytics/recommendations/user/me");
  return data;
}

export async function applyRecommendation(id: string): Promise<void> {
  if (DEMO_MODE) {
    await delay(200);
    return;
  }
  await api.patch(`/api/v1/analytics/recommendations/${id}/apply`);
}

export async function getAnomalies(): Promise<Anomaly[]> {
  if (DEMO_MODE) {
    await delay();
    return demoAnomalies;
  }
  const { data } = await api.get<Anomaly[]>("/api/v1/analytics/anomalies/user/me");
  return data;
}

export async function getBillPrediction(): Promise<BillPrediction> {
  if (DEMO_MODE) {
    await delay(300);
    return demoBillPrediction;
  }
  const { data } = await api.get<BillPrediction[]>("/api/v1/analytics/bill-predictions/user/me");
  return Array.isArray(data) ? data[0] : data;
}

export async function getRankings(): Promise<ConsumptionRanking[]> {
  if (DEMO_MODE) {
    await delay();
    return demoRankings;
  }
  const { data } = await api.get<ConsumptionRanking[]>("/api/v1/analytics/consumption-rankings/user/me");
  return data;
}

import type {
  Device,
  EnergyReading,
  DeviceConsumption,
  EnergyMeter,
  Recommendation,
  Anomaly,
  BillPrediction,
  ConsumptionRanking,
  DashboardSummary,
  User,
} from "../types";

export const demoUser: User = {
  id: "u-001",
  email: "demo@energix.pe",
  fullName: "Alexis Encalada",
  role: "RESIDENT",
};

export const demoDevices: Device[] = [
  { deviceId: "d-01", name: "Aire acondicionado", type: "Climatización", status: "ACTIVE", ratedPowerW: 1200, location: "Sala", lastSeen: "hace 2 min" },
  { deviceId: "d-02", name: "Refrigeradora", type: "Cocina", status: "ACTIVE", ratedPowerW: 350, location: "Cocina", lastSeen: "hace 1 min" },
  { deviceId: "d-03", name: "Terma eléctrica", type: "Baño", status: "ACTIVE", ratedPowerW: 1500, location: "Baño principal", lastSeen: "hace 5 min" },
  { deviceId: "d-04", name: "Televisor", type: "Entretenimiento", status: "INACTIVE", ratedPowerW: 120, location: "Sala", lastSeen: "hace 3 h" },
  { deviceId: "d-05", name: "Lavadora", type: "Lavandería", status: "MAINTENANCE", ratedPowerW: 500, location: "Patio", lastSeen: "hace 1 día" },
  { deviceId: "d-06", name: "Microondas", type: "Cocina", status: "ACTIVE", ratedPowerW: 900, location: "Cocina", lastSeen: "hace 12 min" },
];

export function demoReadings(days = 14): EnergyReading[] {
  const out: EnergyReading[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const kwh = +(6 + Math.sin(i / 2) * 2 + Math.random() * 2.5).toFixed(1);
    out.push({
      date: d.toISOString().slice(0, 10),
      kwh,
      cost: +(kwh * 0.78).toFixed(2),
    });
  }
  return out;
}

export const demoConsumption: DeviceConsumption[] = [
  { deviceId: "d-01", deviceName: "Aire acondicionado", kwh: 58.4, cost: 45.55, pct: 34 },
  { deviceId: "d-03", deviceName: "Terma eléctrica", kwh: 37.8, cost: 29.48, pct: 22 },
  { deviceId: "d-02", deviceName: "Refrigeradora", kwh: 30.9, cost: 24.1, pct: 18 },
  { deviceId: "d-06", deviceName: "Microondas", kwh: 18.2, cost: 14.2, pct: 11 },
  { deviceId: "d-04", deviceName: "Televisor", kwh: 13.7, cost: 10.69, pct: 8 },
  { deviceId: "d-05", deviceName: "Otros", kwh: 11.9, cost: 9.28, pct: 7 },
];

export const demoMeters: EnergyMeter[] = [
  { meterId: "m-01", name: "Medidor principal EOS", active: true, lastReadingKwh: 1842.6 },
];

export const demoRecommendations: Recommendation[] = [
  { id: "r-01", title: "Sube el aire a 24°C", detail: "Mantener el aire acondicionado en 24°C en vez de 21°C puede reducir su consumo hasta un 18%.", estimatedSaving: 14.2, applied: false },
  { id: "r-02", title: "Evita standby en la terma", detail: "Programa la terma 30 min antes del baño en lugar de dejarla encendida todo el día.", estimatedSaving: 11.5, applied: false },
  { id: "r-03", title: "Usa la lavadora en agua fría", detail: "El 90% de la energía de la lavadora se va en calentar el agua.", estimatedSaving: 6.8, applied: true },
];

export const demoAnomalies: Anomaly[] = [
  { id: "a-01", deviceName: "Aire acondicionado", description: "Encendido por 4 h continuas durante la madrugada.", severity: "HIGH", detectedAt: "Hoy, 03:12", resolved: false },
  { id: "a-02", deviceName: "Terma eléctrica", description: "Consumo 35% por encima de tu promedio semanal.", severity: "MEDIUM", detectedAt: "Ayer, 19:40", resolved: false },
  { id: "a-03", deviceName: "Refrigeradora", description: "Pico breve de consumo inusual.", severity: "LOW", detectedAt: "Lun, 11:05", resolved: true },
];

export const demoBillPrediction: BillPrediction = {
  projectedCost: 318.4,
  projectedKwh: 408,
  confidence: 0.86,
  closingDate: "fin de mes",
};

export const demoRankings: ConsumptionRanking[] = demoConsumption
  .slice(0, 5)
  .map((c, i) => ({ rank: i + 1, deviceName: c.deviceName, kwh: c.kwh, cost: c.cost }));

export const demoSummary: DashboardSummary = {
  currentMonthCost: 231.6,
  savingAmount: 86.4,
  savingPct: 21,
  projectedCost: 318.4,
  totalKwh: 297,
  activeDevices: demoDevices.filter((d) => d.status === "ACTIVE").length,
  unreadAlerts: demoAnomalies.filter((a) => !a.resolved).length,
};

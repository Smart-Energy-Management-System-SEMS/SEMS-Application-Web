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
  { deviceId: "d-01", externalDeviceCode: "AC-001", userId: "u-001", deviceName: "Aire acondicionado", deviceType: "AIR_CONDITIONER", brand: "Samsung", model: "AR12", connectionProtocol: "WIFI", status: "ACTIVE", registeredAt: "2026-06-01T10:00:00Z", updatedAt: "2026-06-01T10:00:00Z" },
  { deviceId: "d-02", externalDeviceCode: "REF-002", userId: "u-001", deviceName: "Refrigeradora", deviceType: "REFRIGERATOR", brand: "LG", model: "GT29", connectionProtocol: "WIFI", status: "ACTIVE", registeredAt: "2026-06-01T10:05:00Z", updatedAt: "2026-06-01T10:05:00Z" },
  { deviceId: "d-03", externalDeviceCode: "HEAT-003", userId: "u-001", deviceName: "Terma eléctrica", deviceType: "WATER_HEATER", brand: "Bosch", model: "Tronic", connectionProtocol: "WIFI", status: "ACTIVE", registeredAt: "2026-06-01T10:10:00Z", updatedAt: "2026-06-01T10:10:00Z" },
  { deviceId: "d-04", externalDeviceCode: "TV-004", userId: "u-001", deviceName: "Televisor", deviceType: "TV", brand: "Sony", model: "Bravia", connectionProtocol: "WIFI", status: "INACTIVE", registeredAt: "2026-06-01T10:15:00Z", updatedAt: "2026-06-01T10:15:00Z" },
  { deviceId: "d-05", externalDeviceCode: "WASH-005", userId: "u-001", deviceName: "Lavadora", deviceType: "WASHING_MACHINE", brand: "Mabe", model: "LMA", connectionProtocol: "BLUETOOTH", status: "MAINTENANCE", registeredAt: "2026-06-01T10:20:00Z", updatedAt: "2026-06-01T10:20:00Z" },
  { deviceId: "d-06", externalDeviceCode: "MW-006", userId: "u-001", deviceName: "Microondas", deviceType: "MICROWAVE", brand: "Panasonic", model: "NN", connectionProtocol: "WIFI", status: "ACTIVE", registeredAt: "2026-06-01T10:25:00Z", updatedAt: "2026-06-01T10:25:00Z" },
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

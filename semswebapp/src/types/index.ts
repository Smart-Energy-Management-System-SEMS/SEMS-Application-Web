// Tipos de dominio de SEMS (alineados con los microservicios).
// Segmento objetivo del reporte: propietario de vivienda o estudiante/inquilino.
export type UserSegment = "HOMEOWNER" | "TENANT";
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: "ADMIN" | "RESIDENT" | "GUEST";
  segment?: UserSegment;   // <-- agrega esta línea
}
export interface AuthResponse {
  token: string;
  user: User;
}

// Device Management Service
export type DeviceStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE";

export interface Device {
  deviceId: string;
  externalDeviceCode: string;
  userId: string;
  deviceName: string;
  deviceType: string; // p.ej. "meter", "AIR_CONDITIONER", "SENSOR"
  brand: string;
  model: string;
  connectionProtocol: string; // "WIFI", "BLUETOOTH"
  status: DeviceStatus;
  registeredAt?: string;
  updatedAt?: string;
}
export interface CreateDevicePayload {
  deviceName: string;
  deviceType: string;
  brand: string;
  model: string;
  connectionProtocol: string;
  externalDeviceCode: string;
  userId: string;
}
// Energy Monitoring Service
export interface EnergyReading {
  date: string; // YYYY-MM-DD
  kwh: number;
  cost: number; // en soles
}

export interface DeviceConsumption {
  deviceId: string;
  deviceName: string;
  kwh: number;
  cost: number;
  pct: number; // % del total
}

export interface EnergyMeter {
  meterId: string;
  name: string;
  active: boolean;
  lastReadingKwh: number;
}

// Analytics Service
export interface Recommendation {
  id: string;
  title: string;
  detail: string;
  estimatedSaving: number; // soles/mes
  applied: boolean;
}

export interface Anomaly {
  id: string;
  deviceName: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  detectedAt: string;
  resolved: boolean;
}

export interface BillPrediction {
  projectedCost: number; // soles
  projectedKwh: number;
  confidence: number; // 0..1
  closingDate: string;
}

export interface ConsumptionRanking {
  rank: number;
  deviceName: string;
  kwh: number;
  cost: number;
}

// Resumen del dashboard (agregado en el cliente)
export interface DashboardSummary {
  currentMonthCost: number;
  savingAmount: number;
  savingPct: number;
  projectedCost: number;
  totalKwh: number;
  activeDevices: number;
  unreadAlerts: number;
}

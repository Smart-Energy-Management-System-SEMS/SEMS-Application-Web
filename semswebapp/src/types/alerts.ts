// Tipos del Alert Service (Go).

export type AlertStatus = "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";
export type AlertSeverity = "LOW" | "MEDIUM" | "HIGH";
export type AlertType = "THRESHOLD" | "ANOMALY" | "INACTIVITY";

export interface Alert {
  id: string;
  type: AlertType;
  title: string;
  deviceName: string;
  message: string;
  severity: AlertSeverity;
  status: AlertStatus;
  createdAt: string;
}

export interface Threshold {
  id: string;
  deviceName: string;
  maxKwhPerDay: number;
  enabled: boolean;
}

export interface NotificationPreference {
  channel: "EMAIL" | "SMS" | "PUSH";
  label: string;
  enabled: boolean;
}
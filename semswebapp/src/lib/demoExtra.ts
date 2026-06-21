import type { Alert, Threshold, NotificationPreference } from "../types/alerts";
import type {
  SubscriptionPlan,
  Subscription,
  PaymentMethod,
  Invoice,
} from "../types/billing";

// ---------- Alertas ----------
export const demoAlerts: Alert[] = [
   { id: "al-01", type: "THRESHOLD", title: "Consumo elevado detectado", deviceName: "Aire acondicionado", message: "Superó el umbral de 8 kWh/día.", severity: "HIGH", status: "ACTIVE", createdAt: "Hoy, 03:12" },
  { id: "al-02", type: "ANOMALY", title: "Anomalía de consumo", deviceName: "Terma eléctrica", message: "Consumo 35% por encima de tu promedio semanal.", severity: "MEDIUM", status: "ACTIVE", createdAt: "Ayer, 19:40" },
  { id: "al-03", type: "INACTIVITY", title: "Dispositivo inactivo", deviceName: "Lavadora", message: "Sin actividad por más de 7 días.", severity: "LOW", status: "ACKNOWLEDGED", createdAt: "Lun, 09:15" },
  { id: "al-04", type: "THRESHOLD", title: "Umbral superado", deviceName: "Microondas", message: "Encendido por tiempo prolongado.", severity: "LOW", status: "RESOLVED", createdAt: "Dom, 13:02" },];

export const demoThresholds: Threshold[] = [
  { id: "th-01", deviceName: "Aire acondicionado", maxKwhPerDay: 8, enabled: true },
  { id: "th-02", deviceName: "Terma eléctrica", maxKwhPerDay: 6, enabled: true },
  { id: "th-03", deviceName: "Refrigeradora", maxKwhPerDay: 4, enabled: false },
];

export const demoPreferences: NotificationPreference[] = [
  { channel: "EMAIL", label: "Correo electrónico", enabled: true },
  { channel: "PUSH", label: "Notificaciones push", enabled: true },
  { channel: "SMS", label: "Mensaje de texto (SMS)", enabled: false },
];

// ---------- Suscripción y pagos ----------
export const demoPlans: SubscriptionPlan[] = [
  { id: "p-basic", name: "Básica", price: 19, period: "mes", features: ["Consumo en tiempo real", "Avisos de consumo alto", "Panel web del hogar"] },
  { id: "p-premium", name: "Premium", price: 39, period: "mes", recommended: true, features: ["Todo lo de Básica", "Consumo por dispositivo", "Proyección de factura y metas", "Soporte prioritario"] },
  { id: "p-annual", name: "Anual", price: 349, period: "año", features: ["Todo lo de Premium", "2 meses gratis", "Asesoría de eficiencia", "Acceso anticipado"] },
];

export const demoSubscription: Subscription = {
  id: "sub-demo-01",
  planId: "p-premium",
  planName: "Premium",
  status: "ACTIVE",
  renewalDate: "15 jul 2026",
  price: 39,
  period: "mes",
};

export const demoPaymentMethods: PaymentMethod[] = [
  { id: "pm-01", brand: "Visa", last4: "4242", expMonth: 8, expYear: 27, primary: true },
  { id: "pm-02", brand: "Mastercard", last4: "5588", expMonth: 3, expYear: 26, primary: false },
];

export const demoInvoices: Invoice[] = [
  { id: "inv-1042", date: "15 jun 2026", amount: 39, status: "PAID", description: "Plan Premium · Junio" },
  { id: "inv-1019", date: "15 may 2026", amount: 39, status: "PAID", description: "Plan Premium · Mayo" },
  { id: "inv-0987", date: "15 abr 2026", amount: 39, status: "PAID", description: "Plan Premium · Abril" },
  { id: "inv-0965", date: "15 mar 2026", amount: 0, status: "PAID", description: "Prueba gratuita" },
];
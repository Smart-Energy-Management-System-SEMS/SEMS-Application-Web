import { api, DEMO_MODE, delay } from "../lib/api";
import {
  demoPlans,
  demoSubscription,
  demoPaymentMethods,
  demoInvoices,
} from "../lib/demoExtra";
import type {
  SubscriptionPlan,
  Subscription,
  SubscriptionStatus,
  PaymentMethod,
  Invoice,
} from "../types/billing";

// Subscriptions y Payments (vía API Gateway). Si el gateway usa otro prefijo,
// cámbialo aquí (ambos servicios exponen sus rutas bajo /api/v1).
const BASE = "/api/v1";

// --- Subscriptions: el backend devuelve los campos en PascalCase ---
interface RawPlanFeature { FeatureCode?: string; FeatureName?: string; FeatureValue?: string; }
interface RawPlan {
  PlanID?: string;
  Name?: string;
  Price?: number;
  BillingPeriod?: string;
  Description?: string;
  Active?: boolean;
  PlanFeatures?: RawPlanFeature[];
}
interface RawSubscription {
  SubscriptionID?: string;
  UserID?: string;
  PlanID?: string;
  Status?: string;
  StartDate?: string;
  EndDate?: string;
  StripeSubscriptionID?: string;
}

// --- Payments: el backend devuelve los campos en snake_case ---
interface RawPaymentMethod {
  payment_method_id: string;
  brand?: string;
  last4?: string;
  exp_month?: number;
  exp_year?: number;
  is_default?: boolean;
}
interface RawPayment {
  payment_id: string;
  amount?: number;
  currency?: string;
  status?: string;
  paid_at?: string;
  created_at?: string;
}

function periodLabel(billing?: string): "mes" | "año" {
  return String(billing ?? "").toLowerCase().startsWith("year") ||
    String(billing ?? "").toLowerCase().startsWith("annual") ||
    String(billing ?? "").toLowerCase() === "yearly"
    ? "año"
    : "mes";
}

function planFeatures(p: RawPlan): string[] {
  const feats = (p.PlanFeatures ?? [])
    .filter((f) => (f.FeatureCode ?? "").toUpperCase() !== "STRIPE_PRICE_ID")
    .map((f) => f.FeatureName || f.FeatureValue || "")
    .filter(Boolean);
  if (feats.length > 0) return feats;
  return p.Description ? [p.Description] : [];
}

function mapPlan(p: RawPlan): SubscriptionPlan {
  return {
    id: p.PlanID ?? "",
    name: p.Name ?? "Plan",
    price: p.Price ?? 0,
    period: periodLabel(p.BillingPeriod),
    features: planFeatures(p),
    recommended: (p.Name ?? "").toLowerCase().includes("pro"),
  };
}

function normSubStatus(s?: string): SubscriptionStatus {
  switch (String(s ?? "").toUpperCase()) {
    case "CANCELLED":
    case "CANCELED":
      return "CANCELED";
    case "TRIAL":
    case "TRIALING":
      return "TRIAL";
    case "PAST_DUE":
    case "UNPAID":
      return "PAST_DUE";
    default:
      return "ACTIVE";
  }
}

export async function getPlans(): Promise<SubscriptionPlan[]> {
  if (DEMO_MODE) {
    await delay();
    return demoPlans;
  }
  const { data } = await api.get<RawPlan[]>(`${BASE}/subscription-plans`);
  return (data ?? []).map(mapPlan);
}

// Suscripción actual del usuario (resuelve nombre/precio del plan).
export async function getMySubscription(userId: string): Promise<Subscription | null> {
  if (DEMO_MODE) {
    await delay(300);
    return demoSubscription;
  }
  const [subsRes, plansRes] = await Promise.allSettled([
    api.get<RawSubscription[]>(`${BASE}/subscriptions/users/${userId}`),
    api.get<RawPlan[]>(`${BASE}/subscription-plans`),
  ]);
  const subs = subsRes.status === "fulfilled" ? subsRes.value.data ?? [] : [];
  const plans = plansRes.status === "fulfilled" ? (plansRes.value.data ?? []).map(mapPlan) : [];
  if (subs.length === 0) return null;

  // Preferimos una activa; si no, la primera.
  const raw = subs.find((s) => normSubStatus(s.Status) === "ACTIVE") ?? subs[0];
  const plan = plans.find((p) => p.id === raw.PlanID);
  return {
    id: raw.SubscriptionID ?? "",
    planId: raw.PlanID ?? "",
    planName: plan?.name ?? raw.PlanID ?? "Plan",
    status: normSubStatus(raw.Status),
    renewalDate: (raw.EndDate ?? "").slice(0, 10) || "—",
    price: plan?.price ?? 0,
    period: plan?.period ?? "mes",
  };
}

// Cambia de plan si ya hay suscripción; si no, crea una nueva.
export async function changePlan(args: {
  planId: string;
  subscriptionId?: string;
  userId: string;
}): Promise<void> {
  if (DEMO_MODE) {
    await delay(400);
    return;
  }
  if (args.subscriptionId) {
    await api.patch(`${BASE}/subscriptions/${args.subscriptionId}/change-plan`, { new_plan_id: args.planId });
  } else {
    await api.post(`${BASE}/subscriptions`, { plan_id: args.planId, user_id: args.userId });
  }
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  if (DEMO_MODE) {
    await delay(300);
    return;
  }
  await api.patch(`${BASE}/subscriptions/${subscriptionId}/cancel`);
}

export async function getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
  if (DEMO_MODE) {
    await delay(250);
    return demoPaymentMethods;
  }
  const { data } = await api.get<RawPaymentMethod[]>(`${BASE}/payment-methods/user/${userId}`);
  return (data ?? []).map((m) => ({
    id: m.payment_method_id,
    brand: m.brand ? m.brand.charAt(0).toUpperCase() + m.brand.slice(1) : "Tarjeta",
    last4: m.last4 ?? "····",
    expMonth: m.exp_month ?? 0,
    expYear: m.exp_year ?? 0,
    primary: Boolean(m.is_default),
  }));
}
// Registra en el backend una tarjeta ya tokenizada por Stripe (pm_xxx).
export async function addPaymentMethod(userId: string, stripePaymentMethodId: string): Promise<void> {
  if (DEMO_MODE) {
    await delay(300);
    return;
  }
  await api.post(`${BASE}/payment-methods`, {
    user_id: userId,
    type: "card",
    stripe_payment_method_id: stripePaymentMethodId,
    is_default: true,
  });
}

export async function deletePaymentMethod(paymentMethodId: string): Promise<void> {
  if (DEMO_MODE) {
    await delay(200);
    return;
  }
  await api.delete(`${BASE}/payment-methods/${paymentMethodId}`);
}

// Procesa un pago real vía Stripe (crea PaymentIntent + factura en la BD).
export async function processPayment(args: {
  userId: string;
  paymentMethodId: string;
  amount: number;
  subscriptionId?: string;
  currency?: string;
}): Promise<void> {
  if (DEMO_MODE) {
    await delay(500);
    return;
  }
  await api.post(`${BASE}/payments/process`, {
    user_id: args.userId,
    payment_method_id: args.paymentMethodId,
    subscription_id: args.subscriptionId,
    amount: args.amount,
    currency: (args.currency ?? "pen").toLowerCase(),
    payment_method: "card",
  });
}
// Payments no tiene "facturas por usuario"; armamos el historial desde los pagos.
export async function getInvoices(userId: string): Promise<Invoice[]> {
  if (DEMO_MODE) {
    await delay();
    return demoInvoices;
  }
  const { data } = await api.get<RawPayment[]>(`${BASE}/payments/user/${userId}`);
  return (data ?? []).map((p) => ({
    id: p.payment_id,
    date: (p.paid_at || p.created_at || "").slice(0, 10),
    amount: p.amount ?? 0,
    status: p.status === "paid" ? "PAID" : p.status === "failed" ? "FAILED" : "PENDING",
    description: `Pago ${String(p.currency ?? "PEN").toUpperCase()}`,
  }));
}

// Crea una sesión de Stripe Checkout (página alojada de Stripe) y devuelve la
// URL a la que hay que redirigir. Con esto el pago se procesa en la ventana de
// Stripe (RF-BILL-02) — el cliente nunca toca datos de tarjeta.
export async function createCheckoutSession(args: {
  userId: string;
  amount: number;
  subscriptionId?: string;
  planName?: string;
}): Promise<string> {
  if (DEMO_MODE) {
    await delay(300);
    return ""; // en demo no hay redirección real
  }
  const origin = window.location.origin;
  const { data } = await api.post<{ url: string }>(`${BASE}/payments/checkout-session`, {
    user_id: args.userId,
    subscription_id: args.subscriptionId,
    amount: args.amount,
    currency: "pen",
    product_name: args.planName ? `SEMS ${args.planName}` : "SEMS",
    success_url: `${origin}/subscription?paid=1`,
    cancel_url: `${origin}/subscription?canceled=1`,
  });
  return data.url;
}
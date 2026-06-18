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
  PaymentMethod,
  Invoice,
} from "../types/billing";

export async function getPlans(): Promise<SubscriptionPlan[]> {
  if (DEMO_MODE) {
    await delay();
    return demoPlans;
  }
  const { data } = await api.get<SubscriptionPlan[]>("/api/v1/subscription-plans");
  return data;
}

export async function getMySubscription(): Promise<Subscription | null> {
  if (DEMO_MODE) {
    await delay(300);
    return demoSubscription;
  }
  const { data } = await api.get<Subscription>("/api/v1/subscriptions/me");
  return data;
}

export async function changePlan(planId: string): Promise<void> {
  if (DEMO_MODE) {
    await delay(400);
    return;
  }
  await api.post("/api/v1/subscriptions/change", { planId });
}

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  if (DEMO_MODE) {
    await delay(250);
    return demoPaymentMethods;
  }
  const { data } = await api.get<PaymentMethod[]>("/api/v1/payments/payment-methods");
  return data;
}

export async function getInvoices(): Promise<Invoice[]> {
  if (DEMO_MODE) {
    await delay();
    return demoInvoices;
  }
  const { data } = await api.get<Invoice[]>("/api/v1/payments/invoices");
  return data;
}
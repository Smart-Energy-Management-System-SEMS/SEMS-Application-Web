// Tipos de Subscriptions Service y Payments Service (Go).

export type SubscriptionStatus = "ACTIVE" | "TRIAL" | "CANCELED" | "PAST_DUE";

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number; // soles
  period: "mes" | "año";
  features: string[];
  recommended?: boolean;
}

export interface Subscription {
  id: string;
  planId: string;
  planName: string;
  status: SubscriptionStatus;
  renewalDate: string;
  price: number;
  period: string;
}

export interface PaymentMethod {
  id: string;
  brand: string; // Visa, Mastercard
  last4: string;
  expMonth: number;
  expYear: number;
  primary: boolean;
}

export interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: "PAID" | "PENDING" | "FAILED";
  description: string;
}
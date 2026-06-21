import { loadStripe } from "@stripe/stripe-js";

// Publishable key de Stripe (configúrala en Vercel como VITE_STRIPE_PUBLISHABLE_KEY).
const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;

// Si no hay key, queda null y la UI de pago se oculta.
export const stripePromise = key ? loadStripe(key) : null;
export const STRIPE_ENABLED = !!key;
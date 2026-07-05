// Niveles de plan y qué desbloquea cada uno.
export type PlanTier = "free" | "plus" | "pro";

const ORDER: PlanTier[] = ["free", "plus", "pro"];

export const TIER_LABEL: Record<PlanTier, string> = { free: "Free", plus: "Plus", pro: "Pro" };

// Deriva el nivel a partir del nombre del plan de la suscripción.
export function tierFromName(name?: string): PlanTier {
  const n = (name ?? "").toLowerCase();
  if (n.includes("pro")) return "pro";
  if (n.includes("plus")) return "plus";
  return "free";
}

// ¿El nivel actual alcanza el requerido? (free < plus < pro)
export function hasTier(current: PlanTier, required: PlanTier): boolean {
  return ORDER.indexOf(current) >= ORDER.indexOf(required);
}

// Límite de dispositivos vinculados por plan (Pro = ilimitado).
export const DEVICE_LIMIT: Record<PlanTier, number> = {
  free: 3,
  plus: 10,
  pro: Number.POSITIVE_INFINITY,
};
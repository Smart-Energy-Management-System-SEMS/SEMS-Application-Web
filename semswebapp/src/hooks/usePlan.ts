import { useQuery } from "@tanstack/react-query";
import { getMySubscription } from "../services/subscriptions.service";
import { useAuth } from "../context/AuthContext";
import { tierFromName, type PlanTier } from "../lib/plan";

// Devuelve el nivel del plan del usuario. Comparte la misma query key que la
// página de Suscripción, así que no genera una petición extra.
export function usePlanTier(): PlanTier {
  const { user } = useAuth();
  const sub = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: () => getMySubscription(user!.id),
    enabled: !!user,
  });
  return tierFromName(sub.data?.planName);
}
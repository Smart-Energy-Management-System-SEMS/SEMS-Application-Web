import { NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard, Cpu, Activity, LineChart, Bell, FileText, Home, CreditCard, Zap, X, Lock,
} from "lucide-react";
import { getMySubscription } from "../services/subscriptions.service";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";
import { usePlanTier } from "../hooks/usePlan";
import { hasTier, type PlanTier } from "../lib/plan";
export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
    const { t } = useLang();
  const tier = usePlanTier();
  const nav: { to: string; label: string; icon: typeof LayoutDashboard; end?: boolean; min?: PlanTier }[] = [
    { to: "/", label: t("Resumen", "Overview"), icon: LayoutDashboard, end: true },
    { to: "/devices", label: t("Dispositivos", "Devices"), icon: Cpu },
    { to: "/monitoring", label: t("Monitoreo", "Monitoring"), icon: Activity },
    { to: "/analytics", label: t("Analítica", "Analytics"), icon: LineChart, min: "plus" },    { to: "/alerts", label: t("Alertas", "Alerts"), icon: Bell },
    { to: "/reports", label: t("Reportes", "Reports"), icon: FileText, min: "plus" },    { to: "/subscription", label: t("Suscripción", "Subscription"), icon: CreditCard },
    { to: "/household", label: t("Hogar", "Household"), icon: Home },

  ];
  return (
    <>
      {/* Overlay móvil */}
      {open && (
        <div className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-200 bg-white transition-transform dark:border-navy-800 dark:bg-navy-900 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
              <Zap className="h-5 w-5 text-white" fill="white" />
            </span>
            <span className="font-display text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
              SEMS
            </span>
          </div>
          <button className="text-slate-400 lg:hidden" onClick={onClose} aria-label={t("Cerrar menú", "Close menu")}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="px-3 py-4">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">{t("Panel", "Menu")}</p>
          <ul className="space-y-1">
            {nav.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-navy-800 dark:hover:text-white"
                    }`
                  }
                >
                                    <item.icon className="h-5 w-5" />
                  <span className="flex-1">{item.label}</span>
                  {item.min && !hasTier(tier, item.min) && <Lock className="h-3.5 w-3.5 text-slate-400" />}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <PlanCard onClose={onClose} />
      </aside>
    </>
  );
}

function PlanCard({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const { t } = useLang();
  const sub = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: () => getMySubscription(user!.id),
    enabled: !!user,
  });

  const planName = sub.data?.planName;
  const isPaid = !!planName && (sub.data?.price ?? 0) > 0;

  return (
    <NavLink
      to="/subscription"
      onClick={onClose}
      className="absolute inset-x-3 bottom-4 block rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 p-4 text-white transition-opacity hover:opacity-95"
    >
      {isPaid ? (
        <>
          <p className="text-sm font-bold">{t("Plan", "Plan")} {planName}</p>
          <p className="mt-1 text-xs text-blue-100/90">{t("Tu plan está activo. Administra tu suscripción.", "Your plan is active. Manage your subscription.")}</p>
        </>
      ) : (
        <>
          <p className="text-sm font-bold">{t("Mejora tu plan", "Upgrade your plan")}</p>
          <p className="mt-1 text-xs text-blue-100/90">{t("Desbloquea analítica avanzada y proyección de factura.", "Unlock advanced analytics and bill forecasting.")}</p>
        </>
      )}
    </NavLink>
  );
}
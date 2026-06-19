import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Gauge, Check, SlidersHorizontal, Loader2 } from "lucide-react";
import { Card, CardTitle, Loading, ErrorState, Badge, Button } from "../components/ui";
import { SeverityBadge } from "./Dashboard";
import {
  getAlerts,
  updateAlertStatus,
  getThresholds,
  getNotificationPreferences,
  updateNotificationPreference,
} from "../services/alerts.service";
import { kwh as fmtKwh } from "../lib/format";
import type { AlertStatus, NotificationPreference } from "../types/alerts";
import { useAuth } from "../context/AuthContext";
const tabs: { key: AlertStatus | "ALL"; label: string }[] = [
  { key: "ALL", label: "Todas" },
  { key: "ACTIVE", label: "Activas" },
  { key: "ACKNOWLEDGED", label: "Vistas" },
  { key: "RESOLVED", label: "Resueltas" },
];

const statusBadge: Record<AlertStatus, { color: "rose" | "amber" | "green"; label: string }> = {
  ACTIVE: { color: "rose", label: "Activa" },
  ACKNOWLEDGED: { color: "amber", label: "Vista" },
  RESOLVED: { color: "green", label: "Resuelta" },
};

const typeLabel: Record<string, string> = {
  THRESHOLD: "Umbral",
  ANOMALY: "Anomalía",
  INACTIVITY: "Inactividad",
};

export default function Alerts() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [tab, setTab] = useState<AlertStatus | "ALL">("ALL");

   const alerts = useQuery({ queryKey: ["alerts", user?.id], queryFn: () => getAlerts(user!.id), enabled: !!user });
  const thresholds = useQuery({ queryKey: ["thresholds", user?.id], queryFn: () => getThresholds(user!.id), enabled: !!user });
  const prefs = useQuery({ queryKey: ["preferences", user?.id], queryFn: () => getNotificationPreferences(user!.id), enabled: !!user });
  const resolve = useMutation({
    mutationFn: (id: string) => updateAlertStatus(id, "RESOLVED"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });

    const togglePref = useMutation({
    mutationFn: (p: NotificationPreference) => updateNotificationPreference(user!.id, p.channel, !p.enabled),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["preferences"] }),
  });
  const filtered = (alerts.data ?? []).filter((a) => tab === "ALL" || a.status === tab);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">Alertas</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Avisos, umbrales y preferencias de notificación.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Lista de alertas */}
        <Card className="lg:col-span-2">
          <CardTitle
            action={
              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 dark:border-navy-800">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                      tab === t.key
                        ? "bg-blue-600 text-white"
                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            }
          >
            Bandeja de alertas
          </CardTitle>

          {alerts.isLoading ? (
            <Loading />
          ) : alerts.isError ? (
            <ErrorState />
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">No hay alertas en esta categoría.</div>
          ) : (
            <ul className="space-y-3">
              {filtered.map((a) => (
                <li key={a.id} className="flex items-start gap-3 rounded-lg border border-slate-100 p-3.5 dark:border-navy-800">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                    <Bell className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
<span className="text-[11px] text-slate-400">{a.deviceName ? `${a.deviceName} · ` : ""}{a.createdAt}</span>                      <Badge color="slate">{typeLabel[a.type]}</Badge>
                      <SeverityBadge severity={a.severity} />
                      <Badge color={statusBadge[a.status].color}>{statusBadge[a.status].label}</Badge>
                    </div>
                    <p className="mt-1 text-xs leading-snug text-slate-500 dark:text-slate-400">{a.message}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">{a.createdAt}</span>
                      {a.status !== "RESOLVED" && (
                        <Button variant="ghost" className="!py-1 !text-xs" onClick={() => resolve.mutate(a.id)} disabled={resolve.isPending}>
                          {resolve.isPending && resolve.variables === a.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                          Resolver
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Columna lateral */}
        <div className="space-y-6">
          {/* Umbrales */}
          <Card>
            <CardTitle action={<SlidersHorizontal className="h-4 w-4 text-slate-400" />}>Umbrales</CardTitle>
            {thresholds.isLoading ? (
              <Loading />
            ) : thresholds.isError ? (
              <ErrorState />
            ) : (
              <ul className="space-y-3">
                {thresholds.data!.map((t) => (
                  <li key={t.id} className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-navy-800 dark:text-slate-400">
                      <Gauge className="h-4 w-4" />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{t.deviceName}</p>
                      <p className="text-xs text-slate-400">Máx. {fmtKwh(t.maxKwhPerDay)}/día</p>
                    </div>
                    <Badge color={t.enabled ? "green" : "slate"}>{t.enabled ? "Activo" : "Off"}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Preferencias */}
          <Card>
            <CardTitle>Notificaciones</CardTitle>
            {prefs.isLoading ? (
              <Loading />
            ) : prefs.isError ? (
              <ErrorState />
            ) : (
              <ul className="space-y-3">
                {prefs.data!.map((p) => (
                  <li key={p.channel} className="flex items-center justify-between">
                    <span className="text-sm text-slate-700 dark:text-slate-200">{p.label}</span>
                    <Toggle on={p.enabled} onClick={() => togglePref.mutate(p)} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative h-6 w-11 rounded-full transition-colors ${on ? "bg-blue-600" : "bg-slate-300 dark:bg-navy-700"}`}
      aria-pressed={on}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}
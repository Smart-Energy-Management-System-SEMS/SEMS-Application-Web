import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Gauge, Check, SlidersHorizontal, Loader2, Plus, X } from "lucide-react";
import { Card, CardTitle, Loading, ErrorState, Badge, Button } from "../components/ui";
import { Field, inputCls } from "./Login";
import { SeverityBadge } from "./Dashboard";
import {
  getAlerts,
  updateAlertStatus,
  getThresholds,
  createThreshold,
  getNotificationPreferences,
  updateNotificationPreference,
} from "../services/alerts.service";
import { listDevices } from "../services/devices.service";
import { kwh as fmtKwh } from "../lib/format";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";
import type { AlertStatus, NotificationPreference } from "../types/alerts";

const statusColor: Record<AlertStatus, "rose" | "amber" | "green"> = {
  ACTIVE: "rose",
  ACKNOWLEDGED: "amber",
  RESOLVED: "green",
};

export default function Alerts() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { t } = useLang();
  const [tab, setTab] = useState<AlertStatus | "ALL">("ALL");
  const [thOpen, setThOpen] = useState(false);

  const alerts = useQuery({ queryKey: ["alerts", user?.id], queryFn: () => getAlerts(user!.id), enabled: !!user });
  const thresholds = useQuery({ queryKey: ["thresholds", user?.id], queryFn: () => getThresholds(user!.id), enabled: !!user });
  const prefs = useQuery({ queryKey: ["preferences", user?.id], queryFn: () => getNotificationPreferences(user!.id), enabled: !!user });
  const devices = useQuery({ queryKey: ["devices", user?.id], queryFn: () => listDevices(user!.id), enabled: !!user });

  const resolve = useMutation({
    mutationFn: (id: string) => updateAlertStatus(id, "RESOLVED"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });

  const addThreshold = useMutation({
    mutationFn: createThreshold,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["thresholds"] });
      setThOpen(false);
    },
  });

  const togglePref = useMutation({
    mutationFn: (p: NotificationPreference) => updateNotificationPreference(user!.id, p.channel, !p.enabled),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["preferences"] }),
  });

  const tabs: { key: AlertStatus | "ALL"; label: string }[] = [
    { key: "ALL", label: t("Todas", "All") },
    { key: "ACTIVE", label: t("Activas", "Active") },
    { key: "ACKNOWLEDGED", label: t("Vistas", "Seen") },
    { key: "RESOLVED", label: t("Resueltas", "Resolved") },
  ];
  const statusLabel: Record<AlertStatus, string> = {
    ACTIVE: t("Activa", "Active"),
    ACKNOWLEDGED: t("Vista", "Seen"),
    RESOLVED: t("Resuelta", "Resolved"),
  };
  const typeLabel: Record<string, string> = {
    THRESHOLD: t("Umbral", "Threshold"),
    ANOMALY: t("Anomalía", "Anomaly"),
    INACTIVITY: t("Inactividad", "Inactivity"),
  };

  const filtered = (alerts.data ?? []).filter((a) => tab === "ALL" || a.status === tab);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">{t("Alertas", "Alerts")}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t("Avisos, umbrales y preferencias de notificación.", "Alerts, thresholds and notification preferences.")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Lista de alertas */}
        <Card className="lg:col-span-2">
          <CardTitle
            action={
              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 dark:border-navy-800">
                {tabs.map((tabItem) => (
                  <button
                    key={tabItem.key}
                    onClick={() => setTab(tabItem.key)}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                      tab === tabItem.key
                        ? "bg-blue-600 text-white"
                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    }`}
                  >
                    {tabItem.label}
                  </button>
                ))}
              </div>
            }
          >
            {t("Bandeja de alertas", "Alerts inbox")}
          </CardTitle>

          {alerts.isLoading ? (
            <Loading />
          ) : alerts.isError ? (
            <ErrorState />
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">{t("No hay alertas en esta categoría.", "No alerts in this category.")}</div>
          ) : (
            <ul className="space-y-3">
              {filtered.map((a) => (
                <li key={a.id} className="flex items-start gap-3 rounded-lg border border-slate-100 p-3.5 dark:border-navy-800">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                    <Bell className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{a.title}</p>
                      <Badge color="slate">{typeLabel[a.type]}</Badge>
                      <SeverityBadge severity={a.severity} />
                      <Badge color={statusColor[a.status]}>{statusLabel[a.status]}</Badge>
                    </div>
                    <p className="mt-1 text-xs leading-snug text-slate-500 dark:text-slate-400">{a.message}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">{a.deviceName ? `${a.deviceName} · ` : ""}{a.createdAt}</span>
                      {a.status !== "RESOLVED" && (
                        <Button variant="ghost" className="!py-1 !text-xs" onClick={() => resolve.mutate(a.id)} disabled={resolve.isPending}>
                          {resolve.isPending && resolve.variables === a.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                          {t("Resolver", "Resolve")}
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
            <CardTitle
              action={
                <button onClick={() => setThOpen(true)} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400">
                  <Plus className="h-3.5 w-3.5" /> {t("Agregar", "Add")}
                </button>
              }
            >
              {t("Umbrales", "Thresholds")}
            </CardTitle>
            {thresholds.isLoading ? (
              <Loading />
            ) : thresholds.isError ? (
              <ErrorState />
            ) : (
              <ul className="space-y-3">
                {thresholds.data!.map((th) => (
                  <li key={th.id} className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-navy-800 dark:text-slate-400">
                      <Gauge className="h-4 w-4" />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{th.deviceName}</p>
                      <p className="text-xs text-slate-400">{t("Máx.", "Max")} {fmtKwh(th.maxKwhPerDay)}/{t("día", "day")}</p>
                    </div>
                    <Badge color={th.enabled ? "green" : "slate"}>{th.enabled ? t("Activo", "On") : "Off"}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Preferencias */}
          <Card>
            <CardTitle>{t("Notificaciones", "Notifications")}</CardTitle>
            {prefs.isLoading ? (
              <Loading />
            ) : prefs.isError ? (
              <ErrorState />
            ) : (
                            <ul className="space-y-3">
                {[
                  { channel: "PUSH" as const, label: t("Plataforma web", "Web platform") },
                  { channel: "EMAIL" as const, label: t("Correo electrónico", "Email") },
                  { channel: "SMS" as const, label: t("SMS", "SMS") },
                ].map(({ channel, label }) => {
                  const current = prefs.data!.find((p) => p.channel === channel);
                  const enabled = current?.enabled ?? false;
                  return (
                    <li key={channel} className="flex items-center justify-between">
                      <span className="text-sm text-slate-700 dark:text-slate-200">{label}</span>
                      <Toggle on={enabled} onClick={() => togglePref.mutate({ channel, label, enabled })} />
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {thOpen && user && (
        <ThresholdModal
          userId={user.id}
          devices={(devices.data ?? []).map((d) => ({ id: d.deviceId, name: d.deviceName }))}
          onClose={() => setThOpen(false)}
          onCreate={(p) => addThreshold.mutate(p)}
          loading={addThreshold.isPending}
        />
      )}
    </div>
  );
}

function ThresholdModal({
  userId,
  devices,
  onClose,
  onCreate,
  loading,
}: {
  userId: string;
  devices: { id: string; name: string }[];
  onClose: () => void;
  onCreate: (p: { userId: string; deviceId: string; thresholdName: string; thresholdValue: number }) => void;
  loading: boolean;
}) {
  const { t } = useLang();
  const [deviceId, setDeviceId] = useState(devices[0]?.id ?? "");
  const [thresholdName, setThresholdName] = useState("");
  const [thresholdValue, setThresholdValue] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-card border border-slate-200 bg-white p-6 shadow-xl dark:border-navy-800 dark:bg-navy-900">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">{t("Nuevo umbral", "New threshold")}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onCreate({ userId, deviceId, thresholdName, thresholdValue: Number(thresholdValue) });
          }}
          className="space-y-4"
        >
          <Field label={t("Nombre del umbral", "Threshold name")}>
            <input required value={thresholdName} onChange={(e) => setThresholdName(e.target.value)} placeholder={t("Ej: Consumo alto aire", "e.g. High AC usage")} className={inputCls} />
          </Field>
          <Field label={t("Dispositivo", "Device")}>
            <select value={deviceId} onChange={(e) => setDeviceId(e.target.value)} className={inputCls} required>
              {devices.length === 0 && <option value="">{t("Sin dispositivos", "No devices")}</option>}
              {devices.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>
          <Field label={t("Límite (kWh/día)", "Limit (kWh/day)")}>
            <input required type="number" min="0" step="0.1" value={thresholdValue} onChange={(e) => setThresholdValue(e.target.value)} placeholder="8" className={inputCls} />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} type="button">{t("Cancelar", "Cancel")}</Button>
            <Button type="submit" disabled={loading || !deviceId}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />} {t("Guardar", "Save")}
            </Button>
          </div>
        </form>
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
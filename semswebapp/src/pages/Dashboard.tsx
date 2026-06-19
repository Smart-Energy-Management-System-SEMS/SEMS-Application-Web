import { useQuery } from "@tanstack/react-query";
import { TrendingDown, Zap, Cpu, Receipt, ArrowUpRight, Lightbulb, AlertTriangle } from "lucide-react";
import { Card, CardTitle, Loading, ErrorState, Badge } from "../components/ui";
import ConsumptionChart from "../components/charts/ConsumptionChart";
import { getDashboardSummary } from "../services/dashboard.service";
import { getReadings, getDeviceConsumption } from "../services/energy.service";
import { getRecommendations, getAnomalies } from "../services/analytics.service";
import { soles, kwh as fmtKwh, pct } from "../lib/format";
import { useAuth } from "../context/AuthContext";

const deviceColors = ["#2563eb", "#0ea5e9", "#6366f1", "#f59e0b", "#10b981", "#94a3b8"];

export default function Dashboard() {
  const { user } = useAuth();
  const summary = useQuery({ queryKey: ["summary", user?.id], queryFn: () => getDashboardSummary(user!.id), enabled: !!user });
  const readings = useQuery({ queryKey: ["readings", user?.id, 14], queryFn: () => getReadings(user!.id, 14), enabled: !!user });
  const consumption = useQuery({ queryKey: ["consumption", user?.id], queryFn: () => getDeviceConsumption(user!.id), enabled: !!user });
  const recs = useQuery({ queryKey: ["recommendations", user?.id], queryFn: () => getRecommendations(user!.id), enabled: !!user });
const anomalies = useQuery({ queryKey: ["anomalies", user?.id], queryFn: () => getAnomalies(user!.id), enabled: !!user });
  const s = summary.data;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
          Hola, {user?.fullName?.split(" ")[0] ?? "👋"}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Este es el resumen energético de tu hogar.</p>
      </div>

      {/* KPIs */}
      {summary.isLoading ? (
        <Loading />
      ) : summary.isError || !s ? (
        <ErrorState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi
            icon={<TrendingDown className="h-5 w-5" />}
            tone="green"
            label="Ahorro este mes"
            value={soles(s.savingAmount)}
            hint={`${pct(s.savingPct)} vs. tu promedio`}
          />
          <Kpi
            icon={<Receipt className="h-5 w-5" />}
            tone="blue"
            label="Gasto actual"
            value={soles(s.currentMonthCost)}
            hint={`Proyección: ${soles(s.projectedCost)}`}
          />
          <Kpi
            icon={<Zap className="h-5 w-5" />}
            tone="amber"
            label="Consumo total"
            value={fmtKwh(s.totalKwh)}
            hint="Mes en curso"
          />
          <Kpi
            icon={<Cpu className="h-5 w-5" />}
            tone="slate"
            label="Dispositivos activos"
            value={String(s.activeDevices)}
            hint={`${s.unreadAlerts} alertas sin leer`}
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Gráfico */}
        <Card className="lg:col-span-2">
          <CardTitle action={<Badge color="blue">Últimos 14 días</Badge>}>Consumo diario</CardTitle>
          {readings.isLoading ? (
            <Loading />
          ) : readings.isError || !readings.data ? (
            <ErrorState />
          ) : (
            <ConsumptionChart data={readings.data} metric="kwh" />
          )}
        </Card>

        {/* Consumo por dispositivo */}
        <Card>
          <CardTitle>Por dispositivo</CardTitle>
          {consumption.isLoading ? (
            <Loading />
          ) : consumption.isError || !consumption.data ? (
            <ErrorState />
          ) : (
            <ul className="space-y-3.5">
              {consumption.data.map((d, i) => (
                <li key={d.deviceId}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: deviceColors[i % deviceColors.length] }} />
                      {d.deviceName}
                    </span>
                    <span className="font-medium text-slate-500 dark:text-slate-400">{soles(d.cost)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-navy-800">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${d.pct}%`, background: deviceColors[i % deviceColors.length] }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recomendaciones */}
        <Card>
          <CardTitle action={<Badge color="green">Ahorro potencial</Badge>}>Recomendaciones</CardTitle>
          {recs.isLoading ? (
            <Loading />
          ) : recs.isError || !recs.data ? (
            <ErrorState />
          ) : (
            <ul className="space-y-3">
              {recs.data.slice(0, 3).map((r) => (
                <li key={r.id} className="flex items-start gap-3 rounded-lg border border-slate-100 p-3 dark:border-navy-800">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                    <Lightbulb className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{r.title}</p>
                      <span className="shrink-0 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        +{soles(r.estimatedSaving)}/mes
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs leading-snug text-slate-500 dark:text-slate-400">{r.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Anomalías */}
        <Card>
          <CardTitle action={<a href="/analytics" className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400">Ver todo</a>}>
            Anomalías recientes
          </CardTitle>
          {anomalies.isLoading ? (
            <Loading />
          ) : anomalies.isError || !anomalies.data ? (
            <ErrorState />
          ) : (
            <ul className="space-y-3">
              {anomalies.data.map((a) => (
                <li key={a.id} className="flex items-start gap-3 rounded-lg border border-slate-100 p-3 dark:border-navy-800">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
                    <AlertTriangle className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{a.deviceName}</p>
                      <SeverityBadge severity={a.severity} />
                    </div>
                    <p className="mt-0.5 text-xs leading-snug text-slate-500 dark:text-slate-400">{a.description}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{a.detectedAt}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  tone: "green" | "blue" | "amber" | "slate";
}) {
  const tones = {
    green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
    slate: "bg-slate-100 text-slate-600 dark:bg-navy-800 dark:text-slate-300",
  };
  return (
    <Card>
      <div className="flex items-center justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}>{icon}</span>
        <ArrowUpRight className="h-4 w-4 text-slate-300 dark:text-navy-700" />
      </div>
      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{hint}</p>
    </Card>
  );
}

export function SeverityBadge({ severity }: { severity: "LOW" | "MEDIUM" | "HIGH" }) {
  const map = {
    LOW: { color: "slate" as const, label: "Baja" },
    MEDIUM: { color: "amber" as const, label: "Media" },
    HIGH: { color: "rose" as const, label: "Alta" },
  };
  return <Badge color={map[severity].color}>{map[severity].label}</Badge>;
}

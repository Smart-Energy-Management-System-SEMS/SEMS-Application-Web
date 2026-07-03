import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Gauge, Zap, Receipt, TrendingUp, TrendingDown } from "lucide-react";import { Card, CardTitle, Loading, ErrorState, Badge } from "../components/ui";
import ConsumptionChart from "../components/charts/ConsumptionChart";
import { getReadings, getDeviceConsumption, getMeters, getPeriodComparison } from "../services/energy.service";import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";
import { soles, kwh as fmtKwh } from "../lib/format";

export default function Monitoring() {
  const { user } = useAuth();
  const { t } = useLang();
  const [metric, setMetric] = useState<"kwh" | "cost">("kwh");
  const [days, setDays] = useState(14);

  const readings = useQuery({ queryKey: ["readings", user?.id, days], queryFn: () => getReadings(user!.id, days), enabled: !!user });
  const consumption = useQuery({ queryKey: ["consumption", user?.id], queryFn: () => getDeviceConsumption(user!.id), enabled: !!user });
  const meters = useQuery({ queryKey: ["meters", user?.id], queryFn: () => getMeters(user!.id), enabled: !!user });
  const comparison = useQuery({ queryKey: ["comparison", user?.id, days], queryFn: () => getPeriodComparison(user!.id, days), enabled: !!user });
  const totalKwh = readings.data?.reduce((s, r) => s + r.kwh, 0) ?? 0;
  const totalCost = readings.data?.reduce((s, r) => s + r.cost, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">{t("Monitoreo", "Monitoring")}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t("Consumo de tu hogar en tiempo real.", "Your home's energy usage in real time.")}</p>
      </div>

      {/* Medidores */}
      {meters.data?.map((m) => (
        <Card key={m.meterId} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
              <Gauge className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">{m.name}</p>
              <p className="text-xs text-slate-400">{t("Lectura acumulada", "Total reading")}: {fmtKwh(m.lastReadingKwh)}</p>
            </div>
          </div>
          <Badge color={m.active ? "green" : "slate"}>
            <span className={`h-1.5 w-1.5 rounded-full ${m.active ? "bg-emerald-500 animate-pulse-soft" : "bg-slate-400"}`} />
            {m.active ? t("En línea", "Online") : t("Desconectado", "Offline")}
          </Badge>
        </Card>
      ))}

      {/* Totales */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300"><Zap className="h-5 w-5" /></span>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t("Consumo", "Usage")} ({days} {t("días", "days")})</p>
              <p className="font-display text-xl font-extrabold text-slate-900 dark:text-white">{fmtKwh(+totalKwh.toFixed(1))}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300"><Receipt className="h-5 w-5" /></span>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t("Costo", "Cost")} ({days} {t("días", "days")})</p>
              <p className="font-display text-xl font-extrabold text-slate-900 dark:text-white">{soles(+totalCost.toFixed(2))}</p>
            </div>
          </div>
        </Card>
      </div>
      {/* Comparación de periodos */}
      <Card>
        <CardTitle>{t("Comparación con el periodo anterior", "Comparison with previous period")}</CardTitle>
        {comparison.isLoading ? (
          <Loading />
        ) : comparison.isError || !comparison.data ? (
          <ErrorState />
        ) : (
          <PeriodCompare data={comparison.data} days={days} />
        )}
      </Card>
      {/* Gráfico con controles */}
      <Card>
        <CardTitle
          action={
            <div className="flex items-center gap-2">
              <Segmented value={metric} onChange={(v) => setMetric(v as "kwh" | "cost")} options={[["kwh", "kWh"], ["cost", t("Costo", "Cost")]]} />
              <Segmented value={String(days)} onChange={(v) => setDays(+v)} options={[["7", "7d"], ["14", "14d"], ["30", "30d"]]} />
            </div>
          }
        >
          {t("Tendencia de consumo", "Usage trend")}
        </CardTitle>
        {readings.isLoading ? (
          <Loading />
        ) : readings.isError || !readings.data ? (
          <ErrorState />
        ) : (
          <ConsumptionChart data={readings.data} metric={metric} />
        )}
      </Card>

      {/* Detalle por dispositivo */}
      <Card>
        <CardTitle>{t("Detalle por dispositivo", "Device breakdown")}</CardTitle>
        {consumption.isLoading ? (
          <Loading />
        ) : consumption.isError || !consumption.data ? (
          <ErrorState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wider text-slate-400 dark:border-navy-800">
                  <th className="pb-2 font-semibold">{t("Dispositivo", "Device")}</th>
                  <th className="pb-2 text-right font-semibold">{t("Consumo", "Usage")}</th>
                  <th className="pb-2 text-right font-semibold">{t("Costo", "Cost")}</th>
                  <th className="pb-2 text-right font-semibold">{t("% del total", "% of total")}</th>
                </tr>
              </thead>
              <tbody>
                {consumption.data.map((d) => (
                  <tr key={d.deviceId} className="border-b border-slate-50 last:border-0 dark:border-navy-800/50">
                    <td className="py-3 font-medium text-slate-900 dark:text-white">{d.deviceName}</td>
                    <td className="py-3 text-right text-slate-600 dark:text-slate-300">{fmtKwh(d.kwh)}</td>
                    <td className="py-3 text-right text-slate-600 dark:text-slate-300">{soles(d.cost)}</td>
                    <td className="py-3 text-right font-semibold text-blue-600 dark:text-blue-400">{d.pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
function PeriodCompare({
  data,
  days,
}: {
  data: { currentKwh: number; previousKwh: number; currentCost: number; previousCost: number; deltaPct: number };
  days: number;
}) {
  const { t } = useLang();
  const up = data.deltaPct > 0;
  const flat = data.deltaPct === 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-100 p-4 dark:border-navy-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">{t("Periodo actual", "Current period")} ({days} {t("días", "days")})</p>
          <p className="mt-1 font-display text-xl font-extrabold text-slate-900 dark:text-white">{fmtKwh(data.currentKwh)}</p>
          <p className="text-xs text-slate-400">{soles(data.currentCost)}</p>
        </div>
        <div className="rounded-lg border border-slate-100 p-4 dark:border-navy-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">{t("Periodo anterior", "Previous period")}</p>
          <p className="mt-1 font-display text-xl font-extrabold text-slate-500 dark:text-slate-400">{fmtKwh(data.previousKwh)}</p>
          <p className="text-xs text-slate-400">{soles(data.previousCost)}</p>
        </div>
      </div>

      <div className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
        flat ? "bg-slate-50 text-slate-600 dark:bg-navy-800 dark:text-slate-300"
        : up ? "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
        : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
      }`}>
        {!flat && (up ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />)}
        <span className="font-semibold">
          {flat
            ? t("Tu consumo se mantuvo igual.", "Your usage stayed the same.")
            : up
              ? `${t("Subiste", "Up")} ${Math.abs(data.deltaPct)}% ${t("vs. el periodo anterior.", "vs. the previous period.")}`
              : `${t("Bajaste", "Down")} ${Math.abs(data.deltaPct)}% ${t("vs. el periodo anterior. ¡Bien!", "vs. the previous period. Nice!")}`}
        </span>
      </div>
    </div>
  );
}
function Segmented({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 p-0.5 dark:border-navy-800">
      {options.map(([val, label]) => (
        <button
          key={val}
          onClick={() => onChange(val)}
          className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
            value === val
              ? "bg-blue-600 text-white"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
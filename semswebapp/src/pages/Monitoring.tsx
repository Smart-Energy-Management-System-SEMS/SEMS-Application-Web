import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Gauge, Zap, Receipt } from "lucide-react";
import { Card, CardTitle, Loading, ErrorState, Badge } from "../components/ui";
import ConsumptionChart from "../components/charts/ConsumptionChart";
import { getReadings, getDeviceConsumption, getMeters } from "../services/energy.service";
import { soles, kwh as fmtKwh } from "../lib/format";

export default function Monitoring() {
  const [metric, setMetric] = useState<"kwh" | "cost">("kwh");
  const [days, setDays] = useState(14);

  const readings = useQuery({ queryKey: ["readings", days], queryFn: () => getReadings(days) });
  const consumption = useQuery({ queryKey: ["consumption"], queryFn: getDeviceConsumption });
  const meters = useQuery({ queryKey: ["meters"], queryFn: getMeters });

  const totalKwh = readings.data?.reduce((s, r) => s + r.kwh, 0) ?? 0;
  const totalCost = readings.data?.reduce((s, r) => s + r.cost, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">Monitoreo</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Consumo de tu hogar en tiempo real.</p>
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
              <p className="text-xs text-slate-400">Lectura acumulada: {fmtKwh(m.lastReadingKwh)}</p>
            </div>
          </div>
          <Badge color={m.active ? "green" : "slate"}>
            <span className={`h-1.5 w-1.5 rounded-full ${m.active ? "bg-emerald-500 animate-pulse-soft" : "bg-slate-400"}`} />
            {m.active ? "En línea" : "Desconectado"}
          </Badge>
        </Card>
      ))}

      {/* Totales */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300"><Zap className="h-5 w-5" /></span>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Consumo ({days} días)</p>
              <p className="font-display text-xl font-extrabold text-slate-900 dark:text-white">{fmtKwh(+totalKwh.toFixed(1))}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300"><Receipt className="h-5 w-5" /></span>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Costo ({days} días)</p>
              <p className="font-display text-xl font-extrabold text-slate-900 dark:text-white">{soles(+totalCost.toFixed(2))}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Gráfico con controles */}
      <Card>
        <CardTitle
          action={
            <div className="flex items-center gap-2">
              <Segmented value={metric} onChange={(v) => setMetric(v as "kwh" | "cost")} options={[["kwh", "kWh"], ["cost", "Costo"]]} />
              <Segmented value={String(days)} onChange={(v) => setDays(+v)} options={[["7", "7d"], ["14", "14d"], ["30", "30d"]]} />
            </div>
          }
        >
          Tendencia de consumo
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
        <CardTitle>Detalle por dispositivo</CardTitle>
        {consumption.isLoading ? (
          <Loading />
        ) : consumption.isError || !consumption.data ? (
          <ErrorState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wider text-slate-400 dark:border-navy-800">
                  <th className="pb-2 font-semibold">Dispositivo</th>
                  <th className="pb-2 text-right font-semibold">Consumo</th>
                  <th className="pb-2 text-right font-semibold">Costo</th>
                  <th className="pb-2 text-right font-semibold">% del total</th>
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

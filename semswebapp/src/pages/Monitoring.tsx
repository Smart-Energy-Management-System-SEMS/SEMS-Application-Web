import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Gauge, Zap, Receipt, TrendingUp, TrendingDown, Plus, Trash2, Loader2, QrCode } from "lucide-react";
import { Card, CardTitle, Button, Loading, ErrorState, Badge } from "../components/ui";
import ConsumptionChart from "../components/charts/ConsumptionChart";
import QrScannerModal from "../components/QrScannerModal";
import { getReadings, getDeviceConsumption, getMeters, linkMeter, unlinkMeter, getPeriodComparison } from "../services/energy.service";
import { getGoals } from "../lib/homeStore";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";
import { soles, kwh as fmtKwh } from "../lib/format";
import PeriodSummaryCard from "../components/PeriodSummaryCard";
// Lee el código de serie del medidor desde el texto del QR. Acepta texto plano
// (el serial) o un JSON con { serial | meter_serial, model }.
function parseMeterQr(text: string): { serial: string; model?: string } {
  const raw = (text ?? "").trim();
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>;
    const serial = String(obj.serial ?? obj.meter_serial ?? obj.serialNumber ?? obj.serie ?? "");
    if (serial) return { serial, model: obj.model ? String(obj.model) : undefined };
  } catch {
    /* no era JSON: lo tratamos como serial plano */
  }
  return { serial: raw };
}

export default function Monitoring() {
  const { user } = useAuth();
  const { t } = useLang();
  const [metric, setMetric] = useState<"kwh" | "cost">("kwh");
  const [days, setDays] = useState(14);

  const readings = useQuery({ queryKey: ["readings", user?.id, days], queryFn: () => getReadings(user!.id, days), enabled: !!user });
  const consumption = useQuery({ queryKey: ["consumption", user?.id], queryFn: () => getDeviceConsumption(user!.id), enabled: !!user });
  const comparison = useQuery({ queryKey: ["comparison", user?.id, days], queryFn: () => getPeriodComparison(user!.id, days), enabled: !!user });

  const totalKwh = readings.data?.reduce((s, r) => s + r.kwh, 0) ?? 0;
  const totalCost = readings.data?.reduce((s, r) => s + r.cost, 0) ?? 0;

  // Umbrales por dispositivo definidos por el usuario (RF-ANL-05).
  const goals = getGoals(user?.id ?? "anon");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">{t("Monitoreo", "Monitoring")}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t("Consumo de tu hogar en tiempo real.", "Your home's energy usage in real time.")}</p>
      </div>

      {/* Medidores (vincular / desvincular) */}
      {user && <MetersManager userId={user.id} />}

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
      {/* Resúmenes por semana y mes (RF-MON-06) */}
      {user && <PeriodSummaryCard userId={user.id} />}
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
                {consumption.data.map((d) => {
                  const goal = goals.perDevice[d.deviceId] ?? 0;
                  const over = goal > 0 && d.kwh > goal; // supera el umbral configurado
                  return (
                    <tr key={d.deviceId} className="border-b border-slate-50 last:border-0 dark:border-navy-800/50">
                      <td className="py-3 font-medium text-slate-900 dark:text-white">
                        <span className="flex items-center gap-2">
                          {d.deviceName}
                          {over && <Badge color="rose">{t("Desviación", "Deviation")}</Badge>}
                        </span>
                      </td>
                      <td className="py-3 text-right text-slate-600 dark:text-slate-300">{fmtKwh(d.kwh)}</td>
                      <td className="py-3 text-right text-slate-600 dark:text-slate-300">{soles(d.cost)}</td>
                      <td className="py-3 text-right font-semibold text-blue-600 dark:text-blue-400">{d.pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function MetersManager({ userId }: { userId: string }) {
  const { t } = useLang();
  const qc = useQueryClient();
  const [serial, setSerial] = useState("");
  const [error, setError] = useState("");
  const [scanOpen, setScanOpen] = useState(false);

  const meters = useQuery({ queryKey: ["meters", userId], queryFn: () => getMeters(userId) });

  const link = useMutation({
    mutationFn: (p: { serial: string; model?: string }) => linkMeter(userId, p.serial, p.model),
    onSuccess: () => {
      setSerial("");
      setError("");
      qc.invalidateQueries({ queryKey: ["meters", userId] });
    },
    onError: () => setError(t("No se pudo vincular el medidor. Revisa el código de serie.", "Couldn't link the meter. Check the serial code.")),
  });

  const unlink = useMutation({
    mutationFn: (meterId: string) => unlinkMeter(meterId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meters", userId] }),
  });

  const onLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serial.trim()) return;
    link.mutate({ serial: serial.trim() });
  };

  // Resultado del escaneo: mostramos el serial y vinculamos automáticamente.
  const onScan = (text: string) => {
    setScanOpen(false);
    const { serial: s, model } = parseMeterQr(text);
    if (!s) return;
    setSerial(s);
    link.mutate({ serial: s, model });
  };

  return (
    <Card>
      <CardTitle action={<Gauge className="h-4 w-4 text-slate-400" />}>{t("Medidores EOS", "EOS meters")}</CardTitle>
      {scanOpen && <QrScannerModal onResult={onScan} onClose={() => setScanOpen(false)} />}

      {meters.isLoading ? (
        <Loading />
      ) : meters.isError ? (
        <ErrorState />
      ) : (meters.data?.length ?? 0) === 0 ? (
        <p className="py-3 text-sm text-slate-400">{t("Aún no tienes un medidor vinculado.", "You don't have a meter linked yet.")}</p>
      ) : (
        <ul className="space-y-2.5">
          {meters.data!.map((m) => (
            <li key={m.meterId} className="flex items-center justify-between rounded-lg border border-slate-100 p-3 dark:border-navy-800">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                  <Gauge className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{m.name}</p>
                  <p className="text-xs text-slate-400">{t("Lectura acumulada", "Total reading")}: {fmtKwh(m.lastReadingKwh)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge color={m.active ? "green" : "slate"}>
                  <span className={`h-1.5 w-1.5 rounded-full ${m.active ? "bg-emerald-500 animate-pulse-soft" : "bg-slate-400"}`} />
                  {m.active ? t("En línea", "Online") : t("Desconectado", "Offline")}
                </Badge>
                <button
                  onClick={() => {
                    if (confirm(t("¿Desvincular este medidor de tu cuenta?", "Unlink this meter from your account?"))) unlink.mutate(m.meterId);
                  }}
                  disabled={unlink.isPending}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:hover:bg-rose-500/10"
                  title={t("Desvincular", "Unlink")}
                >
                  {unlink.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Vincular un nuevo medidor: por QR o por código de serie */}
      <form onSubmit={onLink} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={serial}
          onChange={(e) => setSerial(e.target.value)}
          placeholder={t("Código de serie del medidor EOS", "EOS meter serial code")}
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-navy-700 dark:bg-navy-950 dark:text-white"
        />
        <button
          type="button"
          onClick={() => { setError(""); setScanOpen(true); }}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:border-blue-400 hover:text-blue-600 dark:border-navy-700 dark:text-slate-300 dark:hover:text-blue-400"
        >
          <QrCode className="h-4 w-4" />
          {t("Escanear QR", "Scan QR")}
        </button>
        <Button type="submit" disabled={link.isPending || !serial.trim()}>
          {link.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {t("Vincular medidor", "Link meter")}
        </Button>
      </form>
      {error && <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">{error}</p>}
    </Card>
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
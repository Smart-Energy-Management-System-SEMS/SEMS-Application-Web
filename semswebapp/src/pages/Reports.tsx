import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileDown, FileText, Loader2 } from "lucide-react";
import { Card, CardTitle, Button, Loading, ErrorState } from "../components/ui";
import { getDashboardSummary } from "../services/dashboard.service";
import { getReadings, getDeviceConsumption } from "../services/energy.service";
import { generateConsumptionReport } from "../lib/report";
import { soles, kwh as fmtKwh } from "../lib/format";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";
import { usePlanTier } from "../hooks/usePlan";
import { hasTier } from "../lib/plan";
import UpgradeGate from "../components/UpgradeGate";
export default function Reports() {
  const { user } = useAuth();
  const { t, lang } = useLang();
  const [days, setDays] = useState(30);
  const [generating, setGenerating] = useState(false);

  const summary = useQuery({ queryKey: ["summary", user?.id], queryFn: () => getDashboardSummary(user!.id), enabled: !!user });
  const consumption = useQuery({ queryKey: ["consumption", user?.id], queryFn: () => getDeviceConsumption(user!.id), enabled: !!user });
  const readings = useQuery({ queryKey: ["readings", user?.id, days], queryFn: () => getReadings(user!.id, days), enabled: !!user });

  const loading = summary.isLoading || consumption.isLoading || readings.isLoading;
  const error = summary.isError || consumption.isError || readings.isError;

  const download = () => {
    setGenerating(true);
    try {
      generateConsumptionReport({
        userName: user?.fullName ?? user?.email ?? "—",
        summary: summary.data ?? null,
        consumption: consumption.data ?? [],
        readings: readings.data ?? [],
        days,
        lang,
      });
    } finally {
      setGenerating(false);
    }
  };

  const periods = [
    { d: 7, label: "7d" },
    { d: 14, label: "14d" },
    { d: 30, label: "30d" },
  ];

  const tier = usePlanTier();
  if (!hasTier(tier, "plus")) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">{t("Reportes", "Reports")}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t("Descarga reportes de consumo y gasto de tu hogar.", "Download consumption and cost reports for your home.")}</p>
        </div>
        <UpgradeGate
          required="plus"
          title={t("Reportes mensuales", "Monthly reports")}
          description={t("La generación de reportes en PDF está disponible desde el plan Plus.", "PDF report generation is available from the Plus plan.")}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">{t("Reportes", "Reports")}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t("Descarga el reporte de consumo de tu hogar en PDF.", "Download your home's consumption report as PDF.")}</p>
      </div>

      <Card>
        <CardTitle>{t("Reporte de consumo", "Consumption report")}</CardTitle>

        <div className="mb-5 flex flex-wrap items-center gap-3">
          <span className="text-sm text-slate-500 dark:text-slate-400">{t("Periodo", "Period")}:</span>
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 dark:border-navy-800">
            {periods.map((p) => (
              <button
                key={p.d}
                onClick={() => setDays(p.d)}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                  days === p.d ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState />
        ) : (
          <>
            {/* Vista previa del contenido */}
            <div className="grid gap-3 sm:grid-cols-3">
              <Preview label={t("Consumo total", "Total usage")} value={fmtKwh(summary.data?.totalKwh ?? 0)} />
              <Preview label={t("Gasto actual", "Current spend")} value={soles(summary.data?.currentMonthCost ?? 0)} />
              <Preview label={t("Dispositivos", "Devices")} value={String(consumption.data?.length ?? 0)} />
            </div>

            <div className="mt-5 flex items-center gap-3">
              <Button onClick={download} disabled={generating}>
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                {t("Descargar PDF", "Download PDF")}
              </Button>
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <FileText className="h-3.5 w-3.5" />
                {t("Incluye resumen, consumo por dispositivo y lecturas diarias.", "Includes summary, per-device usage and daily readings.")}
              </span>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

function Preview({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 p-4 dark:border-navy-800">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 font-display text-xl font-extrabold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}
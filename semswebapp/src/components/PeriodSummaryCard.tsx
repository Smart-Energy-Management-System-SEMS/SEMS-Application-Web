import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarRange } from "lucide-react";
import { Card, CardTitle, Loading, ErrorState } from "./ui";
import { getConsumptionSummary } from "../services/energy.service";
import { useLang } from "../context/LanguageContext";
import { soles, kwh as fmtKwh } from "../lib/format";

// Resúmenes de consumo por semana y por mes (RF-MON-06).
export default function PeriodSummaryCard({ userId }: { userId: string }) {
  const { t } = useLang();
  const [view, setView] = useState<"weekly" | "monthly">("weekly");

  const summary = useQuery({
    queryKey: ["summary-period", userId],
    queryFn: () => getConsumptionSummary(userId),
  });

  const rows = view === "weekly" ? summary.data?.weekly ?? [] : summary.data?.monthly ?? [];

  const monthLabel = (ym: string) => {
    const d = new Date(ym + "-01T00:00:00");
    return isNaN(d.getTime()) ? ym : d.toLocaleDateString("es-PE", { month: "long", year: "numeric" });
  };

  return (
    <Card>
      <CardTitle
        action={
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 dark:border-navy-800">
            {([["weekly", t("Semana", "Week")], ["monthly", t("Mes", "Month")]] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setView(val)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                  view === val ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        }
      >
        <span className="flex items-center gap-2">
          <CalendarRange className="h-4 w-4 text-slate-400" />
          {t("Resúmenes por periodo", "Period summaries")}
        </span>
      </CardTitle>

      {summary.isLoading ? (
        <Loading />
      ) : summary.isError || !summary.data ? (
        <ErrorState />
      ) : rows.length === 0 ? (
        <p className="py-3 text-center text-xs text-slate-400">{t("Sin datos suficientes todavía.", "Not enough data yet.")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wider text-slate-400 dark:border-navy-800">
                <th className="pb-2 font-semibold">{t("Periodo", "Period")}</th>
                <th className="pb-2 text-right font-semibold">{t("Consumo", "Usage")}</th>
                <th className="pb-2 text-right font-semibold">{t("Costo", "Cost")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.key} className="border-b border-slate-50 last:border-0 dark:border-navy-800/50">
                  <td className="py-3 font-medium capitalize text-slate-900 dark:text-white">
                    {view === "monthly" ? monthLabel(p.key) : p.label}
                  </td>
                  <td className="py-3 text-right text-slate-600 dark:text-slate-300">{fmtKwh(p.kwh)}</td>
                  <td className="py-3 text-right text-slate-600 dark:text-slate-300">{soles(p.cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
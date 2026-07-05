import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Lightbulb, AlertTriangle, Trophy, Receipt, Check, Loader2 } from "lucide-react";
import { Card, CardTitle, Loading, ErrorState, Button } from "../components/ui";
import { SeverityBadge } from "./Dashboard";
import {
  getRecommendations,
  applyRecommendation,
  getAnomalies,
  getBillPrediction,
  getRankings,
} from "../services/analytics.service";
import { soles, kwh as fmtKwh, pct } from "../lib/format";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";
import { usePlanTier } from "../hooks/usePlan";
import { hasTier } from "../lib/plan";
import UpgradeGate from "../components/UpgradeGate";
export default function Analytics() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { t } = useLang();
  const recs = useQuery({ queryKey: ["recommendations", user?.id], queryFn: () => getRecommendations(user!.id), enabled: !!user });
  const anomalies = useQuery({ queryKey: ["anomalies", user?.id], queryFn: () => getAnomalies(user!.id), enabled: !!user });
  const prediction = useQuery({ queryKey: ["billPrediction", user?.id], queryFn: () => getBillPrediction(user!.id), enabled: !!user });
  const rankings = useQuery({ queryKey: ["rankings", user?.id], queryFn: () => getRankings(user!.id), enabled: !!user });

  const apply = useMutation({
    mutationFn: applyRecommendation,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recommendations"] }),
  });
  const tier = usePlanTier();
  if (!hasTier(tier, "plus")) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">{t("Analítica", "Analytics")}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t("Recomendaciones, anomalías y proyección de tu factura.", "Recommendations, anomalies and your bill forecast.")}</p>
        </div>
        <UpgradeGate
          required="plus"
          title={t("Analítica avanzada", "Advanced analytics")}
          description={t("Las recomendaciones personalizadas, la detección de anomalías y la proyección de factura están disponibles desde el plan Plus.", "Personalized recommendations, anomaly detection and bill forecasting are available from the Plus plan.")}
        />
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">{t("Analítica", "Analytics")}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t("Recomendaciones, anomalías y proyección de tu factura.", "Recommendations, anomalies and your bill forecast.")}</p>
      </div>

      {/* Proyección de factura */}
      <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white dark:from-blue-600 dark:to-blue-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15"><Receipt className="h-6 w-6" /></span>
            <div>
              <p className="text-sm text-blue-100/90">{t("Proyección de tu factura", "Your bill forecast")}</p>
              {prediction.data ? (
                <p className="font-display text-3xl font-extrabold">{soles(prediction.data.projectedCost)}</p>
              ) : (
                <p className="font-display text-3xl font-extrabold">—</p>
              )}
            </div>
          </div>
          {prediction.data && (
            <div className="text-right text-sm text-blue-100/90">
              <p>{fmtKwh(prediction.data.projectedKwh)} {t("estimados", "estimated")}</p>
              <p>{t("Confianza", "Confidence")} {pct(prediction.data.confidence * 100)} · {t("al", "to")} {prediction.data.closingDate}</p>
            </div>
          )}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recomendaciones */}
        <Card>
          <CardTitle>{t("Recomendaciones", "Recommendations")}</CardTitle>
          {recs.isLoading ? (
            <Loading />
          ) : recs.isError || !recs.data ? (
            <ErrorState />
          ) : (
            <ul className="space-y-3">
              {recs.data.map((r) => (
                <li key={r.id} className="rounded-lg border border-slate-100 p-3.5 dark:border-navy-800">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                      <Lightbulb className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{r.title}</p>
                        <span className="shrink-0 text-xs font-bold text-emerald-600 dark:text-emerald-400">+{soles(r.estimatedSaving)}/{t("mes", "mo")}</span>
                      </div>
                      <p className="mt-0.5 text-xs leading-snug text-slate-500 dark:text-slate-400">{r.detail}</p>
                      <div className="mt-2.5">
                        {r.applied ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            <Check className="h-3.5 w-3.5" /> {t("Aplicada", "Applied")}
                          </span>
                        ) : (
                          <Button variant="outline" className="!py-1.5 !text-xs" onClick={() => apply.mutate(r.id)} disabled={apply.isPending}>
                            {apply.isPending && apply.variables === r.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            {t("Aplicar", "Apply")}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          {/* Ranking */}
          <Card>
            <CardTitle>{t("Ranking de consumo", "Usage ranking")}</CardTitle>
            {rankings.isLoading ? (
              <Loading />
            ) : rankings.isError || !rankings.data ? (
              <ErrorState />
            ) : (
              <ul className="space-y-2">
                {rankings.data.map((r) => (
                  <li key={r.rank} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50 dark:hover:bg-navy-800">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                      r.rank === 1 ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" : "bg-slate-100 text-slate-500 dark:bg-navy-800 dark:text-slate-400"
                    }`}>
                      {r.rank === 1 ? <Trophy className="h-3.5 w-3.5" /> : r.rank}
                    </span>
                    <span className="flex-1 text-sm font-medium text-slate-900 dark:text-white">{r.deviceName}</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">{fmtKwh(r.kwh)}</span>
                    <span className="w-16 text-right text-sm font-semibold text-blue-600 dark:text-blue-400">{soles(r.cost)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Anomalías */}
          <Card>
            <CardTitle>{t("Anomalías detectadas", "Detected anomalies")}</CardTitle>
            {anomalies.isLoading ? (
              <Loading />
            ) : anomalies.isError || !anomalies.data ? (
              <ErrorState />
            ) : (
              <ul className="space-y-3">
                {anomalies.data.map((a) => (
                  <li key={a.id} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
                      <AlertTriangle className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{a.deviceName}</p>
                        <SeverityBadge severity={a.severity} />
                      </div>
                      <p className="mt-0.5 text-xs leading-snug text-slate-500 dark:text-slate-400">{a.description}</p>
                    </div>
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
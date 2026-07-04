import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Home, Target, Save, Check, Coins } from "lucide-react";
import { Card, CardTitle, Button, Loading, ErrorState, Badge } from "../components/ui";
import { Field, inputCls } from "./Login";
import { getDashboardSummary } from "../services/dashboard.service";
import { getDeviceConsumption } from "../services/energy.service";
import { kwh as fmtKwh } from "../lib/format";
import { getHomeProfile, saveHomeProfile, getGoals, saveGoals, type Goals } from "../lib/homeStore";
import { getTariff, saveTariff, DEFAULT_TARIFF } from "../lib/tariff";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";

export default function Household() {
  const { user } = useAuth();
  const { t } = useLang();
  const uid = user?.id ?? "anon";

  const qc = useQueryClient();
  const summary = useQuery({ queryKey: ["summary", user?.id], queryFn: () => getDashboardSummary(user!.id), enabled: !!user });
  const consumption = useQuery({ queryKey: ["consumption", user?.id], queryFn: () => getDeviceConsumption(user!.id), enabled: !!user });

  // Tarifa energética (S/ por kWh) que gestiona el jefe de casa.
  const [tariff, setTariff] = useState<string>(() => String(getTariff() ?? DEFAULT_TARIFF));
  const [savedTariff, setSavedTariff] = useState(false);
  const onSaveTariff = (e: React.FormEvent) => {
    e.preventDefault();
    saveTariff(Number(tariff));
    setSavedTariff(true);
    setTimeout(() => setSavedTariff(false), 2000);
    // Recalcula costos con la nueva tarifa.
    qc.invalidateQueries({ queryKey: ["consumption"] });
    qc.invalidateQueries({ queryKey: ["readings"] });
    qc.invalidateQueries({ queryKey: ["summary"] });
    qc.invalidateQueries({ queryKey: ["comparison"] });
  };

  // Perfil del hogar
  const [profile, setProfile] = useState(() => getHomeProfile(uid));
  const [savedProfile, setSavedProfile] = useState(false);
  const onSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    saveHomeProfile(uid, profile);
    setSavedProfile(true);
    setTimeout(() => setSavedProfile(false), 2000);
  };

  // Metas
  const [goals, setGoals] = useState<Goals>(() => getGoals(uid));
  const [savedGoals, setSavedGoals] = useState(false);
  const onSaveGoals = () => {
    saveGoals(uid, goals);
    setSavedGoals(true);
    setTimeout(() => setSavedGoals(false), 2000);
  };

  const totalKwh = summary.data?.totalKwh ?? 0;
  const monthlyPct = goals.monthlyKwh > 0 ? Math.min(100, Math.round((totalKwh / goals.monthlyKwh) * 100)) : 0;
  const overGoal = goals.monthlyKwh > 0 && totalKwh > goals.monthlyKwh;

  const housingTypes = [
    ["HOUSE", t("Casa", "House")],
    ["APARTMENT", t("Departamento", "Apartment")],
    ["ROOM", t("Habitación / cuarto", "Room")],
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">{t("Mi hogar", "My home")}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t("Perfil del hogar y metas de consumo.", "Home profile and consumption goals.")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Perfil del hogar */}
        <Card>
          <CardTitle action={<Home className="h-4 w-4 text-slate-400" />}>{t("Perfil del hogar", "Home profile")}</CardTitle>
          <form onSubmit={onSaveProfile} className="space-y-4">
            <Field label={t("Tipo de vivienda", "Housing type")}>
              <select value={profile.housingType} onChange={(e) => setProfile({ ...profile, housingType: e.target.value })} className={inputCls}>
                {housingTypes.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
              </select>
            </Field>
            <Field label={t("Número de ambientes", "Number of rooms")}>
              <input type="number" min="1" max="30" value={profile.rooms} onChange={(e) => setProfile({ ...profile, rooms: Number(e.target.value) })} className={inputCls} />
            </Field>
            <Field label={t("Ubicación referencial", "Reference location")}>
              <input value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })} placeholder={t("Ej: Miraflores, Lima", "e.g. Miraflores, Lima")} className={inputCls} />
            </Field>
            <div className="flex items-center gap-3">
              <Button type="submit">
                <Save className="h-4 w-4" /> {t("Guardar perfil", "Save profile")}
              </Button>
              {savedProfile && (
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  <Check className="h-4 w-4" /> {t("Guardado", "Saved")}
                </span>
              )}
            </div>
          </form>
        </Card>

        {/* Metas de consumo */}
        <Card>
          <CardTitle action={<Target className="h-4 w-4 text-slate-400" />}>{t("Metas de consumo", "Consumption goals")}</CardTitle>

          <Field label={t("Meta mensual (kWh)", "Monthly goal (kWh)")}>
            <input
              type="number"
              min="0"
              step="1"
              value={goals.monthlyKwh || ""}
              onChange={(e) => setGoals({ ...goals, monthlyKwh: Number(e.target.value) })}
              placeholder={t("Ej: 250", "e.g. 250")}
              className={inputCls}
            />
          </Field>

          {goals.monthlyKwh > 0 && (
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">
                  {fmtKwh(totalKwh)} / {fmtKwh(goals.monthlyKwh)}
                </span>
                <Badge color={overGoal ? "rose" : "green"}>
                  {overGoal ? t("Superada", "Exceeded") : `${monthlyPct}%`}
                </Badge>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-navy-800">
                <div
                  className={`h-full rounded-full ${overGoal ? "bg-rose-500" : "bg-blue-600"}`}
                  style={{ width: `${monthlyPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Metas por dispositivo */}
          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">{t("Por dispositivo", "By device")}</p>
            {consumption.isLoading ? (
              <Loading />
            ) : consumption.isError || !consumption.data ? (
              <ErrorState />
            ) : consumption.data.length === 0 ? (
              <p className="py-3 text-center text-xs text-slate-400">{t("Sin dispositivos con consumo.", "No devices with usage yet.")}</p>
            ) : (
              <ul className="space-y-2.5">
                {consumption.data.map((d) => {
                  const goal = goals.perDevice[d.deviceId] ?? 0;
                  const over = goal > 0 && d.kwh > goal;
                  return (
                    <li key={d.deviceId} className="flex items-center gap-3">
                      <span className="flex-1 truncate text-sm text-slate-700 dark:text-slate-200">
                        {d.deviceName}
                        <span className="ml-1 text-xs text-slate-400">({fmtKwh(d.kwh)})</span>
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={goal || ""}
                        onChange={(e) => setGoals({ ...goals, perDevice: { ...goals.perDevice, [d.deviceId]: Number(e.target.value) } })}
                        placeholder="kWh"
                        className="w-24 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-blue-500 dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                      />
                      {over && <Badge color="rose">!</Badge>}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="mt-5 flex items-center gap-3">
            <Button onClick={onSaveGoals}>
              <Save className="h-4 w-4" /> {t("Guardar metas", "Save goals")}
            </Button>
            {savedGoals && (
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                <Check className="h-4 w-4" /> {t("Guardado", "Saved")}
              </span>
            )}
          </div>
        </Card>
      </div>

      {/* Tarifa energética (gestión del jefe de casa) */}
      <Card>
        <CardTitle action={<Coins className="h-4 w-4 text-slate-400" />}>{t("Tarifa energética", "Energy tariff")}</CardTitle>
        <p className="mb-3 text-xs text-slate-400">
          {t("Precio por kWh que usa el cálculo de costos de tu hogar.", "Price per kWh used to estimate your home's costs.")}
        </p>
        <form onSubmit={onSaveTariff} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="sm:max-w-xs sm:flex-1">
            <Field label={t("Precio por kWh (S/)", "Price per kWh (S/)")}>
              <input
                type="number"
                min="0"
                step="0.01"
                value={tariff}
                onChange={(e) => setTariff(e.target.value)}
                placeholder={String(DEFAULT_TARIFF)}
                className={inputCls}
              />
            </Field>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit">
              <Save className="h-4 w-4" /> {t("Guardar tarifa", "Save tariff")}
            </Button>
            {savedTariff && (
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                <Check className="h-4 w-4" /> {t("Guardado", "Saved")}
              </span>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
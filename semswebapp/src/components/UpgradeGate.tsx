import { Link } from "react-router-dom";
import { Lock, Sparkles } from "lucide-react";
import { Card } from "./ui";
import { useLang } from "../context/LanguageContext";
import { TIER_LABEL, type PlanTier } from "../lib/plan";

// Bloque que se muestra cuando una funcionalidad requiere un plan superior.
export default function UpgradeGate({
  required,
  title,
  description,
}: {
  required: PlanTier;
  title: string;
  description: string;
}) {
  const { t } = useLang();
  return (
    <Card className="flex flex-col items-center gap-3 py-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
        <Lock className="h-7 w-7" />
      </span>
      <h3 className="font-display text-xl font-extrabold text-slate-900 dark:text-white">{title}</h3>
      <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">{description}</p>
      <Link
        to="/subscription"
        className="mt-2 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
      >
        <Sparkles className="h-4 w-4" />
        {t(`Mejorar al plan ${TIER_LABEL[required]}`, `Upgrade to ${TIER_LABEL[required]}`)}
      </Link>
    </Card>
  );
}
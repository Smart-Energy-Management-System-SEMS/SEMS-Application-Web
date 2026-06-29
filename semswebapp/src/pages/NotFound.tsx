import { Link } from "react-router-dom";
import { useLang } from "../context/LanguageContext";

export default function NotFound() {
  const { t } = useLang();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="font-display text-6xl font-extrabold text-blue-600">404</p>
      <p className="text-slate-500 dark:text-slate-400">{t("La página que buscas no existe.", "The page you're looking for doesn't exist.")}</p>
      <Link to="/" className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
        {t("Volver al panel", "Back to dashboard")}
      </Link>
    </div>
  );
}
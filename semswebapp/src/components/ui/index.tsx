import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useLang } from "../../context/LanguageContext";

/* ---------- Card ---------- */
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`card p-5 ${className}`}>{children}</div>;
}

export function CardTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">{children}</h3>
      {action}
    </div>
  );
}

/* ---------- Button ---------- */
type ButtonProps = {
  children: ReactNode;
  variant?: "primary" | "outline" | "ghost";
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
};
export function Button({
  children,
  variant = "primary",
  type = "button",
  onClick,
  disabled,
  className = "",
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-blue-600 text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700",
    outline:
      "border border-slate-300 text-slate-700 hover:border-blue-400 hover:text-blue-600 dark:border-navy-700 dark:text-slate-200 dark:hover:text-blue-400",
    ghost: "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-navy-800",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

/* ---------- Badge ---------- */
export function Badge({
  children,
  color = "blue",
}: {
  children: ReactNode;
  color?: "blue" | "green" | "amber" | "rose" | "slate";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
    green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    rose: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    slate: "bg-slate-100 text-slate-600 dark:bg-navy-800 dark:text-slate-300",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors[color]}`}>
      {children}
    </span>
  );
}

/* ---------- Spinner / Loading ---------- */
export function Loading({ label }: { label?: string }) {
  const { t } = useLang();
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-400">
      <Loader2 className="h-5 w-5 animate-spin" />
      {label ?? t("Cargando...", "Loading...")}
    </div>
  );
}

/* ---------- Empty / Error ---------- */
export function ErrorState({ message }: { message?: string }) {
  const { t } = useLang();
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-6 text-center text-sm text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
      {message ?? t("No se pudo cargar la información. Revisa tu conexión con el API Gateway.", "Could not load the data. Check your connection to the API Gateway.")}
    </div>
  );
}
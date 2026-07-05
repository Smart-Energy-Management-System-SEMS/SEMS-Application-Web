import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, ArrowLeft, MailCheck } from "lucide-react";
import { AuthShell, Field, inputCls } from "./Login";
import { forgotPassword } from "../services/auth.service";
import { useLang } from "../context/LanguageContext";

export default function ForgotPassword() {
  const { t } = useLang();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={t("Recupera tu contraseña", "Reset your password")}
      subtitle={t("Te enviaremos un enlace a tu correo.", "We'll email you a reset link.")}
    >
      {sent ? (
        <div className="space-y-4 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
            <MailCheck className="h-6 w-6" />
          </span>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {t("Si el correo existe, te enviamos un enlace para restablecer tu contraseña. Revisa tu bandeja (y spam).",
               "If the email exists, we sent a link to reset your password. Check your inbox (and spam).")}
          </p>
          <Link to="/login" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400">
            <ArrowLeft className="h-4 w-4" /> {t("Volver a iniciar sesión", "Back to sign in")}
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label={t("Correo electrónico", "Email")}>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tucorreo@ejemplo.com" className={inputCls} />
          </Field>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-700 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("Enviar enlace", "Send link")}
          </button>
          <Link to="/login" className="flex items-center justify-center gap-1 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
            <ArrowLeft className="h-4 w-4" /> {t("Volver", "Back")}
          </Link>
        </form>
      )}
    </AuthShell>
  );
}
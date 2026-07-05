import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";
import { AuthShell, Field, inputCls } from "./Login";
import { resetPassword } from "../services/auth.service";
import { useLang } from "../context/LanguageContext";

export default function ResetPassword() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError(t("La contraseña debe tener al menos 6 caracteres.", "Password must be at least 6 characters.")); return; }
    if (password !== confirm) { setError(t("Las contraseñas no coinciden.", "Passwords don't match.")); return; }
    setLoading(true);
    try {
      await resetPassword(token, password);
      navigate("/login", { replace: true });
    } catch {
      setError(t("El enlace es inválido o expiró. Solicita uno nuevo.", "The link is invalid or expired. Request a new one."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={t("Nueva contraseña", "New password")}
      subtitle={t("Crea una contraseña nueva para tu cuenta.", "Create a new password for your account.")}
    >
      {!token ? (
        <div className="space-y-4 text-center">
          <p className="text-sm text-rose-600 dark:text-rose-400">
            {t("Falta el token del enlace. Abre el enlace desde tu correo.", "The link token is missing. Open the link from your email.")}
          </p>
          <Link to="/forgot-password" className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400">
            {t("Solicitar un nuevo enlace", "Request a new link")}
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label={t("Nueva contraseña", "New password")}>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={inputCls} />
          </Field>
          <Field label={t("Confirmar contraseña", "Confirm password")}>
            <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" className={inputCls} />
          </Field>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-700 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("Cambiar contraseña", "Change password")}
          </button>
          <Link to="/login" className="flex items-center justify-center gap-1 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
            <ArrowLeft className="h-4 w-4" /> {t("Volver", "Back")}
          </Link>
        </form>
      )}
    </AuthShell>
  );
}
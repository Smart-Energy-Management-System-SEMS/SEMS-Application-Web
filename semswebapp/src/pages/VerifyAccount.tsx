import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { AuthShell } from "./Login";
import { verifyAccount } from "../services/auth.service";
import { useLang } from "../context/LanguageContext";

export default function VerifyAccount() {
  const { t } = useLang();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // evita doble ejecución en StrictMode
    ran.current = true;
    if (!token) { setState("error"); return; }
    verifyAccount(token).then(() => setState("ok")).catch(() => setState("error"));
  }, [token]);

  return (
    <AuthShell
      title={t("Verificación de cuenta", "Account verification")}
      subtitle={t("Estamos activando tu cuenta.", "We're activating your account.")}
    >
      <div className="space-y-4 text-center">
        {state === "loading" && (
          <>
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm text-slate-600 dark:text-slate-300">{t("Verificando…", "Verifying…")}</p>
          </>
        )}
        {state === "ok" && (
          <>
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
              <CheckCircle2 className="h-6 w-6" />
            </span>
            <p className="text-sm text-slate-600 dark:text-slate-300">{t("¡Tu cuenta fue verificada! Ya puedes iniciar sesión.", "Your account is verified! You can sign in now.")}</p>
            <Link to="/login" className="inline-block rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
              {t("Iniciar sesión", "Sign in")}
            </Link>
          </>
        )}
        {state === "error" && (
          <>
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
              <XCircle className="h-6 w-6" />
            </span>
            <p className="text-sm text-slate-600 dark:text-slate-300">{t("El enlace es inválido o expiró.", "The link is invalid or expired.")}</p>
            <Link to="/login" className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400">{t("Ir a iniciar sesión", "Go to sign in")}</Link>
          </>
        )}
      </div>
    </AuthShell>
  );
}
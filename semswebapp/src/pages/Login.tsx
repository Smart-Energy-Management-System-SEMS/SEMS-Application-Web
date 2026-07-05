import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Zap, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";
import { DEMO_MODE } from "../lib/api";
import GoogleSignInButton from "../components/GoogleSignInButton";

export default function Login() {
  const { login, loginWithGoogle, loading } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [email, setEmail] = useState(DEMO_MODE ? "demo@energix.pe" : "");
  const [password, setPassword] = useState(DEMO_MODE ? "demo1234" : "");
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/");
    } catch {
      setError(t("No se pudo iniciar sesión. Verifica tus credenciales.", "Could not sign in. Check your credentials."));
    }
  };

  const onGoogle = async (idToken: string) => {
    setError("");
    try {
      await loginWithGoogle(idToken);
      navigate("/");
    } catch {
      setError(t("No se pudo iniciar sesión con Google.", "Could not sign in with Google."));
    }
  };

  return (
    <AuthShell title={t("Bienvenido de nuevo", "Welcome back")} subtitle={t("Ingresa para ver el consumo de tu hogar.", "Sign in to see your home's energy usage.")}>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label={t("Correo electrónico", "Email")}>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tucorreo@ejemplo.com"
            className={inputCls}
          />
        </Field>
        <Field label={t("Contraseña", "Password")}>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={inputCls}
          />
        </Field>

                <div className="text-right -mt-1">
          <Link to="/forgot-password" className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400">
            {t("¿Olvidaste tu contraseña?", "Forgot your password?")}
          </Link>
        </div>


        {error && <p className="text-sm text-rose-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-700 disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {t("Iniciar sesión", "Sign in")}
        </button>

        <div className="relative py-1 text-center">
          <span className="relative z-10 bg-white px-3 text-xs text-slate-400 dark:bg-navy-900">{t("o continúa con", "or continue with")}</span>
          <div className="absolute inset-x-0 top-1/2 h-px bg-slate-200 dark:bg-navy-800" />
        </div>

        <GoogleSignInButton onCredential={onGoogle} />
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        {t("¿No tienes cuenta?", "Don't have an account?")}{" "}
        <Link to="/register" className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
          {t("Regístrate gratis", "Sign up free")}
        </Link>
      </p>

      {DEMO_MODE && (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-center text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
          {t("Modo demo activo: ingresa con cualquier correo y contraseña.", "Demo mode: sign in with any email and password.")}
        </p>
      )}
    </AuthShell>
  );
}

/* ---------- compartido por Login y Register ---------- */
export const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-navy-700 dark:bg-navy-950 dark:text-white";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      {children}
    </label>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const { t } = useLang();
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Panel de marca */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 p-12 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
            <Zap className="h-6 w-6 text-white" fill="white" />
          </span>
          <span className="font-display text-2xl font-extrabold">SEMS</span>
        </div>
        <div>
          <h2 className="font-display text-4xl font-extrabold leading-tight">
            {t("Controla tu energía.", "Take control of your energy.")}<br />{t("Reduce tu factura.", "Lower your bill.")}
          </h2>
          <p className="mt-4 max-w-md text-blue-100/90">
            {t("Monitorea el consumo de tu hogar en tiempo real, recibe alertas y ahorra hasta un 30% en tu recibo de luz.", "Monitor your home's usage in real time, get alerts and save up to 30% on your electricity bill.")}
          </p>
        </div>
        <p className="text-sm text-blue-100/70">{t("Un producto de Energix · Lima, Perú", "An Energix product · Lima, Peru")}</p>
      </div>

      {/* Formulario */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
              <Zap className="h-6 w-6 text-white" fill="white" />
            </span>
          </div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">{title}</h1>
          <p className="mt-1 mb-6 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
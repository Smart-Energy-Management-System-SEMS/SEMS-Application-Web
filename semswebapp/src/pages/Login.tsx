import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Zap, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { DEMO_MODE } from "../lib/api";
import GoogleSignInButton from "../components/GooglesSigninButton";

export default function Login() {
  const { login, loginWithGoogle, loading } = useAuth();
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
      setError("No se pudo iniciar sesión. Verifica tus credenciales.");
    }
  };
  const onGoogle = async (idToken: string) => {
    setError("");
    try {
      await loginWithGoogle(idToken);
      navigate("/");
    } catch {
      setError("No se pudo iniciar sesión con Google.");
    }
  };
  return (
    <AuthShell title="Bienvenido de nuevo" subtitle="Ingresa para ver el consumo de tu hogar.">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Correo electrónico">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tucorreo@ejemplo.com"
            className={inputCls}
          />
        </Field>
        <Field label="Contraseña">
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={inputCls}
          />
        </Field>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-700 disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Iniciar sesión
        </button>

        <div className="relative py-1 text-center">
          <span className="relative z-10 bg-white px-3 text-xs text-slate-400 dark:bg-navy-900">o continúa con</span>
          <div className="absolute inset-x-0 top-1/2 h-px bg-slate-200 dark:bg-navy-800" />
        </div>

         <GoogleSignInButton onCredential={onGoogle} />
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        ¿No tienes cuenta?{" "}
        <Link to="/register" className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
          Regístrate gratis
        </Link>
      </p>

      {DEMO_MODE && (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-center text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
          Modo demo activo: ingresa con cualquier correo y contraseña.
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
            Controla tu energía.<br />Reduce tu factura.
          </h2>
          <p className="mt-4 max-w-md text-blue-100/90">
            Monitorea el consumo de tu hogar en tiempo real, recibe alertas y ahorra hasta un 30% en tu recibo de luz.
          </p>
        </div>
        <p className="text-sm text-blue-100/70">Un producto de Energix · Lima, Perú</p>
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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
    </svg>
  );
}

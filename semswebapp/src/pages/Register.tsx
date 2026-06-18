import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { AuthShell, Field, inputCls } from "./Login";

export default function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await register(fullName, email, password);
      navigate("/");
    } catch {
      setError("No se pudo crear la cuenta. Intenta nuevamente.");
    }
  };

  return (
    <AuthShell title="Crea tu cuenta" subtitle="Empieza tu prueba gratis de 30 días.">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Nombre completo">
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Tu nombre"
            className={inputCls}
          />
        </Field>
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
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
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
          Crear cuenta gratis
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        ¿Ya tienes cuenta?{" "}
        <Link to="/login" className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
          Inicia sesión
        </Link>
      </p>
    </AuthShell>
  );
}

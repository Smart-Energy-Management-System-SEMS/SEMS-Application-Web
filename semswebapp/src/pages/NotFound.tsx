import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="font-display text-6xl font-extrabold text-blue-600">404</p>
      <p className="text-slate-500 dark:text-slate-400">La página que buscas no existe.</p>
      <Link to="/" className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
        Volver al panel
      </Link>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Moon, Sun, LogOut, ChevronDown, Settings } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useLang } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { DEMO_MODE } from "../lib/api";

export default function Topbar({ onMenu, title }: { onMenu: () => void; title: string }) {
  const { theme, toggle } = useTheme();
  const { lang, toggle: toggleLang, t } = useLang();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const initials = (user?.fullName ?? "U")
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/85 px-5 backdrop-blur-md dark:border-navy-800 dark:bg-navy-950/85">
      <div className="flex items-center gap-3">
        <button className="text-slate-500 lg:hidden" onClick={onMenu} aria-label={t("Abrir menú", "Open menu")}>
          <Menu className="h-6 w-6" />
        </button>
        <h1 className="font-display text-lg font-bold text-slate-900 dark:text-white">{title}</h1>
        {DEMO_MODE && (
          <span className="hidden rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 sm:inline dark:bg-amber-500/15 dark:text-amber-300">
            {t("Modo demo", "Demo mode")}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleLang}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-xs font-bold text-slate-600 transition-colors hover:border-blue-400 hover:text-blue-600 dark:border-navy-800 dark:text-slate-300 dark:hover:text-blue-400"
          aria-label={t("Cambiar idioma", "Change language")}
          title={t("Cambiar idioma", "Change language")}
        >
          {lang === "es" ? "EN" : "ES"}
        </button>
        <button
          onClick={toggle}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:border-blue-400 hover:text-blue-600 dark:border-navy-800 dark:text-slate-300 dark:hover:text-blue-400"
          aria-label={t("Cambiar tema", "Toggle theme")}
        >
          {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-slate-100 dark:hover:bg-navy-800"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
              {initials}
            </span>
            <span className="hidden text-sm font-medium text-slate-700 sm:block dark:text-slate-200">
              {user?.fullName ?? t("Usuario", "User")}
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-navy-800 dark:bg-navy-900">
                <div className="border-b border-slate-100 px-4 py-3 dark:border-navy-800">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{user?.fullName}</p>
                  <p className="truncate text-xs text-slate-400">{user?.email}</p>
                  {user?.segment && (
                    <span className="mt-1.5 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                      {user.segment === "HOMEOWNER"
                        ? t("Propietario de vivienda", "Homeowner")
                        : t("Estudiante / Inquilino", "Student / Tenant")}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => { setMenuOpen(false); navigate("/settings"); }}
                  className="flex w-full items-center gap-2 border-b border-slate-100 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-navy-800 dark:text-slate-200 dark:hover:bg-navy-800"
                >
                  <Settings className="h-4 w-4" />
                  {t("Configuración", "Settings")}
                </button>
                <button
                  onClick={() => { logout(); navigate("/login", { replace: true }); }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                >
                  <LogOut className="h-4 w-4" />
                  {t("Cerrar sesión", "Sign out")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
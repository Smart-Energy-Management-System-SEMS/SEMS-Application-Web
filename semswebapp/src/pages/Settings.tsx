import { useState } from "react";
import { User as UserIcon, Mail, Shield, Save, Check, Sun, Moon, Languages, Users } from "lucide-react";
import { Card, CardTitle, Button, Badge } from "../components/ui";
import { Field, inputCls } from "./Login";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useLang } from "../context/LanguageContext";
import type { UserSegment } from "../types";

export default function Settings() {
  const { user, updateProfile } = useAuth();
  const { theme, toggle } = useTheme();
  const { lang, setLang, t } = useLang();

  // Datos editables del perfil (se guardan en localStorage vía updateProfile).
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [segment, setSegment] = useState<UserSegment>(user?.segment ?? "HOMEOWNER");
  const [saved, setSaved] = useState(false);

  const dirty = fullName.trim() !== (user?.fullName ?? "") || segment !== (user?.segment ?? "HOMEOWNER");

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    const name = fullName.trim();
    if (!name) return;
    updateProfile({ fullName: name, segment });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const roleLabel: Record<string, string> = {
    ADMIN: t("Administrador", "Administrator"),
    RESIDENT: t("Residente", "Resident"),
    GUEST: t("Invitado", "Guest"),
  };

  const segments: [UserSegment, string, string][] = [
    ["HOMEOWNER", t("Propietario de vivienda", "Homeowner"), t("Dueño del hogar y del medidor.", "Owns the home and the meter.")],
    ["TENANT", t("Estudiante / Inquilino", "Student / Tenant"), t("Alquila o comparte la vivienda.", "Rents or shares the home.")],
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">{t("Configuración", "Settings")}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t("Administra tu cuenta y preferencias.", "Manage your account and preferences.")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Datos de la cuenta */}
        <Card>
          <CardTitle action={<UserIcon className="h-4 w-4 text-slate-400" />}>{t("Datos de la cuenta", "Account details")}</CardTitle>
          <form onSubmit={onSave} className="space-y-4">
            <Field label={t("Nombre para mostrar", "Display name")}>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t("Tu nombre", "Your name")}
                className={inputCls}
              />
            </Field>

            <Field label={t("Correo electrónico", "Email")}>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 dark:border-navy-800 dark:bg-navy-950/60 dark:text-slate-400">
                <Mail className="h-4 w-4 shrink-0" />
                <span className="truncate">{user?.email}</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">{t("El correo no se puede cambiar aquí.", "Email can't be changed here.")}</p>
            </Field>

            <Field label={t("Rol", "Role")}>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                  <Shield className="h-4 w-4" />
                </span>
                <Badge color="blue">{roleLabel[user?.role ?? "RESIDENT"] ?? user?.role}</Badge>
              </div>
            </Field>

            <div className="flex items-center gap-3 pt-1">
              <Button type="submit" disabled={!dirty}>
                <Save className="h-4 w-4" /> {t("Guardar cambios", "Save changes")}
              </Button>
              {saved && (
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  <Check className="h-4 w-4" /> {t("Guardado", "Saved")}
                </span>
              )}
            </div>
          </form>
        </Card>

        <div className="space-y-6">
          {/* Segmento */}
          <Card>
            <CardTitle action={<Users className="h-4 w-4 text-slate-400" />}>{t("Segmento", "Segment")}</CardTitle>
            <p className="mb-3 text-xs text-slate-400">{t("Personaliza las recomendaciones según tu perfil.", "Tailors recommendations to your profile.")}</p>
            <div className="space-y-2.5">
              {segments.map(([val, label, desc]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setSegment(val)}
                  className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
                    segment === val
                      ? "border-blue-500 bg-blue-50/60 dark:border-blue-500/60 dark:bg-blue-500/10"
                      : "border-slate-200 hover:border-slate-300 dark:border-navy-800 dark:hover:border-navy-700"
                  }`}
                >
                  <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                    segment === val ? "border-blue-600 bg-blue-600" : "border-slate-300 dark:border-navy-600"
                  }`}>
                    {segment === val && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-slate-900 dark:text-white">{label}</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">{desc}</span>
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-400">{t("Recuerda guardar los cambios arriba.", "Remember to save changes above.")}</p>
          </Card>

          {/* Preferencias */}
          <Card>
            <CardTitle action={<Languages className="h-4 w-4 text-slate-400" />}>{t("Preferencias", "Preferences")}</CardTitle>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{t("Idioma", "Language")}</p>
                  <p className="text-xs text-slate-400">{t("Español o inglés.", "Spanish or English.")}</p>
                </div>
                <div className="inline-flex rounded-lg border border-slate-200 p-0.5 dark:border-navy-800">
                  {(["es", "en"] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLang(l)}
                      className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                        lang === l ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                      }`}
                    >
                      {l.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-navy-800">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{t("Tema", "Theme")}</p>
                  <p className="text-xs text-slate-400">{t("Claro u oscuro.", "Light or dark.")}</p>
                </div>
                <button
                  type="button"
                  onClick={toggle}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-blue-400 hover:text-blue-600 dark:border-navy-800 dark:text-slate-300 dark:hover:text-blue-400"
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  {theme === "dark" ? t("Oscuro", "Dark") : t("Claro", "Light")}
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
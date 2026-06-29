import { createContext, useContext, useState, type ReactNode } from "react";

export type Lang = "es" | "en";

interface LanguageState {
  lang: Lang;
  toggle: () => void;
  setLang: (l: Lang) => void;
  // Traduce en línea: t("Hola", "Hello"). Sin diccionario externo.
  t: (es: string, en: string) => string;
}

const LanguageContext = createContext<LanguageState | undefined>(undefined);

const LANG_KEY = "sems-lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem(LANG_KEY);
    return saved === "en" || saved === "es" ? saved : "es";
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem(LANG_KEY, l);
    document.documentElement.lang = l;
  };

  const toggle = () => setLang(lang === "es" ? "en" : "es");

  const t = (es: string, en: string) => (lang === "en" ? en : es);

  return (
    <LanguageContext.Provider value={{ lang, toggle, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang debe usarse dentro de <LanguageProvider>");
  return ctx;
}
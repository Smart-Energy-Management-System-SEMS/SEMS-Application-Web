import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useLang } from "../context/LanguageContext";

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { t } = useLang();

  const titles: Record<string, string> = {
    "/": t("Resumen", "Overview"),
    "/devices": t("Dispositivos", "Devices"),
    "/monitoring": t("Monitoreo", "Monitoring"),
    "/analytics": t("Analítica", "Analytics"),
    "/alerts": t("Alertas", "Alerts"),
    "/subscription": t("Suscripción y pagos", "Subscription & payments"),
    "/reports": t("Reportes", "Reports"),
    "/settings": t("Configuración", "Settings"),
  };
  const title = titles[pathname] ?? "SEMS";

  return (
    <div className="min-h-screen">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="lg:pl-64">
        <Topbar onMenu={() => setOpen(true)} title={title} />
        <main className="mx-auto max-w-7xl p-5 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
# SEMS — Web App (Dashboard)

Panel de control de **SEMS (Smart Energy Management System)** — la app web que
consume los microservicios a través del **API Gateway**. Construida con la misma
identidad visual de la landing page (azul + blanco, modo claro/oscuro).

## 🧱 Stack

- **React 18 + Vite + TypeScript**
- **Tailwind CSS v4** (sistema de diseño compartido con la landing)
- **React Router** — navegación SPA con rutas protegidas
- **TanStack Query** — manejo de datos del servidor (cache, loading, errores)
- **Axios** — cliente HTTP con inyección de JWT
- **Recharts** — gráficos del dashboard
- **lucide-react** — íconos

## ✨ Funcionalidades (MVP)

- **Autenticación**: login y registro (JWT), con pantalla de marca. Botón de Google (UI).
- **Resumen (Dashboard)**: KPIs de ahorro, gasto, consumo y dispositivos; gráfico de consumo diario; desglose por dispositivo; recomendaciones y anomalías.
- **Dispositivos**: listado por estado, alta de dispositivos (modal).
- **Monitoreo**: medidor EOS, totales, tendencia con filtros (kWh/costo, 7/14/30 días) y detalle por dispositivo.
- **Analítica**: proyección de factura, recomendaciones aplicables, ranking de consumo y anomalías.
- **Tema claro/oscuro** persistente y **modo demo**.

## 🔌 Conexión con el backend

La app está lista para consumir tus microservicios vía el **API Gateway**
(Spring Cloud Gateway, puerto `8089`). Se configura con variables de entorno:

```bash
# .env
VITE_API_BASE_URL=http://localhost:8089   # URL del API Gateway
VITE_DEMO_MODE=true                        # true = datos simulados; false = API real
```

- **`VITE_DEMO_MODE=true`** (por defecto): la app funciona con datos de ejemplo,
  sin necesidad de levantar el backend. Ideal para revisar la UI.
- **`VITE_DEMO_MODE=false`**: la app llama al API Gateway real. Los servicios usados:

| Módulo | Endpoint (vía Gateway) |
|---|---|
| Auth/IAM | `POST /api/v1/auth/login`, `/register`, `GET /api/v1/users/me` |
| Dispositivos | `GET/POST /api/v1/devices` |
| Monitoreo | `GET /api/v1/energy/energy-readings/range`, `/device-consumptions/...`, `/energy-meters/...` |
| Analítica | `GET /api/v1/analytics/recommendations|anomalies|bill-predictions|consumption-rankings/...` |

> Nota: los paths exactos pueden ajustarse en `src/services/*.ts` según la
> configuración final de rutas del Gateway.

## 🚀 Desarrollo

```bash
npm install
cp .env.example .env
npm run dev        # http://localhost:5173
npm run build      # build de producción -> dist/
npm run preview
```

## 📁 Estructura

```
src/
├── components/      # AppLayout, Sidebar, Topbar, ui/, charts/
├── context/         # AuthContext, ThemeContext
├── lib/             # api (axios), demo (mock), format, queryClient
├── pages/           # Login, Register, Dashboard, Devices, Monitoring, Analytics
├── routes/          # ProtectedRoute
├── services/        # auth, devices, energy, analytics, dashboard
└── types/           # tipos de dominio
```

---

Un producto de **Energix** · Universidad Peruana de Ciencias Aplicadas (UPC).

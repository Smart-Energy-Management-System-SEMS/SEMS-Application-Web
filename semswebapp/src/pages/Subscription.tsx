import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, CreditCard, Star, Plus, Loader2, Download } from "lucide-react";
import { Card, CardTitle, Loading, ErrorState, Badge, Button } from "../components/ui";
import {
  getPlans,
  getMySubscription,
  changePlan,
  getPaymentMethods,
  getInvoices,
} from "../services/subscriptions.service";
import { soles } from "../lib/format";
import type { SubscriptionStatus } from "../types/billing";
import { useAuth } from "../context/AuthContext";
const subStatus: Record<SubscriptionStatus, { color: "green" | "blue" | "rose" | "amber" | "slate"; label: string }> = {
  ACTIVE: { color: "green", label: "Activa" },
  TRIAL: { color: "blue", label: "Prueba gratis" },
  CANCELED: { color: "slate", label: "Cancelada" },
  PAST_DUE: { color: "rose", label: "Pago pendiente" },
};

const invStatus = {
  PAID: { color: "green" as const, label: "Pagada" },
  PENDING: { color: "amber" as const, label: "Pendiente" },
  FAILED: { color: "rose" as const, label: "Fallida" },
};

export default function Subscription() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const sub = useQuery({ queryKey: ["subscription", user?.id], queryFn: () => getMySubscription(user!.id), enabled: !!user });
  const plans = useQuery({ queryKey: ["plans"], queryFn: getPlans });
  const methods = useQuery({ queryKey: ["paymentMethods", user?.id], queryFn: () => getPaymentMethods(user!.id), enabled: !!user });
  const invoices = useQuery({ queryKey: ["invoices", user?.id], queryFn: () => getInvoices(user!.id), enabled: !!user });

  const change = useMutation({
    mutationFn: (planId: string) => changePlan({ planId, subscriptionId: sub.data?.id, userId: user!.id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscription"] }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">Suscripción y pagos</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Gestiona tu plan, métodos de pago y facturas.</p>
      </div>

      {/* Suscripción actual */}
      <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white dark:from-blue-600 dark:to-blue-800">
        {sub.isLoading ? (
          <div className="py-6 text-center text-blue-100">Cargando...</div>
        ) : sub.data ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-blue-100/90">Tu plan actual</p>
              <div className="mt-1 flex items-center gap-3">
                <p className="font-display text-3xl font-extrabold">{sub.data.planName}</p>
                <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold">
                  {subStatus[sub.data.status].label}
                </span>
              </div>
              <p className="mt-1 text-sm text-blue-100/80">
                {soles(sub.data.price)} / {sub.data.period} · se renueva el {sub.data.renewalDate}
              </p>
            </div>
            <button className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50">
              Administrar plan
            </button>
          </div>
        ) : (
          <p className="py-6 text-center text-blue-100">No tienes una suscripción activa.</p>
        )}
      </Card>

      {/* Planes */}
      <div>
        <h3 className="mb-4 font-display text-lg font-bold text-slate-900 dark:text-white">Cambia de plan</h3>
        {plans.isLoading ? (
          <Loading />
        ) : plans.isError || !plans.data ? (
          <ErrorState />
        ) : (
          <div className="grid gap-5 lg:grid-cols-3">
            {plans.data.map((plan) => {
              const current = sub.data?.planId === plan.id;
              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-card border p-6 ${
                    plan.recommended
                      ? "border-blue-600 bg-white shadow-md dark:bg-navy-900"
                      : "border-slate-200 bg-white dark:border-navy-800 dark:bg-navy-900"
                  }`}
                >
                  {plan.recommended && (
                    <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
                      <Star className="h-3 w-3" fill="white" /> Recomendado
                    </span>
                  )}
                  <h4 className="font-display text-lg font-bold text-slate-900 dark:text-white">{plan.name}</h4>
                  <div className="mt-2 flex items-end gap-1">
                    <span className="font-display text-3xl font-extrabold text-slate-900 dark:text-white">{soles(plan.price)}</span>
                    <span className="mb-1 text-sm text-slate-400">/{plan.period}</span>
                  </div>
                  <ul className="mt-5 flex-1 space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6">
                    {current ? (
                      <Button variant="outline" className="w-full" disabled>
                        Plan actual
                      </Button>
                    ) : (
                      <Button
                        variant={plan.recommended ? "primary" : "outline"}
                        className="w-full"
                        onClick={() => change.mutate(plan.id)}
                        disabled={change.isPending}
                      >
                        {change.isPending && change.variables === plan.id && <Loader2 className="h-4 w-4 animate-spin" />}
                        Elegir {plan.name}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Métodos de pago */}
        <Card>
          <CardTitle action={<Button variant="ghost" className="!py-1 !text-xs"><Plus className="h-3.5 w-3.5" /> Agregar</Button>}>
            Métodos de pago
          </CardTitle>
          {methods.isLoading ? (
            <Loading />
          ) : methods.isError || !methods.data ? (
            <ErrorState />
          ) : (
            <ul className="space-y-3">
              {methods.data.map((m) => (
                <li key={m.id} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 dark:border-navy-800">
                  <span className="flex h-9 w-12 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600 dark:bg-navy-800 dark:text-slate-300">
                    <CreditCard className="h-4 w-4" />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {m.brand} •••• {m.last4}
                    </p>
                    <p className="text-xs text-slate-400">Vence {String(m.expMonth).padStart(2, "0")}/{m.expYear}</p>
                  </div>
                  {m.primary && <Badge color="blue">Principal</Badge>}
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Facturas */}
        <Card>
          <CardTitle>Historial de facturas</CardTitle>
          {invoices.isLoading ? (
            <Loading />
          ) : invoices.isError || !invoices.data ? (
            <ErrorState />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-navy-800">
              {invoices.data.map((inv) => (
                <li key={inv.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{inv.description}</p>
                    <p className="text-xs text-slate-400">{inv.date} · {inv.id}</p>
                  </div>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{soles(inv.amount)}</span>
                  <Badge color={invStatus[inv.status].color}>{invStatus[inv.status].label}</Badge>
                  <button className="text-slate-400 transition-colors hover:text-blue-600" aria-label="Descargar">
                    <Download className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, CreditCard, Star, Plus, Loader2, Download, Trash2 } from "lucide-react";
import { Card, CardTitle, Loading, ErrorState, Badge, Button } from "../components/ui";
import {
  getPlans,
  getMySubscription,
  changePlan,
  cancelSubscription,
  getPaymentMethods,
  getInvoices,
  createCheckoutSession,
  deletePaymentMethod,
} from "../services/subscriptions.service";
import { soles } from "../lib/format";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";
import { STRIPE_ENABLED } from "../lib/stripe";
import AddCardModal from "../components/AddCardModal";
import type { Subscription, SubscriptionStatus, SubscriptionPlan } from "../types/billing";

const subColor: Record<SubscriptionStatus, "green" | "blue" | "rose" | "amber" | "slate"> = {
  ACTIVE: "green",
  TRIAL: "blue",
  CANCELED: "slate",
  PAST_DUE: "rose",
};

const invColor = {
  PAID: "green" as const,
  PENDING: "amber" as const,
  FAILED: "rose" as const,
};

export default function Subscription() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { t } = useLang();
  const [addOpen, setAddOpen] = useState(false);
  const [payError, setPayError] = useState("");
  const [paidMsg, setPaidMsg] = useState("");

  const subLabel: Record<SubscriptionStatus, string> = {
    ACTIVE: t("Activa", "Active"),
    TRIAL: t("Prueba gratis", "Free trial"),
    CANCELED: t("Cancelada", "Canceled"),
    PAST_DUE: t("Pago pendiente", "Past due"),
  };
  const invLabel = {
    PAID: t("Pagada", "Paid"),
    PENDING: t("Pendiente", "Pending"),
    FAILED: t("Fallida", "Failed"),
  };

  const sub = useQuery({ queryKey: ["subscription", user?.id], queryFn: () => getMySubscription(user!.id), enabled: !!user });
  const plans = useQuery({ queryKey: ["plans"], queryFn: getPlans });
  const methods = useQuery({ queryKey: ["paymentMethods", user?.id], queryFn: () => getPaymentMethods(user!.id), enabled: !!user });
  const invoices = useQuery({ queryKey: ["invoices", user?.id], queryFn: () => getInvoices(user!.id), enabled: !!user });

  // Elegir plan: si es de pago, abre Stripe Checkout (ventana de Stripe) y
  // redirige; el plan se aplica al volver del pago. Si es gratis, cambia directo.
  const choose = useMutation({
    mutationFn: async (plan: SubscriptionPlan) => {
      if (plan.price > 0) {
        // Guardamos el plan elegido para aplicarlo al regresar del pago.
        localStorage.setItem("sems-pending-plan", JSON.stringify({ planId: plan.id }));
        const url = await createCheckoutSession({
          userId: user!.id,
          amount: plan.price,
          subscriptionId: sub.data?.id,
          planName: plan.name,
        });
        if (url) {
          window.location.href = url; // → ventana de Stripe
          return;
        }
        // Sin URL (modo demo): aplica el cambio directo.
      }
      await changePlan({ planId: plan.id, subscriptionId: sub.data?.id, userId: user!.id });
    },
    onMutate: () => { setPayError(""); setPaidMsg(""); },
    onSuccess: (_data, plan) => {
      qc.setQueriesData<Subscription | null>({ queryKey: ["subscription", user?.id] }, (old) =>
        old ? { ...old, planId: plan.id, planName: plan.name, price: plan.price, period: plan.period, status: "ACTIVE" } : old
      );
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: () => setPayError(t("No se pudo iniciar el pago. Inténtalo de nuevo.", "Could not start the payment. Please try again.")),
  });

  // Pagar una factura pendiente → abre Stripe Checkout por ese monto.
  const payInvoice = useMutation({
    mutationFn: async (amount: number) => {
      const url = await createCheckoutSession({ userId: user!.id, amount, subscriptionId: sub.data?.id });
      if (url) window.location.href = url;
    },
    onError: () => setPayError(t("No se pudo iniciar el pago.", "Could not start the payment.")),
  });

  const removeCard = useMutation({
    mutationFn: deletePaymentMethod,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["paymentMethods"] }),
  });

  const cancel = useMutation({
    mutationFn: () => cancelSubscription(sub.data!.id),
    onSuccess: () => {
      qc.setQueriesData<Subscription | null>({ queryKey: ["subscription", user?.id] }, (old) =>
        old ? { ...old, status: "CANCELED" } : old
      );
    },
  });

  // Al volver de Stripe Checkout: aplica el plan pendiente y refresca.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("paid") === "1") {
      const raw = localStorage.getItem("sems-pending-plan");
      if (raw) {
        try {
          const { planId } = JSON.parse(raw) as { planId: string };
          changePlan({ planId, subscriptionId: sub.data?.id, userId: user!.id }).catch(() => {});
        } catch { /* noop */ }
        localStorage.removeItem("sems-pending-plan");
      }
      setPaidMsg(t("¡Pago realizado! Tu comprobante llegará por correo.", "Payment complete! Your receipt will arrive by email."));
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["subscription"] });
      window.history.replaceState({}, "", "/subscription");
    } else if (params.get("canceled") === "1") {
      setPayError(t("Pago cancelado.", "Payment canceled."));
      window.history.replaceState({}, "", "/subscription");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">{t("Suscripción y pagos", "Subscription & payments")}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t("Gestiona tu plan, métodos de pago y facturas.", "Manage your plan, payment methods and invoices.")}</p>
      </div>

      {/* Suscripción actual */}
      <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white dark:from-blue-600 dark:to-blue-800">
        {sub.isLoading ? (
          <div className="py-6 text-center text-blue-100">{t("Cargando...", "Loading...")}</div>
        ) : sub.data ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-blue-100/90">{t("Tu plan actual", "Your current plan")}</p>
              <div className="mt-1 flex items-center gap-3">
                <p className="font-display text-3xl font-extrabold">{sub.data.planName}</p>
                <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold">
                  {subLabel[sub.data.status]}
                </span>
              </div>
              <p className="mt-1 text-sm text-blue-100/80">
                {soles(sub.data.price)} / {sub.data.period} · {t("se renueva el", "renews on")} {sub.data.renewalDate}
              </p>
            </div>
            {sub.data.status === "ACTIVE" && (
              <button
                onClick={() => cancel.mutate()}
                disabled={cancel.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/25 disabled:opacity-60"
              >
                {cancel.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {t("Cancelar renovación", "Cancel renewal")}
              </button>
            )}
          </div>
        ) : (
          <p className="py-6 text-center text-blue-100">{t("No tienes una suscripción activa.", "You have no active subscription.")}</p>
        )}
      </Card>

      {/* Planes */}
      <div>
        <h3 className="mb-4 font-display text-lg font-bold text-slate-900 dark:text-white">{t("Cambia de plan", "Change plan")}</h3>
        {paidMsg && (
          <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            {paidMsg}
          </p>
        )}
        {payError && (
          <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
            {payError}
          </p>
        )}
        {plans.isLoading ? (
          <Loading />
        ) : plans.isError || !plans.data ? (
          <ErrorState />
        ) : (
          <div className="grid gap-5 lg:grid-cols-3">
            {plans.data.map((plan) => {
              const current = sub.data?.planId === plan.id;
              const busy = choose.isPending && choose.variables?.id === plan.id;
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
                        {t("Plan actual", "Current plan")}
                      </Button>
                    ) : (
                      <Button
                        variant={plan.recommended ? "primary" : "outline"}
                        className="w-full"
                        onClick={() => choose.mutate(plan)}
                        disabled={choose.isPending}
                      >
                        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                        {plan.price > 0 ? `${t("Pagar", "Pay")} ${soles(plan.price)}` : `${t("Elegir", "Choose")} ${plan.name}`}
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
          <CardTitle
            action={
              STRIPE_ENABLED ? (
                <Button variant="ghost" className="!py-1 !text-xs" onClick={() => setAddOpen(true)}>
                  <Plus className="h-3.5 w-3.5" /> {t("Agregar", "Add")}
                </Button>
              ) : undefined
            }
          >
            {t("Métodos de pago", "Payment methods")}
          </CardTitle>
          {methods.isLoading ? (
            <Loading />
          ) : methods.isError || !methods.data ? (
            <ErrorState />
          ) : methods.data.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">
              {STRIPE_ENABLED
                ? t('Aún no tienes tarjetas. Agrega una con "Agregar".', 'No cards yet. Add one with "Add".')
                : t("No hay métodos de pago.", "No payment methods.")}
            </p>
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
                    <p className="text-xs text-slate-400">{t("Vence", "Expires")} {String(m.expMonth).padStart(2, "0")}/{m.expYear}</p>
                  </div>
                  {m.primary && <Badge color="blue">{t("Principal", "Default")}</Badge>}
                  <button
                    onClick={() => removeCard.mutate(m.id)}
                    disabled={removeCard.isPending}
                    className="text-slate-300 transition-colors hover:text-rose-500 disabled:opacity-50 dark:text-navy-700 dark:hover:text-rose-400"
                    aria-label={t("Eliminar tarjeta", "Delete card")}
                  >
                    {removeCard.isPending && removeCard.variables === m.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Facturas */}
        <Card>
          <CardTitle>{t("Historial de facturas", "Invoice history")}</CardTitle>
          {invoices.isLoading ? (
            <Loading />
          ) : invoices.isError || !invoices.data ? (
            <ErrorState />
          ) : invoices.data.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">{t("Aún no tienes pagos registrados.", "No payments yet.")}</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-navy-800">
              {invoices.data.map((inv) => (
                <li key={inv.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{inv.description}</p>
                    <p className="text-xs text-slate-400">{inv.date} · {inv.id.slice(0, 8)}</p>
                  </div>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{soles(inv.amount)}</span>
                  <Badge color={invColor[inv.status]}>{invLabel[inv.status]}</Badge>
                  {inv.status === "PENDING" && (
                    <button
                      onClick={() => payInvoice.mutate(inv.amount)}
                      disabled={payInvoice.isPending}
                      className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                    >
                      {t("Pagar", "Pay")}
                    </button>
                  )}
                  <button className="text-slate-400 transition-colors hover:text-blue-600" aria-label={t("Descargar", "Download")}>
                    <Download className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {addOpen && user && (
        <AddCardModal
          userId={user.id}
          onClose={() => setAddOpen(false)}
          onSaved={() => qc.invalidateQueries({ queryKey: ["paymentMethods"] })}
        />
      )}
    </div>
  );
}
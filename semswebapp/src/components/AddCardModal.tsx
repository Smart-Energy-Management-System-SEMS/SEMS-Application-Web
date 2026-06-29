import { useState } from "react";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { X, Loader2, CreditCard } from "lucide-react";
import { stripePromise } from "../lib/stripe";
import { addPaymentMethod } from "../services/subscriptions.service";
import { useLang } from "../context/LanguageContext";
import { Button } from "./ui";

export default function AddCardModal({
  userId,
  onClose,
  onSaved,
}: {
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useLang();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-card border border-slate-200 bg-white p-6 shadow-xl dark:border-navy-800 dark:bg-navy-900">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">{t("Agregar tarjeta", "Add card")}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>
        <Elements stripe={stripePromise}>
          <CardForm userId={userId} onClose={onClose} onSaved={onSaved} />
        </Elements>
      </div>
    </div>
  );
}

function CardForm({ userId, onClose, onSaved }: { userId: string; onClose: () => void; onSaved: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const { t } = useLang();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    const card = elements.getElement(CardElement);
    if (!card) return;

    setLoading(true);
    setError("");
    const { error: err, paymentMethod } = await stripe.createPaymentMethod({ type: "card", card });
    if (err || !paymentMethod) {
      setError(err?.message ?? t("No se pudo validar la tarjeta.", "Could not validate the card."));
      setLoading(false);
      return;
    }
    try {
      await addPaymentMethod(userId, paymentMethod.id);
      onSaved();
      onClose();
    } catch {
      setError(t("No se pudo guardar la tarjeta. Inténtalo de nuevo.", "Could not save the card. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="rounded-lg border border-slate-300 bg-white px-3.5 py-3 dark:border-navy-700 dark:bg-navy-950">
        <CardElement
          options={{
            style: {
              base: { fontSize: "15px", color: "#0f172a", "::placeholder": { color: "#94a3b8" } },
              invalid: { color: "#e11d48" },
            },
          }}
        />
      </div>
      <p className="flex items-center gap-1.5 text-xs text-slate-400">
        <CreditCard className="h-3.5 w-3.5" /> {t("Tarjeta de prueba: 4242 4242 4242 4242 · cualquier fecha futura · cualquier CVC", "Test card: 4242 4242 4242 4242 · any future date · any CVC")}
      </p>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="outline" onClick={onClose} type="button">{t("Cancelar", "Cancel")}</Button>
        <Button type="submit" disabled={loading || !stripe}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} {t("Guardar tarjeta", "Save card")}
        </Button>
      </div>
    </form>
  );
}
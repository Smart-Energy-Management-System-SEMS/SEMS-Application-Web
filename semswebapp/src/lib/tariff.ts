
const KEY = "sems-tariff";

// Tarifa referencial S/ por kWh si nadie la ha configurado.
export const DEFAULT_TARIFF = 0.78;

export function getTariff(): number | null {
  const raw = localStorage.getItem(KEY);
  if (raw == null) return null;
  const n = Number(raw);
  return isNaN(n) || n <= 0 ? null : n;
}

export function saveTariff(price: number) {
  if (!price || price <= 0) {
    localStorage.removeItem(KEY);
    return;
  }
  localStorage.setItem(KEY, String(price));
}
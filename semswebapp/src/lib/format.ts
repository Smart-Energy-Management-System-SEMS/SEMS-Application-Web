// Formateadores para soles (PEN) y energía.

export const soles = (n: number) =>
  new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(n);

export const kwh = (n: number) =>
  `${new Intl.NumberFormat("es-PE", { maximumFractionDigits: 1 }).format(n)} kWh`;

export const pct = (n: number) => `${Math.round(n)}%`;

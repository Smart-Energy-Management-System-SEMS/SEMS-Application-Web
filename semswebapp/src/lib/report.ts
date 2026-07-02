import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { DashboardSummary, DeviceConsumption, EnergyReading } from "../types";

interface ReportData {
  userName: string;
  summary: DashboardSummary | null;
  consumption: DeviceConsumption[];
  readings: EnergyReading[];
  days: number;
  lang: "es" | "en";
}

const money = (n: number) => `S/ ${n.toFixed(2)}`;
const kwh = (n: number) => `${n.toFixed(2)} kWh`;

// Genera un PDF de consumo energético y lo descarga.
export function generateConsumptionReport(d: ReportData) {
  const es = d.lang === "es";
  const T = (a: string, b: string) => (es ? a : b);
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const lastY = () => (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 0;
  const now = new Date();
  const stamp = now.toLocaleString(es ? "es-PE" : "en-US");

  // Encabezado con barra azul
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageW, 26, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("SEMS", 14, 12);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(T("Reporte de consumo energético", "Energy consumption report"), 14, 20);

  // Metadatos
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(10);
  doc.text(`${T("Usuario", "User")}: ${d.userName}`, 14, 36);
  doc.text(`${T("Periodo", "Period")}: ${T("últimos", "last")} ${d.days} ${T("días", "days")}`, 14, 42);
  doc.text(`${T("Generado", "Generated")}: ${stamp}`, 14, 48);

  // Resumen
  let y = 60;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(T("Resumen", "Summary"), 14, y);
  y += 4;

  const s = d.summary;
  autoTable(doc, {
    startY: y,
    theme: "grid",
    headStyles: { fillColor: [37, 99, 235] },
    head: [[T("Indicador", "Metric"), T("Valor", "Value")]],
    body: [
      [T("Gasto actual", "Current spend"), money(s?.currentMonthCost ?? 0)],
      [T("Proyección de factura", "Bill forecast"), money(s?.projectedCost ?? 0)],
      [T("Consumo total", "Total usage"), kwh(s?.totalKwh ?? 0)],
      [T("Dispositivos activos", "Active devices"), String(s?.activeDevices ?? 0)],
    ],
  });

  // Consumo por dispositivo
    // Consumo por dispositivo
  y = (lastY() || y) + 10;

  // Lecturas diarias
    // Lecturas diarias
  y = (lastY() || y) + 10;

  // Pie
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `SEMS · Energix — ${T("Página", "Page")} ${i}/${pages}`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: "center" }
    );
  }

  const fname = `SEMS_${T("reporte", "report")}_${now.toISOString().slice(0, 10)}.pdf`;
  doc.save(fname);
}
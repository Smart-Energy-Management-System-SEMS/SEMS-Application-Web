import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { EnergyReading } from "../../types";
import { useTheme } from "../../context/ThemeContext";

export default function ConsumptionChart({
  data,
  metric = "kwh",
}: {
  data: EnergyReading[];
  metric?: "kwh" | "cost";
}) {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const axis = dark ? "#64748b" : "#94a3b8";
  const grid = dark ? "#1b2748" : "#e2e8f0";

  const fmtDate = (d: string) => {
    const date = new Date(d + "T00:00:00");
    return date.toLocaleDateString("es-PE", { day: "2-digit", month: "short" });
  };

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={fmtDate}
          tick={{ fontSize: 11, fill: axis }}
          axisLine={false}
          tickLine={false}
          minTickGap={24}
        />
        <YAxis tick={{ fontSize: 11, fill: axis }} axisLine={false} tickLine={false} width={40} />
        <Tooltip
          contentStyle={{
            background: dark ? "#0e1730" : "#fff",
            border: `1px solid ${grid}`,
            borderRadius: 12,
            fontSize: 12,
            color: dark ? "#e2e8f0" : "#0f172a",
          }}
          labelFormatter={(l) => fmtDate(l as string)}
          formatter={(value: number) =>
            metric === "cost"
              ? [`S/ ${value.toFixed(2)}`, "Costo"]
              : [`${value} kWh`, "Consumo"]
          }
        />
        <Area
          type="monotone"
          dataKey={metric}
          stroke="#2563eb"
          strokeWidth={2.5}
          fill="url(#fill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

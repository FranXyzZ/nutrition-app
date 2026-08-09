"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  type TooltipContentProps,
} from "recharts";
import type { TimelinePoint } from "@/lib/nutrition/timeline";

type MacroKey = "calories" | "protein" | "carbs" | "fat";

interface MacroDef {
  key: MacroKey;
  label: string;
  colorVar: string;
  pctKey: keyof TimelinePoint;
  gKey: keyof TimelinePoint;
  unit: string;
}

const MACROS: MacroDef[] = [
  {
    key: "calories",
    label: "Calorías",
    colorVar: "--color-calories",
    pctKey: "caloriesPct",
    gKey: "caloriesG",
    unit: "kcal",
  },
  {
    key: "protein",
    label: "Proteína",
    colorVar: "--color-protein",
    pctKey: "proteinPct",
    gKey: "proteinG",
    unit: "g",
  },
  {
    key: "carbs",
    label: "Carbohidratos",
    colorVar: "--color-carbs",
    pctKey: "carbsPct",
    gKey: "carbsG",
    unit: "g",
  },
  {
    key: "fat",
    label: "Grasas",
    colorVar: "--color-fat",
    pctKey: "fatPct",
    gKey: "fatG",
    unit: "g",
  },
];

function CustomTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as TimelinePoint;

  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 shadow-lg">
      <p className="mb-1.5 text-xs font-medium text-muted">{label}</p>
      <div className="tabular-data space-y-0.5 text-xs">
        {MACROS.map((m) => (
          <p key={m.key} style={{ color: `var(${m.colorVar})` }}>
            {m.label}: {point[m.gKey]} {m.unit} ({point[m.pctKey]}%)
          </p>
        ))}
      </div>
    </div>
  );
}

/**
 * Gráfico principal del dashboard: evolución acumulada del día
 * (estilo "equity curve" de trading), con las 4 macros en el
 * mismo eje Y expresadas como % del objetivo diario — así son
 * comparables entre sí aunque kcal, g de proteína, etc. tengan
 * escalas distintas. La línea horizontal punteada marca el 100%
 * (objetivo cumplido). El toggle no filtra datos: aísla visualmente
 * una macro atenuando las otras tres.
 */
export function MacroTrendChart({ data }: { data: TimelinePoint[] }) {
  const [isolated, setIsolated] = useState<MacroKey | null>(null);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {MACROS.map((m) => {
          const active = isolated === null || isolated === m.key;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => setIsolated(isolated === m.key ? null : m.key)}
              className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-opacity"
              style={{
                borderColor: active ? `var(${m.colorVar})` : "var(--border)",
                color: active ? `var(${m.colorVar})` : "var(--muted)",
                opacity: active ? 1 : 0.5,
              }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: `var(${m.colorVar})` }}
              />
              {m.label}
            </button>
          );
        })}
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="time"
            stroke="var(--muted)"
            tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            minTickGap={32}
          />
          <YAxis
            stroke="var(--muted)"
            tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
            width={40}
          />
          <ReferenceLine
            y={100}
            stroke="var(--muted)"
            strokeDasharray="4 4"
            label={{
              value: "Objetivo",
              position: "insideTopRight",
              fill: "var(--muted)",
              fontSize: 10,
            }}
          />
          <Tooltip content={CustomTooltip} />
          {MACROS.map((m) => {
            const active = isolated === null || isolated === m.key;
            return (
              <Line
                key={m.key}
                type="stepAfter"
                dataKey={m.pctKey}
                stroke={`var(${m.colorVar})`}
                strokeWidth={active ? 2.5 : 1.5}
                strokeOpacity={active ? 1 : 0.2}
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

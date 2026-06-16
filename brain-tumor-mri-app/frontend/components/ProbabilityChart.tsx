"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import type { ClassProbability } from "@/lib/types";
import { CLASS_META, formatPercent } from "@/lib/classes";

interface ProbabilityChartProps {
  probabilities: ClassProbability[];
  topClass: string;
}

/** Custom tooltip styled to match the dark glass theme. */
function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="glass-2 px-3 py-2 text-sm">
      <p className="font-semibold text-ink-primary">{p.label}</p>
      <p className="tabular-nums text-ink-secondary">
        {formatPercent(p.value, 2)}
      </p>
    </div>
  );
}

/**
 * Horizontal bar chart of all four class probabilities. Bars grow on load
 * (Recharts animation) and the predicted class is emphasized.
 */
export function ProbabilityChart({
  probabilities,
  topClass,
}: ProbabilityChartProps) {
  const data = probabilities.map((p) => ({
    label: CLASS_META[p.class_id].short,
    value: p.probability,
    color: CLASS_META[p.class_id].hex,
    isTop: p.class_id === topClass,
  }));

  return (
    <div className="glass p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="eyebrow mb-1">Class Probabilities</p>
          <h4 className="font-heading text-lg font-semibold">All four classes</h4>
        </div>
      </div>

      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 48, bottom: 0, left: 8 }}
            barCategoryGap={14}
          >
            <XAxis type="number" domain={[0, 1]} hide />
            <YAxis
              type="category"
              dataKey="label"
              axisLine={false}
              tickLine={false}
              width={92}
              tick={{ fill: "rgb(156 170 191)", fontSize: 13 }}
            />
            <Tooltip
              cursor={{ fill: "rgba(148,163,184,0.06)" }}
              content={<ChartTooltip />}
            />
            <Bar
              dataKey="value"
              radius={[6, 6, 6, 6]}
              animationDuration={900}
              animationEasing="ease-out"
              label={{
                position: "right",
                formatter: (v: number | string) => formatPercent(Number(v), 1),
                fill: "rgb(203 213 225)",
                fontSize: 12,
              }}
            >
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.color}
                  fillOpacity={entry.isTop ? 1 : 0.45}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

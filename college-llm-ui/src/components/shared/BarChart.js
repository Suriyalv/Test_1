import React from "react";
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

/**
 * One restrained, single-accent bar chart used by every analytics surface
 * (Admin Activity Dashboard, My Progress) so those pages read as one
 * consistent "product", not a pile of one-off chart configs.
 *
 * `data` is [{ label, value }]. `colorFor(entry, index)` is optional — when
 * omitted every bar uses the same brand color; My Progress uses it to color
 * strength/weakness bars differently.
 */
const DEFAULT_COLOR = "#0284c7";

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <div className="font-bold text-slate-900">{label}</div>
      <div className="text-slate-500">{payload[0].value}</div>
    </div>
  );
};

const BarChart = ({ data, height = 220, colorFor, valueLabel }) => {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 text-xs font-medium text-slate-400"
        style={{ height }}
      >
        No data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ReBarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#64748b" }}
          axisLine={{ stroke: "#e2e8f0" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#64748b" }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          label={
            valueLabel
              ? { value: valueLabel, angle: -90, position: "insideLeft", fontSize: 11, fill: "#94a3b8" }
              : undefined
          }
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f1f5f9" }} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
          {data.map((entry, i) => (
            <Cell key={entry.label} fill={colorFor ? colorFor(entry, i) : DEFAULT_COLOR} />
          ))}
        </Bar>
      </ReBarChart>
    </ResponsiveContainer>
  );
};

export default BarChart;

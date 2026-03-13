"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

export default function NavLineChart({
  data,
}: {
  data: { investment_index: number; portfolio_value: number }[];
}) {
  if (!data || data.length < 2) {
    return (
      <p className="mt-6 text-sm text-(--muted)">
        Not enough data to render chart. Need at least 2 investment cycles.
      </p>
    );
  }

  return (
    <div className="mt-6 w-full" style={{ height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="investment_index"
            stroke="rgba(255,255,255,0.4)"
            tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
            label={{ value: "Investment Cycle", position: "insideBottom", offset: -10, fill: "rgba(255,255,255,0.5)" }}
          />
          <YAxis
            stroke="rgba(255,255,255,0.4)"
            tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
            tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
            label={{ value: "Portfolio Value", angle: -90, position: "insideLeft", fill: "rgba(255,255,255,0.5)" }}
          />
          <Tooltip
            formatter={(value: number | undefined) => value ? [`₹${value.toLocaleString("en-IN")}`, "NAV"] : ["N/A", "NAV"]}
            contentStyle={{
              backgroundColor: "#0f172a",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              color: "#fff",
            }}
            labelStyle={{ color: "#fff", fontWeight: 600 }}
            itemStyle={{ color: "#22d3ee" }}
          />
          <Line
            type="monotone"
            dataKey="portfolio_value"
            stroke="#22d3ee"
            strokeWidth={3}
            dot={{ r: 4, fill: "#22d3ee" }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

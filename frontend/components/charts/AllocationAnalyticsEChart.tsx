"use client";

import { useMemo, useState } from "react";
import EChartsReact from "echarts-for-react";
import { formatCurrency, formatPercent } from "@/utils/format";

export type AllocationAnalyticsPoint = {
  assetKey: string;
  category: string;
  instrumentName: string;
  amount: number;
  weightPct: number;
  growthRatePct: number;
  projectedValue: number;
};

type MetricMode = "amount" | "weight" | "gain";

function getMetricLabel(metric: MetricMode) {
  if (metric === "weight") return "Weight";
  if (metric === "gain") return "Projected Gain";
  return "Invested Amount";
}

function getThemeColor(token: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(token)
    .trim();
  return value || fallback;
}

export default function AllocationAnalyticsEChart({
  data,
}: {
  data: AllocationAnalyticsPoint[];
}) {
  const [metric, setMetric] = useState<MetricMode>("amount");
  const [horizonYears, setHorizonYears] = useState(1);
  const [selectedAssetKey, setSelectedAssetKey] = useState<string | null>(null);

  const chartTheme = useMemo(() => {
    return {
      ink1: getThemeColor("--ink-1", "#f4f2ed"),
      ink2: getThemeColor("--ink-2", "#d8d2c8"),
      muted: getThemeColor("--muted", "#9b9489"),
      brand1: getThemeColor("--brand-1", "#3a7ca5"),
      brand2: getThemeColor("--brand-2", "#f4b860"),
      brand3: getThemeColor("--brand-3", "#5cc7d6"),
      surface1: getThemeColor("--surface-1", "#13171b"),
      surface3: getThemeColor("--surface-3", "#20262c"),
    };
  }, []);

  const enhancedData = useMemo(() => {
    return data.map((item) => {
      const projectedByHorizon =
        item.amount * Math.pow(1 + item.growthRatePct / 100, horizonYears);
      const projectedGain = projectedByHorizon - item.amount;

      return {
        ...item,
        projectedByHorizon,
        projectedGain,
      };
    });
  }, [data, horizonYears]);

  const pieSeriesData = useMemo(() => {
    return enhancedData.map((item) => {
      const value =
        metric === "weight"
          ? item.weightPct
          : metric === "gain"
            ? item.projectedGain
            : item.amount;

      return {
        name: item.instrumentName,
        value,
        assetKey: item.assetKey,
      };
    });
  }, [enhancedData, metric]);

  const selected = useMemo(() => {
    if (!enhancedData.length) return null;
    if (!selectedAssetKey) return enhancedData[0];
    return (
      enhancedData.find((item) => item.assetKey === selectedAssetKey) ??
      enhancedData[0]
    );
  }, [enhancedData, selectedAssetKey]);

  const pieOption = useMemo(() => {
    return {
      tooltip: {
        trigger: "item",
        backgroundColor: chartTheme.surface1,
        borderColor: chartTheme.surface3,
        textStyle: { color: chartTheme.ink1 },
        formatter: (params: { name: string; value: number; percent: number }) => {
          const valueLabel =
            metric === "weight"
              ? formatPercent(params.value)
              : formatCurrency(params.value);

          return `${params.name}<br/>${getMetricLabel(metric)}: ${valueLabel}<br/>Share: ${formatPercent(params.percent)}`;
        },
      },
      legend: {
        bottom: 0,
        textStyle: { color: chartTheme.ink2 },
      },
      series: [
        {
          name: "Allocation",
          type: "pie",
          radius: ["48%", "74%"],
          center: ["50%", "45%"],
          avoidLabelOverlap: true,
          itemStyle: {
            borderColor: chartTheme.surface1,
            borderWidth: 2,
          },
          label: {
            color: chartTheme.ink2,
            formatter: "{b}",
          },
          labelLine: {
            lineStyle: {
              color: chartTheme.ink2,
            },
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 16,
              shadowColor: "rgba(0, 0, 0, 0.18)",
            },
          },
          color: [
            chartTheme.brand1,
            chartTheme.brand2,
            chartTheme.brand3,
            chartTheme.ink2,
            chartTheme.muted,
          ],
          data: pieSeriesData,
        },
      ],
    };
  }, [chartTheme, metric, pieSeriesData]);

  const comparisonBarOption = useMemo(() => {
    return {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: chartTheme.surface1,
        borderColor: chartTheme.surface3,
        textStyle: { color: chartTheme.ink1 },
        formatter: (params: Array<{ seriesName: string; value: number; dataIndex?: number }>) => {
          if (!params?.length) return "";

          const dataIndex = params[0].dataIndex ?? 0;
          const heading = enhancedData[dataIndex]?.instrumentName ?? "";
          const lines = params.map((row) => {
            return `${row.seriesName}: ${formatCurrency(row.value)}`;
          });

          return `${heading}<br/>${lines.join("<br/>")}`;
        },
      },
      grid: { left: 16, right: 12, top: 16, bottom: 8, containLabel: true },
      xAxis: {
        type: "value",
        axisLabel: {
          color: chartTheme.ink2,
          formatter: (value: number) => `₹${Math.round(value / 1000)}k`,
        },
        axisLine: { lineStyle: { color: chartTheme.surface3 } },
        splitLine: { lineStyle: { color: chartTheme.surface3 } },
      },
      yAxis: {
        type: "category",
        axisLabel: { color: chartTheme.ink2 },
        axisLine: { lineStyle: { color: chartTheme.surface3 } },
        data: enhancedData.map((item) => item.instrumentName),
      },
      series: [
        {
          name: "Invested",
          type: "bar",
          barMaxWidth: 18,
          itemStyle: { color: chartTheme.brand1, borderRadius: [0, 8, 8, 0] },
          data: enhancedData.map((item) => item.amount),
        },
        {
          name: `Projected (${horizonYears}Y)`,
          type: "bar",
          barMaxWidth: 18,
          itemStyle: { color: chartTheme.brand2, borderRadius: [0, 8, 8, 0] },
          data: enhancedData.map((item) => item.projectedByHorizon),
        },
      ],
    };
  }, [chartTheme, enhancedData, horizonYears]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setMetric("amount")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium ${
            metric === "amount"
              ? "bg-(--brand-1) text-(--surface-1)"
              : "bg-(--surface-2) text-(--ink-1)"
          }`}
        >
          Amount
        </button>
        <button
          type="button"
          onClick={() => setMetric("weight")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium ${
            metric === "weight"
              ? "bg-(--brand-1) text-(--surface-1)"
              : "bg-(--surface-2) text-(--ink-1)"
          }`}
        >
          Weight %
        </button>
        <button
          type="button"
          onClick={() => setMetric("gain")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium ${
            metric === "gain"
              ? "bg-(--brand-1) text-(--surface-1)"
              : "bg-(--surface-2) text-(--ink-1)"
          }`}
        >
          Projected Gain
        </button>
      </div>

      <div className="rounded-2xl border border-(--surface-3) bg-(--surface-1) p-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs uppercase tracking-[0.2em] text-(--ink-2)">
            Projection Horizon
          </p>
          <p className="text-sm font-semibold text-(--ink-1)">{horizonYears} year{horizonYears > 1 ? "s" : ""}</p>
        </div>
        <input
          type="range"
          min={1}
          max={5}
          value={horizonYears}
          onChange={(event) => setHorizonYears(Number(event.target.value))}
          className="mt-3 w-full accent-(--brand-1)"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-(--surface-3) bg-(--surface-1) p-4">
          <p className="text-sm font-semibold text-(--ink-1)">Allocation Mix</p>
          <div className="mt-2 h-80">
            <EChartsReact
              option={pieOption}
              notMerge
              lazyUpdate
              style={{ height: "100%", width: "100%" }}
              onEvents={{
                click: (params: { data?: { assetKey?: string } }) => {
                  const clickedKey = params?.data?.assetKey;
                  if (clickedKey) setSelectedAssetKey(clickedKey);
                },
              }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-(--surface-3) bg-(--surface-1) p-4">
          <p className="text-sm font-semibold text-(--ink-1)">Invested vs Projected</p>
          <div className="mt-2 h-80">
            <EChartsReact
              option={comparisonBarOption}
              notMerge
              lazyUpdate
              style={{ height: "100%", width: "100%" }}
            />
          </div>
        </div>
      </div>

      {selected ? (
        <div className="rounded-2xl border border-(--surface-3) bg-(--surface-2) p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-(--ink-2)">Selected Instrument</p>
          <p className="mt-1 text-base font-semibold text-(--ink-1)">{selected.instrumentName}</p>
          <div className="mt-3 grid gap-3 text-sm text-(--ink-2) md:grid-cols-4">
            <p>Category: <span className="font-semibold text-(--ink-1)">{selected.category}</span></p>
            <p>Invested: <span className="font-semibold text-(--ink-1)">{formatCurrency(selected.amount)}</span></p>
            <p>Growth rate: <span className="font-semibold text-(--ink-1)">{formatPercent(selected.growthRatePct)}</span></p>
            <p>Projected ({horizonYears}Y): <span className="font-semibold text-(--ink-1)">{formatCurrency(selected.projectedByHorizon)}</span></p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

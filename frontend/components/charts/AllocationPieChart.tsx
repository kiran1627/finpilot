"use client";

import { useMemo } from "react";
import EChartsReact from "echarts-for-react";

function getThemeColor(token: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(token)
    .trim();
  return value || fallback;
}

export default function AllocationPieChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
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

  const option = useMemo(() => {
    return {
      tooltip: {
        trigger: "item",
        backgroundColor: chartTheme.surface1,
        borderColor: chartTheme.surface3,
        textStyle: { color: chartTheme.ink1 },
        formatter: (params: { name: string; value: number; percent: number }) =>
          `${params.name}<br/>Amount: ₹${params.value.toLocaleString("en-IN")}<br/>Share: ${params.percent.toFixed(2)}%`,
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
          color: [
            chartTheme.brand1,
            chartTheme.brand2,
            chartTheme.brand3,
            chartTheme.ink2,
            chartTheme.muted,
          ],
          data,
        },
      ],
    };
  }, [chartTheme, data]);

  return (
    <div className="h-72 w-full">
      <EChartsReact
        option={option}
        notMerge
        lazyUpdate
        style={{ height: "100%", width: "100%" }}
      />
    </div>
  );
}

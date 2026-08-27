"use client";

import React from "react";
import { SystemState } from "@/lib/types";
import { Shield, ArrowDownRight, ArrowUpRight } from "lucide-react";

// Micro Sparkline SVG generator
const Sparkline = ({
  data,
  color,
}: {
  data: number[];
  color: string;
}) => {
  const min = Math.min(...data);
  const max = Math.max(...data) || 1;
  const range = max - min || 1;
  const w = 70;
  const h = 20;

  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((val - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

export function ThreatOverview({ state }: { state: SystemState }) {
  const isAttack = (state.label && state.label !== "Benign") || (state.risk_score || 0) >= 0.5;

  const metrics = [
    {
      id: "score",
      label: "Threat Score",
      value: isAttack ? "88" : "23",
      trend: "↓ 12%",
      trendDir: "down" as const,
      color: "#F43F5E",
      sparkData: isAttack ? [30, 45, 60, 75, 82, 88] : [40, 35, 32, 28, 25, 23],
    },
    {
      id: "attempts",
      label: "Attack Attempts",
      value: isAttack ? "148" : "47",
      trend: "↑ 8%",
      trendDir: "up" as const,
      color: "#D97706",
      sparkData: isAttack ? [15, 30, 60, 95, 120, 148] : [35, 38, 42, 40, 45, 47],
    },
    {
      id: "blocked",
      label: "Blocked Attacks",
      value: isAttack ? "142" : "36",
      trend: "↑ 15%",
      trendDir: "up" as const,
      color: "#6D28D9",
      sparkData: isAttack ? [12, 28, 55, 90, 115, 142] : [20, 24, 28, 30, 34, 36],
    },
    {
      id: "trend",
      label: "Risk Trend (24h)",
      value: isAttack ? "CRITICAL" : "LOW",
      trend: isAttack ? "Escalating" : "Stable",
      trendDir: "stable" as const,
      color: isAttack ? "#F43F5E" : "#059669",
      sparkData: isAttack ? [10, 20, 40, 65, 80, 95] : [10, 8, 12, 7, 9, 6],
    },
  ];

  return (
    <div className="card p-4 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2 mb-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-[var(--coral)]" />
          <h3 className="font-head text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
            THREAT OVERVIEW
          </h3>
        </div>
        <span className="badge badge-gray text-[9px]">24H ROLLING</span>
      </div>

      {/* 4 Metric Columns */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-center">
        {metrics.map((m) => (
          <div key={m.id} className="space-y-1">
            <span className="text-[10px] font-semibold text-[var(--text-muted)] font-mono block">
              {m.label}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span
                className="font-head text-xl font-extrabold tracking-tight"
                style={{ color: m.color }}
              >
                {m.value}
              </span>
              <span
                className={`text-[10px] font-mono font-bold flex items-center ${
                  m.trendDir === "down"
                    ? "text-[var(--mint)]"
                    : m.trendDir === "up"
                    ? "text-[var(--coral)]"
                    : "text-[var(--mint)]"
                }`}
              >
                {m.trend}
              </span>
            </div>
            <div className="pt-1">
              <Sparkline data={m.sparkData} color={m.color} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

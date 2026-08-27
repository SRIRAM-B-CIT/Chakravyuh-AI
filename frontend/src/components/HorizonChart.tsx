"use client";

import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { SystemState } from "@/lib/types";

interface HorizonChartProps {
  state: SystemState;
}

export const HorizonChart: React.FC<HorizonChartProps> = ({ state }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAttack = state.risk_score >= 0.50 || (state.label && state.label !== "Benign");
  const rollout = state.rollout && state.rollout.length === 4 
    ? state.rollout 
    : (isAttack ? [0.15, 0.40, 0.75, 0.96] : [0.02, 0.03, 0.04, 0.05]);

  const threatRollout = rollout;
  const internalSubnetScore = 5.0;
  const threatScorePct = Math.round((threatRollout[3] || 0.05) * 100);

  const chartData = [
    {
      step: "Step t",
      "Threat Node": Math.round((threatRollout[0] || 0.02) * 100),
      "Internal Subnet": 5.0,
    },
    {
      step: "t+1",
      "Threat Node": Math.round((threatRollout[1] || 0.03) * 100),
      "Internal Subnet": 5.0,
    },
    {
      step: "t+2",
      "Threat Node": Math.round((threatRollout[2] || 0.04) * 100),
      "Internal Subnet": 5.0,
    },
    {
      step: "t+3",
      "Threat Node": Math.round((threatRollout[3] || 0.05) * 100),
      "Internal Subnet": 5.0,
    },
  ];

  return (
    <div className="tactical-card p-3.5 flex flex-col relative overflow-hidden bg-[#0c121e]/95 border border-slate-800">
      {/* Header with Title and Custom Legends */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-rose-400" />
          <h2 className="text-xs font-bold text-white tracking-wide uppercase font-mono">
            RSSM K-Step Attack Horizon Rollout Projection
          </h2>
        </div>

        {/* Legend Indicators */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <span className="w-3 h-0.5 bg-cyan-400 inline-block" />
            <span>Internal Subnet ({internalSubnetScore.toFixed(1)}%)</span>
          </div>
          <div className="flex items-center gap-1.5 text-red-400">
            <span className="w-3 h-0.5 bg-red-500 inline-block" />
            <span>Threat Node ({threatScorePct}.0%)</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas with Guaranteed Pixel Height */}
      <div 
        className="w-full relative rounded-lg bg-[#060a12] border border-slate-800/80 p-2"
        style={{ minHeight: "220px", height: "220px" }}
      >
        {mounted ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart
              data={chartData}
              margin={{ top: 15, right: 30, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="threatAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="step"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#1e2c47" }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#1e2c47" }}
                domain={[0, 100]}
                ticks={[0, 50, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(10, 15, 26, 0.95)",
                  borderColor: "#1e2c47",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontFamily: "monospace",
                }}
                formatter={(val: any, name: string) => [`${val}% Risk`, name]}
              />

              {/* Internal Subnet Flat Base Line (Cyan) */}
              <Line
                type="monotone"
                dataKey="Internal Subnet"
                stroke="#22d3ee"
                strokeWidth={2}
                dot={{ r: 3, fill: "#22d3ee" }}
              />

              {/* Threat Horizon Surge Area & Line (Red) */}
              <Area
                type="monotone"
                dataKey="Threat Node"
                stroke="#ef4444"
                strokeWidth={2.5}
                fill="url(#threatAreaGrad)"
                dot={{ r: 4, fill: "#ef4444", stroke: "#ffe4e6", strokeWidth: 1.5 }}
                activeDot={{ r: 6, fill: "#ef4444", stroke: "#ffffff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs font-mono text-slate-500">
            Initializing Horizon Projection...
          </div>
        )}

        {/* Peak Threat Callout Badge at t+3 */}
        {isAttack && (
          <div className="absolute right-6 top-3 pointer-events-none">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1a0f14] text-red-400 border border-red-500/80 shadow-tactical-crimson">
              Threat Node ({threatScorePct}.0%)
            </span>
          </div>
        )}
      </div>
    </div>
  );
};


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
import { TrendingUp, BrainCircuit } from "lucide-react";
import { SystemState } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";

interface HorizonChartProps {
  state: SystemState;
}

export const HorizonChart: React.FC<HorizonChartProps> = ({ state }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAttack =
    state.risk_score >= 0.5 || (state.label && state.label !== "Benign");
  const rollout =
    state.rollout && state.rollout.length === 4
      ? state.rollout
      : isAttack
      ? [0.15, 0.4, 0.75, 0.96]
      : [0.02, 0.03, 0.04, 0.05];

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
    <div className="tactical-card p-4 flex flex-col h-full relative overflow-hidden">
      {/* Header with Title and Legends */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-violet-400" />
          <div>
            <h2 className="text-xs font-bold text-white tracking-wide uppercase font-mono">
              RSSM K-STEP ATTACK HORIZON ROLLOUT PROJECTION
            </h2>
            <p className="text-[10px] text-slate-400 font-mono">
              RECURRENT STATE SPACE MODEL FORECAST
            </p>
          </div>
        </div>

        {/* Legend Indicators */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <span className="w-2.5 h-0.5 bg-cyan-400 inline-block rounded-full" />
            <span>Subnet ({internalSubnetScore.toFixed(1)}%)</span>
          </div>
          <div className="flex items-center gap-1.5 text-red-400">
            <span className="w-2.5 h-0.5 bg-red-500 inline-block rounded-full" />
            <span>Threat ({threatScorePct}%)</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div
        className="w-full relative rounded-xl bg-[#040812] border border-slate-800/90 p-3"
        style={{ minHeight: "220px", height: "220px" }}
      >
        {mounted ? (
          <ResponsiveContainer width="100%" height={195}>
            <AreaChart
              data={chartData}
              margin={{ top: 15, right: 25, left: -20, bottom: 0 }}
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
                  backgroundColor: "rgba(6, 11, 20, 0.95)",
                  borderColor: "#1e2c47",
                  borderRadius: "8px",
                  fontSize: "11px",
                  fontFamily: "monospace",
                  color: "#f1f5f9",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                }}
                formatter={(val: any, name: string) => [`${val}% Risk`, name]}
              />

              {/* Internal Subnet Line */}
              <Line
                type="monotone"
                dataKey="Internal Subnet"
                stroke="#38bdf8"
                strokeWidth={2}
                dot={{ r: 3, fill: "#38bdf8" }}
              />

              {/* Threat Horizon Surge Area */}
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

        {/* Peak Callout Badge */}
        {isAttack && (
          <div className="absolute right-6 top-3 pointer-events-none">
            <Badge variant="critical">t+3 PEAK FORECAST: {threatScorePct}%</Badge>
          </div>
        )}
      </div>
    </div>
  );
};

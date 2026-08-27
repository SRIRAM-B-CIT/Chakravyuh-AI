"use client";

import React from "react";
import { SystemState } from "@/lib/types";
import { BrainCircuit, Zap } from "lucide-react";

export function PredictionConfidence({ state }: { state: SystemState }) {
  const conf = Math.round((state.ml_conf || 0.98) * 100);

  // SVG Circular Gauge calculations
  const size = 88;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (conf / 100) * circumference;

  // Smooth Area Chart Curve
  const chartPoints = [
    { x: 0,   y: 42 },
    { x: 40,  y: 36 },
    { x: 80,  y: 44 },
    { x: 120, y: 28 },
    { x: 160, y: 32 },
    { x: 200, y: 18 },
    { x: 240, y: 22 },
    { x: 280, y: 12 },
    { x: 320, y: 8 },
  ];

  const w = 320;
  const h = 64;

  const pathD = `M 0,${chartPoints[0].y} ` + chartPoints.slice(1).map((p) => `L ${p.x},${p.y}`).join(" ");
  const areaD = `${pathD} L ${w},${h} L 0,${h} Z`;

  return (
    <div className="card p-4 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2 mb-2">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-[var(--magenta)]" />
          <h3 className="font-head text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
            PREDICTION CONFIDENCE
          </h3>
        </div>
        <span className="badge badge-magenta text-[9px]">ST-GNN + RSSM</span>
      </div>

      {/* Content: Donut on Left, Area Chart on Right */}
      <div className="flex items-center gap-5 justify-between">
        {/* Circular Gauge */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative flex items-center justify-center">
            <svg width={size} height={size} className="-rotate-90">
              {/* Background Ring */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="var(--border)"
                strokeWidth={strokeWidth}
              />
              {/* Foreground Gradient Ring */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="url(#confGrad)"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{
                  transition: "stroke-dashoffset 0.8s ease-in-out",
                }}
              />
              <defs>
                <linearGradient id="confGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#6D28D9" />
                  <stop offset="100%" stopColor="#C026D3" />
                </linearGradient>
              </defs>
            </svg>

            {/* Percentage Text inside Ring */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-head text-lg font-extrabold text-[var(--text-primary)]">
                {conf}%
              </span>
            </div>
          </div>

          <div>
            <div className="font-head text-xs font-bold text-[var(--text-primary)]">
              High Confidence
            </div>
            <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">
              RSSM Latent State
            </div>
          </div>
        </div>

        {/* Prediction Confidence Gradient Area Chart */}
        <div className="flex-1 overflow-hidden">
          <svg width="100%" height="60" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C026D3" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#6D28D9" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6D28D9" />
                <stop offset="100%" stopColor="#C026D3" />
              </linearGradient>
            </defs>

            {/* Filled Area */}
            <path d={areaD} fill="url(#areaGrad)" />
            {/* Smooth Outline */}
            <path
              d={pathD}
              fill="none"
              stroke="url(#lineGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

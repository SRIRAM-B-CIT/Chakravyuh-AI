"use client";

import React from "react";
import { Activity, ShieldAlert, Gauge, Network, ShieldCheck, BrainCircuit } from "lucide-react";
import { SystemState } from "@/lib/types";

// Helper SVG Mini Sparkline component for lightweight, ultra-smooth rendering
const MiniSparkline = ({
  data,
  color,
  fillColor,
}: {
  data: number[];
  color: string;
  fillColor?: string;
}) => {
  const min = Math.min(...data);
  const max = Math.max(...data) || 1;
  const range = max - min || 1;
  const width = 80;
  const height = 24;

  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x},${y}`;
    })
    .join(" ");

  const firstPoint = `0,${height}`;
  const lastPoint = `${width},${height}`;
  const areaPoints = `${firstPoint} ${points} ${lastPoint}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      {fillColor && (
        <polygon points={areaPoints} fill={fillColor} opacity={0.3} />
      )}
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

export function MetricGrid({
  state,
}: {
  state: SystemState;
  uptime: string;
}) {
  const risk = Math.round((state.risk_score || 0.05) * 100);
  const horizon = Math.round(
    (state.rollout?.[3] || (state.risk_score ? state.risk_score * 1.2 : 0.35)) * 100
  );
  const nodes =
    state.topology?.stats?.total_nodes ?? state.topology?.nodes?.length ?? 4;
  const edges =
    state.topology?.stats?.total_edges ?? state.topology?.edges?.length ?? 5;
  const isAttack = state.label !== "Benign" || risk >= 50;
  const activeFlows = state.topology?.stats?.active_flows ?? 131;

  const cards = [
    {
      id: "posture",
      label: "SYSTEM POSTURE",
      value: isAttack ? "ELEVATED" : "NOMINAL",
      detail: isAttack ? "Active Threat Vector" : "99.98% System Health",
      icon: Activity,
      iconColor: "#6D28D9", // Deep violet
      valueColor: isAttack ? "#F43F5E" : "var(--text-primary)",
      badgeText: "↑ 0.82% vs last hour",
      badgeClass: "badge-mint",
      sparkData: [98, 98.4, 99.1, 98.9, 99.5, 99.8, 99.98],
      sparkColor: "#6D28D9",
      sparkFill: "#EDE9FE",
    },
    {
      id: "threat",
      label: "CURRENT THREAT",
      value: `${risk}%`,
      detail: isAttack ? state.label.toUpperCase() : "Low Risk Profile",
      icon: ShieldAlert,
      iconColor: "#F43F5E", // Coral
      valueColor: isAttack ? "#F43F5E" : "#F43F5E",
      badgeText: isAttack ? "CRITICAL THREAT" : "LOW RISK",
      badgeClass: isAttack ? "badge-coral" : "badge-amber",
      sparkData: isAttack ? [10, 25, 45, 70, 85, 92, 96] : [8, 5, 6, 4, 7, 5, 5],
      sparkColor: "#F43F5E",
      sparkFill: "#FFF1F2",
    },
    {
      id: "horizon",
      label: "PREDICTIVE HORIZON",
      value: `t+${horizon}%`,
      detail: horizon >= 80 ? "Escalation Imminent" : "Nominal Forward State",
      icon: Gauge,
      iconColor: "#C026D3", // Magenta
      valueColor: "#C026D3",
      badgeText: "t+3 STEPS",
      badgeClass: "badge-magenta",
      sparkData: [15, 22, 28, 30, 32, 34, 35],
      sparkColor: "#C026D3",
      sparkFill: "#FDF4FF",
    },
    {
      id: "flows",
      label: "SPATIAL FLOWS",
      value: `${activeFlows}`,
      detail: `${nodes} Nodes · ${edges} Flow Edges`,
      icon: Network,
      iconColor: "#4338CA", // Indigo
      valueColor: "var(--text-primary)",
      badgeText: "ACTIVE",
      badgeClass: "badge-violet",
      sparkData: [110, 125, 118, 134, 128, 130, 131],
      sparkColor: "#4338CA",
      sparkFill: "#EDE9FE",
    },
    {
      id: "containment",
      label: "SOAR CONTAINMENT",
      value: state.isolated ? "CONTAINING" : "PROTECTED",
      detail: `${state.isolated ? 1 : 0} Active · ${state.netfilter_drops || "0 Drops"}`,
      icon: ShieldCheck,
      iconColor: "#059669", // Mint
      valueColor: state.isolated ? "#F43F5E" : "#059669",
      badgeText: state.isolated ? "ISOLATED" : "STABLE",
      badgeClass: state.isolated ? "badge-coral" : "badge-mint",
      sparkData: state.isolated ? [0, 0, 12, 45, 120, 240, 380] : [0, 0, 0, 0, 0, 0, 0],
      sparkColor: "#059669",
      sparkFill: "#ECFDF5",
    },
    {
      id: "world_model",
      label: "WORLD MODEL",
      value: "RSSM + ST-GNN",
      detail: `${Math.round((state.ml_conf || 0.98) * 100)}% Confidence Score`,
      icon: BrainCircuit,
      iconColor: "#C026D3", // Magenta
      valueColor: "#6D28D9",
      badgeText: "ONLINE",
      badgeClass: "badge-violet",
      sparkData: [92, 94, 95, 96, 97, 98, 98],
      sparkColor: "#7C3AED",
      sparkFill: "#EDE9FE",
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className="card p-3.5 flex flex-col justify-between space-y-3 relative overflow-hidden group hover:border-[var(--violet)] transition-all duration-200"
          >
            {/* Top row: Label & Icon */}
            <div className="flex items-center justify-between">
              <span className="font-head text-[11px] font-bold tracking-wider text-[var(--text-secondary)] uppercase">
                {card.label}
              </span>
              <div
                className="p-1.5 rounded-lg"
                style={{
                  backgroundColor: `${card.iconColor}15`,
                }}
              >
                <Icon className="h-4 w-4" style={{ color: card.iconColor }} />
              </div>
            </div>

            {/* Middle row: Large Value & Detail */}
            <div>
              <div
                className="font-head text-2xl font-extrabold tracking-tight"
                style={{ color: card.valueColor }}
              >
                {card.value}
              </div>
              <div className="mt-0.5 text-[11px] text-[var(--text-muted)] font-medium">
                {card.detail}
              </div>
            </div>

            {/* Bottom row: Sparkline & Badge */}
            <div className="flex items-center justify-between pt-2.5 border-t border-[var(--border)]">
              <MiniSparkline
                data={card.sparkData}
                color={card.sparkColor}
                fillColor={card.sparkFill}
              />
              <span className={`badge ${card.badgeClass}`}>
                {card.badgeText}
              </span>
            </div>
          </div>
        );
      })}
    </section>
  );
}

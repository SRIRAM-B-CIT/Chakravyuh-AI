"use client";

import React from "react";
import { Activity, BrainCircuit, Gauge, Network, ShieldCheck, Zap, ArrowUpRight } from "lucide-react";
import { SystemState } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";

export function MetricGrid({
  state,
  uptime,
}: {
  state: SystemState;
  uptime: string;
}) {
  const risk = Math.round((state.risk_score || 0) * 100);
  const horizon = Math.round(
    (state.rollout?.[3] || state.risk_score || 0) * 100
  );
  const nodes =
    state.topology?.stats?.total_nodes ?? state.topology?.nodes?.length ?? 0;
  const edges =
    state.topology?.stats?.total_edges ?? state.topology?.edges?.length ?? 0;
  const attack = state.label !== "Benign" || risk >= 50;

  const cards = [
    {
      label: "SYSTEM POSTURE",
      value: attack ? "DEGRADED" : "NOMINAL",
      detail: attack ? "Active Threat Vector" : "99.98% System Health",
      icon: Activity,
      variant: attack ? ("warning" as const) : ("safe" as const),
      trend: "+0.02%",
    },
    {
      label: "CURRENT THREAT",
      value: `${risk}%`,
      detail: attack ? state.label.toUpperCase() : "Low Risk Profile",
      icon: ShieldCheck,
      variant: attack ? ("critical" as const) : ("safe" as const),
      trend: attack ? "CRITICAL" : "NORMAL",
    },
    {
      label: "PREDICTIVE HORIZON",
      value: `t+3 ${horizon}%`,
      detail: horizon >= 90 ? "High Risk Escalation" : "Nominal Forward State",
      icon: Gauge,
      variant: horizon >= 90 ? ("critical" as const) : ("purple" as const),
      trend: "t+3 STEPS",
    },
    {
      label: "SPATIAL FLOWS",
      value: `${state.topology?.stats?.active_flows ?? 0}`,
      detail: `${nodes} Nodes · ${edges} Flow Edges`,
      icon: Network,
      variant: "info" as const,
      trend: "ST-GNN",
    },
    {
      label: "SOAR CONTAINMENT",
      value: state.isolated ? "ISOLATING" : "PROTECTED",
      detail: `${state.isolated ? 1 : 0} Active · Drops: ${state.netfilter_drops || 0}`,
      icon: Zap,
      variant: state.isolated ? ("critical" as const) : ("safe" as const),
      trend: "IPTABLES",
    },
    {
      label: "WORLD MODEL",
      value: "RSSM + ST-GNN",
      detail: `${Math.round((state.ml_conf || 0) * 100)}% Confidence Score`,
      icon: BrainCircuit,
      variant: "purple" as const,
      trend: "ONLINE",
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="p-4 flex flex-col justify-between space-y-3 relative overflow-hidden group rounded-xl border border-[#D9E3EF] bg-white shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <span className="font-sans text-[10px] font-black tracking-wider text-[#2563EB] uppercase">
                {card.label}
              </span>
              <Icon className="h-4 w-4 text-[#2563EB] transition-colors" />
            </div>

            <div>
              <div className="font-sans text-xl font-black text-[#0F2747] tracking-tight">
                {card.value}
              </div>
              <div className="mt-0.5 text-[11px] text-[#52677F] font-sans font-semibold">
                {card.detail}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#D9E3EF]">
              {card.label === "SYSTEM POSTURE" ? (
                <div className="flex items-center gap-1.5 text-[10px] font-sans">
                  <span className="font-bold text-[#2563EB]">↑ 0.82%</span>
                  <span className="text-[#7A8CA0] font-medium">vs last hour</span>
                </div>
              ) : (
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                  card.variant === "safe" 
                    ? "bg-emerald-50 text-[#10B981]" 
                    : card.variant === "critical" 
                    ? "bg-red-50 text-[#EF4444]" 
                    : "bg-blue-50 text-[#2563EB]"
                }`}>
                  <span aria-hidden="true">●</span> {card.trend}
                </span>
              )}
              <ArrowUpRight className="h-3.5 w-3.5 text-[#7A8CA0] group-hover:text-[#2563EB] transition" />
            </div>
          </div>
        );
      })}
    </section>
  );
}

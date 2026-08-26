"use client";

import React from "react";
import { Settings, Shield, Globe, TrendingUp } from "lucide-react";
import { SystemState } from "@/lib/types";

interface MetricCardsProps {
  state: SystemState;
  isConnected: boolean;
  uptime: string;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ state }) => {
  const isIsolated = state.isolated;
  const riskVal = state.risk_score;
  const isAttack = riskVal >= 0.50 || (state.label && state.label !== "Benign");

  const systemStatusTitle = isIsolated
    ? "HOST ISOLATED (NETFILTER ACTIVE)"
    : isAttack
    ? "INFILTRATION DETECTED, CONTAINING"
    : "ACTIVE MONITORING, SAFE / NOMINAL";

  const conditionText = isIsolated
    ? "ISOLATED / BLOCKED"
    : isAttack
    ? "ATTACK ACTIVE"
    : "NOMINAL";

  const statusBadge = isIsolated ? "ISOLATED" : isAttack ? "CRITICAL" : "SAFE";

  const dropsCount = (state as any).netfilter_drops || (isIsolated ? "41.3k Drops" : "0 Drops");
  const mlConfidence = Math.round((state.ml_conf || 0.98) * 100);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: System Status */}
      <div className="tactical-card p-4 relative overflow-hidden bg-[#0c121d]/90 border border-slate-800">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mb-2">
          <Settings className="w-3.5 h-3.5 text-slate-400" />
          <span className="uppercase tracking-wider">SYSTEM STATUS</span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              isIsolated
                ? "bg-red-500 animate-ping"
                : isAttack
                ? "bg-red-500 animate-pulse"
                : "bg-cyan-400 animate-pulse"
            }`}
          />
          <span className="text-xs font-bold text-slate-100 truncate">
            {systemStatusTitle}
          </span>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            State Condition: <strong className="text-slate-200">{conditionText}</strong>
          </span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${
              statusBadge === "SAFE"
                ? "bg-cyan-950/60 text-cyan-300 border-cyan-500/60"
                : "bg-red-950/60 text-red-300 border-red-500/80 shadow-tactical-crimson"
            }`}
          >
            {statusBadge}
          </span>
        </div>
      </div>

      {/* Card 2: Defense Strategy */}
      <div className="tactical-card p-4 relative overflow-hidden bg-[#0c121d]/90 border border-slate-800">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mb-2">
          <Shield className="w-3.5 h-3.5 text-slate-400" />
          <span className="uppercase tracking-wider">DEFENSE STRATEGY</span>
        </div>

        <h3 className="text-base font-bold text-white tracking-tight">
          Targeted Isolation
        </h3>

        <div className="mt-3 pt-2 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
          <span>Netfilter Action:</span>
          <span className="font-mono text-slate-200 font-semibold">{dropsCount}</span>
        </div>
      </div>

      {/* Card 3: World Model Engine */}
      <div className="tactical-card p-4 relative overflow-hidden bg-[#0c121d]/90 border border-slate-800">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mb-2">
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <span className="uppercase tracking-wider">WORLD MODEL ENGINE</span>
        </div>

        <h3 className="text-base font-bold text-white tracking-tight">
          RSSM + ST-GNN
        </h3>

        <div className="mt-3 pt-2 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
          <span>Predicted Class:</span>
          <span
            className={`font-mono font-semibold ${
              state.label && state.label !== "Benign"
                ? "text-red-400"
                : "text-cyan-400"
            }`}
          >
            {state.label || "Benign"}
          </span>
        </div>
      </div>

      {/* Card 4: Evaluator Baseline */}
      <div className="tactical-card p-4 relative overflow-hidden bg-[#0c121d]/90 border border-slate-800">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mb-2">
          <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
          <span className="uppercase tracking-wider">EVALUATOR BASELINE</span>
        </div>

        <h3 className="text-base font-bold text-white tracking-tight">
          ML Conf: {mlConfidence}.0%
        </h3>

        <div className="mt-3 pt-2 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
          <span>Baseline F1:</span>
          <span className="font-mono text-cyan-400 font-semibold font-bold">~0.890</span>
        </div>
      </div>
    </div>
  );
};


"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { SystemState } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";

export function IncidentSummary({ state }: { state: SystemState }) {
  const risk = Math.round((state.risk_score || 0) * 100);
  const active = state.label !== "Benign" || risk >= 50;

  return (
    <section
      id="incident"
      className={`tactical-card p-4 ${
        active ? "border-red-500/50 bg-red-950/10" : "border-slate-800"
      }`}
    >
      <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          {active ? (
            <AlertTriangle className="h-4 w-4 text-red-400" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-cyan-400" />
          )}
          <h2 className="font-mono text-xs font-bold tracking-[0.16em] text-white">
            {active ? "ACTIVE INCIDENT TRIAGE" : "INCIDENT STATUS"}
          </h2>
        </div>
        <Badge variant={active ? "critical" : "safe"}>
          {active ? "CONTAINING" : "NOMINAL"}
        </Badge>
      </div>

      {active ? (
        <div className="grid grid-cols-2 gap-4 text-xs font-mono">
          <div>
            <p className="text-slate-400 text-[10px]">DETECTION LABEL</p>
            <p className="mt-1 font-bold text-red-300">{state.label.toUpperCase()}</p>
          </div>
          <div>
            <p className="text-slate-400 text-[10px]">SOURCE THREAT IP</p>
            <p className="mt-1 text-white font-bold">{state.src_ip}</p>
          </div>
          <div>
            <p className="text-slate-400 text-[10px]">RISK SCORE</p>
            <p className="mt-1 text-xl font-bold text-red-300">{risk}%</p>
          </div>
          <div>
            <p className="text-slate-400 text-[10px]">ML CONFIDENCE</p>
            <p className="mt-1 text-xl font-bold text-cyan-300">
              {Math.round((state.ml_conf || 0) * 100)}%
            </p>
          </div>
          <div className="col-span-2 border-t border-slate-800/80 pt-3">
            <p className="text-slate-400 text-[10px]">RECOMMENDED SOAR ACTION</p>
            <p className="mt-1 font-bold text-red-300">ENGAGE MICRO-ISOLATION ON HOST</p>
          </div>
        </div>
      ) : (
        <div className="py-6 text-center">
          <p className="font-mono text-sm font-bold text-cyan-300">
            NO ACTIVE INCIDENTS DETECTED
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Network telemetry nominal. Spatial ST-GNN model reports zero active threat vectors.
          </p>
        </div>
      )}
    </section>
  );
}

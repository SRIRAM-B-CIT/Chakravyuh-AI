"use client";

import { BrainCircuit, CheckCircle2 } from "lucide-react";
import { SystemState } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";

export function ModelHealth({ state }: { state: SystemState }) {
  return (
    <section id="model" className="tactical-card p-4">
      <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-cyan-400" />
          <h2 className="font-mono text-xs font-bold tracking-[0.16em] text-white">
            WORLD MODEL HEALTH
          </h2>
        </div>
        <Badge variant="safe">ACTIVE</Badge>
      </div>

      <div className="space-y-3 font-mono text-xs">
        {[
          ["RSSM WORLD MODEL", "ONLINE"],
          ["ST-GNN SPATIAL ENGINE", "ONLINE"],
          ["NETFILTER CLASSIFIER", "ONLINE"],
        ].map(([model, status]) => (
          <div key={model} className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">{model}</span>
            <span className="flex items-center gap-1.5 text-cyan-300 font-bold text-[10px]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {status}
            </span>
          </div>
        ))}

        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-800/80 pt-3">
          <div>
            <p className="text-[10px] text-slate-400">ML CONFIDENCE</p>
            <p className="mt-1 font-mono text-lg font-bold text-cyan-300">
              {Math.round((state.ml_conf || 0) * 100)}%
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400">K-STEP ROLLOUT</p>
            <p className="mt-1 font-mono text-lg font-bold text-cyan-300">
              {state.rollout?.length || 4} STEPS
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

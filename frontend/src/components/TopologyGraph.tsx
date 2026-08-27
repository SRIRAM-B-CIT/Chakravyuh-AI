"use client";

import React, { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { Globe, X, ShieldAlert, Cpu, Crosshair, ShieldCheck, Zap } from "lucide-react";
import { SystemState, TopologyNode } from "@/lib/types";

// Dynamic import for react-force-graph-2d (disabling SSR for HTML5 Canvas)
const ForceTopology2D = dynamic(
  () => import("./ForceTopology2D").then((mod) => mod.ForceTopology2D),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[360px] bg-[var(--card-surface)] border border-[var(--border-muted)] rounded-xl flex items-center justify-center font-mono text-xs text-blue-500 dark:text-cyan-400">
        <Zap className="h-4 w-4 animate-spin mr-2" />
        INITIALIZING SPATIAL GRAPH ENGINE...
      </div>
    ),
  }
);

interface TopologyGraphProps {
  topology: SystemState["topology"];
  state?: SystemState;
}

export function TopologyGraph({ topology, state }: TopologyGraphProps) {
  const [selectedNode, setSelectedNode] = useState<TopologyNode | null>(null);
  const [isDark, setIsDark] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 620, height: 350 });

  useEffect(() => {
    const detect = () => setIsDark(document.documentElement.classList.contains("dark"));
    detect();
    const observer = new MutationObserver(detect);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth } = containerRef.current;
        setDimensions({
          width: clientWidth || 620,
          height: 350,
        });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const nodes = topology?.nodes || [];
  const isThreatActive = state?.label !== "Benign" || (state?.risk_score || 0) >= 0.5;
  const isIsolated = Boolean(state?.isolated);

  return (
    <div className="tactical-card relative flex flex-col overflow-hidden p-3.5 rounded-xl shadow-sm h-full">
      {/* Topology Header */}
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-muted)] pb-2.5">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-blue-500" />
          <div>
            <h2 className="font-mono text-xs font-bold tracking-wider text-[var(--foreground)] uppercase">
              ST-GNN Dynamic Spatial Topology
            </h2>
            <p className="text-[10px] text-[var(--muted-text)] font-mono">
              react-force-graph-2d · {nodes.length || 4} Nodes · {topology?.stats?.active_flows || 148} Active Flows
            </p>
          </div>
        </div>

        {/* Tactical Legend Strip */}
        <div className="flex items-center gap-1.5 font-mono text-[9px] font-bold">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-500">
            ● SAFE
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-500">
            ● DEFENSE
          </span>
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded border transition ${
            isIsolated
              ? "bg-red-950/80 border-red-500 text-red-300"
              : isThreatActive
              ? "bg-red-500/20 border-red-500/60 text-red-400 animate-pulse"
              : "bg-slate-800 border-slate-700 text-slate-400"
          }`}>
            {isIsolated ? "🛑 QUARANTINED" : isThreatActive ? "⚡ ACTIVE THREAT" : "● EXTERNAL"}
          </span>
        </div>
      </div>

      {/* Force Graph Canvas Container */}
      <div ref={containerRef} className="relative flex-1 w-full min-h-[350px]">
        <ForceTopology2D
          state={state}
          onSelectNode={(node) => setSelectedNode(node)}
          selectedNodeId={selectedNode?.id || null}
          width={dimensions.width}
          height={dimensions.height}
          isDark={isDark}
        />

        {/* Interactive Inspection Tooltip Overlay */}
        <div className="absolute bottom-2.5 left-2.5 pointer-events-none flex items-center gap-1.5 rounded border border-[var(--border-muted)] bg-[var(--elevated-card)]/90 px-2 py-1 font-mono text-[9px] text-[var(--muted-text)] shadow-sm backdrop-blur">
          <Crosshair className="h-3 w-3 text-blue-500 dark:text-cyan-400" />
          <span>CLICK / DRAG NODES TO INSPECT & INTERACT</span>
        </div>

        {isIsolated && (
          <div className="absolute bottom-2.5 right-2.5 pointer-events-none flex items-center gap-1.5 rounded border border-red-500/60 bg-red-950/90 px-2.5 py-1 font-mono text-[9px] font-bold text-red-300 shadow-md">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>SOAR QUARANTINE ACTIVE · NETFILTER DROP</span>
          </div>
        )}
      </div>

      {/* Selected Node Details Drawer */}
      {selectedNode && (
        <aside
          className="absolute right-4 top-14 z-20 w-64 rounded-xl border border-[var(--border-muted)] bg-[var(--card-surface)] p-3.5 shadow-2xl animate-in fade-in slide-in-from-right-4 duration-200"
          onMouseLeave={() => setSelectedNode(null)}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-blue-500" />
              <div>
                <p className="font-mono text-[8px] font-bold tracking-widest text-[var(--muted-text)] uppercase">
                  NODE TELEMETRY
                </p>
                <h3 className="text-xs font-bold text-[var(--foreground)] font-mono">
                  {selectedNode.label}
                </h3>
              </div>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              aria-label="Close node details"
              className="text-[var(--muted-text)] hover:text-[var(--foreground)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <dl className="mt-3 space-y-2 font-mono text-[10px]">
            <div className="flex justify-between border-b border-[var(--border-muted)] pb-1">
              <dt className="text-[var(--muted-text)]">IP ADDRESS</dt>
              <dd className="text-[var(--foreground)] font-bold">{selectedNode.ip}</dd>
            </div>
            <div className="flex justify-between border-b border-[var(--border-muted)] pb-1">
              <dt className="text-[var(--muted-text)]">ROLE</dt>
              <dd className="text-[var(--secondary-text)]">{selectedNode.role}</dd>
            </div>
            <div className="flex justify-between border-b border-[var(--border-muted)] pb-1">
              <dt className="text-[var(--muted-text)]">STATUS</dt>
              <dd className={`font-bold ${
                selectedNode.status === "ISOLATED" || isIsolated
                  ? "text-red-400"
                  : selectedNode.status === "ATTACKER"
                  ? "text-amber-400"
                  : "text-emerald-400"
              }`}>
                {selectedNode.status || (isIsolated ? "ISOLATED" : "SAFE")}
              </dd>
            </div>
            <div className="flex justify-between border-b border-[var(--border-muted)] pb-1">
              <dt className="text-[var(--muted-text)]">RISK SCORE</dt>
              <dd className="text-xs text-[var(--foreground)] font-bold">
                {Math.round((selectedNode.risk_score || (isThreatActive ? 0.96 : 0.05)) * 100)}%
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--muted-text)]">CONTAINMENT</dt>
              <dd className="text-xs font-bold text-cyan-400">
                {isIsolated ? "QUARANTINED" : "STANDBY"}
              </dd>
            </div>
          </dl>
        </aside>
      )}
    </div>
  );
}

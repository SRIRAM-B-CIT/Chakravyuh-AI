"use client";

import React, { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Globe,
  Maximize2,
  Minimize2,
  RotateCcw,
  Crosshair,
  Zap,
  Activity,
  Radio,
  Layers,
  Box,
} from "lucide-react";
import { SystemState, TopologyNode } from "@/lib/types";

// Dynamic import for react-force-graph-2d
const ForceTopology2D = dynamic(
  () => import("./ForceTopology2D").then((mod) => mod.ForceTopology2D),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[400px] bg-[var(--surface)] border border-[var(--border)] rounded-xl flex items-center justify-center font-mono text-xs text-[var(--violet)]">
        <Zap className="h-4 w-4 animate-spin mr-2" />
        INITIALIZING SPATIAL TOPOLOGY ENGINE...
      </div>
    ),
  }
);

interface TopologyGraphProps {
  topology?: SystemState["topology"];
  state?: SystemState;
}

export function TopologyGraph({ state }: TopologyGraphProps) {
  const [selectedNode, setSelectedNode] = useState<TopologyNode | null>(null);
  const [activeTab, setActiveTab] = useState<"Graph" | "Heatmap" | "3D View">("Graph");
  const [isDark, setIsDark] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 700, height: 420 });

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
        setDimensions({
          width: containerRef.current.clientWidth || 700,
          height: 420,
        });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const isThreatActive =
    (state?.label && state.label !== "Benign") || (state?.risk_score || 0) >= 0.5;
  const isIsolated = Boolean(state?.isolated);

  return (
    <div className="card relative flex flex-col overflow-hidden p-4 h-full">
      {/* Header Strip */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-[var(--violet)]" />
            <h2 className="font-head text-[13px] font-extrabold tracking-wider text-[var(--text-primary)] uppercase">
              DYNAMIC SPATIAL TOPOLOGY
            </h2>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
            Real-time Attack Graph · 4 Nodes · 131 Active Flows
          </p>
        </div>

        {/* Graph / Heatmap / 3D View Switcher */}
        <div className="flex items-center gap-1 rounded-lg bg-[var(--surface-2)] p-1 border border-[var(--border)]">
          {(["Graph", "Heatmap", "3D View"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded-md text-[11px] font-mono font-bold transition ${
                activeTab === tab
                  ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Legend Ribbon */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3 font-mono text-[10px] text-[var(--text-secondary)]">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#6D28D9]" />
            Safe (violet)
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#D97706]" />
            Suspicious (amber)
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#F43F5E]" />
            Compromised (coral)
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[var(--text-muted)]" />
            External
          </span>
        </div>

        {isIsolated ? (
          <span className="badge badge-coral">🛑 SOAR CONTAINMENT ACTIVE</span>
        ) : isThreatActive ? (
          <span className="badge badge-coral animate-pulse">⚡ THREAT ESCALATION DETECTED</span>
        ) : (
          <span className="badge badge-mint">🟢 TELEMETRY NOMINAL</span>
        )}
      </div>

      {/* Main Force Graph Canvas Container */}
      <div
        ref={containerRef}
        className="relative flex-1 w-full min-h-[400px] rounded-xl overflow-hidden border border-[var(--border)]"
      >
        <ForceTopology2D
          state={state}
          onSelectNode={(node) => setSelectedNode(node)}
          selectedNodeId={selectedNode?.id || null}
          width={dimensions.width}
          height={dimensions.height}
          isDark={isDark}
        />

        {/* Bottom Interactive Toolbar */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 p-1 rounded-lg bg-[var(--surface)]/90 border border-[var(--border)] shadow-sm backdrop-blur">
          <button
            title="Inspect"
            className="p-1.5 rounded hover:bg-[var(--surface-2)] text-[var(--text-secondary)] transition"
          >
            <Crosshair className="h-3.5 w-3.5" />
          </button>
          <button
            title="Fit to screen"
            className="p-1.5 rounded hover:bg-[var(--surface-2)] text-[var(--text-secondary)] transition"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <button
            title="Center Graph"
            className="p-1.5 rounded hover:bg-[var(--surface-2)] text-[var(--text-secondary)] transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Live Feed Indicator */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--surface)]/95 border border-[var(--border)] shadow-sm backdrop-blur font-mono text-[10px] font-bold text-[var(--text-primary)]">
          <span className="h-2 w-2 rounded-full bg-[var(--coral)] animate-ping" />
          <span>● LIVE FEED</span>
        </div>
      </div>

      {/* Selected Node Details Modal/Drawer */}
      {selectedNode && (
        <div
          className="absolute right-6 top-20 z-20 w-64 card p-3.5 shadow-2xl animate-slide-up"
          onMouseLeave={() => setSelectedNode(null)}
        >
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
            <span className="font-head text-xs font-bold text-[var(--text-primary)]">
              {selectedNode.label}
            </span>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] font-mono"
            >
              ✕
            </button>
          </div>
          <div className="space-y-1.5 mt-2 font-mono text-[11px]">
            <div className="flex justify-between text-[var(--text-secondary)]">
              <span>IP Address:</span>
              <span className="font-bold text-[var(--text-primary)]">{selectedNode.ip}</span>
            </div>
            <div className="flex justify-between text-[var(--text-secondary)]">
              <span>Status:</span>
              <span className="font-bold text-[var(--violet)]">{selectedNode.status}</span>
            </div>
            <div className="flex justify-between text-[var(--text-secondary)]">
              <span>Risk Score:</span>
              <span className="font-bold text-[var(--coral)]">{selectedNode.risk_score}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

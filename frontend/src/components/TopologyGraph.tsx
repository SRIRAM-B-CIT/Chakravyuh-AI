"use client";

import { useMemo, useState } from "react";
import { Crosshair, Globe, X, ShieldAlert, Cpu } from "lucide-react";
import { SystemState, TopologyNode } from "@/lib/types";

interface TopologyGraphProps {
  topology: SystemState["topology"];
  state?: SystemState;
}

const coordinates = [
  { x: 12, y: 42 },
  { x: 38, y: 20 },
  { x: 44, y: 64 },
  { x: 86, y: 42 },
];

const fallbackEdges = [
  { id: "fallback-gateway-defense", sourceIndex: 0, targetIndex: 1, threat: false },
  { id: "fallback-gateway-server", sourceIndex: 0, targetIndex: 2, threat: false },
  { id: "fallback-defense-server", sourceIndex: 1, targetIndex: 2, threat: false },
  { id: "fallback-defense-source", sourceIndex: 1, targetIndex: 3, threat: false },
  { id: "fallback-server-source", sourceIndex: 2, targetIndex: 3, threat: false },
];

function nodeColor(node: TopologyNode, isThreat: boolean) {
  if (node.is_defense || node.label.toLowerCase() === "defense")
    return { stroke: "#38BDF8", fill: "#38BDF8" };
  if (node.label.toLowerCase() === "gateway")
    return { stroke: "#10B981", fill: "#10B981" };
  if (isThreat)
    return { stroke: "#EF4444", fill: "#EF4444" };
  if (node.label.toLowerCase() === "server")
    return { stroke: "#10B981", fill: "#10B981" };
  return { stroke: "#10B981", fill: "#10B981" };
}

function isNodeThreat(node: TopologyNode, state?: SystemState) {
  const isConfirmedSource =
    state?.guardrail_action === "ATTACK_CONFIRMED" &&
    state.attack_attribution?.verified === true &&
    state.attack_attribution.source_ip === node.ip;

  return Boolean(
    node.status === "ATTACKER" ||
    node.status === "ISOLATED" ||
    node.is_isolated ||
    node.risk_score >= 0.7 ||
    isConfirmedSource
  );
}

function nodeDisplayLabel(node: TopologyNode, isThreat: boolean) {
  if (node.label.toLowerCase() === "attacker" && !isThreat) return "SOURCE";
  return node.label.toUpperCase();
}

export function TopologyGraph({ topology, state }: TopologyGraphProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const nodes = topology?.nodes || [];
  const positions = useMemo(
    () =>
      nodes.map((node, index) => ({
        node,
        ...(coordinates[index] || { x: 20 + (index % 4) * 20, y: 50 }),
      })),
    [nodes]
  );
  const selected = nodes.find((node) => node.id === selectedId);
  const hasActiveThreat = Boolean(
    state &&
    state.risk_score >= 0.7 &&
    state.label !== "Benign" &&
    state.label !== "Legitimate Flash Crowd / High Concurrency"
  );
  const graphEdges = topology?.edges?.length
    ? topology.edges
    : fallbackEdges.map((edge) => ({
        id: edge.id,
        source: nodes[edge.sourceIndex]?.id || "",
        target: nodes[edge.targetIndex]?.id || "",
        threat: edge.threat,
      }));
  const isThreatEdge = (edge: (typeof graphEdges)[number]) =>
    hasActiveThreat && edge.threat === true;
  const threatEdges = graphEdges.filter(isThreatEdge);
  const positionFor = (id: string) =>
    positions.find(({ node }) => node.id === id);

  return (
    <div className="tactical-card relative flex flex-col overflow-hidden p-4 rounded-xl shadow-sm h-full">
      {/* Topology Header */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-muted)] pb-3">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-blue-500" />
          <div>
            <h2 className="font-mono text-xs font-bold tracking-wider text-[var(--foreground)] uppercase">
              ST-GNN SPATIAL GRAPH TOPOLOGY
            </h2>
            <p className="text-[10px] text-[var(--muted-text)] font-mono">
              Live Graph · {nodes.length} Nodes · {topology?.stats?.active_flows || 0} Active Flows
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-[9px] font-bold">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-500">
            ● SAFE
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-500">
            ● DEFENSE
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/10 border border-red-500/30 text-red-500">
            ● THREAT
          </span>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div
        className="relative min-h-[340px] flex-1 overflow-hidden rounded-xl border border-[var(--border-muted)] bg-[var(--secondary-bg)] shadow-inner flex flex-col"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(56, 189, 248, 0.12) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      >
        <svg
          viewBox="0 0 100 80"
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="xMidYMid meet"
          aria-label="Interactive network topology graph"
        >
          <defs>
            <marker
              id="threatArrow"
              markerWidth="3.5"
              markerHeight="3.5"
              refX="3.5"
              refY="1.75"
              orient="auto"
            >
              <path d="M0,0 L3.5,1.75 L0,3.5" fill="none" stroke="#EF4444" strokeWidth="0.8" />
            </marker>
          </defs>

          {/* Graph Edges */}
          {graphEdges.map((edge) => {
            const source = positionFor(edge.source);
            const target = positionFor(edge.target);
            if (!source || !target) return null;
            const threat = isThreatEdge(edge);
            const controlY = source.y < target.y ? Math.min(source.y, target.y) - 18 : Math.max(source.y, target.y) + 18;
            return threat ? (
              <path
                key={edge.id}
                d={`M ${source.x} ${source.y} Q ${(source.x + target.x) / 2} ${controlY} ${target.x} ${target.y}`}
                fill="none"
                stroke="#EF4444"
                strokeWidth="0.75"
                strokeDasharray="2 1"
                className="threat-edge-animated"
                markerEnd="url(#threatArrow)"
              />
            ) : (
              <line
                key={edge.id}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke="#10B981"
                strokeWidth="0.5"
                strokeOpacity="0.85"
              />
            );
          })}

          {/* Graph Nodes */}
          {positions.map(({ node, x, y }) => {
            const isThreatNode = isNodeThreat(node, state);
            const colors = nodeColor(node, isThreatNode);
            const active = selectedId === node.id;
            const displayLabel = nodeDisplayLabel(node, isThreatNode);

            return (
              <g
                key={node.id}
                transform={`translate(${x} ${y})`}
                onClick={() => setSelectedId(node.id)}
                onMouseEnter={() => setSelectedId(node.id)}
                className="cursor-pointer outline-none transition-transform"
                tabIndex={0}
                role="button"
                aria-label={`Inspect ${displayLabel.toLowerCase()} ${node.ip}`}
              >
                <circle r={active ? 3.8 : 2.6} fill={colors.fill} opacity="0.15" />
                <circle
                  r={active ? 2.2 : 1.5}
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth="0.8"
                />
                {isThreatNode && (
                  <circle
                    r="3.0"
                    fill="none"
                    stroke={colors.stroke}
                    strokeWidth="0.6"
                    className="animate-ping"
                  />
                )}
                <text
                  y="5.5"
                  textAnchor="middle"
                  fill="currentColor"
                  className="text-[var(--foreground)]"
                  fontSize="1.9"
                  fontFamily="sans-serif"
                  fontWeight="bold"
                >
                  {displayLabel}
                </text>
                <text
                  y="8"
                  textAnchor="middle"
                  fill="currentColor"
                  className="text-[var(--secondary-text)]"
                  fontSize="1.3"
                  fontFamily="sans-serif"
                >
                  {node.ip}
                </text>
                <text
                  y="10.5"
                  textAnchor="middle"
                  fill={colors.stroke}
                  fontSize="1.4"
                  fontFamily="sans-serif"
                  fontWeight="bold"
                >
                  RISK {Math.round(node.risk_score * 100)}%
                </text>
              </g>
            );
          })}
        </svg>

        {/* Bottom Legend and Status */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded border border-[var(--border-muted)] bg-[var(--card-surface)]/95 px-2 py-1 font-mono text-[9px] text-[var(--secondary-text)] shadow-sm">
          <Crosshair className="h-3 w-3 text-blue-500" />
          <span>INSPECT NODE</span>
        </div>

        {threatEdges.length > 0 && (
          <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 font-mono text-[10px] font-bold text-red-500 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded">
            Threat Flow ({topology?.stats?.active_flows || 0} pkts/s)
          </div>
        )}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 font-mono text-[9px] text-[var(--muted-text)]">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live
        </div>
      </div>

      {/* Selected Node Details Drawer */}
      {selected && (
        <aside
          className="absolute right-4 top-14 z-20 w-60 rounded-xl border border-[var(--border-muted)] bg-[var(--card-surface)] p-3.5 shadow-xl animate-in fade-in slide-in-from-right-4 duration-200"
          onMouseLeave={() => setSelectedId(null)}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-blue-500" />
              <div>
                <p className="font-mono text-[8px] font-bold tracking-widest text-[var(--muted-text)] uppercase">
                  NODE TELEMETRY
                </p>
                <h3 className="text-xs font-bold text-[var(--foreground)] font-mono">
                  {nodeDisplayLabel(selected, isNodeThreat(selected, state))}
                </h3>
              </div>
            </div>
            <button
              onClick={() => setSelectedId(null)}
              aria-label="Close node details"
              className="text-[var(--muted-text)] hover:text-[var(--foreground)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <dl className="mt-3 space-y-2 font-mono text-[10px]">
            <div className="flex justify-between border-b border-[var(--border-muted)] pb-1">
              <dt className="text-[var(--muted-text)]">IP ADDRESS</dt>
              <dd className="text-[var(--foreground)] font-bold">{selected.ip}</dd>
            </div>
            <div className="flex justify-between border-b border-[var(--border-muted)] pb-1">
              <dt className="text-[var(--muted-text)]">ROLE</dt>
              <dd className="text-[var(--secondary-text)]">{selected.role}</dd>
            </div>
            <div className="flex justify-between border-b border-[var(--border-muted)] pb-1">
              <dt className="text-[var(--muted-text)]">STATUS</dt>
              <dd style={{ color: nodeColor(selected, isNodeThreat(selected, state)).stroke }} className="font-bold">
                {selected.status}
              </dd>
            </div>
            <div className="flex justify-between border-b border-[var(--border-muted)] pb-1">
              <dt className="text-[var(--muted-text)]">RISK SCORE</dt>
              <dd className="text-xs text-[var(--foreground)] font-bold">
                {Math.round(selected.risk_score * 100)}%
              </dd>
            </div>
          </dl>
        </aside>
      )}
    </div>
  );
}

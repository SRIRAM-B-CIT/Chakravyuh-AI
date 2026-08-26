"use client";

import { useMemo, useState } from "react";
import { Crosshair, Globe, X, ShieldAlert, Cpu } from "lucide-react";
import { SystemState, TopologyNode } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";

interface TopologyGraphProps {
  topology: SystemState["topology"];
  state?: SystemState;
}

const coordinates = [
  { x: 18, y: 48 },
  { x: 40, y: 32 },
  { x: 45, y: 72 },
  { x: 78, y: 50 },
];

function nodeColor(node: TopologyNode) {
  if (node.is_defense || node.label.toLowerCase() === "defense")
    return { stroke: "#2563EB", fill: "#2563EB" };
  if (node.label.toLowerCase() === "gateway")
    return { stroke: "#10B981", fill: "#10B981" };
  if (node.label.toLowerCase() === "attacker")
    return { stroke: "#EF4444", fill: "#EF4444" };
  if (node.label.toLowerCase() === "server")
    return { stroke: "#10B981", fill: "#10B981" };
  return { stroke: "#52677F", fill: "#7A8CA0" };
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
  const threatEdges = topology?.edges?.filter((edge) => edge.threat) || [];
  const positionFor = (id: string) =>
    positions.find(({ node }) => node.id === id);

  return (
    <div className="tactical-card relative flex flex-col overflow-hidden p-6 bg-white border border-[#D9E3EF] rounded-xl shadow-sm">
      {/* Topology Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#D9E3EF] pb-4">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-[#2563EB]" />
          <div>
            <h2 className="font-sans text-xs font-extrabold tracking-wider text-[#0F2747]">
              ST-GNN SPATIAL GRAPH TOPOLOGY
            </h2>
            <p className="mt-0.5 text-[10px] text-[#7A8CA0] font-sans font-medium">
              Live Graph · 4 Nodes · 148 Active Flows
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-sans text-[9px] font-bold">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-250 text-[#10B981]">
            ● SAFE
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 border border-blue-250 text-[#2563EB]">
            ● DEFENSE
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-50 border border-red-250 text-[#EF4444]">
            ● THREAT
          </span>
        </div>
      </div>

      {/* Grid: Topology View (Col 8) & Threats/Events Side Panel (Col 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div
          className="relative min-h-[360px] lg:col-span-8 overflow-hidden rounded-xl border border-[#D9E3EF] bg-[#F4F7FB] shadow-inner flex flex-col"
          style={{
            backgroundImage:
              "linear-gradient(rgba(37, 99, 235, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(37, 99, 235, 0.05) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
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
                id="arrow"
                markerWidth="3.5"
                markerHeight="3.5"
                refX="3.5"
                refY="1.75"
                orient="auto"
              >
                <path d="M0,0 L3.5,1.75 L0,3.5" fill="none" stroke="#2563EB" strokeWidth="0.8" />
              </marker>
            </defs>

            {/* Graph Edges */}
            {topology?.edges?.map((edge) => {
              const source = positionFor(edge.source);
              const target = positionFor(edge.target);
              if (!source || !target) return null;
              const threat = Boolean(
                edge.threat || (edge.weight && edge.weight > 50)
              );
              return (
                <line
                  key={edge.id}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={threat ? "#EF4444" : "#2563EB"}
                  strokeWidth={threat ? 0.75 : 0.35}
                  strokeDasharray={threat ? "2 1" : undefined}
                  className={threat ? "threat-edge-animated" : ""}
                  markerEnd="url(#arrow)"
                />
              );
            })}

            {/* Graph Nodes */}
            {positions.map(({ node, x, y }) => {
              const colors = nodeColor(node);
              const active = selectedId === node.id;
              const isThreatNode =
                node.status === "ATTACKER" ||
                node.status === "ISOLATED" ||
                node.risk_score >= 0.7 ||
                node.label.toLowerCase() === "attacker";

              return (
                <g
                  key={node.id}
                  transform={`translate(${x} ${y})`}
                  onClick={() => setSelectedId(node.id)}
                  onMouseEnter={() => setSelectedId(node.id)}
                  className="cursor-pointer outline-none transition-transform"
                  tabIndex={0}
                  role="button"
                  aria-label={`Inspect ${node.label} ${node.ip}`}
                >
                  <circle r={active ? 3.5 : 2.5} fill={colors.fill} opacity="0.12" />
                  <circle
                    r={active ? 2.0 : 1.4}
                    fill={colors.fill}
                    stroke={colors.stroke}
                    strokeWidth="0.8"
                  />
                  {isThreatNode && (
                    <circle
                      r="2.8"
                      fill="none"
                      stroke={colors.stroke}
                      strokeWidth="0.5"
                      className="animate-ping"
                    />
                  )}
                  <text
                    y="5.5"
                    textAnchor="middle"
                    fill="#0F2747"
                    fontSize="1.8"
                    fontFamily="sans-serif"
                    fontWeight="bold"
                  >
                    {node.label.toUpperCase()}
                  </text>
                  <text
                    y="8"
                    textAnchor="middle"
                    fill="#52677F"
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

          <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded border border-[#D9E3EF] bg-white/95 px-2.5 py-1 font-sans text-[9px] text-[#52677F] shadow-sm">
            <Crosshair className="h-3 w-3 text-[#2563EB]" />
            <span>HOVER / CLICK NODE TO INSPECT</span>
          </div>

          {threatEdges.length > 0 && (
            <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded border border-[#EF4444]/50 bg-red-50/95 px-2.5 py-1 font-sans text-[9px] text-[#EF4444] shadow-sm">
              <ShieldAlert className="h-3.5 w-3.5 text-[#EF4444]" />
              <span>{threatEdges.length} THREAT VECTOR ACTIVE</span>
            </div>
          )}
        </div>

        {/* Right Info Column (Col 4) */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
          {/* Top Threats Widget */}
          <div className="border border-[#D9E3EF] bg-[#F8FAFD] rounded-xl p-4 flex-1">
            <h3 className="font-sans text-[10px] font-extrabold tracking-wider text-[#7A8CA0] mb-3 uppercase">
              TOP THREATS
            </h3>
            <div className="space-y-2">
              {[
                ["Brute Force Login", "HIGH", "bg-red-50 border-red-200 text-[#EF4444]"],
                ["C2 Communication", "HIGH", "bg-red-50 border-red-200 text-[#EF4444]"],
                ["Port Scan Detected", "MEDIUM", "bg-amber-50 border-amber-200 text-[#F59E0B]"],
                ["Unusual Data Exfil", "MEDIUM", "bg-amber-50 border-amber-200 text-[#F59E0B]"],
                ["Policy Violation", "LOW", "bg-emerald-50 border-emerald-250 text-[#10B981]"],
              ].map(([threat, severity, badgeStyle]) => (
                <div key={threat} className="flex items-center justify-between text-xs py-1 border-b border-[#D9E3EF]/50 last:border-b-0">
                  <span className="font-sans font-semibold text-[#0F2747]">{threat}</span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold border ${badgeStyle}`}>
                    {severity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Events Widget */}
          <div className="border border-[#D9E3EF] bg-[#F8FAFD] rounded-xl p-4 flex-1">
            <h3 className="font-sans text-[10px] font-extrabold tracking-wider text-[#7A8CA0] mb-3 uppercase">
              RECENT EVENTS
            </h3>
            <div className="space-y-2">
              {[
                "Firewall rule updated",
                "New connection blocked",
                "Model inference completed",
                "Threat feed updated",
                "System posture nominal",
              ].map((event, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs py-1 border-b border-[#D9E3EF]/50 last:border-b-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                  <span className="font-sans text-[#52677F] truncate">{event}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Node Details Drawer */}
      {selected && (
        <aside
          className="absolute right-4 top-14 z-20 w-64 rounded-xl border border-[#D9E3EF] bg-white p-4 shadow-xl animate-in fade-in slide-in-from-right-4 duration-200"
          onMouseLeave={() => setSelectedId(null)}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-[#2563EB]" />
              <div>
                <p className="font-sans text-[9px] font-bold tracking-widest text-[#7A8CA0] uppercase">
                  NODE TELEMETRY
                </p>
                <h3 className="text-sm font-bold text-[#0F2747] font-sans">
                  {selected.label}
                </h3>
              </div>
            </div>
            <button
              onClick={() => setSelectedId(null)}
              aria-label="Close node details"
              className="text-[#7A8CA0] hover:text-[#0F2747]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <dl className="mt-4 space-y-3 font-sans text-[10px]">
            <div className="flex justify-between border-b border-[#D9E3EF] pb-1.5">
              <dt className="text-[#7A8CA0]">IP ADDRESS</dt>
              <dd className="text-[#0F2747] font-bold">{selected.ip}</dd>
            </div>
            <div className="flex justify-between border-b border-[#D9E3EF] pb-1.5">
              <dt className="text-[#7A8CA0]">ROLE</dt>
              <dd className="text-[#52677F]">{selected.role}</dd>
            </div>
            <div className="flex justify-between border-b border-[#D9E3EF] pb-1.5">
              <dt className="text-[#7A8CA0]">STATUS</dt>
              <dd style={{ color: nodeColor(selected).stroke }} className="font-bold">
                {selected.status}
              </dd>
            </div>
            <div className="flex justify-between border-b border-[#D9E3EF] pb-1.5">
              <dt className="text-[#7A8CA0]">RISK SCORE</dt>
              <dd className="text-sm text-[#0F2747] font-bold">
                {Math.round(selected.risk_score * 100)}%
              </dd>
            </div>
          </dl>
        </aside>
      )}
    </div>
  );
}

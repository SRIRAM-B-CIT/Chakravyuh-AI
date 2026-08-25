"use client";

import React, { useState } from "react";
import { Globe } from "lucide-react";
import { TopologyData } from "@/lib/types";

interface TopologyGraphProps {
  topology: TopologyData;
  state?: any;
}

export const TopologyGraph: React.FC<TopologyGraphProps> = ({ topology, state }) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const rawNodes = topology?.nodes || [];
  
  const gatewayNode = rawNodes.find((n) => n.role === "Gateway" || n.ip.endsWith(".1")) || {
    id: "192.168.29.1",
    ip: "192.168.29.1",
    label: "Gateway",
    role: "Gateway Router",
    risk_score: 0.02,
    status: "SAFE" as const,
  };

  const defenseNode = rawNodes.find((n) => n.is_defense || n.ip.endsWith(".104")) || {
    id: "192.168.29.104",
    ip: "192.168.29.104",
    label: "Defense",
    role: "Defense Controller",
    risk_score: 0.05,
    status: "SAFE" as const,
  };

  const serverNode = rawNodes.find((n) => n.role.includes("Core") || n.role.includes("Server") || n.ip.endsWith(".42")) || {
    id: "192.168.29.42",
    ip: "192.168.29.42",
    label: "Server",
    role: "Internal Core Server",
    risk_score: 0.12,
    status: "SAFE" as const,
  };

  const currentRisk = state?.risk_score ?? 0.05;
  const isStateAttack = currentRisk >= 0.40 || (state?.label && state.label !== "Benign");

  const attackerNode = rawNodes.find((n) => n.status === "ATTACKER" || n.status === "ISOLATED" || n.risk_score > 0.4 || n.ip.endsWith(".124")) || {
    id: "192.168.29.124",
    ip: state?.src_ip || "192.168.29.124",
    label: "Attacker",
    role: "Threat Host",
    risk_score: isStateAttack ? currentRisk : 0.05,
    status: isStateAttack ? "ATTACKER" : "SAFE",
  };

  const isAttacking = isStateAttack || attackerNode.risk_score >= 0.40 || attackerNode.status === "ATTACKER";
  const isIsolated = state?.isolated || attackerNode.status === "ISOLATED";

  const dynamicThreatScore = isAttacking ? Math.max(currentRisk, attackerNode.risk_score) : 0.05;

  // Coordinates in a viewBox 0 0 800 320
  const nodePositions = {
    gateway: { x: 120, y: 160 },
    defense: { x: 300, y: 100 },
    server: { x: 360, y: 240 },
    attacker: { x: 640, y: 160 },
  };

  return (
    <div className="tactical-card p-3.5 flex flex-col h-full relative overflow-hidden bg-[#0c121e]/95 border border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-400 animate-pulse" />
          <h2 className="text-xs font-bold text-white tracking-wide uppercase font-mono">
            ST-GNN Dynamic Network Topology
          </h2>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Safe Route
          </span>
          <span className="flex items-center gap-1 text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block animate-pulse" /> Threat Flow
          </span>
        </div>
      </div>

      {/* SVG Canvas Container with Guaranteed Explicit Pixel Height */}
      <div 
        className="w-full rounded-lg overflow-hidden border border-slate-800/80 bg-[#060a12] relative flex items-center justify-center"
        style={{ minHeight: "280px", height: "280px" }}
      >
        {/* Subtle grid background */}
        <div 
          className="absolute inset-0 opacity-25 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#1e2c47 1px, transparent 1px)",
            backgroundSize: "20px 20px"
          }}
        />

        <svg
          width="100%"
          height="280"
          viewBox="0 0 800 320"
          style={{ width: "100%", height: "280px", display: "block" }}
          className="select-none"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Glow Filters */}
            <filter id="greenGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="cyanGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="redGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Gradient for Curved Threat Path */}
            <linearGradient id="threatPathGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#f43f5e" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="1" />
            </linearGradient>

            {/* Marker for Threat Arrow */}
            <marker
              id="threatArrow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#ef4444" />
            </marker>
          </defs>

          {/* Normal Safe Topology Network Edges */}
          {/* Edge: Gateway -> Defense */}
          <line
            x1={nodePositions.gateway.x}
            y1={nodePositions.gateway.y}
            x2={nodePositions.defense.x}
            y2={nodePositions.defense.y}
            stroke="#22d3ee"
            strokeWidth="2"
            strokeOpacity="0.6"
          />

          {/* Edge: Gateway -> Server */}
          <line
            x1={nodePositions.gateway.x}
            y1={nodePositions.gateway.y}
            x2={nodePositions.server.x}
            y2={nodePositions.server.y}
            stroke="#10b981"
            strokeWidth="2"
            strokeOpacity="0.5"
          />

          {/* Edge: Defense -> Server */}
          <line
            x1={nodePositions.defense.x}
            y1={nodePositions.defense.y}
            x2={nodePositions.server.x}
            y2={nodePositions.server.y}
            stroke="#38bdf8"
            strokeWidth="2"
            strokeOpacity="0.6"
          />

          {/* Curved Lower Connection: Server -> Attacker */}
          <path
            d={`M ${nodePositions.server.x} ${nodePositions.server.y} Q 480 240 ${nodePositions.attacker.x} ${nodePositions.attacker.y}`}
            fill="none"
            stroke={isAttacking ? "#ef4444" : "#1e2c47"}
            strokeWidth={isAttacking ? "2" : "1.5"}
            strokeOpacity={isAttacking ? "0.6" : "0.3"}
            strokeDasharray={isAttacking ? "4,4" : "none"}
            className={isAttacking ? "threat-edge-animated" : ""}
          />

          {/* Curved Upper Infiltration Arc: Defense -> Attacker */}
          <path
            id="threatFlowArc"
            d={`M ${nodePositions.defense.x} ${nodePositions.defense.y} Q 460 60 ${nodePositions.attacker.x} ${nodePositions.attacker.y}`}
            fill="none"
            stroke={isAttacking ? "url(#threatPathGrad)" : "#1e2c47"}
            strokeWidth={isAttacking ? "2.5" : "1.5"}
            strokeDasharray={isAttacking ? "6,4" : "none"}
            className={isAttacking ? "threat-edge-animated" : ""}
            markerEnd={isAttacking ? "url(#threatArrow)" : ""}
          />

          {/* Flow Particles along Curved Threat Arc */}
          {isAttacking && (
            <>
              <circle r="3" fill="#fca5a5" filter="url(#redGlow)">
                <animateMotion
                  path={`M ${nodePositions.defense.x} ${nodePositions.defense.y} Q 460 60 ${nodePositions.attacker.x} ${nodePositions.attacker.y}`}
                  dur="1.6s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle r="2.5" fill="#ef4444">
                <animateMotion
                  path={`M ${nodePositions.defense.x} ${nodePositions.defense.y} Q 460 60 ${nodePositions.attacker.x} ${nodePositions.attacker.y}`}
                  dur="1.6s"
                  begin="0.8s"
                  repeatCount="indefinite"
                />
              </circle>
            </>
          )}

          {/* Threat Flow Text Callout */}
          {isAttacking && (
            <g transform="translate(440, 85)">
              <text
                x="0"
                y="0"
                fill="#f87171"
                fontSize="11"
                fontFamily="monospace"
                fontWeight="bold"
                textAnchor="middle"
              >
                Threat Flow (148 pkts/s)
              </text>
              <line x1="0" y1="4" x2="0" y2="16" stroke="#ef4444" strokeWidth="1" strokeDasharray="2,2" strokeOpacity="0.7" />
            </g>
          )}

          {/* ======================= NODE 1: GATEWAY ======================= */}
          <g
            transform={`translate(${nodePositions.gateway.x}, ${nodePositions.gateway.y})`}
            className="cursor-pointer"
            onMouseEnter={() => setHoveredNode("gateway")}
            onMouseLeave={() => setHoveredNode(null)}
          >
            <circle r="22" fill="#10b981" fillOpacity="0.15" />
            <circle r="15" fill="none" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.8" />
            <circle r="8" fill="#10b981" filter="url(#greenGlow)" />
            <circle r="4" fill="#a7f3d0" />

            <text y="36" textAnchor="middle" fill="#f1f5f9" fontSize="11" fontWeight="bold" fontFamily="monospace">
              Gateway
            </text>
            <text y="50" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">
              {gatewayNode.ip}
            </text>
            <text y="62" textAnchor="middle" fill="#10b981" fontSize="9" fontWeight="bold" fontFamily="monospace">
              Risk: {Math.round(gatewayNode.risk_score * 100)}%
            </text>
          </g>

          {/* ======================= NODE 2: DEFENSE ======================= */}
          <g
            transform={`translate(${nodePositions.defense.x}, ${nodePositions.defense.y})`}
            className="cursor-pointer"
            onMouseEnter={() => setHoveredNode("defense")}
            onMouseLeave={() => setHoveredNode(null)}
          >
            <circle r="28" fill="#00f0ff" fillOpacity="0.12" />
            <circle r="19" fill="none" stroke="#00f0ff" strokeWidth="1.5" strokeOpacity="0.8">
              <animate attributeName="r" values="18;23;18" dur="3s" repeatCount="indefinite" />
              <animate attributeName="stroke-opacity" values="0.8;0.3;0.8" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle r="10" fill="#00f0ff" filter="url(#cyanGlow)" />
            <circle r="5" fill="#e0f2fe" />

            <text y="40" textAnchor="middle" fill="#f1f5f9" fontSize="11" fontWeight="bold" fontFamily="monospace">
              Defense
            </text>
            <text y="54" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">
              {defenseNode.ip}
            </text>
            <text y="66" textAnchor="middle" fill="#00f0ff" fontSize="9" fontWeight="bold" fontFamily="monospace">
              Risk: {Math.round(defenseNode.risk_score * 100)}%
            </text>
          </g>

          {/* ======================= NODE 3: SERVER ======================= */}
          <g
            transform={`translate(${nodePositions.server.x}, ${nodePositions.server.y})`}
            className="cursor-pointer"
            onMouseEnter={() => setHoveredNode("server")}
            onMouseLeave={() => setHoveredNode(null)}
          >
            <circle r="22" fill="#10b981" fillOpacity="0.15" />
            <circle r="15" fill="none" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.8" />
            <circle r="8" fill="#10b981" filter="url(#greenGlow)" />
            <circle r="4" fill="#a7f3d0" />

            <text y="36" textAnchor="middle" fill="#f1f5f9" fontSize="11" fontWeight="bold" fontFamily="monospace">
              Server
            </text>
            <text y="50" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">
              {serverNode.ip}
            </text>
            <text y="62" textAnchor="middle" fill="#10b981" fontSize="9" fontWeight="bold" fontFamily="monospace">
              Risk: {Math.round(serverNode.risk_score * 100)}%
            </text>
          </g>

          {/* ======================= NODE 4: ATTACKER ======================= */}
          <g
            transform={`translate(${nodePositions.attacker.x}, ${nodePositions.attacker.y})`}
            className="cursor-pointer"
            onMouseEnter={() => setHoveredNode("attacker")}
            onMouseLeave={() => setHoveredNode(null)}
          >
            <circle r="36" fill="#ef4444" fillOpacity={isAttacking ? "0.10" : "0.03"}>
              {isAttacking && (
                <animate attributeName="r" values="28;42;28" dur="2s" repeatCount="indefinite" />
              )}
            </circle>
            <circle r="26" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeOpacity="0.6">
              {isAttacking && (
                <animate attributeName="r" values="22;32;22" dur="2s" repeatCount="indefinite" />
              )}
            </circle>
            <circle r="18" fill="none" stroke="#ef4444" strokeWidth="2" strokeOpacity="0.9">
              {isAttacking && (
                <animate attributeName="stroke-opacity" values="0.9;0.4;0.9" dur="1.2s" repeatCount="indefinite" />
              )}
            </circle>

            <circle r="11" fill={isAttacking ? "#ef4444" : "#64748b"} filter={isAttacking ? "url(#redGlow)" : ""} />
            <circle r="5" fill={isAttacking ? "#ffe4e6" : "#cbd5e1"} />

            <text y="42" textAnchor="middle" fill="#f1f5f9" fontSize="11" fontWeight="bold" fontFamily="monospace">
              {isIsolated ? "Isolated Host" : isAttacking ? "Attacker" : "External Host"}
            </text>
            <text y="56" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">
              {attackerNode.ip}
            </text>
            <text y="68" textAnchor="middle" fill={isAttacking ? "#ef4444" : "#10b981"} fontSize="9" fontWeight="bold" fontFamily="monospace">
              Risk: {Math.round(dynamicThreatScore * 100)}%
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
};



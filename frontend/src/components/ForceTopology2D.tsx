"use client";

import React, { useRef, useEffect, useCallback, useMemo } from "react";
import ForceGraph2D, { ForceGraphMethods } from "react-force-graph-2d";
import { SystemState, TopologyNode } from "@/lib/types";

interface ForceTopology2DProps {
  state?: SystemState;
  onSelectNode: (node: TopologyNode | null) => void;
  selectedNodeId: string | null;
  width?: number;
  height?: number;
}

// 4 Canonical nodes with balanced, stable tactical layout positions
const CANONICAL_NODES = [
  {
    id: "node-server",
    fx: 0,
    fy: -75,
    label: "Server",
    role: "Internal Core Server",
    ip: "192.168.29.42",
    risk_score: 0.12,
    status: "SAFE",
    packet_count: 18,
    byte_rate: "850 KB/s",
    is_defense: false,
    is_isolated: false,
  },
  {
    id: "node-defense",
    fx: -85,
    fy: 35,
    label: "Defense",
    role: "Defense Controller",
    ip: "10.42.0.1",
    risk_score: 0.05,
    status: "SAFE",
    packet_count: 148,
    byte_rate: "3.8 MB/s",
    is_defense: true,
    is_isolated: false,
  },
  {
    id: "node-gateway",
    fx: 85,
    fy: -10,
    label: "Gateway",
    role: "Gateway Router",
    ip: "10.42.0.1",
    risk_score: 0.02,
    status: "SAFE",
    packet_count: 24,
    byte_rate: "1.2 MB/s",
    is_defense: false,
    is_isolated: false,
  },
  {
    id: "node-attacker",
    fx: 45,
    fy: 75,
    label: "Attacker",
    role: "External Node",
    ip: "10.42.0.181",
    risk_score: 0.05,
    status: "SAFE",
    packet_count: 88,
    byte_rate: "340 KB/s",
    is_defense: false,
    is_isolated: false,
  },
];

const CANONICAL_LINKS = [
  { source: "node-gateway", target: "node-defense", threat: false, traffic: "Safe Path", protocol: "TCP/HTTPS" },
  { source: "node-defense", target: "node-server", threat: false, traffic: "Safe Path", protocol: "gRPC/TLS" },
  { source: "node-gateway", target: "node-server", threat: false, traffic: "Internal Route", protocol: "TCP/TLS" },
  { source: "node-attacker", target: "node-defense", threat: false, traffic: "External Flow", protocol: "TCP/SYN" },
  { source: "node-attacker", target: "node-server", threat: false, traffic: "External Flow", protocol: "TCP/SYN" },
];

export const ForceTopology2D: React.FC<ForceTopology2DProps> = ({
  state,
  onSelectNode,
  selectedNodeId,
  width = 640,
  height = 360,
}) => {
  const fgRef = useRef<ForceGraphMethods>();
  const isCenteredRef = useRef(false);

  // Persistent graph data state that mutates properties in-place without re-creating nodes
  const graphData = useMemo(() => {
    return {
      nodes: CANONICAL_NODES.map((n) => ({ ...n })),
      links: CANONICAL_LINKS.map((l) => ({ ...l })),
    };
  }, []);

  const currentLabel = state?.label || "Benign";
  const isAttack = currentLabel !== "Benign" || (state?.risk_score || 0) >= 0.5;
  const isIsolated = Boolean(state?.isolated);
  const attackerIp = state?.src_ip || "10.42.0.181";

  // In-place update of node data without triggering physics reset or jitter
  useEffect(() => {
    if (!graphData.nodes) return;

    const rawNodes = state?.topology?.nodes || [];
    const serverNode = rawNodes.find((n) => n.label.toLowerCase() === "server");
    const defenseNode = rawNodes.find((n) => n.label.toLowerCase() === "defense" || n.is_defense);
    const gatewayNode = rawNodes.find((n) => n.label.toLowerCase() === "gateway");
    const attackerNode = rawNodes.find((n) => n.label.toLowerCase() === "attacker" || n.status === "ATTACKER" || n.status === "ISOLATED");

    graphData.nodes.forEach((node) => {
      if (node.id === "node-server") {
        if (serverNode) {
          node.ip = serverNode.ip || node.ip;
          node.risk_score = serverNode.risk_score;
        }
      } else if (node.id === "node-defense") {
        if (defenseNode) {
          node.ip = defenseNode.ip || node.ip;
          node.risk_score = defenseNode.risk_score;
        }
      } else if (node.id === "node-gateway") {
        if (gatewayNode) {
          node.ip = gatewayNode.ip || node.ip;
          node.risk_score = gatewayNode.risk_score;
        }
      } else if (node.id === "node-attacker") {
        node.ip = attackerIp;
        node.risk_score = isAttack ? (state?.risk_score || 0.96) : 0.05;
        node.status = isIsolated ? "ISOLATED" : (isAttack ? "ATTACKER" : "SAFE");
        node.role = isAttack ? "Threat Host" : "External Node";
        node.is_isolated = isIsolated;
      }
    });

    graphData.links.forEach((link: any) => {
      const srcId = typeof link.source === "object" ? link.source.id : link.source;
      const tgtId = typeof link.target === "object" ? link.target.id : link.target;
      if (srcId === "node-attacker" || tgtId === "node-attacker") {
        link.threat = isAttack;
        link.traffic = isAttack ? "Threat Surge" : "External Flow";
      }
    });
  }, [state, isAttack, isIsolated, attackerIp, graphData]);

  // Dynamic particle visual configurations for each attack vector
  const attackConfig = useMemo(() => {
    switch (currentLabel) {
      case "DoS/Flood":
        return {
          particleSpeed: 0.04,
          particleWidth: 4.5,
          particleColor: "#EF4444", // Crimson Laser
          particleCount: 16,
          beamColor: "rgba(239, 68, 68, 0.9)",
          modeLabel: "⚡ DOS / HIGH-VELOCITY PLASMA FLOOD",
        };
      case "Recon/PortScan":
        return {
          particleSpeed: 0.028,
          particleWidth: 3.5,
          particleColor: "#F59E0B", // Amber Radar
          particleCount: 12,
          beamColor: "rgba(245, 158, 11, 0.85)",
          modeLabel: "📡 SYN PORT RECONNAISSANCE SWEEP",
        };
      case "Recon/BruteForce":
        return {
          particleSpeed: 0.032,
          particleWidth: 4.0,
          particleColor: "#F97316", // Orange Spark
          particleCount: 14,
          beamColor: "rgba(249, 115, 22, 0.85)",
          modeLabel: "🔑 AUTH CREDENTIAL BRUTE-FORCE BURST",
        };
      case "Infiltration":
        return {
          particleSpeed: 0.018,
          particleWidth: 5.0,
          particleColor: "#A855F7", // Toxic Purple Droplet
          particleCount: 8,
          beamColor: "rgba(168, 85, 247, 0.85)",
          modeLabel: "☣️ RCE INFILTRATION & PAYLOAD DROP",
        };
      case "Botnet/LateralMovement":
        return {
          particleSpeed: 0.022,
          particleWidth: 4.0,
          particleColor: "#10B981", // Biohazard Green
          particleCount: 10,
          beamColor: "rgba(16, 185, 129, 0.85)",
          modeLabel: "🕸️ BOTNET C2 & LATERAL SPREAD",
        };
      default:
        return {
          particleSpeed: 0.007,
          particleWidth: 2.5,
          particleColor: "#38BDF8", // Cyan Data Stream
          particleCount: 4,
          beamColor: "rgba(56, 189, 248, 0.35)",
          modeLabel: "🟢 NOMINAL SAFE HARMONIC STREAM",
        };
    }
  }, [currentLabel]);

  // Center view once on initial mount only
  useEffect(() => {
    if (fgRef.current && !isCenteredRef.current) {
      setTimeout(() => {
        fgRef.current?.zoomToFit(350, 40);
        isCenteredRef.current = true;
      }, 250);
    }
  }, []);

  // Custom Node Canvas Renderer
  const nodeCanvasObject = useCallback(
    (node: any, ctx: CanvasRenderingContext2D) => {
      const isSelected = node.id === selectedNodeId;
      const isAttacker = node.id === "node-attacker" || node.label.toLowerCase() === "attacker";
      const isDefense = node.id === "node-defense" || node.is_defense;
      const isGateway = node.id === "node-gateway";
      const isServer = node.id === "node-server";
      const nodeIsolated = isAttacker && isIsolated;

      const r = isAttacker ? (isAttack ? 9 : 7.5) : isDefense ? 8.5 : 7.5;

      ctx.save();

      // 1. Glowing outer halo
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + 4, 0, 2 * Math.PI, false);
      if (nodeIsolated) {
        ctx.fillStyle = "rgba(239, 68, 68, 0.25)";
      } else if (isAttacker && isAttack) {
        ctx.fillStyle = "rgba(239, 68, 68, 0.35)";
      } else if (isDefense) {
        ctx.fillStyle = "rgba(56, 189, 248, 0.25)";
      } else if (isGateway || isServer) {
        ctx.fillStyle = "rgba(16, 185, 129, 0.2)";
      } else {
        ctx.fillStyle = "rgba(100, 116, 139, 0.2)";
      }
      ctx.fill();

      // 2. Micro-Isolation Hexagonal Shield Barrier
      if (nodeIsolated) {
        ctx.strokeStyle = "#EF4444";
        ctx.lineWidth = 1.8;
        ctx.setLineDash([3, 2]);
        ctx.beginPath();
        const hexR = r + 9;
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i;
          const hx = node.x + hexR * Math.cos(angle);
          const hy = node.y + hexR * Math.sin(angle);
          if (i === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 3. Main Node Circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
      if (nodeIsolated) {
        ctx.fillStyle = "#991B1B";
        ctx.strokeStyle = "#EF4444";
      } else if (isAttacker && isAttack) {
        ctx.fillStyle = "#DC2626";
        ctx.strokeStyle = "#FCA5A5";
      } else if (isDefense) {
        ctx.fillStyle = "#0284C7";
        ctx.strokeStyle = "#38BDF8";
      } else if (isGateway || isServer) {
        ctx.fillStyle = "#059669";
        ctx.strokeStyle = "#34D399";
      } else {
        ctx.fillStyle = "#475569";
        ctx.strokeStyle = "#94A3B8";
      }
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.fill();
      ctx.stroke();

      // 4. Node Typography & Badges
      const fontSize = 3.4;
      ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Label
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(node.label.toUpperCase(), node.x, node.y - r - 4);

      // IP Address
      ctx.font = `${fontSize * 0.8}px "JetBrains Mono", monospace`;
      ctx.fillStyle = "#94A3B8";
      ctx.fillText(node.ip, node.x, node.y + r + 3.5);

      // Status indicator tag
      if (nodeIsolated) {
        ctx.font = `bold ${fontSize * 0.75}px "JetBrains Mono", monospace`;
        ctx.fillStyle = "#EF4444";
        ctx.fillText("🛑 MICRO-ISOLATED [DROP]", node.x, node.y + r + 7.5);
      } else if (isAttacker && isAttack) {
        ctx.font = `bold ${fontSize * 0.75}px "JetBrains Mono", monospace`;
        ctx.fillStyle = "#F87171";
        ctx.fillText(`⚡ ${currentLabel.toUpperCase()}`, node.x, node.y + r + 7.5);
      }

      ctx.restore();
    },
    [selectedNodeId, isAttack, isIsolated, currentLabel]
  );

  // Custom Edge Canvas Renderer
  const linkCanvasObject = useCallback(
    (link: any, ctx: CanvasRenderingContext2D) => {
      const isThreatLink = link.threat || isAttack;
      const start = link.source;
      const end = link.target;
      if (!start || !end || typeof start.x !== "number" || typeof end.x !== "number") return;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);

      if (isIsolated && isThreatLink) {
        // Broken link style
        ctx.strokeStyle = "rgba(239, 68, 68, 0.45)";
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();

        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        ctx.fillStyle = "#EF4444";
        ctx.font = "bold 3.8px monospace";
        ctx.fillText("✕ SEVERED", midX - 8, midY);
      } else if (isThreatLink) {
        // Active attack beam
        ctx.strokeStyle = attackConfig.beamColor;
        ctx.lineWidth = 2.2;
        ctx.stroke();
      } else {
        // Safe link
        ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
        ctx.lineWidth = 1.0;
        ctx.stroke();
      }

      ctx.restore();
    },
    [isAttack, isIsolated, attackConfig]
  );

  return (
    <div className="relative w-full h-full min-h-[350px] rounded-xl overflow-hidden bg-[#040814] border border-slate-800">
      {/* Top Banner Indicator */}
      <div className="absolute top-2.5 left-3 z-10 flex items-center gap-2 pointer-events-none">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold border shadow-sm ${
          isIsolated
            ? "bg-red-950/80 border-red-500/50 text-red-300"
            : isAttack
            ? "bg-amber-950/80 border-amber-500/50 text-amber-300 animate-pulse"
            : "bg-slate-900/80 border-cyan-500/40 text-cyan-300"
        }`}>
          <span className="h-2 w-2 rounded-full bg-current animate-ping" />
          {isIsolated ? "🛑 SOAR DEFENSE: HOST QUARANTINED (IPTABLES DROP)" : attackConfig.modeLabel}
        </span>
      </div>

      {/* ForceGraph2D Canvas */}
      <ForceGraph2D
        ref={fgRef}
        width={width}
        height={height}
        graphData={graphData}
        backgroundColor="#040814"
        nodeCanvasObject={nodeCanvasObject}
        linkCanvasObject={linkCanvasObject}
        linkDirectionalParticles={isIsolated ? 0 : (link) => (link.threat || isAttack ? attackConfig.particleCount : 3)}
        linkDirectionalParticleSpeed={isIsolated ? 0 : (link) => (link.threat || isAttack ? attackConfig.particleSpeed : 0.007)}
        linkDirectionalParticleWidth={isIsolated ? 0 : (link) => (link.threat || isAttack ? attackConfig.particleWidth : 2.4)}
        linkDirectionalParticleColor={(link) => (link.threat || isAttack ? attackConfig.particleColor : "#38BDF8")}
        onNodeClick={(node) => onSelectNode(node as unknown as TopologyNode)}
        nodePointerAreaPaint={(node, color, ctx) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x || 0, node.y || 0, 12, 0, 2 * Math.PI, false);
          ctx.fill();
        }}
        cooldownTicks={0}
        d3AlphaDecay={0.05}
        d3VelocityDecay={0.4}
        enableNodeDrag={true}
        enableZoomInteraction={true}
        enablePanInteraction={true}
      />
    </div>
  );
};

"use client";

import React, { useRef, useEffect, useMemo, useCallback } from "react";
import ForceGraph2D, { ForceGraphMethods } from "react-force-graph-2d";
import { SystemState, TopologyNode } from "@/lib/types";

interface ForceTopology2DProps {
  state?: SystemState;
  onSelectNode: (node: TopologyNode | null) => void;
  selectedNodeId: string | null;
  width?: number;
  height?: number;
}

export const ForceTopology2D: React.FC<ForceTopology2DProps> = ({
  state,
  onSelectNode,
  selectedNodeId,
  width = 640,
  height = 360,
}) => {
  const fgRef = useRef<ForceGraphMethods>();

  const currentLabel = state?.label || "Benign";
  const isAttack = currentLabel !== "Benign" || (state?.risk_score || 0) >= 0.5;
  const isIsolated = Boolean(state?.isolated);

  // Prepare nodes & links for react-force-graph
  const graphData = useMemo(() => {
    const rawNodes = state?.topology?.nodes || [];
    const rawEdges = state?.topology?.edges || [];

    const nodes = rawNodes.map((n) => ({
      id: n.id,
      ip: n.ip,
      label: n.label,
      role: n.role,
      risk_score: n.risk_score,
      status: n.status,
      packet_count: n.packet_count,
      byte_rate: n.byte_rate,
      is_defense: n.is_defense,
      is_isolated: n.is_isolated || (n.label.toLowerCase() === "attacker" && isIsolated),
    }));

    // If no nodes, provide fallback
    if (nodes.length === 0) {
      nodes.push(
        { id: "192.168.29.1", ip: "192.168.29.1", label: "Gateway", role: "Gateway Router", risk_score: 0.02, status: "SAFE", packet_count: 24, byte_rate: "1.2 MB/s", is_defense: false, is_isolated: false },
        { id: "192.168.29.104", ip: "192.168.29.104", label: "Defense", role: "Defense Controller", risk_score: 0.05, status: "SAFE", packet_count: 148, byte_rate: "3.8 MB/s", is_defense: true, is_isolated: false },
        { id: "192.168.29.42", ip: "192.168.29.42", label: "Server", role: "Internal Core Server", risk_score: 0.12, status: "SAFE", packet_count: 18, byte_rate: "850 KB/s", is_defense: false, is_isolated: false },
        { id: state?.src_ip || "10.42.0.181", ip: state?.src_ip || "10.42.0.181", label: "Attacker", role: "Threat Host", risk_score: isAttack ? 0.96 : 0.05, status: isIsolated ? "ISOLATED" : (isAttack ? "ATTACKER" : "SAFE"), packet_count: 88, byte_rate: "18.4 MB/s", is_defense: false, is_isolated: isIsolated }
      );
    }

    const links = rawEdges.length > 0 ? rawEdges.map((e) => ({
      source: e.source,
      target: e.target,
      threat: e.threat,
      traffic: e.traffic,
      protocol: e.protocol,
    })) : [
      { source: nodes[0]?.id, target: nodes[1]?.id, threat: false, traffic: "Safe Path", protocol: "TCP/HTTPS" },
      { source: nodes[1]?.id, target: nodes[2]?.id, threat: false, traffic: "Safe Path", protocol: "gRPC/TLS" },
      { source: nodes[0]?.id, target: nodes[2]?.id, threat: false, traffic: "Internal Route", protocol: "TCP/TLS" },
      { source: nodes[3]?.id, target: nodes[1]?.id, threat: isAttack, traffic: isAttack ? "Threat Flow" : "Safe Path", protocol: "TCP/SYN" },
      { source: nodes[3]?.id, target: nodes[2]?.id, threat: isAttack, traffic: isAttack ? "Lateral Probe" : "Internal Route", protocol: "TCP/SYN" },
    ];

    return { nodes, links };
  }, [state, isAttack, isIsolated]);

  // Dynamic particle settings depending on active MITRE attack vector
  const attackConfig = useMemo(() => {
    switch (currentLabel) {
      case "DoS/Flood":
        return {
          particleSpeed: 0.045,
          particleWidth: 4.5,
          particleColor: "#EF4444", // Crimson Laser
          particleCount: 16,
          beamColor: "rgba(239, 68, 68, 0.85)",
          modeLabel: "⚡ DOS / PLASMA SURGE FLOOD",
        };
      case "Recon/PortScan":
        return {
          particleSpeed: 0.03,
          particleWidth: 3.5,
          particleColor: "#F59E0B", // Amber Radar
          particleCount: 12,
          beamColor: "rgba(245, 158, 11, 0.85)",
          modeLabel: "📡 SYN PORT RECONNAISSANCE SWEEP",
        };
      case "Recon/BruteForce":
        return {
          particleSpeed: 0.035,
          particleWidth: 4.0,
          particleColor: "#F97316", // Orange Spark
          particleCount: 14,
          beamColor: "rgba(249, 115, 22, 0.85)",
          modeLabel: "🔑 AUTH CREDENTIAL BRUTE-FORCE BURST",
        };
      case "Infiltration":
        return {
          particleSpeed: 0.02,
          particleWidth: 5.0,
          particleColor: "#A855F7", // Toxic Purple Droplet
          particleCount: 8,
          beamColor: "rgba(168, 85, 247, 0.85)",
          modeLabel: "☣️ RCE INFILTRATION & PAYLOAD DROP",
        };
      case "Botnet/LateralMovement":
        return {
          particleSpeed: 0.025,
          particleWidth: 4.0,
          particleColor: "#10B981", // Bio-hazard Green
          particleCount: 10,
          beamColor: "rgba(16, 185, 129, 0.85)",
          modeLabel: "🕸️ BOTNET C2 & LATERAL SPREAD",
        };
      default:
        return {
          particleSpeed: 0.008,
          particleWidth: 2.5,
          particleColor: "#38BDF8", // Cyan Data Stream
          particleCount: 4,
          beamColor: "rgba(56, 189, 248, 0.4)",
          modeLabel: "🟢 NOMINAL SAFE HARMONIC STREAM",
        };
    }
  }, [currentLabel]);

  // Adjust force simulation on initial load
  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force("charge")?.strength(-260);
      fgRef.current.d3Force("link")?.distance(95);
      setTimeout(() => {
        fgRef.current?.zoomToFit(400, 30);
      }, 300);
    }
  }, [graphData]);

  // Custom Node Canvas Renderer
  const nodeCanvasObject = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const isSelected = node.id === selectedNodeId;
      const isAttacker = node.label.toLowerCase() === "attacker" || node.role.includes("Threat") || node.status === "ATTACKER" || node.status === "ISOLATED";
      const isDefense = node.is_defense || node.label.toLowerCase() === "defense";
      const isGateway = node.label.toLowerCase() === "gateway";
      const isServer = node.label.toLowerCase() === "server";
      const nodeIsolated = node.is_isolated || (isAttacker && isIsolated);

      const r = isAttacker ? (isAttack ? 9 : 7) : isDefense ? 8 : 7;

      // 1. Draw glowing outer halo
      ctx.save();
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

      // 2. Micro-Isolation Quarantine Barrier (Hexagonal Cyber Shield)
      if (nodeIsolated) {
        ctx.strokeStyle = "#EF4444";
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 2]);
        ctx.beginPath();
        const hexR = r + 10;
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i;
          const hx = node.x + hexR * Math.cos(angle);
          const hy = node.y + hexR * Math.sin(angle);
          if (i === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]); // Reset line dash
      }

      // 3. Draw Core Circle
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

      // 4. Draw Node Label & Status Tag
      const fontSize = 3.2;
      ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Role / Label
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(node.label.toUpperCase(), node.x, node.y - r - 3.5);

      // IP Address
      ctx.font = `${fontSize * 0.8}px "JetBrains Mono", monospace`;
      ctx.fillStyle = "#94A3B8";
      ctx.fillText(node.ip, node.x, node.y + r + 3.5);

      // Micro-Isolation Status Badge
      if (nodeIsolated) {
        ctx.font = `bold ${fontSize * 0.75}px "JetBrains Mono", monospace`;
        ctx.fillStyle = "#EF4444";
        ctx.fillText("🛑 MICRO-ISOLATED [DROP]", node.x, node.y + r + 7.5);
      } else if (isAttacker && isAttack) {
        ctx.font = `bold ${fontSize * 0.75}px "JetBrains Mono", monospace`;
        ctx.fillStyle = "#F87171";
        ctx.fillText(`⚡ THREAT: ${currentLabel.toUpperCase()}`, node.x, node.y + r + 7.5);
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
        // Severed link style
        ctx.strokeStyle = "rgba(239, 68, 68, 0.4)";
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();

        // Draw Severed X marker in the middle
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        ctx.fillStyle = "#EF4444";
        ctx.font = "bold 4px monospace";
        ctx.fillText("✕ SEVERED", midX - 8, midY);
      } else if (isThreatLink) {
        // Active attack beam
        ctx.strokeStyle = attackConfig.beamColor;
        ctx.lineWidth = 2.4;
        ctx.stroke();
      } else {
        // Safe nominal link
        ctx.strokeStyle = "rgba(56, 189, 248, 0.3)";
        ctx.lineWidth = 1.0;
        ctx.stroke();
      }

      ctx.restore();
    },
    [isAttack, isIsolated, attackConfig]
  );

  return (
    <div className="relative w-full h-full min-h-[340px] rounded-xl overflow-hidden bg-[#050B14] border border-slate-800">
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
        backgroundColor="#040812"
        nodeCanvasObject={nodeCanvasObject}
        linkCanvasObject={linkCanvasObject}
        linkDirectionalParticles={isIsolated ? 0 : (link) => (link.threat || isAttack ? attackConfig.particleCount : 3)}
        linkDirectionalParticleSpeed={isIsolated ? 0 : (link) => (link.threat || isAttack ? attackConfig.particleSpeed : 0.008)}
        linkDirectionalParticleWidth={isIsolated ? 0 : (link) => (link.threat || isAttack ? attackConfig.particleWidth : 2.5)}
        linkDirectionalParticleColor={(link) => (link.threat || isAttack ? attackConfig.particleColor : "#38BDF8")}
        onNodeClick={(node) => onSelectNode(node as unknown as TopologyNode)}
        nodePointerAreaPaint={(node, color, ctx) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x || 0, node.y || 0, 12, 0, 2 * Math.PI, false);
          ctx.fill();
        }}
        cooldownTicks={100}
        enableNodeDrag={true}
        enableZoomInteraction={true}
        enablePanInteraction={true}
      />
    </div>
  );
};

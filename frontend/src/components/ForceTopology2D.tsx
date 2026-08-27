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
  isDark?: boolean;
}

// 5 Canonical Nodes with Spatial Infrastructure Placement
// Center: Critical Asset, Top: Server, Left: Defense, Right: Gateway, Bottom: Attacker
const TOPOLOGY_NODES = [
  {
    id: "node-critical",
    fx: 0,
    fy: 10,
    label: "CRITICAL ASSET",
    role: "Core Financial Database & Vault",
    ip: "192.168.1.10",
    risk_score: 0.18,
    status: "SAFE",
    is_critical: true,
    is_defense: false,
    is_isolated: false,
    accent: "#F43F5E", // Coral / Pink
  },
  {
    id: "node-server",
    fx: 0,
    fy: -110,
    label: "SERVER",
    role: "Internal Enterprise Server",
    ip: "127.0.0.1",
    risk_score: 0.05,
    status: "SAFE",
    is_critical: false,
    is_defense: false,
    is_isolated: false,
    accent: "#6D28D9", // Deep Violet
  },
  {
    id: "node-defense",
    fx: -130,
    fy: 0,
    label: "DEFENSE",
    role: "Autonomous SOAR Controller",
    ip: "10.0.0.5",
    risk_score: 0.02,
    status: "SAFE",
    is_critical: false,
    is_defense: true,
    is_isolated: false,
    accent: "#D97706", // Amber / Orange
  },
  {
    id: "node-gateway",
    fx: 130,
    fy: 0,
    label: "GATEWAY",
    role: "Perimeter Router & Firewall",
    ip: "10.0.0.8",
    risk_score: 0.02,
    status: "SAFE",
    is_critical: false,
    is_defense: false,
    is_isolated: false,
    accent: "#059669", // Mint / Teal
  },
  {
    id: "node-attacker",
    fx: 0,
    fy: 120,
    label: "ATTACKER",
    role: "External Adversary Stream",
    ip: "172.16.0.3",
    risk_score: 0.95,
    status: "ATTACKER",
    is_critical: false,
    is_defense: false,
    is_isolated: false,
    accent: "#F43F5E", // Coral
  },
];

const TOPOLOGY_LINKS = [
  // Gateway -> Defense & Server
  { id: "e-gw-def",  source: "node-gateway",  target: "node-defense",  curvature: 0.2,  threat: false, color: "#6D28D9" },
  { id: "e-gw-srv",  source: "node-gateway",  target: "node-server",   curvature: -0.2, threat: false, color: "#059669" },
  // Defense -> Server & Critical Asset
  { id: "e-def-srv", source: "node-defense",  target: "node-server",   curvature: 0.2,  threat: false, color: "#D97706" },
  { id: "e-def-crit",source: "node-defense",  target: "node-critical", curvature: -0.15,threat: false, color: "#D97706" },
  // Server -> Critical Asset
  { id: "e-srv-crit",source: "node-server",   target: "node-critical", curvature: 0.0,  threat: false, color: "#6D28D9" },
  // Attacker -> Critical Asset (Target Path) & Defense (Intercept Path)
  { id: "e-att-crit",source: "node-attacker", target: "node-critical", curvature: 0.1,  threat: true,  color: "#F43F5E" },
  { id: "e-att-def", source: "node-attacker", target: "node-defense",  curvature: -0.25,threat: true,  color: "#F43F5E" },
];

export const ForceTopology2D: React.FC<ForceTopology2DProps> = ({
  state,
  onSelectNode,
  selectedNodeId,
  width = 680,
  height = 420,
  isDark = false,
}) => {
  const fgRef = useRef<ForceGraphMethods>();
  const isCenteredRef = useRef(false);

  // Surface & Line tokens
  const bg = isDark ? "#111827" : "#FFFFFF";
  const textColor = isDark ? "#F3F4F6" : "#141922";
  const textMuted = isDark ? "#9CA3AF" : "#8796A9";

  const graphData = useMemo(() => ({
    nodes: TOPOLOGY_NODES.map((n) => ({ ...n })),
    links: TOPOLOGY_LINKS.map((l) => ({ ...l })),
  }), []);

  const isAttack = (state?.label && state.label !== "Benign") || (state?.risk_score || 0) >= 0.5;
  const isIsolated = Boolean(state?.isolated);

  // Sync state into graph data
  useEffect(() => {
    graphData.nodes.forEach((node) => {
      if (node.id === "node-attacker") {
        node.ip = state?.src_ip || "172.16.0.3";
        node.status = isIsolated ? "ISOLATED" : isAttack ? "ATTACKER" : "SAFE";
        node.is_isolated = isIsolated;
      }
    });
  }, [state, isAttack, isIsolated, graphData]);

  // Initial Center Zoom
  useEffect(() => {
    if (fgRef.current && !isCenteredRef.current) {
      setTimeout(() => {
        fgRef.current?.zoomToFit(400, 35);
        isCenteredRef.current = true;
      }, 150);
    }
  }, []);

  // ── Custom Node Canvas Renderer ───────────────────────────
  const nodeCanvasObject = useCallback(
    (node: any, ctx: CanvasRenderingContext2D) => {
      const isSelected = node.id === selectedNodeId;
      const isCrit = node.is_critical;
      const isAttacker = node.id === "node-attacker";
      const isIso = isAttacker && isIsolated;
      const attacking = isAttacker && isAttack;

      const baseR = isCrit ? 16 : isAttacker ? 13 : 11;
      const t = Date.now() / 1000;
      ctx.save();

      // 1. Concentric Radial Wave Rings (Radar Effect on Critical Asset)
      if (isCrit) {
        for (let ring = 1; ring <= 4; ring++) {
          const ringProgress = (t * 0.4 + ring * 0.25) % 1.0;
          const currentRadius = baseR + ringProgress * 48;
          const alpha = (1 - ringProgress) * 0.28;

          ctx.beginPath();
          ctx.arc(node.x, node.y, currentRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(244, 63, 94, ${alpha})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }

      // 2. Pulse Glow around Active Nodes
      const glowR = baseR + (attacking ? 6 + Math.sin(t * 6) * 3 : 4);
      ctx.beginPath();
      ctx.arc(node.x, node.y, glowR, 0, Math.PI * 2);
      ctx.fillStyle = isIso
        ? "rgba(244, 63, 94, 0.2)"
        : attacking
        ? "rgba(244, 63, 94, 0.25)"
        : `${node.accent}18`;
      ctx.fill();

      // 3. Hexagonal Micro-Isolation Barrier
      if (isIso) {
        const hexR = baseR + 12;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 3) * i;
          const px = node.x + hexR * Math.cos(a);
          const py = node.y + hexR * Math.sin(a);
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.strokeStyle = "#F43F5E";
        ctx.lineWidth = 2.2;
        ctx.setLineDash([5, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 4. Main Concentric Circle Body
      // Outer border circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, baseR, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? "#1E293B" : "#FFFFFF";
      ctx.strokeStyle = node.accent;
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.fill();
      ctx.stroke();

      // Inner Core Accent Circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, baseR * 0.55, 0, Math.PI * 2);
      ctx.fillStyle = node.accent;
      ctx.fill();

      // 5. Typography: IP Label & Machine Name
      ctx.fillStyle = textColor;
      ctx.font = `bold 4.5px "IBM Plex Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(node.ip, node.x, node.y - baseR - 5);

      ctx.fillStyle = textMuted;
      ctx.font = `600 3.8px "Space Grotesk", sans-serif`;
      ctx.fillText(node.label, node.x, node.y + baseR + 5.5);

      // Status Indicator Pill for Critical or Attacker
      if (isCrit) {
        ctx.fillStyle = "#F43F5E";
        ctx.font = `bold 3.2px "Space Grotesk", sans-serif`;
        ctx.fillText("CORE TARGET", node.x, node.y + baseR + 9.5);
      } else if (isIso) {
        ctx.fillStyle = "#F43F5E";
        ctx.font = `bold 3.2px "IBM Plex Mono", monospace`;
        ctx.fillText("🛑 MICRO-ISOLATED", node.x, node.y + baseR + 9.5);
      } else if (attacking) {
        ctx.fillStyle = "#F43F5E";
        ctx.font = `bold 3.2px "Space Grotesk", sans-serif`;
        ctx.fillText("⚡ ATTACK STREAM", node.x, node.y + baseR + 9.5);
      }

      ctx.restore();
    },
    [selectedNodeId, isAttack, isIsolated, isDark, textColor, textMuted]
  );

  // ── Custom Link Canvas Renderer (Fluid Curved Stream & Particles) ─
  const linkCanvasObject = useCallback(
    (link: any, ctx: CanvasRenderingContext2D) => {
      const start = link.source;
      const end = link.target;
      if (!start || !end || typeof start.x !== "number" || typeof end.x !== "number") return;

      const isThreat = link.threat;
      const isSevered = isThreat && isIsolated;
      const linkColor = isThreat ? "#F43F5E" : link.color || "#6D28D9";

      ctx.save();

      // Draw Connection Line
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);

      if (isSevered) {
        ctx.strokeStyle = "rgba(244, 63, 94, 0.3)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        ctx.strokeStyle = isThreat ? "rgba(244, 63, 94, 0.55)" : `${linkColor}35`;
        ctx.lineWidth = isThreat ? 2.2 : 1.4;
        ctx.stroke();

        // Directional Data Particles (60 FPS Smooth Flow)
        const t = Date.now() / 1000;
        const particleCount = isThreat ? 6 : 3;
        const speed = isThreat ? 0.65 : 0.25;

        for (let i = 0; i < particleCount; i++) {
          const offset = ((t * speed + i / particleCount) % 1.0 + 1.0) % 1.0;
          const px = start.x + (end.x - start.x) * offset;
          const py = start.y + (end.y - start.y) * offset;

          // Main Particle
          ctx.beginPath();
          ctx.arc(px, py, isThreat ? 3.2 : 2.0, 0, Math.PI * 2);
          ctx.fillStyle = linkColor;
          ctx.shadowColor = linkColor;
          ctx.shadowBlur = isThreat ? 8 : 4;
          ctx.fill();
          ctx.shadowBlur = 0;

          // Trailing packet tail
          if (isThreat) {
            for (let tail = 1; tail <= 2; tail++) {
              const tailOffset = ((offset - tail * 0.02) % 1.0 + 1.0) % 1.0;
              const tx = start.x + (end.x - start.x) * tailOffset;
              const ty = start.y + (end.y - start.y) * tailOffset;
              ctx.beginPath();
              ctx.arc(tx, ty, 3.2 * (1 - tail * 0.35), 0, Math.PI * 2);
              ctx.fillStyle = `rgba(244, 63, 94, ${0.8 - tail * 0.35})`;
              ctx.fill();
            }
          }
        }
      }

      ctx.restore();
    },
    [isIsolated]
  );

  return (
    <div
      className="relative w-full h-full min-h-[400px] overflow-hidden"
      style={{ background: bg }}
    >
      <ForceGraph2D
        ref={fgRef}
        width={width}
        height={height}
        graphData={graphData}
        backgroundColor={bg}
        nodeCanvasObject={nodeCanvasObject}
        linkCanvasObject={linkCanvasObject}
        cooldownTicks={Infinity}
        d3AlphaDecay={0}
        d3VelocityDecay={1}
        onNodeClick={(node) => onSelectNode(node as unknown as TopologyNode)}
        enableNodeDrag={true}
        enableZoomInteraction={true}
        enablePanInteraction={true}
      />
    </div>
  );
};

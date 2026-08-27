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
    is_defense: false,
    is_isolated: false,
  },
  {
    id: "node-attacker",
    fx: 45,
    fy: 75,
    label: "Attacker",
    role: "External Node",
    ip: "127.0.0.1",
    risk_score: 0.05,
    status: "SAFE",
    is_defense: false,
    is_isolated: false,
  },
];

const CANONICAL_LINKS = [
  { id: "e-gw-def",  source: "node-gateway",  target: "node-defense", threat: false },
  { id: "e-def-srv", source: "node-defense",  target: "node-server",  threat: false },
  { id: "e-gw-srv",  source: "node-gateway",  target: "node-server",  threat: false },
  { id: "e-att-def", source: "node-attacker", target: "node-defense", threat: false },
  { id: "e-att-srv", source: "node-attacker", target: "node-server",  threat: false },
];

export const ForceTopology2D: React.FC<ForceTopology2DProps> = ({
  state,
  onSelectNode,
  selectedNodeId,
  width = 640,
  height = 360,
  isDark = false,
}) => {
  const fgRef = useRef<ForceGraphMethods>();
  const isCenteredRef = useRef(false);

  // Theme-aware colors
  const bg    = isDark ? "#070B14" : "#FFFFFF";
  const nodeText  = isDark ? "#F1F5F9" : "#0F2747";
  const nodeSubText = isDark ? "#94A3B8" : "#52677F";
  const safeLinkColor = isDark ? "rgba(56,189,248,0.35)" : "rgba(37,99,235,0.25)";
  const safeParticleColor = isDark ? "#38BDF8" : "#2563EB";
  const nodeSafe   = isDark ? "#1E3A5F" : "#DBEAFE";
  const nodeSafeBorder = isDark ? "#38BDF8" : "#2563EB";
  const nodeGreen  = isDark ? "#064E3B" : "#D1FAE5";
  const nodeGreenBorder = isDark ? "#34D399" : "#059669";

  // Persistent graph data
  const graphData = useMemo(() => ({
    nodes: CANONICAL_NODES.map((n) => ({ ...n })),
    links: CANONICAL_LINKS.map((l) => ({ ...l })),
  }), []);

  const currentLabel = state?.label || "Benign";
  const isAttack   = currentLabel !== "Benign" || (state?.risk_score || 0) >= 0.5;
  const isIsolated = Boolean(state?.isolated);
  const attackerIp = state?.src_ip || "127.0.0.1";

  // In-place node updates to avoid physics resets
  useEffect(() => {
    const rawNodes = state?.topology?.nodes || [];
    const findNode = (key: string) =>
      rawNodes.find((n) => n.label.toLowerCase() === key || n.is_defense === (key === "defense"));

    graphData.nodes.forEach((node) => {
      const raw = node.id === "node-server"  ? findNode("server")
                : node.id === "node-defense" ? findNode("defense")
                : node.id === "node-gateway" ? findNode("gateway")
                : null;
      if (raw && node.id !== "node-attacker") {
        node.ip = raw.ip || node.ip;
        node.risk_score = raw.risk_score;
      }
      if (node.id === "node-attacker") {
        node.ip = attackerIp;
        node.risk_score = isAttack ? (state?.risk_score || 0.96) : 0.05;
        node.status = isIsolated ? "ISOLATED" : isAttack ? "ATTACKER" : "SAFE";
        node.role = isAttack ? "Threat Host" : "External Node";
        node.is_isolated = isIsolated;
      }
    });
    graphData.links.forEach((link: any) => {
      const srcId = typeof link.source === "object" ? link.source.id : link.source;
      const tgtId = typeof link.target === "object" ? link.target.id : link.target;
      link.threat = (srcId === "node-attacker" || tgtId === "node-attacker") && isAttack;
    });
  }, [state, isAttack, isIsolated, attackerIp, graphData]);

  // Per-attack particle + color config
  const attackConfig = useMemo(() => {
    switch (currentLabel) {
      case "DoS/Flood":
        return { color: "#EF4444", beam: "rgba(239,68,68,0.85)", size: 4.5, speed: 0.9, label: "⚡ DOS / PLASMA FLOOD" };
      case "Recon/PortScan":
        return { color: "#F59E0B", beam: "rgba(245,158,11,0.8)",  size: 3.8, speed: 0.55, label: "📡 SYN PORT SCAN" };
      case "Recon/BruteForce":
        return { color: "#F97316", beam: "rgba(249,115,22,0.8)",  size: 4.0, speed: 0.65, label: "🔑 CREDENTIAL BRUTE-FORCE" };
      case "Infiltration":
        return { color: "#A855F7", beam: "rgba(168,85,247,0.85)", size: 5.0, speed: 0.45, label: "☣️ RCE INFILTRATION" };
      case "Bot/LateralMovement":
        return { color: "#10B981", beam: "rgba(16,185,129,0.85)", size: 4.2, speed: 0.5,  label: "🕸️ BOTNET C2 LATERAL" };
      default:
        return { color: safeParticleColor, beam: safeLinkColor, size: 2.8, speed: 0.3, label: "🟢 NOMINAL SAFE" };
    }
  }, [currentLabel, safeParticleColor, safeLinkColor]);

  // Center once on mount
  useEffect(() => {
    if (fgRef.current && !isCenteredRef.current) {
      setTimeout(() => {
        fgRef.current?.zoomToFit(300, 40);
        isCenteredRef.current = true;
      }, 200);
    }
  }, []);

  // ── Node renderer ──────────────────────────────────────────────
  const nodeCanvasObject = useCallback(
    (node: any, ctx: CanvasRenderingContext2D) => {
      const isSelected  = node.id === selectedNodeId;
      const isAttacker  = node.id === "node-attacker";
      const isDefNode   = node.id === "node-defense";
      const isoNode     = isAttacker && isIsolated;
      const attackingNow = isAttacker && isAttack;

      const r = isAttacker ? 9.5 : isDefNode ? 8.5 : 7.5;
      const t = Date.now() / 1000;
      ctx.save();

      // Outer glow ring (pulses during attack)
      const pulse = attackingNow ? 4 + Math.sin(t * 7) * 2.5 : 3;
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + pulse, 0, Math.PI * 2);
      ctx.fillStyle = isoNode       ? "rgba(239,68,68,0.25)"
                    : attackingNow  ? `${attackConfig.color}33`
                    : isDefNode     ? (isDark ? "rgba(56,189,248,0.2)" : "rgba(37,99,235,0.15)")
                    : "rgba(148,163,184,0.12)";
      ctx.fill();

      // Hexagonal isolation barrier
      if (isoNode) {
        const hexR = r + 11;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 3) * i;
          const px = node.x + hexR * Math.cos(a);
          const py = node.y + hexR * Math.sin(a);
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.strokeStyle = "#EF4444";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 2]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Main circle fill
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      if (isoNode) {
        ctx.fillStyle = isDark ? "#7F1D1D" : "#FEE2E2";
        ctx.strokeStyle = "#EF4444";
      } else if (attackingNow) {
        ctx.fillStyle = isDark ? "#7F1D1D" : "#FEE2E2";
        ctx.strokeStyle = "#EF4444";
      } else if (isDefNode) {
        ctx.fillStyle = nodeSafe; ctx.strokeStyle = nodeSafeBorder;
      } else {
        ctx.fillStyle = nodeGreen; ctx.strokeStyle = nodeGreenBorder;
      }
      ctx.lineWidth = isSelected ? 2.5 : 1.8;
      ctx.fill();
      ctx.stroke();

      // Label
      ctx.fillStyle = attackingNow || isoNode ? "#EF4444" : nodeText;
      ctx.font = `bold 3.4px "JetBrains Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(node.label.toUpperCase(), node.x, node.y - r - 4.5);

      // IP
      ctx.fillStyle = nodeSubText;
      ctx.font = `2.8px "JetBrains Mono", monospace`;
      ctx.fillText(node.ip, node.x, node.y + r + 3.5);

      // Status badge
      if (isoNode) {
        ctx.fillStyle = "#EF4444";
        ctx.font = `bold 2.6px "JetBrains Mono", monospace`;
        ctx.fillText("🛑 MICRO-ISOLATED [DROP]", node.x, node.y + r + 7.5);
      } else if (attackingNow) {
        ctx.fillStyle = "#EF4444";
        ctx.font = `bold 2.6px "JetBrains Mono", monospace`;
        ctx.fillText(`⚡ ${currentLabel.toUpperCase()}`, node.x, node.y + r + 7.5);
      }

      ctx.restore();
    },
    [selectedNodeId, isAttack, isIsolated, currentLabel, attackConfig,
     isDark, nodeText, nodeSubText, nodeSafe, nodeSafeBorder, nodeGreen, nodeGreenBorder]
  );

  // ── Link renderer (time-based 60fps fluid particles) ──────────
  const linkCanvasObject = useCallback(
    (link: any, ctx: CanvasRenderingContext2D) => {
      const start = link.source;
      const end   = link.target;
      if (!start || !end || typeof start.x !== "number" || typeof end.x !== "number") return;

      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist === 0) return;

      const isThreat = link.threat;
      ctx.save();

      if (isIsolated && isThreat) {
        // Severed link — dashed red
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.strokeStyle = "rgba(239,68,68,0.4)";
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        // ✕ badge
        ctx.fillStyle = "#EF4444";
        ctx.font = "bold 3.5px monospace";
        ctx.textAlign = "center";
        ctx.fillText("✕ SEVERED", (start.x + end.x) / 2, (start.y + end.y) / 2 - 1);
      } else {
        // Base link line
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.strokeStyle = isThreat ? attackConfig.beam : safeLinkColor;
        ctx.lineWidth = isThreat ? 2.0 : 0.9;
        ctx.stroke();

        // ── Continuous time-based comet particles ──
        // Works at 60fps because d3AlphaDecay=0 keeps simulation's rAF loop alive
        const t = Date.now() / 1000;
        const count = isThreat ? 8 : 3;
        const speed = isThreat ? attackConfig.speed : 0.18;
        const pSize = isThreat ? attackConfig.size  : 2.5;
        const pColor = isThreat ? attackConfig.color : safeParticleColor;

        for (let i = 0; i < count; i++) {
          const offset = ((t * speed + i / count) % 1.0 + 1.0) % 1.0;
          const px = start.x + dx * offset;
          const py = start.y + dy * offset;

          // Comet glow
          ctx.beginPath();
          ctx.arc(px, py, pSize, 0, Math.PI * 2);
          ctx.fillStyle = pColor;
          ctx.shadowColor = pColor;
          ctx.shadowBlur = isThreat ? 10 : 5;
          ctx.fill();
          ctx.shadowBlur = 0;

          // Comet tail (3 trailing dots)
          if (isThreat) {
            for (let t2 = 1; t2 <= 3; t2++) {
              const tailOffset = ((offset - (t2 * 0.015) + 1.0) % 1.0);
              const tx = start.x + dx * tailOffset;
              const ty = start.y + dy * tailOffset;
              ctx.beginPath();
              ctx.arc(tx, ty, pSize * (1 - t2 * 0.28), 0, Math.PI * 2);
              ctx.fillStyle = pColor + Math.floor(255 * (1 - t2 * 0.3)).toString(16).padStart(2, "0");
              ctx.fill();
            }
          }
        }
      }

      ctx.restore();
    },
    [isAttack, isIsolated, attackConfig, safeLinkColor, safeParticleColor]
  );

  return (
    <div
      className="relative w-full h-full min-h-[350px] rounded-xl overflow-hidden border"
      style={{
        background: bg,
        borderColor: isDark ? "rgba(30,41,59,0.8)" : "rgba(217,227,239,0.8)",
      }}
    >
      {/* Top banner */}
      <div className="absolute top-2.5 left-3 z-10 flex items-center gap-2 pointer-events-none">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold border shadow-sm ${
            isIsolated
              ? "bg-red-100 dark:bg-red-950/80 border-red-400/60 text-red-700 dark:text-red-300"
              : isAttack
              ? "bg-amber-100 dark:bg-amber-950/80 border-amber-400/60 text-amber-700 dark:text-amber-300 animate-pulse"
              : "bg-blue-50 dark:bg-slate-900/80 border-blue-200/60 dark:border-cyan-500/40 text-blue-700 dark:text-cyan-300"
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current animate-ping" />
          {isIsolated
            ? "🛑 SOAR: HOST QUARANTINED (IPTABLES DROP)"
            : attackConfig.label}
        </span>
      </div>

      {/* ForceGraph2D — d3AlphaDecay=0 keeps the rAF loop alive at 60fps */}
      <ForceGraph2D
        ref={fgRef}
        width={width}
        height={height}
        graphData={graphData}
        backgroundColor={bg}
        nodeCanvasObject={nodeCanvasObject}
        linkCanvasObject={linkCanvasObject}
        /* Keep physics warm → continuous render loop at 60fps */
        cooldownTicks={Infinity}
        d3AlphaDecay={0}
        d3VelocityDecay={1}
        onNodeClick={(node) => onSelectNode(node as unknown as TopologyNode)}
        nodePointerAreaPaint={(node, color, ctx) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x || 0, node.y || 0, 13, 0, 2 * Math.PI, false);
          ctx.fill();
        }}
        enableNodeDrag={true}
        enableZoomInteraction={true}
        enablePanInteraction={true}
      />
    </div>
  );
};

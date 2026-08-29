"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { TopHeader } from "@/components/layout/TopHeader";
import { MetricGrid } from "@/components/dashboard/MetricGrid";
import { IncidentSummary } from "@/components/dashboard/IncidentSummary";
import { ModelHealth } from "@/components/dashboard/ModelHealth";
import { StatusStrip } from "@/components/StatusStrip";
import { TopologyGraph } from "@/components/TopologyGraph";
import { HorizonChart } from "@/components/HorizonChart";
import { LiveLogs } from "@/components/LiveLogs";
import { CompactSoarBar } from "@/components/CompactSoarBar";
import { CommandMenu } from "@/components/ui/CommandMenu";

import { useSoarActions } from "@/hooks/useSoarActions";
import { useTelemetryStream } from "@/hooks/useTelemetryStream";
import { SystemState } from "@/lib/types";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
};

const initialState: SystemState = {
  src_ip: "192.168.29.124",
  label: "Benign",
  ml_conf: 0.98,
  risk_score: 0.05,
  isolated: false,
  rollout: [0.02, 0.03, 0.04, 0.05],
  rollout_series: {
    Gateway: [0.02],
    "Defense Host": [0.05],
    "Internal Server": [0.12],
    "Threat Host": [0.05],
  },
  topology: {
    nodes: [
      {
        id: "192.168.29.1",
        ip: "192.168.29.1",
        label: "Gateway",
        role: "Gateway Router",
        risk_score: 0.02,
        status: "SAFE",
        packet_count: 24,
        byte_rate: "1.2 MB/s",
        is_defense: false,
        is_isolated: false,
      },
      {
        id: "192.168.29.104",
        ip: "192.168.29.104",
        label: "Defense",
        role: "Defense Controller",
        risk_score: 0.05,
        status: "SAFE",
        packet_count: 148,
        byte_rate: "3.8 MB/s",
        is_defense: true,
        is_isolated: false,
      },
      {
        id: "192.168.29.42",
        ip: "192.168.29.42",
        label: "Server",
        role: "Internal Core Server",
        risk_score: 0.12,
        status: "SAFE",
        packet_count: 18,
        byte_rate: "850 KB/s",
        is_defense: false,
        is_isolated: false,
      },
      {
        id: "192.168.29.124",
        ip: "192.168.29.124",
        label: "Attacker",
        role: "External Node",
        risk_score: 0.05,
        status: "SAFE",
        packet_count: 28,
        byte_rate: "210 KB/s",
        is_defense: false,
        is_isolated: false,
      },
    ],
    edges: [],
    stats: {
      total_nodes: 4,
      total_edges: 0,
      threat_level: "NORMAL",
      active_flows: 148,
    },
  },
};

const initialLogs = [
  "[21:35:01] INFO: Connecting State / ST-GNN spatial graph topology online.",
  "[21:35:03] State: Benign | Source IP: 192.168.29.124",
  "[21:35:05] ACTION: Network connectivity nominal.",
];

export default function DashboardPage() {
  const telemetry = useTelemetryStream(initialState, initialLogs);
  const actions = useSoarActions(telemetry.refresh);
  const [uptimeSeconds, setUptimeSeconds] = useState(1540);

  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setUptimeSeconds((v) => v + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const uptime = [
    Math.floor(uptimeSeconds / 3600),
    Math.floor((uptimeSeconds % 3600) / 60),
    uptimeSeconds % 60,
  ]
    .map((v) => v.toString().padStart(2, "0"))
    .join(":");

  const runHeaderAction = (action: "reset" | "simulate" | "rollback") => {
    void actions.run(action, telemetry.state.src_ip);
  };

  const handleCommandAction = (actionId: string) => {
    if (actionId === "isolate") {
      void actions.run("isolate", telemetry.state.src_ip);
    } else if (actionId === "rollback") {
      void actions.run("rollback", telemetry.state.src_ip);
    } else if (actionId === "simulate") {
      void actions.run("simulate", telemetry.state.src_ip);
    } else if (actionId === "reset") {
      void actions.run("reset", telemetry.state.src_ip);
    } else if (actionId === "nav-topology") {
      document.getElementById("topology")?.scrollIntoView({ behavior: "smooth" });
    } else if (actionId === "nav-horizon") {
      document.getElementById("horizon")?.scrollIntoView({ behavior: "smooth" });
    } else if (actionId === "nav-logs") {
      document.getElementById("logs")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <DashboardShell state={telemetry.state}>
      <TopHeader
        status={telemetry.status}
        uptime={uptime}
        loading={actions.loading}
        onOpenCommandMenu={() => setIsCommandMenuOpen(true)}
        onAction={runHeaderAction}
        onRefresh={telemetry.refresh}
      />

      <motion.main
        id="dashboard"
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="mx-auto w-full max-w-[1800px] space-y-4 p-3 md:p-5 flex-1"
      >
            {actions.error && (
              <motion.div
                variants={itemVariants}
                role="alert"
                className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 font-mono text-xs text-red-400 shadow-sm"
              >
                SOAR ACTION FAILED: {actions.error}
              </motion.div>
            )}

            {/* Row 1: Enterprise KPI Grid */}
            <motion.div variants={itemVariants}>
              <MetricGrid state={telemetry.state} uptime={uptime} />
            </motion.div>

            {/* Row 2: Side-by-Side Graphical Node Part (Left) + Terminal & Controls (Right) */}
            <motion.div
              variants={itemVariants}
              className="grid w-full grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] items-stretch"
            >
              {/* Left Column: ST-GNN Spatial Graph Topology */}
              <section id="topology" className="min-w-0 flex flex-col">
                <TopologyGraph
                  topology={telemetry.state.topology}
                  state={telemetry.state}
                />
              </section>

              {/* Right Column: Compact SOAR Controls (Top) + Live Event Terminal Logs (Bottom) */}
              <section id="terminal-soar" className="min-w-0 flex flex-col gap-3">
                {/* Attack type, Rollback, Reset Baseline & SOAR actions bar */}
                <CompactSoarBar
                  state={telemetry.state}
                  onRefresh={telemetry.refresh}
                  onAction={runHeaderAction}
                />

                {/* Live Event Terminal Logs */}
                <div id="logs" className="flex-1 min-h-[220px]">
                  <LiveLogs logs={telemetry.logs} />
                </div>
              </section>
            </motion.div>

            {/* Row 3: Horizon Chart Full Width */}
            <motion.div variants={itemVariants} className="w-full">
              <section id="horizon">
                <HorizonChart state={telemetry.state} />
              </section>
            </motion.div>

            {/* Row 4: Incident Summary & World Model Health */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-1 gap-4 lg:grid-cols-2"
            >
              <IncidentSummary state={telemetry.state} />
              <ModelHealth state={telemetry.state} />
            </motion.div>
      </motion.main>

      <StatusStrip connected={telemetry.status !== "disconnected"} />

      <CommandMenu
        isOpen={isCommandMenuOpen}
        onClose={() => setIsCommandMenuOpen(false)}
        onSelectAction={handleCommandAction}
        srcIp={telemetry.state.src_ip}
      />
    </DashboardShell>
  );
}

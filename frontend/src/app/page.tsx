"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { TopHeader } from "@/components/layout/TopHeader";
import { MetricGrid } from "@/components/dashboard/MetricGrid";
import { ThreatOverview } from "@/components/dashboard/ThreatOverview";
import { PredictionConfidence } from "@/components/dashboard/PredictionConfidence";
import { TopologyGraph } from "@/components/TopologyGraph";
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
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 18,
    },
  },
};

const initialState: SystemState = {
  src_ip: "172.16.0.3",
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
        id: "192.168.1.10",
        ip: "192.168.1.10",
        label: "Critical Asset",
        role: "Core Financial Database & Vault",
        risk_score: 0.18,
        status: "SAFE",
        packet_count: 54,
        byte_rate: "4.2 MB/s",
        is_defense: false,
        is_isolated: false,
      },
      {
        id: "127.0.0.1",
        ip: "127.0.0.1",
        label: "Server",
        role: "Internal Enterprise Server",
        risk_score: 0.05,
        status: "SAFE",
        packet_count: 88,
        byte_rate: "2.1 MB/s",
        is_defense: false,
        is_isolated: false,
      },
      {
        id: "10.0.0.5",
        ip: "10.0.0.5",
        label: "Defense",
        role: "Autonomous SOAR Controller",
        risk_score: 0.02,
        status: "SAFE",
        packet_count: 148,
        byte_rate: "3.8 MB/s",
        is_defense: true,
        is_isolated: false,
      },
      {
        id: "10.0.0.8",
        ip: "10.0.0.8",
        label: "Gateway",
        role: "Perimeter Router & Firewall",
        risk_score: 0.02,
        status: "SAFE",
        packet_count: 32,
        byte_rate: "1.6 MB/s",
        is_defense: false,
        is_isolated: false,
      },
      {
        id: "172.16.0.3",
        ip: "172.16.0.3",
        label: "Attacker",
        role: "External Adversary Stream",
        risk_score: 0.95,
        status: "SAFE",
        packet_count: 148,
        byte_rate: "18.4 MB/s",
        is_defense: false,
        is_isolated: false,
      },
    ],
    edges: [],
    stats: {
      total_nodes: 4,
      total_edges: 5,
      threat_level: "NORMAL",
      active_flows: 131,
    },
  },
};

const initialLogs = [
  "10:42:14 · CRITICAL · State: Benign · ML Conf: 99.6% · RSSM K-Horizon Risk: 3.8% · Source IP: 127.0.0.1",
  "10:42:17 · DETECTED · State: Benign · ML Conf: 99.0% · RSSM K-Horizon Risk: 3.8%",
  "10:42:20 · SCAN · Port Scan Detected · 12 Ports · Severity: Low · Source IP: 10.0.0.5",
  "10:42:24 · DETECTED · State: Benign · ML Conf: 98.6% · RSSM K-Horizon Risk: 5.8%",
  "10:42:28 · INFO · Baseline Updated Successfully · Auto-Remediate Engine",
];

export default function DashboardPage() {
  const telemetry = useTelemetryStream(initialState, initialLogs);
  const actions = useSoarActions(telemetry.refresh);
  const [uptimeSeconds, setUptimeSeconds] = useState(1700);
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
    }
  };

  return (
    <DashboardShell state={telemetry.state}>
      {/* Top Header Navigation */}
      <TopHeader
        status={telemetry.status}
        uptime={uptime}
        loading={actions.loading}
        currentView="dashboard"
        onSwitchView={() => {}}
        onOpenCommandMenu={() => setIsCommandMenuOpen(true)}
        onAction={runHeaderAction}
        onRefresh={telemetry.refresh}
      />

      {/* Main Command Center Canvas */}
      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="w-full space-y-4 p-4 md:p-6"
      >
        {actions.error && (
          <motion.div
            variants={itemVariants}
            role="alert"
            className="rounded-xl border border-[var(--coral)]/40 bg-[var(--coral-light)] p-3 font-mono text-xs text-[var(--coral)] shadow-sm"
          >
            SOAR ACTION FAILED: {actions.error}
          </motion.div>
        )}

        {/* Row 1: Six Top KPI Cards */}
        <motion.div variants={itemVariants}>
          <MetricGrid state={telemetry.state} uptime={uptime} />
        </motion.div>

        {/* Row 2: Dynamic Spatial Topology (60%) + SOAR & Audit Trail (40%) */}
        <motion.div
          variants={itemVariants}
          className="grid w-full grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] items-stretch"
        >
          {/* Main Network Centerpiece */}
          <section id="topology" className="min-w-0 flex flex-col">
            <TopologyGraph
              topology={telemetry.state.topology}
              state={telemetry.state}
            />
          </section>

          {/* Right Column: SOAR Controls (Top) + Audit Trail (Bottom) */}
          <section id="soar-terminal" className="min-w-0 flex flex-col gap-4">
            <CompactSoarBar
              state={telemetry.state}
              onRefresh={telemetry.refresh}
              onAction={runHeaderAction}
            />

            <div id="logs" className="flex-1 min-h-[260px]">
              <LiveLogs logs={telemetry.logs} />
            </div>
          </section>
        </motion.div>

        {/* Row 3: Threat Overview (50%) + Prediction Confidence (50%) */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 gap-4 lg:grid-cols-2"
        >
          <ThreatOverview state={telemetry.state} />
          <PredictionConfidence state={telemetry.state} />
        </motion.div>
      </motion.main>

      {/* Command Palette */}
      <CommandMenu
        isOpen={isCommandMenuOpen}
        onClose={() => setIsCommandMenuOpen(false)}
        onSelectAction={handleCommandAction}
        srcIp={telemetry.state.src_ip}
      />
    </DashboardShell>
  );
}

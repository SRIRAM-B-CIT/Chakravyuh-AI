"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { TopHeader } from "@/components/layout/TopHeader";
import { MetricGrid } from "@/components/dashboard/MetricGrid";
import { IncidentSummary } from "@/components/dashboard/IncidentSummary";
import { ModelHealth } from "@/components/dashboard/ModelHealth";
import { ThreatRail } from "@/components/dashboard/ThreatRail";
import { HeroBanner } from "@/components/dashboard/HeroBanner";
import { StatusStrip } from "@/components/StatusStrip";
import { TopologyGraph } from "@/components/TopologyGraph";
import { HorizonChart } from "@/components/HorizonChart";
import { SoarControl } from "@/components/SoarControl";
import { LiveLogs } from "@/components/LiveLogs";
import { CommandMenu } from "@/components/ui/CommandMenu";
import { CinematicLanding } from "@/components/landing/CinematicLanding";
import { BlockchainTransition } from "@/components/landing/BlockchainTransition";
import { CyberPuzzleLoader } from "@/components/landing/CyberPuzzleLoader";

import { useSoarActions } from "@/hooks/useSoarActions";
import { useTelemetryStream } from "@/hooks/useTelemetryStream";
import { SystemState } from "@/lib/types";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 90,
      damping: 14,
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

  // View States: "puzzle-loader" (default 5s instant loader) | "landing" | "transitioning" | "dashboard"
  const [viewState, setViewState] = useState<"puzzle-loader" | "landing" | "transitioning" | "dashboard">("puzzle-loader");
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
      void actions.run("isolate" as any, telemetry.state.src_ip);
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
    <>
      {/* 1. Initial 5-Second 3D Cyber Puzzle Decryption Loader Overlay */}
      {viewState === "puzzle-loader" && (
        <CyberPuzzleLoader onComplete={() => setViewState("dashboard")} />
      )}

      {/* 2. Blockchain Consensus Sequence Overlay */}
      {viewState === "transitioning" && (
        <BlockchainTransition onComplete={() => setViewState("dashboard")} />
      )}

      {/* 3. Platform Overview / Landing View Overlay */}
      {viewState === "landing" && (
        <DashboardShell state={telemetry.state}>
          <CinematicLanding
            onEnterDashboard={() => setViewState("dashboard")}
            onStartBlockchainSequence={() => setViewState("transitioning")}
          />
        </DashboardShell>
      )}

      {/* 4. Production-Grade Enterprise SOC Command Center Dashboard (Pre-mounted for ZERO lag transition) */}
      <div
        className={
          viewState === "dashboard"
            ? "block opacity-100 transition-opacity duration-300"
            : "hidden opacity-0"
        }
      >
        <DashboardShell state={telemetry.state}>
          <TopHeader
            status={telemetry.status}
            uptime={uptime}
            loading={actions.loading}
            currentView="dashboard"
            onSwitchView={(v) => setViewState(v)}
            onOpenCommandMenu={() => setIsCommandMenuOpen(true)}
            onAction={runHeaderAction}
            onRefresh={telemetry.refresh}
          />

          <motion.main
            id="dashboard"
            variants={containerVariants}
            initial="hidden"
            animate={viewState === "dashboard" ? "show" : "hidden"}
            className="mx-auto w-full max-w-[1800px] space-y-6 p-4 md:p-6 flex-1"
          >
            <HeroBanner status={telemetry.status} onRefresh={telemetry.refresh} />
            {actions.error && (
              <motion.div
                variants={itemVariants}
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-4 font-mono text-xs text-red-700 shadow-sm"
              >
                SOAR ACTION FAILED: {actions.error}
              </motion.div>
            )}

            {/* Enterprise KPI Grid */}
            <motion.div
              variants={itemVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
            >
              <MetricGrid state={telemetry.state} uptime={uptime} />
            </motion.div>

            {/* Primary operations workspace */}
            <motion.div
              variants={itemVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              className="grid w-full grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_290px]"
            >
              <section id="topology" className="min-w-0">
                <TopologyGraph
                  topology={telemetry.state.topology}
                  state={telemetry.state}
                />
              </section>
              <ThreatRail state={telemetry.state} />
            </motion.div>

            {/* Operations and prediction */}
            <motion.div
              variants={itemVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              className="grid w-full grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,.85fr)]"
            >
              <section id="soar" className="min-w-0">
                <SoarControl
                  state={telemetry.state}
                  onRefresh={telemetry.refresh}
                />
              </section>
            </motion.div>

            {/* Horizon Chart */}
            <motion.div
              variants={itemVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              className="w-full"
            >
              <section id="horizon">
                <HorizonChart state={telemetry.state} />
              </section>
            </motion.div>

            {/* Incident Summary & Model Health */}
            <motion.div
              variants={itemVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              className="grid grid-cols-1 gap-5 lg:grid-cols-2"
            >
              <IncidentSummary state={telemetry.state} />
              <ModelHealth state={telemetry.state} />
            </motion.div>

            {/* Live Event Terminal Logs */}
            <motion.div
              variants={itemVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
            >
              <section id="logs">
                <LiveLogs logs={telemetry.logs} />
              </section>
            </motion.div>
          </motion.main>

          <StatusStrip connected={telemetry.status !== "disconnected"} />

          {/* Quick Command Palette Dialog */}
          <CommandMenu
            isOpen={isCommandMenuOpen}
            onClose={() => setIsCommandMenuOpen(false)}
            onSelectAction={handleCommandAction}
            srcIp={telemetry.state.src_ip}
          />
        </DashboardShell>
      </div>
    </>
  );
}

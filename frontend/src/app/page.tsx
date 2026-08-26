"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Shield,
  RefreshCw,
  LayoutDashboard,
  Activity,
  CircleGauge,
  Terminal as TerminalIcon,
  Settings,
  LogOut,
  RotateCcw,
  ShieldCheck,
  Flame,
} from "lucide-react";
import { MetricCards } from "@/components/MetricCards";
import { TopologyGraph } from "@/components/TopologyGraph";
import { HorizonChart } from "@/components/HorizonChart";
import { SoarControl } from "@/components/SoarControl";
import { LiveLogs } from "@/components/LiveLogs";
import { SystemState, StreamPayload } from "@/lib/types";

const defaultState: SystemState = {
  src_ip: "192.168.29.124",
  label: "Benign",
  ml_conf: 0.98,
  risk_score: 0.05,
  isolated: false,
  rollout: [0.02, 0.03, 0.04, 0.05],
  rollout_series: {
    Gateway: [0.02, 0.02, 0.02, 0.02],
    "Defense Host": [0.05, 0.05, 0.05, 0.05],
    "Internal Server": [0.12, 0.12, 0.12, 0.12],
    "Threat Host": [0.02, 0.03, 0.04, 0.05],
  },
  topology: {
    nodes: [
      { id: "192.168.29.1", ip: "192.168.29.1", label: "Gateway", role: "Gateway Router", risk_score: 0.02, status: "SAFE", packet_count: 24, byte_rate: "1.2 MB/s", is_defense: false, is_isolated: false },
      { id: "192.168.29.104", ip: "192.168.29.104", label: "Defense", role: "Defense Controller", risk_score: 0.05, status: "SAFE", packet_count: 148, byte_rate: "3.8 MB/s", is_defense: true, is_isolated: false },
      { id: "192.168.29.42", ip: "192.168.29.42", label: "Server", role: "Internal Core Server", risk_score: 0.12, status: "SAFE", packet_count: 18, byte_rate: "850 KB/s", is_defense: false, is_isolated: false },
      { id: "192.168.29.124", ip: "192.168.29.124", label: "Attacker", role: "External Node", risk_score: 0.05, status: "SAFE", packet_count: 28, byte_rate: "210 KB/s", is_defense: false, is_isolated: false },
    ],
    edges: [
      { id: "e-gw-def", source: "192.168.29.1", target: "192.168.29.104", weight: 14, traffic: "Safe Path", protocol: "TCP/HTTPS", animated: false, threat: false },
      { id: "e-def-internal", source: "192.168.29.104", target: "192.168.29.42", weight: 8, traffic: "Safe Path", protocol: "gRPC/TLS", animated: false, threat: false },
      { id: "e-gw-internal", source: "192.168.29.1", target: "192.168.29.42", weight: 6, traffic: "Internal Route", protocol: "TCP/TLS", animated: false, threat: false },
      { id: "e-att-def", source: "192.168.29.124", target: "192.168.29.104", weight: 16, traffic: "Safe Path", protocol: "TCP/SYN", animated: false, threat: false },
    ],
    stats: {
      total_nodes: 4,
      total_edges: 4,
      threat_level: "NORMAL",
      active_flows: 148,
    },
  },
};

export default function Dashboard() {
  const [state, setState] = useState<SystemState>(defaultState);
  const [logs, setLogs] = useState<string[]>([
    "[21:35:01] INFO: Connecting State / ST-GNN spatial graph topology online.",
    "[21:35:03] State: Benign | Source IP: 192.168.29.124",
    "[21:35:05] State: Benign | Source IP: 192.168.29.104",
    "[21:35:08] ACTION: 1-Click Rollback Restored. Network connectivity nominal.",
    "[21:35:10] State: Benign | Source IP: 192.168.29.124",
  ]);
  const [connStatus, setConnStatus] = useState<"ws" | "polling" | "disconnected">("disconnected");
  const [uptimeSeconds, setUptimeSeconds] = useState<number>(1540);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Format uptime
  const formatUptime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setUptimeSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // REST Fallback fetch
  const fetchRestState = useCallback(async () => {
    try {
      const [stateRes, logsRes] = await Promise.all([
        fetch("http://127.0.0.1:8000/api/state"),
        fetch("http://127.0.0.1:8000/api/logs?limit=40"),
      ]);
      if (stateRes.ok) {
        const stateData = await stateRes.json();
        setState(stateData);
        if (connStatus !== "ws") {
          setConnStatus("polling");
        }
      }
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        if (logsData.logs && logsData.logs.length > 0) {
          setLogs(logsData.logs);
        }
      }
    } catch {
      if (connStatus !== "ws") {
        setConnStatus("disconnected");
      }
    }
  }, [connStatus]);

  // Quick Action: Reset Nominal State
  const handleQuickReset = async () => {
    setActionLoading("reset");
    try {
      await fetch("http://127.0.0.1:8000/api/simulate/reset", { method: "POST" });
      await fetchRestState();
    } catch (e) {
      console.error("Reset error:", e);
    } finally {
      setActionLoading(null);
    }
  };

  // Quick Action: 1-Click Rollback
  const handleQuickRollback = async () => {
    setActionLoading("rollback");
    try {
      await fetch("http://127.0.0.1:8000/api/soar/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip: state.src_ip || "192.168.29.124" }),
      });
      await fetchRestState();
    } catch (e) {
      console.error("Rollback error:", e);
    } finally {
      setActionLoading(null);
    }
  };

  // Quick Action: Simulate Attack Spike
  const handleQuickSimulate = async () => {
    setActionLoading("simulate");
    try {
      await fetch("http://127.0.0.1:8000/api/simulate/attack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip: "192.168.29.124", attack_type: "DoS/Flood", risk_level: 0.96 }),
      });
      await fetchRestState();
    } catch (e) {
      console.error("Simulate error:", e);
    } finally {
      setActionLoading(null);
    }
  };

  // Resilient WebSocket + Polling Hybrid Manager
  useEffect(() => {
    let reconnectTimer: NodeJS.Timeout;
    let isUnmounted = false;

    const connectWS = () => {
      if (isUnmounted) return;
      try {
        const wsUrl = "ws://127.0.0.1:8000/ws/stream";
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isUnmounted) setConnStatus("ws");
        };

        ws.onmessage = (event) => {
          try {
            const payload: StreamPayload = JSON.parse(event.data);
            if (payload.state) {
              setState(payload.state);
            }
            if (payload.logs) {
              setLogs(payload.logs);
            }
            if (!isUnmounted) setConnStatus("ws");
          } catch (err) {
            console.error("Error parsing WS payload:", err);
          }
        };

        ws.onclose = () => {
          if (!isUnmounted) {
            setConnStatus("polling");
            fetchRestState();
            reconnectTimer = setTimeout(connectWS, 2500);
          }
        };

        ws.onerror = () => {
          if (!isUnmounted) {
            setConnStatus("polling");
            fetchRestState();
            ws.close();
          }
        };
      } catch {
        if (!isUnmounted) {
          setConnStatus("polling");
          fetchRestState();
          reconnectTimer = setTimeout(connectWS, 2500);
        }
      }
    };

    connectWS();

    const pollInterval = setInterval(() => {
      if (connStatus !== "ws") {
        fetchRestState();
      }
    }, 500);

    return () => {
      isUnmounted = true;
      clearTimeout(reconnectTimer);
      clearInterval(pollInterval);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connStatus, fetchRestState]);

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex">
      {/* Left Vertical Mini Sidebar Strip */}
      <aside className="w-14 sm:w-16 border-r border-defense-border/70 bg-[#090d16] flex flex-col items-center py-5 justify-between flex-shrink-0">
        <div className="flex flex-col items-center gap-6">
          <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/50 text-cyan-400">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <button className="p-2 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition">
            <Activity className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition">
            <CircleGauge className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition">
            <TerminalIcon className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        <button className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition">
          <LogOut className="w-5 h-5" />
        </button>
      </aside>

      {/* Main Dashboard Canvas */}
      <main className="flex-1 p-4 md:p-5 lg:p-6 max-w-[1720px] mx-auto space-y-4 overflow-x-hidden">
        {/* Top Header Navigation with Direct Action Buttons */}
        <header className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-defense-border/60">
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-700/10 border border-amber-500/40 shadow-tactical-amber">
              <Shield className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  CHAKRAVYUH AI <span className="text-sm md:text-base font-semibold text-slate-300">Defense 2.0</span>
                </h1>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                NTRO Problem Statement <strong>SIH26153</strong>
              </p>
            </div>
          </div>

          {/* Direct One-Click Header Action Buttons & Status */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Direct Quick Action Buttons */}
            <button
              onClick={handleQuickRollback}
              disabled={actionLoading === "rollback"}
              title="Instantly restore firewall and network traffic"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/70 shadow-tactical-emerald transition active:scale-95 disabled:opacity-50"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{actionLoading === "rollback" ? "Restoring..." : "1-Click Rollback"}</span>
            </button>

            <button
              onClick={handleQuickReset}
              disabled={actionLoading === "reset"}
              title="Reset system state to safe baseline"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition active:scale-95 disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-300" />
              <span>{actionLoading === "reset" ? "Resetting..." : "Reset Baseline"}</span>
            </button>

            <button
              onClick={handleQuickSimulate}
              disabled={actionLoading === "simulate"}
              title="Simulate adversarial threat surge"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-amber-950/50 hover:bg-amber-900/70 text-amber-300 border border-amber-600/70 transition active:scale-95 disabled:opacity-50"
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulate Attack</span>
            </button>

            {/* Connection Status Badge */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border ${
                connStatus === "ws"
                  ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/60"
                  : connStatus === "polling"
                  ? "bg-cyan-950/60 text-cyan-300 border-cyan-500/60"
                  : "bg-red-950/60 text-red-300 border-red-500/80 shadow-tactical-crimson animate-pulse"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  connStatus === "ws"
                    ? "bg-emerald-400 animate-pulse"
                    : connStatus === "polling"
                    ? "bg-cyan-400"
                    : "bg-red-500"
                }`}
              />
              <span>
                {connStatus === "ws"
                  ? "CONNECTED (WS)"
                  : connStatus === "polling"
                  ? "CONNECTED (POLLING)"
                  : "DISCONNECTED"}
              </span>
            </div>

            {/* Manual Sync */}
            <button
              onClick={fetchRestState}
              title="Manual Telemetry Sync"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* 1. Top 4 Metric Cards */}
        <MetricCards
          state={state}
          isConnected={connStatus !== "disconnected"}
          uptime={formatUptime(uptimeSeconds)}
        />

        {/* 2. Main 2-Column Responsive Viewport Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column (Topology + Rollout Horizon Chart) */}
          <div className="lg:col-span-7 xl:col-span-7 space-y-4">
            <TopologyGraph topology={state.topology} state={state} />
            <HorizonChart state={state} />
          </div>

          {/* Right Column (SOAR Console on top + Live Event Logs) */}
          <div className="lg:col-span-5 xl:col-span-5 space-y-4 flex flex-col">
            <SoarControl state={state} onRefresh={fetchRestState} />
            <LiveLogs logs={logs} />
          </div>
        </div>
      </main>
    </div>
  );
}



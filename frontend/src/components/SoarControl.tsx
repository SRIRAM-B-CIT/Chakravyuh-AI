"use client";

import React, { useState } from "react";
import { Zap, Flame, RefreshCw, AlertOctagon, CheckCircle2, Terminal } from "lucide-react";
import { SystemState } from "@/lib/types";

interface SoarControlProps {
  state: SystemState;
  onRefresh: () => void;
}

export const SoarControl: React.FC<SoarControlProps> = ({ state, onRefresh }) => {
  const [targetIp, setTargetIp] = useState<string>(state.src_ip || "192.168.29.124");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleIsolate = async () => {
    if (!targetIp) return;
    setLoadingAction("isolate");
    try {
      const res = await fetch("http://127.0.0.1:8000/api/soar/isolate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip: targetIp }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Targeted Micro-Isolation Engaged: ${targetIp} dropped via iptables netfilter`, "error");
        onRefresh();
      } else {
        showToast(data.detail || "Failed to isolate host", "error");
      }
    } catch (err: any) {
      showToast(`Connection error: ${err.message}`, "error");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRollback = async () => {
    if (!targetIp) return;
    setLoadingAction("rollback");
    try {
      const res = await fetch("http://127.0.0.1:8000/api/soar/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip: targetIp }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`1-Click Rollback Restored: Host ${targetIp} connectivity restored`, "success");
        onRefresh();
      } else {
        showToast(data.detail || "Failed to rollback host", "error");
      }
    } catch (err: any) {
      showToast(`Connection error: ${err.message}`, "error");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSimulateAttack = async () => {
    setLoadingAction("simulate");
    try {
      const res = await fetch("http://127.0.0.1:8000/api/simulate/attack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip: targetIp, attack_type: "DoS/Flood", risk_level: 0.96 }),
      });
      if (res.ok) {
        showToast(`Simulation started: High-density threat trajectory triggered for ${targetIp}`, "error");
        onRefresh();
      }
    } catch (err: any) {
      showToast(`Simulation trigger failed: ${err.message}`, "error");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReset = async () => {
    setLoadingAction("reset");
    try {
      const res = await fetch("http://127.0.0.1:8000/api/simulate/reset", {
        method: "POST",
      });
      if (res.ok) {
        showToast("System telemetry returned to nominal baseline", "success");
        onRefresh();
      }
    } catch (err: any) {
      showToast(`Reset failed: ${err.message}`, "error");
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="tactical-card p-4 flex flex-col space-y-3.5 h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-defense-border/70 pb-2">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold text-white tracking-wide">
            SOAR Autonomous Defense Console
          </h2>
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-2.5 rounded-lg text-xs font-mono flex items-center gap-2 border ${
            notification.type === "error"
              ? "bg-red-950/70 border-red-500/70 text-red-200"
              : notification.type === "success"
              ? "bg-emerald-950/70 border-emerald-500/70 text-emerald-200"
              : "bg-slate-900/90 border-slate-700 text-slate-200"
          }`}
        >
          {notification.type === "error" ? (
            <AlertOctagon className="w-4 h-4 text-tactical-crimson flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-tactical-emerald flex-shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Target Host Input */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1">
          Target Host IP Address:
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={targetIp}
            onChange={(e) => setTargetIp(e.target.value)}
            placeholder="192.168.29.124"
            className="flex-1 px-3 py-2 bg-slate-950 border border-defense-border focus:border-tactical-teal focus:ring-1 focus:ring-tactical-teal rounded-lg font-mono text-xs text-white placeholder-slate-500 outline-none"
          />
          <button
            onClick={() => setTargetIp(state.src_ip || "192.168.29.124")}
            title="Auto-detect active threat IP"
            className="px-3 py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition"
          >
            Auto Detect
          </button>
        </div>
      </div>

      {/* Main Action Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          onClick={handleIsolate}
          disabled={loadingAction === "isolate"}
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-semibold text-xs text-red-200 border border-red-500/80 bg-red-950/40 hover:bg-red-900/60 active:scale-[0.98] shadow-tactical-crimson transition disabled:opacity-50"
        >
          {loadingAction === "isolate" ? "Isolating..." : "Micro-Isolate Host"}
        </button>

        <button
          onClick={handleRollback}
          disabled={loadingAction === "rollback"}
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-semibold text-xs text-emerald-200 border border-emerald-500/80 bg-emerald-950/40 hover:bg-emerald-900/60 active:scale-[0.98] shadow-tactical-emerald transition disabled:opacity-50"
        >
          {loadingAction === "rollback" ? "Restoring..." : "1-Click Rollback"}
        </button>
      </div>

      {/* Interactive Simulation & Test Suite */}
      <div className="pt-2 border-t border-defense-border/70">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
          Hackathon / SOC Live Simulation Suite
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleSimulateAttack}
            disabled={loadingAction === "simulate"}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border border-amber-800/60 transition"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            Simulate Attack Spike
          </button>

          <button
            onClick={handleReset}
            disabled={loadingAction === "reset"}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Nominal State
          </button>
        </div>
      </div>

      {/* Netfilter Command Reference */}
      <div className="bg-[#060a11] p-2.5 rounded-lg border border-defense-border/80 text-[11px] font-mono text-slate-400 space-y-1 mt-auto">
        <div className="flex items-center gap-1 text-slate-300 font-semibold">
          <Terminal className="w-3 h-3 text-tactical-teal" />
          <span>Active Kernel Rule:</span>
        </div>
        <code className="text-slate-300 block truncate">
          sudo iptables -A INPUT -s {targetIp} -j DROP
        </code>
      </div>
    </div>
  );
};


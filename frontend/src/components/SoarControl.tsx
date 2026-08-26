"use client";

import React, { useEffect, useState } from "react";
import { Zap, Flame, RefreshCw, AlertOctagon, CheckCircle2, Terminal, Shield, ShieldCheck } from "lucide-react";
import { SystemState } from "@/lib/types";
import { api } from "@/lib/api";
import { Dialog } from "@/components/ui/Dialog";
import { Badge } from "@/components/ui/Badge";

interface SoarControlProps {
  state: SystemState;
  onRefresh: () => void;
}

export const SoarControl: React.FC<SoarControlProps> = ({ state, onRefresh }) => {
  const [targetIp, setTargetIp] = useState<string>(state.src_ip || "192.168.29.124");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [confirmAction, setConfirmAction] = useState<"isolate" | "rollback" | null>(null);

  useEffect(() => {
    if (state.src_ip) setTargetIp(state.src_ip);
  }, [state.src_ip]);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleIsolate = async () => {
    if (!targetIp) return;
    setLoadingAction("isolate");
    try {
      await api.isolate(targetIp);
      showToast(`Targeted Micro-Isolation Engaged: ${targetIp} dropped via iptables netfilter`, "error");
      onRefresh();
    } catch (err: any) {
      showToast(`Connection error: ${err.message}`, "error");
    } finally {
      setLoadingAction(null);
      setConfirmAction(null);
    }
  };

  const handleRollback = async () => {
    if (!targetIp) return;
    setLoadingAction("rollback");
    try {
      await api.rollback(targetIp);
      showToast(`1-Click Rollback Restored: Host ${targetIp} connectivity restored`, "success");
      onRefresh();
    } catch (err: any) {
      showToast(`Connection error: ${err.message}`, "error");
    } finally {
      setLoadingAction(null);
      setConfirmAction(null);
    }
  };

  const handleSimulateAttack = async () => {
    setLoadingAction("simulate");
    try {
      await api.simulateAttack(targetIp);
      showToast(`Simulation started: High-density threat trajectory triggered for ${targetIp}`, "error");
      onRefresh();
    } catch (err: any) {
      showToast(`Simulation trigger failed: ${err.message}`, "error");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReset = async () => {
    setLoadingAction("reset");
    try {
      await api.reset();
      showToast("System telemetry returned to nominal baseline", "success");
      onRefresh();
    } catch (err: any) {
      showToast(`Reset failed: ${err.message}`, "error");
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="tactical-card p-4 flex flex-col space-y-4 h-full relative">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          <div>
            <h2 className="text-xs font-bold text-white tracking-wide uppercase font-mono">
              SOAR Autonomous Defense Console
            </h2>
            <p className="text-[10px] text-slate-400 font-mono">
              REAL-TIME NETFILTER MITIGATION
            </p>
          </div>
        </div>
        <Badge variant={state.isolated ? "critical" : "safe"}>
          {state.isolated ? "CONTAINING" : "STANDBY"}
        </Badge>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-2.5 rounded-lg text-xs font-mono flex items-center gap-2 border ${
            notification.type === "error"
              ? "bg-red-50 border-red-200 text-red-700"
              : notification.type === "success"
              ? "bg-blue-50 border-blue-200 text-blue-750"
              : "bg-slate-55 border-slate-200 text-slate-700"
          }`}
        >
          {notification.type === "error" ? (
            <AlertOctagon className="w-4 h-4 text-red-500 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Target Host Input */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-[var(--foreground)] font-mono">
          Target Host IP Address:
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={targetIp}
            onChange={(e) => setTargetIp(e.target.value)}
            placeholder="192.168.29.124"
            className="flex-1 px-3 py-2 bg-[var(--elevated-card)] border border-[var(--border-muted)] focus:border-blue-500 rounded-lg font-mono text-xs text-[var(--foreground)] placeholder-slate-400 outline-none transition"
          />
          <button
            onClick={() => setTargetIp(state.src_ip || "192.168.29.124")}
            title="Auto-detect active threat IP"
            className="px-3 py-2 bg-[var(--card-surface)] hover:bg-[var(--secondary-bg)] text-[var(--secondary-text)] rounded-lg text-xs font-mono font-medium border border-[var(--border-muted)] transition"
          >
            Auto Detect
          </button>
        </div>
      </div>

      {/* Main Action Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          onClick={() => setConfirmAction("isolate")}
          disabled={loadingAction === "isolate"}
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-mono font-bold text-xs text-red-700 border border-red-350 bg-red-50 hover:bg-red-100 active:scale-[0.98] transition disabled:opacity-50"
        >
          <Shield className="h-4 w-4 text-red-600" />
          <span>{loadingAction === "isolate" ? "ISOLATING..." : "MICRO-ISOLATE HOST"}</span>
        </button>

        <button
          onClick={() => setConfirmAction("rollback")}
          disabled={loadingAction === "rollback"}
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-mono font-bold text-xs text-blue-700 border border-blue-350 bg-blue-50 hover:bg-blue-100 active:scale-[0.98] transition disabled:opacity-50"
        >
          <ShieldCheck className="h-4 w-4 text-blue-600" />
          <span>{loadingAction === "rollback" ? "RESTORING..." : "1-CLICK ROLLBACK"}</span>
        </button>
      </div>

      {/* Simulation Suite */}
      <div className="pt-3 border-t border-[var(--border-muted)] space-y-2">
        <p className="text-[10px] font-bold text-[var(--secondary-text)] uppercase tracking-wider font-mono text-center">
          SOC Live Simulation Suite
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleSimulateAttack}
            disabled={loadingAction === "simulate"}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono text-red-650 bg-red-50/50 hover:bg-red-100/50 border border-red-200 transition"
          >
            <Flame className="w-3.5 h-3.5 text-red-500" />
            <span>Simulate Spike</span>
          </button>

          <button
            onClick={handleReset}
            disabled={loadingAction === "reset"}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono text-[var(--secondary-text)] bg-[var(--card-surface)] hover:bg-[var(--secondary-bg)] border border-[var(--border-muted)] transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[var(--secondary-text)]" />
            <span>Reset Baseline</span>
          </button>
        </div>
      </div>

      {/* Netfilter Kernel Rule Preview */}
      <div className="bg-[var(--elevated-card)] p-3 rounded-lg border border-[var(--border-muted)] font-mono text-[11px] text-[var(--secondary-text)] space-y-1 mt-auto">
        <div className="flex items-center gap-1.5 text-[var(--foreground)] font-semibold">
          <Terminal className="w-3.5 h-3.5 text-blue-600" />
          <span>Active Kernel Rule Preview:</span>
        </div>
        <code className="text-[var(--cyber-blue)] block truncate bg-[var(--card-surface)] p-1.5 rounded border border-[var(--border-muted)]">
          sudo iptables -A INPUT -s {targetIp} -j DROP
        </code>
      </div>

      {/* Radix UI Confirmation Modal Dialog */}
      <Dialog
        isOpen={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        title={`CONFIRM ${confirmAction === "isolate" ? "MICRO-ISOLATION" : "CONNECTIVITY RESTORATION"}`}
        description={
          confirmAction === "isolate"
            ? "Engage automated kernel netfilter drop rule on target IP."
            : "Remove active netfilter drop rule and restore host traffic."
        }
      >
        <div className="space-y-4 font-mono text-xs">
          <div className="rounded-lg border border-[var(--border-muted)] bg-[var(--card-surface)] p-3 space-y-1">
            <div className="text-[var(--secondary-text)]">Target Host IP:</div>
            <div className="text-base font-bold text-white">{targetIp}</div>
            {confirmAction === "isolate" && (
              <code className="block mt-2 bg-slate-950 p-2 rounded border border-slate-800 text-[10px] text-red-300">
                iptables -A INPUT -s {targetIp} -j DROP
              </code>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setConfirmAction(null)}
              className="rounded border border-slate-700 px-4 py-2 text-slate-300 hover:text-white"
            >
              CANCEL
            </button>
            <button
              onClick={confirmAction === "isolate" ? handleIsolate : handleRollback}
              disabled={loadingAction !== null}
              className={`rounded border px-4 py-2 font-bold ${
                confirmAction === "isolate"
                  ? "border-red-500 bg-red-950 text-red-200 hover:bg-red-900"
                  : "border-cyan-500 bg-cyan-950 text-cyan-200 hover:bg-cyan-900"
              }`}
            >
              {loadingAction ? "EXECUTING..." : confirmAction === "isolate" ? "CONFIRM ISOLATION" : "RESTORE"}
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

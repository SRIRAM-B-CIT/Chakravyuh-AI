"use client";

import React, { useEffect, useState } from "react";
import { Zap, Flame, RefreshCw, AlertOctagon, CheckCircle2, Terminal, Shield, ShieldCheck, Cpu } from "lucide-react";
import { SystemState } from "@/lib/types";
import { api } from "@/lib/api";
import { Dialog } from "@/components/ui/Dialog";
import { Badge } from "@/components/ui/Badge";

interface SoarControlProps {
  state: SystemState;
  onRefresh: () => void;
}

const ATTACK_OPTIONS = [
  { value: "DoS/Flood", label: "DoS / High-Density Flood", mitre: "Class 4" },
  { value: "Recon/PortScan", label: "SYN Recon Port Scan", mitre: "Class 1" },
  { value: "Recon/BruteForce", label: "Credential Brute-Force", mitre: "Class 1" },
  { value: "Infiltration", label: "Infiltration / RCE Exploit", mitre: "Class 2" },
  { value: "Bot/LateralMovement", label: "Botnet C2 & Lateral Spread", mitre: "Class 3" },
];

export const SoarControl: React.FC<SoarControlProps> = ({ state, onRefresh }) => {
  const [targetIp, setTargetIp] = useState<string>(state.src_ip || "192.168.29.124");
  const [selectedAttack, setSelectedAttack] = useState<string>("DoS/Flood");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [lastPlaybookResult, setLastPlaybookResult] = useState<any>(null);
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

  const handleRemediatePlaybook = async () => {
    if (!targetIp) return;
    setLoadingAction("remediate");
    try {
      const threatToRemediate = state.label && state.label !== "Benign" ? state.label : selectedAttack;
      const data = await api.remediate(targetIp, threatToRemediate);
      if (data && data.playbook_result) {
        setLastPlaybookResult(data.playbook_result);
        showToast(`SOAR Auto-Remediation: ${data.playbook_result?.playbook} applied successfully!`, "success");
        onRefresh();
      }
    } catch (err: any) {
      showToast(`Remediation failed: ${err.message}`, "error");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRollback = async () => {
    if (!targetIp) return;
    setLoadingAction("rollback");
    try {
      await api.rollback(targetIp);
      setLastPlaybookResult(null);
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
      await api.simulateAttack(targetIp, selectedAttack, 0.96);
      showToast(`Simulation started: ${selectedAttack} threat vector triggered on ${targetIp}`, "error");
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
      setLastPlaybookResult(null);
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
              REAL-TIME NETFILTER & AUTO-REMEDIATION
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
              ? "bg-red-950/80 border-red-500/50 text-red-200"
              : notification.type === "success"
              ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-200"
              : "bg-slate-900 border-slate-700 text-slate-200"
          }`}
        >
          {notification.type === "error" ? (
            <AlertOctagon className="w-4 h-4 text-red-400 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          )}
          <span className="truncate">{notification.message}</span>
        </div>
      )}

      {/* Target Host & Vector Selection Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        <div>
          <label className="block text-[11px] font-semibold text-slate-300 mb-1 font-mono">
            Target Host IP:
          </label>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={targetIp}
              onChange={(e) => setTargetIp(e.target.value)}
              placeholder="192.168.29.124"
              className="flex-1 px-2.5 py-1.5 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg font-mono text-xs text-white outline-none"
            />
            <button
              onClick={() => setTargetIp(state.src_ip || "192.168.29.124")}
              title="Auto-detect active threat IP"
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-mono border border-slate-700 transition"
            >
              Detect
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-300 mb-1 font-mono">
            Adversarial Vector (MITRE Class):
          </label>
          <select
            value={selectedAttack}
            onChange={(e) => setSelectedAttack(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg text-xs text-white font-mono outline-none"
          >
            {ATTACK_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label} ({opt.mitre})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Defense Actions */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <button
          onClick={() => setConfirmAction("isolate")}
          disabled={loadingAction === "isolate"}
          className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg font-mono font-bold text-xs text-red-200 border border-red-500/80 bg-red-950/50 hover:bg-red-900/70 transition disabled:opacity-50"
        >
          <Shield className="w-3.5 h-3.5 text-red-400" />
          <span>{loadingAction === "isolate" ? "ISOLATING..." : "MICRO-ISOLATE"}</span>
        </button>

        <button
          onClick={handleRemediatePlaybook}
          disabled={loadingAction === "remediate"}
          className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg font-mono font-bold text-xs text-amber-200 border border-amber-500/80 bg-amber-950/50 hover:bg-amber-900/70 transition disabled:opacity-50"
        >
          <Cpu className="w-3.5 h-3.5 text-amber-400" />
          <span>{loadingAction === "remediate" ? "FIXING..." : "AUTO-REMEDIATE"}</span>
        </button>

        <button
          onClick={() => setConfirmAction("rollback")}
          disabled={loadingAction === "rollback"}
          className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg font-mono font-bold text-xs text-cyan-200 border border-cyan-500/80 bg-cyan-950/50 hover:bg-cyan-900/70 transition disabled:opacity-50"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>{loadingAction === "rollback" ? "RESTORING..." : "1-CLICK ROLLBACK"}</span>
        </button>
      </div>

      {/* Live Playbook Remediation Steps Display */}
      {lastPlaybookResult && (
        <div className="bg-slate-950/90 border border-amber-500/40 rounded-lg p-2.5 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-amber-300">
            <span>Playbook: {lastPlaybookResult.playbook}</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/50">
              {lastPlaybookResult.status}
            </span>
          </div>
          <ul className="text-[10px] font-mono text-slate-300 space-y-1 pl-1">
            {lastPlaybookResult.steps?.map((step: string, idx: number) => (
              <li key={idx} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Interactive Simulation Suite */}
      <div className="pt-2 border-t border-slate-800/80 space-y-2">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono text-center">
          SOC Live Simulation Suite
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleSimulateAttack}
            disabled={loadingAction === "simulate"}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono text-red-300 bg-red-950/40 hover:bg-red-900/50 border border-red-800/50 transition"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulate {selectedAttack}</span>
          </button>

          <button
            onClick={handleReset}
            disabled={loadingAction === "reset"}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Baseline</span>
          </button>
        </div>
      </div>

      {/* Netfilter Kernel Rule Preview */}
      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-400 space-y-1 mt-auto">
        <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span>Active Kernel Rule Preview:</span>
        </div>
        <code className="text-cyan-300 block truncate bg-slate-900 p-1.5 rounded border border-slate-800">
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
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-1">
            <div className="text-slate-400">Target Host IP:</div>
            <div className="text-base font-bold text-white">{targetIp}</div>
            {confirmAction === "isolate" && (
              <code className="block mt-2 bg-slate-900 p-2 rounded border border-slate-800 text-[10px] text-red-300">
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

"use client";

import React, { useState } from "react";
import { Zap, Flame, RefreshCw, AlertOctagon, CheckCircle2, Terminal, ShieldAlert, Cpu, Activity, Play } from "lucide-react";
import { SystemState } from "@/lib/types";

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
        showToast(`Targeted Micro-Isolation Engaged: ${targetIp} quarantined via netfilter/firewall`, "error");
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

  const handleRemediatePlaybook = async () => {
    if (!targetIp) return;
    setLoadingAction("remediate");
    try {
      const threatToRemediate = state.label && state.label !== "Benign" ? state.label : selectedAttack;
      const res = await fetch("http://127.0.0.1:8000/api/soar/remediate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip: targetIp, threat_type: threatToRemediate }),
      });
      const data = await res.json();
      if (res.ok) {
        setLastPlaybookResult(data.playbook_result);
        showToast(`SOAR Auto-Remediation: ${data.playbook_result?.playbook} applied successfully!`, "success");
        onRefresh();
      } else {
        showToast(data.detail || "Failed to execute playbook", "error");
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
      const res = await fetch("http://127.0.0.1:8000/api/soar/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip: targetIp }),
      });
      const data = await res.json();
      if (res.ok) {
        setLastPlaybookResult(null);
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
        body: JSON.stringify({ ip: targetIp, attack_type: selectedAttack, risk_level: 0.96 }),
      });
      if (res.ok) {
        showToast(`Simulation started: ${selectedAttack} threat vector triggered on ${targetIp}`, "error");
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
        setLastPlaybookResult(null);
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
            SOAR Autonomous Defense & Playbook Console
          </h2>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-tactical-teal/10 text-tactical-teal border border-tactical-teal/30">
          Auto-Mitigation Active
        </span>
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
          <span className="truncate">{notification.message}</span>
        </div>
      )}

      {/* Target Host & Vector Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        <div>
          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
            Target Host IP:
          </label>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={targetIp}
              onChange={(e) => setTargetIp(e.target.value)}
              placeholder="192.168.29.124"
              className="flex-1 px-2.5 py-1.5 bg-slate-950 border border-defense-border focus:border-tactical-teal rounded-lg font-mono text-xs text-white outline-none"
            />
            <button
              onClick={() => setTargetIp(state.src_ip || "192.168.29.124")}
              title="Auto-detect active threat IP"
              className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-medium border border-slate-700 transition"
            >
              Detect
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
            Adversarial Vector (Trained MITRE Class):
          </label>
          <select
            value={selectedAttack}
            onChange={(e) => setSelectedAttack(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-950 border border-defense-border focus:border-tactical-teal rounded-lg text-xs text-white font-medium outline-none"
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
          onClick={handleIsolate}
          disabled={loadingAction === "isolate"}
          className="flex items-center justify-center gap-1 px-2.5 py-2 rounded-lg font-semibold text-xs text-red-200 border border-red-500/80 bg-red-950/40 hover:bg-red-900/60 transition disabled:opacity-50"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          {loadingAction === "isolate" ? "Isolating..." : "Micro-Isolate"}
        </button>

        <button
          onClick={handleRemediatePlaybook}
          disabled={loadingAction === "remediate"}
          className="flex items-center justify-center gap-1 px-2.5 py-2 rounded-lg font-semibold text-xs text-amber-200 border border-amber-500/80 bg-amber-950/40 hover:bg-amber-900/60 transition disabled:opacity-50"
        >
          <Cpu className="w-3.5 h-3.5 text-amber-400" />
          {loadingAction === "remediate" ? "Fixing..." : "Auto-Remediate"}
        </button>

        <button
          onClick={handleRollback}
          disabled={loadingAction === "rollback"}
          className="flex items-center justify-center gap-1 px-2.5 py-2 rounded-lg font-semibold text-xs text-emerald-200 border border-emerald-500/80 bg-emerald-950/40 hover:bg-emerald-900/60 transition disabled:opacity-50"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {loadingAction === "rollback" ? "Restoring..." : "1-Click Rollback"}
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
            Simulate {selectedAttack}
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
          <span>Active Kernel Netfilter Action:</span>
        </div>
        <code className="text-slate-300 block truncate">
          sudo iptables -A INPUT -s {targetIp} -j DROP
        </code>
      </div>
    </div>
  );
};

"use client";

import React, { useEffect, useState } from "react";
import { Flame, RotateCcw, ShieldCheck, Shield, Cpu, AlertOctagon, CheckCircle2, Zap } from "lucide-react";
import { SystemState } from "@/lib/types";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";

interface CompactSoarBarProps {
  state: SystemState;
  onRefresh: () => void;
  onAction: (action: "reset" | "simulate" | "rollback") => void;
}

const ATTACK_OPTIONS = [
  { value: "DoS/Flood", label: "DoS / High-Density Flood", mitre: "Class 4" },
  { value: "Recon/PortScan", label: "SYN Recon Port Scan", mitre: "Class 1" },
  { value: "Recon/BruteForce", label: "Credential Brute-Force", mitre: "Class 1" },
  { value: "Infiltration", label: "Infiltration / RCE Exploit", mitre: "Class 2" },
  { value: "Bot/LateralMovement", label: "Botnet C2 & Lateral Spread", mitre: "Class 3" },
];

export const CompactSoarBar: React.FC<CompactSoarBarProps> = ({ state, onRefresh, onAction }) => {
  const [targetIp, setTargetIp] = useState<string>(state.src_ip || "192.168.29.124");
  const [selectedAttack, setSelectedAttack] = useState<string>("DoS/Flood");
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (state.src_ip) setTargetIp(state.src_ip);
  }, [state.src_ip]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSimulateAttack = async () => {
    setLoading("simulate");
    try {
      await api.simulateAttack(targetIp, selectedAttack, 0.96);
      showToast(`Simulation started: ${selectedAttack} vector on ${targetIp}`, "error");
      onRefresh();
    } catch (err: any) {
      showToast(`Simulation error: ${err.message}`, "error");
    } finally {
      setLoading(null);
    }
  };

  const handleRollback = async () => {
    setLoading("rollback");
    try {
      await api.rollback(targetIp);
      showToast(`Host ${targetIp} isolation rolled back`, "success");
      onRefresh();
    } catch (err: any) {
      showToast(`Rollback failed: ${err.message}`, "error");
    } finally {
      setLoading(null);
    }
  };

  const handleReset = async () => {
    setLoading("reset");
    try {
      await api.reset();
      showToast("Telemetry restored to nominal baseline", "success");
      onRefresh();
    } catch (err: any) {
      showToast(`Reset failed: ${err.message}`, "error");
    } finally {
      setLoading(null);
    }
  };

  const handleIsolate = async () => {
    if (!targetIp) return;
    setLoading("isolate");
    try {
      await api.isolate(targetIp);
      showToast(`Micro-Isolation active on ${targetIp}`, "error");
      onRefresh();
    } catch (err: any) {
      showToast(`Isolation failed: ${err.message}`, "error");
    } finally {
      setLoading(null);
    }
  };

  const handleAutoRemediate = async () => {
    if (!targetIp) return;
    setLoading("remediate");
    try {
      const threatToFix = state.label && state.label !== "Benign" ? state.label : selectedAttack;
      const res = await api.remediate(targetIp, threatToFix);
      showToast(`SOAR Playbook: ${res.playbook_result?.playbook || "Remediation"} applied!`, "success");
      onRefresh();
    } catch (err: any) {
      showToast(`Auto-remediation failed: ${err.message}`, "error");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="tactical-card p-3 space-y-2.5">
      {/* Header Strip */}
      <div className="flex items-center justify-between border-b border-[var(--border-muted)] pb-2">
        <div className="flex items-center gap-1.5">
          <Zap className="h-4 w-4 text-cyan-400" />
          <span className="font-mono text-xs font-bold uppercase text-[var(--foreground)] tracking-wide">
            Autonomous SOAR Controls
          </span>
        </div>
        <Badge variant={state.isolated ? "critical" : "safe"}>
          {state.isolated ? "CONTAINING" : "STANDBY"}
        </Badge>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`px-2.5 py-1.5 rounded-md text-[11px] font-mono flex items-center gap-2 border ${
            toast.type === "error"
              ? "bg-red-500/10 border-red-500/30 text-red-400"
              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
          }`}
        >
          {toast.type === "error" ? (
            <AlertOctagon className="w-3.5 h-3.5 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
          )}
          <span className="truncate">{toast.message}</span>
        </div>
      )}

      {/* Row 1: Target IP & MITRE Attack Vector Dropdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="flex gap-1.5">
          <input
            type="text"
            value={targetIp}
            onChange={(e) => setTargetIp(e.target.value)}
            placeholder="Target IP (e.g. 192.168.29.124)"
            className="flex-1 px-2.5 py-1.5 bg-[var(--secondary-bg)] border border-[var(--border-muted)] focus:border-blue-500 rounded-md font-mono text-xs text-[var(--foreground)] outline-none"
          />
          <button
            onClick={() => setTargetIp(state.src_ip || "192.168.29.124")}
            title="Auto-detect active threat IP"
            className="px-2 py-1.5 bg-[var(--card-surface)] hover:bg-[var(--secondary-bg)] text-[var(--secondary-text)] rounded-md text-[11px] font-mono border border-[var(--border-muted)] transition"
          >
            Detect
          </button>
        </div>

        <div>
          <select
            value={selectedAttack}
            onChange={(e) => setSelectedAttack(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-[var(--secondary-bg)] border border-[var(--border-muted)] focus:border-blue-500 rounded-md text-xs text-[var(--foreground)] font-mono outline-none"
          >
            {ATTACK_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label} ({opt.mitre})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 2: Action Buttons (Simulate Attack, 1-Click Rollback, Reset Baseline) */}
      <div className="grid grid-cols-3 gap-1.5">
        <button
          onClick={handleSimulateAttack}
          disabled={loading !== null}
          className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-md font-mono text-[11px] font-bold text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition disabled:opacity-50"
        >
          <Flame className="w-3.5 h-3.5" />
          <span className="truncate">{loading === "simulate" ? "Simulating..." : "Simulate Attack"}</span>
        </button>

        <button
          onClick={handleRollback}
          disabled={loading !== null}
          className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-md font-mono text-[11px] font-bold text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition disabled:opacity-50"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="truncate">{loading === "rollback" ? "Restoring..." : "1-Click Rollback"}</span>
        </button>

        <button
          onClick={handleReset}
          disabled={loading !== null}
          className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-md font-mono text-[11px] font-bold text-[var(--secondary-text)] bg-[var(--secondary-bg)] hover:bg-[var(--card-surface)] border border-[var(--border-muted)] transition disabled:opacity-50"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="truncate">{loading === "reset" ? "Resetting..." : "Reset Baseline"}</span>
        </button>
      </div>

      {/* Row 3: SOAR Direct Quarantine & Remediation */}
      <div className="grid grid-cols-2 gap-1.5 pt-0.5">
        <button
          onClick={handleIsolate}
          disabled={loading !== null}
          className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md font-mono text-[10px] font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition disabled:opacity-50"
        >
          <Shield className="w-3 h-3 text-red-400" />
          <span>{loading === "isolate" ? "Isolating..." : "Micro-Isolate Host"}</span>
        </button>

        <button
          onClick={handleAutoRemediate}
          disabled={loading !== null}
          className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md font-mono text-[10px] font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition disabled:opacity-50"
        >
          <Cpu className="w-3 h-3 text-emerald-400" />
          <span>{loading === "remediate" ? "Remediating..." : "Auto-Remediate"}</span>
        </button>
      </div>
    </div>
  );
};

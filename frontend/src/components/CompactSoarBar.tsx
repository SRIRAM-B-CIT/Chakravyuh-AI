"use client";

import React, { useEffect, useState } from "react";
import {
  Flame,
  RotateCcw,
  ShieldCheck,
  Shield,
  Cpu,
  AlertOctagon,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { SystemState } from "@/lib/types";
import { api } from "@/lib/api";

interface CompactSoarBarProps {
  state: SystemState;
  onRefresh: () => void;
  onAction: (action: "reset" | "simulate" | "rollback") => void;
}

const ATTACK_OPTIONS = [
  { value: "DoS/Flood", label: "DoS / High-Density Flood (Class 4)" },
  { value: "Recon/PortScan", label: "SYN Recon Port Scan (Class 1)" },
  { value: "Recon/BruteForce", label: "Credential Brute-Force (Class 1)" },
  { value: "Infiltration", label: "Infiltration / RCE Exploit (Class 2)" },
  { value: "Bot/LateralMovement", label: "Botnet C2 & Lateral Spread (Class 3)" },
];

export const CompactSoarBar: React.FC<CompactSoarBarProps> = ({
  state,
  onRefresh,
}) => {
  const [targetIp, setTargetIp] = useState<string>(state.src_ip || "127.0.0.1");
  const [selectedAction, setSelectedAction] = useState<string>("Detect");
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
      showToast(`Simulation started: ${selectedAttack} threat vector on ${targetIp}`, "error");
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
      showToast(`1-Click Rollback: Host ${targetIp} connectivity restored`, "success");
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
      showToast("System telemetry returned to nominal baseline", "success");
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
      showToast(`Micro-Isolation triggered for host ${targetIp}`, "error");
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
      const threatToFix =
        state.label && state.label !== "Benign" ? state.label : selectedAttack;
      const res = await api.remediate(targetIp, threatToFix);
      showToast(
        `SOAR Playbook: ${res.playbook_result?.playbook || "Autonomous Defense"} applied!`,
        "success"
      );
      onRefresh();
    } catch (err: any) {
      showToast(`Auto-remediation failed: ${err.message}`, "error");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="card p-4 space-y-3.5 flex flex-col justify-between">
      {/* Header Strip */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-[var(--violet)]" />
          <h2 className="font-head text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
            AUTONOMOUS SOAR CONTROLS
          </h2>
        </div>
        <span
          className={`badge ${
            state.isolated
              ? "badge-coral"
              : state.label !== "Benign"
              ? "badge-amber animate-pulse"
              : "badge-gray"
          }`}
        >
          {state.isolated ? "CONTAINING" : "STANDBY"}
        </span>
      </div>

      {/* Toast Notification Alert */}
      {toast && (
        <div
          className={`px-3 py-2 rounded-lg text-[11px] font-mono flex items-center gap-2 border animate-slide-up ${
            toast.type === "error"
              ? "bg-[var(--coral-light)] border-[var(--coral)]/40 text-[var(--coral)]"
              : "bg-[var(--mint-light)] border-[var(--mint)]/40 text-[var(--mint)]"
          }`}
        >
          {toast.type === "error" ? (
            <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          )}
          <span className="truncate">{toast.message}</span>
        </div>
      )}

      {/* Selectors Grid: Target IP, Action, Attack Type */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {/* Target IP */}
        <div>
          <label className="block text-[10px] font-bold text-[var(--text-muted)] font-mono uppercase mb-1">
            Target IP
          </label>
          <input
            type="text"
            value={targetIp}
            onChange={(e) => setTargetIp(e.target.value)}
            placeholder="127.0.0.1"
            className="soc-input text-xs"
          />
        </div>

        {/* Action selector */}
        <div>
          <label className="block text-[10px] font-bold text-[var(--text-muted)] font-mono uppercase mb-1">
            Action
          </label>
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="soc-select text-xs"
          >
            <option value="Detect">Detect</option>
            <option value="Mitigate">Mitigate</option>
            <option value="Quarantine">Quarantine</option>
          </select>
        </div>

        {/* Attack Type Selector */}
        <div>
          <label className="block text-[10px] font-bold text-[var(--text-muted)] font-mono uppercase mb-1">
            Attack Type
          </label>
          <select
            value={selectedAttack}
            onChange={(e) => setSelectedAttack(e.target.value)}
            className="soc-select text-xs truncate"
          >
            {ATTACK_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Primary Action Buttons Row */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <button
          onClick={handleSimulateAttack}
          disabled={loading !== null}
          className="btn btn-violet text-xs py-2.5"
        >
          <Flame className="w-3.5 h-3.5" />
          <span>{loading === "simulate" ? "Simulating..." : "SIMULATE ATTACK"}</span>
        </button>

        <button
          onClick={handleRollback}
          disabled={loading !== null}
          className="btn btn-violet-outline text-xs py-2.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{loading === "rollback" ? "Restoring..." : "1-CLICK ROLLBACK"}</span>
        </button>

        <button
          onClick={handleReset}
          disabled={loading !== null}
          className="btn btn-neutral text-xs py-2.5"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{loading === "reset" ? "Resetting..." : "Reset Baseline"}</span>
        </button>
      </div>

      {/* Secondary Remediation Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-0.5">
        <button
          onClick={handleIsolate}
          disabled={loading !== null}
          className="btn btn-coral text-xs py-2"
        >
          <Shield className="w-3.5 h-3.5" />
          <span>{loading === "isolate" ? "Isolating..." : "MICRO-ISOLATE HOST"}</span>
        </button>

        <button
          onClick={handleAutoRemediate}
          disabled={loading !== null}
          className="btn btn-amber text-xs py-2"
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>{loading === "remediate" ? "Remediating..." : "AUTO-REMEDIATE"}</span>
        </button>
      </div>
    </div>
  );
};

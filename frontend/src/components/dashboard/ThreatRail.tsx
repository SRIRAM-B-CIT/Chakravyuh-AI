"use client";

import { ArrowRight, CircleAlert, ShieldAlert } from "lucide-react";
import { SystemState } from "@/lib/types";

interface ThreatRailProps {
  state: SystemState;
}

export function ThreatRail({ state }: ThreatRailProps) {
  const active = state.label !== "Benign" || state.risk_score >= 0.5;
  const risk = Math.round((state.risk_score || 0) * 100);
  const threats = active
    ? [
        { label: state.label || "Threat detected", level: "HIGH", tone: "critical" },
        { label: "Threat path active", level: "HIGH", tone: "critical" },
        { label: "Predictive escalation", level: risk >= 90 ? "HIGH" : "MEDIUM", tone: risk >= 90 ? "critical" : "warning" },
        { label: "Micro-isolation ready", level: "LOW", tone: "safe" },
      ]
    : [
        { label: "Brute Force Login", level: "HIGH", tone: "critical" },
        { label: "C2 Communication", level: "HIGH", tone: "critical" },
        { label: "Port Scan Detected", level: "MEDIUM", tone: "warning" },
        { label: "Unusual Data Exfil", level: "MEDIUM", tone: "warning" },
        { label: "Policy Violation", level: "LOW", tone: "safe" },
      ];

  return <aside className="space-y-4">
    <section className="tactical-card overflow-hidden p-4">
      <div className="mb-3 flex items-center justify-between"><div><h2 className="font-sans text-sm font-bold text-[#0F2747]">Top Threats</h2><p className="mt-1 text-[10px] text-[#7A8CA0]">Prioritized intelligence signals</p></div><button className="flex items-center gap-1 text-[10px] font-semibold text-[#2563EB]" onClick={() => document.getElementById("incident")?.scrollIntoView({ behavior: "smooth" })}>View All <ArrowRight className="h-3 w-3" /></button></div>
      <div className="divide-y divide-[#E8EEF5]">{threats.map((threat) => <div key={threat.label} className="flex items-center gap-2 py-3 text-xs"><span className={`h-2 w-2 shrink-0 rounded-full ${threat.tone === "critical" ? "bg-[#F43F5E]" : threat.tone === "warning" ? "bg-[#F59E0B]" : "bg-[#10B981]"}`} /><span className="min-w-0 flex-1 truncate font-semibold text-[#1E3A5F]">{threat.label}</span><span className={`rounded px-2 py-1 text-[9px] font-bold ${threat.tone === "critical" ? "bg-red-50 text-[#EF4444]" : threat.tone === "warning" ? "bg-amber-50 text-[#D97706]" : "bg-emerald-50 text-[#059669]"}`}>{threat.level}</span></div>)}</div>
    </section>
    <section className="relative min-h-[140px] overflow-hidden rounded-xl border border-[#D5E2F4] bg-[#E9F1FF] p-4"><div className="absolute -right-8 -top-8 h-32 w-32 rounded-full border-[14px] border-white/50" /><ShieldAlert className="absolute bottom-4 right-6 h-14 w-14 text-[#6C9EF8]/50" /><p className="text-[9px] font-mono font-bold tracking-[.22em] text-[#7C9EE0]">GREATER IMPACT</p><h3 className="mt-2 max-w-[150px] font-sans text-base font-bold text-[#123A80]">Stronger Together</h3><p className="mt-1 max-w-[175px] text-[10px] leading-relaxed text-[#5D77A5]">AI-driven security operations for resilient digital ecosystems.</p></section>
  </aside>;
}

"use client";

import { Grid2X2, Globe, Moon, RotateCcw, Shield, ShieldCheck, Sun, Flame } from "lucide-react";
import { ConnectionStatus } from "@/hooks/useTelemetryStream";

interface TopHeaderProps {
  status: ConnectionStatus;
  uptime: string;
  loading: string | null;
  currentView: "landing" | "dashboard";
  onSwitchView: (view: "landing" | "dashboard") => void;
  onOpenCommandMenu: () => void;
  onAction: (action: "reset" | "simulate" | "rollback") => void;
  onRefresh: () => void;
}

export function TopHeader({ currentView, uptime, loading, onSwitchView, onAction }: TopHeaderProps) {
  return <header className="sticky top-0 z-30 h-[62px] border-b border-[#E3EAF4] bg-white/95 px-4 shadow-[0_2px_14px_rgba(45,87,140,0.06)] backdrop-blur md:px-7">
    <div className="mx-auto flex h-full max-w-[1800px] items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-5">
        <div className="flex shrink-0 items-center gap-2.5"><Shield className="h-5 w-5 text-[#2563EB]" strokeWidth={1.8} /><div><div className="font-sans text-[12px] font-black tracking-[.08em] text-[#12316B]">CHAKRAVYUH <span className="text-[#2563EB]">AI</span></div><div className="font-sans text-[7px] font-bold tracking-[.08em] text-[#7890B1]">AUTONOMOUS SOC COMMAND</div></div></div>
        <div className="hidden items-center gap-1 rounded-lg bg-[#F1F5FA] p-1 sm:flex"><button onClick={() => onSwitchView("dashboard")} className={`flex items-center gap-2 rounded-md px-3 py-2 text-[10px] font-bold ${currentView === "dashboard" ? "bg-[#E7F0FF] text-[#2563EB] shadow-sm" : "text-[#7085A2] hover:text-[#1E3A5F]"}`}><Grid2X2 className="h-3.5 w-3.5" />SOC Command</button><button onClick={() => onSwitchView("landing")} className={`flex items-center gap-2 rounded-md px-3 py-2 text-[10px] font-bold ${currentView === "landing" ? "bg-[#E7F0FF] text-[#2563EB] shadow-sm" : "text-[#7085A2] hover:text-[#1E3A5F]"}`}><Globe className="h-3.5 w-3.5" />Overview</button></div>
      </div>
      <div className="hidden items-center gap-1.5 lg:flex"><button className="rounded-full p-2 text-[#F6B51B] hover:bg-amber-50" aria-label="Light theme"><Sun className="h-4 w-4" /></button><button className="flex items-center gap-1 rounded-full border border-[#DCE5F2] bg-[#F4F7FB] p-1 text-[#94A5BC]" aria-label="Toggle theme"><Moon className="h-3.5 w-3.5" /><span className="h-4 w-4 rounded-full bg-white shadow-sm" /></button></div>
      <div className="flex items-center gap-1.5"><button onClick={() => onAction("reset")} disabled={loading !== null} className="action-button text-[10px] whitespace-nowrap"><RotateCcw className="h-3 w-3" /> <span className="hidden sm:inline">Reset Baseline</span></button><button onClick={() => onAction("simulate")} disabled={loading !== null} className="action-button whitespace-nowrap border-[#D8E3F3] text-[10px] text-[#1E3A5F] hover:border-[#F59E0B] hover:bg-amber-50"><Flame className="h-3 w-3 text-[#F59E0B]" /><span className="hidden sm:inline">Simulate Attack</span></button><button onClick={() => onAction("rollback")} disabled={loading !== null} className="action-button whitespace-nowrap border-[#D8E3F3] text-[10px] text-[#1E3A5F] hover:border-[#2563EB] hover:bg-blue-50"><ShieldCheck className="h-3 w-3 text-[#2563EB]" /><span className="hidden sm:inline">1-Click Rollback</span></button><span className="ml-1 hidden rounded-lg bg-[#E6F8EF] px-3 py-2 font-mono text-[10px] font-bold text-[#059669] xl:inline-flex">◷&nbsp; Uptime {uptime}</span></div>
    </div>
  </header>;
}

"use client";

import { Activity, RefreshCw, Shield } from "lucide-react";
import { ConnectionStatus } from "@/hooks/useTelemetryStream";

interface HeroBannerProps {
  status: ConnectionStatus;
  onRefresh: () => void;
}

export function HeroBanner({ status, onRefresh }: HeroBannerProps) {
  const statusLabel = status === "ws" ? "Connected" : status === "polling" ? "REST Polling" : "Disconnected";
  const statusTone = status === "ws" ? "text-[#059669] bg-emerald-50" : status === "polling" ? "text-[#2563EB] bg-blue-50" : "text-[#DC2626] bg-red-50";
  return <section className="relative flex min-h-[142px] items-center justify-between overflow-hidden rounded-2xl border border-[#DCE8F5] bg-white/70 px-5 py-6 shadow-sm backdrop-blur-sm md:px-8"><div className="pointer-events-none absolute right-[17%] top-[-110px] h-[300px] w-[300px] rounded-full border border-blue-100/80" /><div className="pointer-events-none absolute right-[10%] top-[-70px] h-[220px] w-[220px] rounded-full border border-blue-100/70" /><div className="relative"><p className="font-mono text-[9px] font-black tracking-[.28em] text-[#7694C2]">REAL-TIME DEFENSE <span className="mx-2 text-[#B4C8E5]">·</span> GREATER POSSIBILITIES</p><h2 className="mt-2 font-sans text-4xl font-black tracking-tight text-[#0D1B55] md:text-5xl">SOC <span className="text-[#2563EB]">Command</span></h2><p className="mt-1 font-sans text-sm font-semibold text-[#52677F]">Unified intelligence for a safer digital world.</p></div><div className="relative hidden w-[190px] rounded-xl border border-[#E1EAF5] bg-white/85 p-3 text-[10px] shadow-sm sm:block"><div className="flex items-center justify-between"><span className="font-semibold text-[#7A8CA0]">Connection:</span><span className={`rounded-full px-2 py-1 font-bold ${statusTone}`}><i className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-current" />{statusLabel}</span></div><div className="mt-3 flex items-center justify-between border-t border-[#E8EEF5] pt-2 text-[#7A8CA0]"><span>Last Updated: <b className="text-[#1E3A5F]">Live Telemetry</b></span><button onClick={onRefresh} aria-label="Refresh live telemetry" title="Refresh live telemetry" className="rounded border border-[#D9E3EF] p-1 text-[#2563EB] hover:bg-blue-50"><RefreshCw className="h-3 w-3" /></button></div><Activity className="absolute -right-7 -top-7 h-20 w-20 text-blue-50" /></div></section>;
}

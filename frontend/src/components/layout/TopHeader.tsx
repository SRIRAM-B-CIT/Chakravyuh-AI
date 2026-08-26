"use client";

import React from "react";
import { Shield, RefreshCw, RotateCcw, Flame, ShieldCheck, Search, LayoutDashboard, Globe } from "lucide-react";
import { ConnectionStatus } from "@/hooks/useTelemetryStream";
import { Badge } from "@/components/ui/Badge";

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

export function TopHeader({
  status,
  uptime,
  loading,
  currentView,
  onSwitchView,
  onOpenCommandMenu,
  onAction,
  onRefresh,
}: TopHeaderProps) {
  const statusLabel =
    status === "ws"
      ? "CONNECTED"
      : status === "polling"
      ? "REST POLLING"
      : "DISCONNECTED";

  const statusVariant =
    status === "ws" ? "safe" : status === "polling" ? "info" : "critical";

  return (
    <header className="sticky top-0 z-30 border-b border-[#D9E3EF] bg-white px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Shield Icon & View Mode Tabs */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#2563EB]" />
            <h1 className="text-sm font-bold text-[#0F2747] font-sans">
              SOC Command
            </h1>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 rounded-md border border-[#D9E3EF] bg-[#EEF3F8] p-1 text-xs">
            <button
              onClick={() => onSwitchView("dashboard")}
              className={`flex items-center gap-1.5 rounded px-3 py-1 text-[11px] font-bold transition ${
                currentView === "dashboard"
                  ? "bg-white text-[#2563EB] shadow-sm"
                  : "text-[#52677F] hover:text-[#0F2747]"
              }`}
            >
              <LayoutDashboard className="h-3 w-3" />
              <span>SOC Command</span>
            </button>
            <button
              onClick={() => onSwitchView("landing")}
              className={`flex items-center gap-1.5 rounded px-3 py-1 text-[11px] font-bold transition ${
                currentView === "landing"
                  ? "bg-white text-[#2563EB] shadow-sm"
                  : "text-[#52677F] hover:text-[#0F2747]"
              }`}
            >
              <Globe className="h-3 w-3" />
              <span>Overview</span>
            </button>
          </div>
        </div>

        {/* Right: Actions Button Bar & Uptime */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onAction("reset")}
              disabled={loading !== null}
              className="action-button text-[11px] py-1 border-[#D9E3EF] bg-white text-[#52677F] hover:bg-[#EEF3F8]"
            >
              <RotateCcw className="h-3 w-3" />
              <span>RESET BASELINE</span>
            </button>

            <button
              onClick={() => onAction("simulate")}
              disabled={loading !== null}
              className="action-button text-[11px] py-1 border-[#EF4444]/40 bg-white text-[#EF4444] hover:bg-red-50"
            >
              <Flame className="h-3 w-3" />
              <span>SIMULATE ATTACK</span>
            </button>

            <button
              onClick={() => onAction("rollback")}
              disabled={loading !== null}
              className="action-button text-[11px] py-1 border-[#2563EB]/40 bg-white text-[#2563EB] hover:bg-blue-50"
            >
              <ShieldCheck className="h-3 w-3" />
              <span>1-CLICK ROLLBACK</span>
            </button>
          </div>

          <span className="rounded border border-[#D9E3EF] bg-[#EEF3F8] px-2.5 py-1 text-[10px] font-extrabold text-[#52677F]">
            UPTIME {uptime}
          </span>
        </div>
      </div>

      {/* Subheader: Search, Connection Status, Last updated, Refresh */}
      <div className="flex items-center justify-between border-t border-[#D9E3EF] mt-4 pt-3 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCommandMenu}
            className="flex items-center gap-2 rounded-lg border border-[#D9E3EF] bg-[#F4F7FB] px-3 py-1.5 text-xs text-[#7A8CA0] hover:border-blue-500 transition"
          >
            <Search className="h-3.5 w-3.5 text-[#7A8CA0]" />
            <span className="text-[11px]">Search...</span>
            <kbd className="rounded border border-[#D9E3EF] bg-white px-1.5 py-0.2 text-[9px] text-[#7A8CA0]">
              Ctrl+K
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-4 text-[#7A8CA0] font-sans text-[11px]">
          <div className="flex items-center gap-2">
            <span>Connection:</span>
            <Badge variant={statusVariant} className="text-[9px]">
              ● {statusLabel}
            </Badge>
          </div>
          <span>Last Updated: Live Telemetry</span>
          <button
            onClick={onRefresh}
            className="rounded-lg border border-[#D9E3EF] bg-white p-1.5 text-[#52677F] hover:border-[#2563EB] hover:text-[#2563EB] transition"
            title="Refresh telemetry stream"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}

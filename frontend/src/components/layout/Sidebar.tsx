"use client";

import React, { useState } from "react";
import {
  LayoutDashboard, Activity, Network, Cpu, Bell, ScrollText,
  Globe, BarChart3, FileText, Settings, BrainCircuit,
} from "lucide-react";

const ITEMS = [
  { icon: LayoutDashboard, label: "Overview",       active: true },
  { icon: Activity,        label: "Threat Monitor", active: false },
  { icon: Network,         label: "Attack Graph",   active: false },
  { icon: Cpu,             label: "Predictions",    active: false },
  { icon: Bell,            label: "Alerts",         active: false },
  { icon: ScrollText,      label: "Logs",           active: false },
  { icon: Globe,           label: "World Model",    active: false },
  { icon: BarChart3,       label: "Analytics",      active: false },
  { icon: FileText,        label: "Reports",        active: false },
  { icon: Settings,        label: "Settings",       active: false },
] as const;

export function Sidebar() {
  const [active, setActive] = useState("Overview");

  return (
    <aside
      className="hidden md:flex flex-col shrink-0 w-[196px] border-r border-[var(--border)] bg-[var(--surface)]"
      style={{ minHeight: "calc(100vh - 58px)" }}
    >
      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 pt-4">
        <p className="px-3 pb-2 text-[9px] font-bold tracking-[0.18em] text-[var(--text-muted)] uppercase font-mono">
          NAVIGATION
        </p>
        {ITEMS.map(({ icon: Icon, label }) => {
          const isActive = active === label;
          return (
            <button
              key={label}
              onClick={() => setActive(label)}
              className={`sidebar-item w-full text-left ${isActive ? "active" : ""}`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* AI Analyst mini */}
      <div className="p-3 border-t border-[var(--border)]">
        <p className="px-1 pb-1.5 text-[9px] font-bold tracking-[0.18em] text-[var(--text-muted)] uppercase font-mono">
          AI ANALYST
        </p>

        {/* Mini network viz */}
        <div className="rounded-lg overflow-hidden bg-[var(--surface-2)] border border-[var(--border)] p-2 mb-2">
          <svg width="100%" height="60" viewBox="0 0 168 60">
            {/* Connections */}
            <line x1="84" y1="30" x2="30"  y2="12" stroke="#F43F5E" strokeWidth="1" opacity="0.5" />
            <line x1="84" y1="30" x2="140" y2="15" stroke="#F43F5E" strokeWidth="1" opacity="0.5" />
            <line x1="84" y1="30" x2="50"  y2="50" stroke="#6D28D9" strokeWidth="1" opacity="0.5" />
            <line x1="84" y1="30" x2="130" y2="48" stroke="#6D28D9" strokeWidth="1" opacity="0.5" />
            <line x1="30" y1="12" x2="140" y2="15" stroke="#D97706" strokeWidth="0.8" opacity="0.35" />
            {/* Nodes */}
            <circle cx="84"  cy="30" r="6"   fill="#F43F5E" opacity="0.9" />
            <circle cx="84"  cy="30" r="11"  fill="none" stroke="#F43F5E" strokeWidth="1" opacity="0.3" />
            <circle cx="30"  cy="12" r="4"   fill="#6D28D9" opacity="0.8" />
            <circle cx="140" cy="15" r="4"   fill="#D97706" opacity="0.8" />
            <circle cx="50"  cy="50" r="3.5" fill="#059669" opacity="0.8" />
            <circle cx="130" cy="48" r="3.5" fill="#C026D3" opacity="0.8" />
          </svg>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--mint)] animate-blink" />
          <span className="text-[10px] font-medium text-[var(--text-secondary)]">Chakra AI Online</span>
        </div>
        <p className="text-[9px] text-[var(--text-muted)] mt-0.5 pl-3.5">Monitoring 24/7</p>
      </div>
    </aside>
  );
}

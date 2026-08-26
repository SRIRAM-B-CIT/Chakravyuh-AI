"use client";

import { Activity, BrainCircuit, ChevronLeft, ChevronRight, Gauge, LayoutDashboard, Network, Settings, Shield, Terminal } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const items = [
  ["Command Center", LayoutDashboard, "#dashboard"],
  ["Network Topology", Network, "#topology"],
  ["Threat Intelligence", Activity, "#incident"],
  ["Predictive Horizon", Gauge, "#horizon"],
  ["SOAR Operations", Shield, "#soar"],
  ["Event Audit", Terminal, "#logs"],
  ["Model Health", BrainCircuit, "#model"],
] as const;

export function Sidebar({ collapsed }: SidebarProps) {
  return (
    <aside
      className="hidden md:flex flex-col shrink-0 border-r border-slate-800 bg-[#090D16] transition-all duration-300 w-64"
    >
      {/* Brand Header */}
      <div className="flex flex-col justify-center border-b border-slate-800 px-5 py-4 h-20">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-[#2563EB]" />
          <span className="font-sans text-sm font-extrabold tracking-wider text-white">
            CHAKRAVYUH AI
          </span>
        </div>
        <span className="text-[8px] font-bold tracking-[0.2em] text-slate-400 uppercase mt-1">
          AUTONOMOUS SOC COMMAND
        </span>
      </div>

      <nav className="flex-1 space-y-1 p-4" aria-label="Command center sections">
        <div className="px-3 pb-2 font-sans text-[10px] font-bold tracking-[0.15em] text-slate-500 uppercase">
          NAVIGATION
        </div>
        {items.map(([label, Icon, href], index) => {
          const isActive = index === 0;
          return (
            <a
              key={label}
              href={href}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2 font-sans text-xs font-semibold transition-all ${
                isActive
                  ? "border-[#2563EB] bg-[#2563EB] text-white shadow-sm"
                  : "border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-white"
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-slate-500"}`} />
              <span>{label}</span>
            </a>
          );
        })}

        <div className="mt-6 border-t border-slate-800 pt-4">
          <div className="px-3 pb-2 font-sans text-[10px] font-bold tracking-[0.15em] text-slate-500 uppercase">
            SUBSYSTEM MONITOR
          </div>
          {[
            ["Backend API", true],
            ["WebSocket Stream", true],
            ["Live Sniffer", true],
            ["ST-GNN Engine", true],
          ].map(([item, ok]) => (
            <div
              key={item as string}
              className="flex items-center justify-between px-3 py-1.5 font-sans text-[11px] text-slate-400"
            >
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                <span>{item as string}</span>
              </div>
              <span className="text-[9px] font-extrabold text-[#10B981]">ONLINE</span>
            </div>
          ))}
        </div>
      </nav>

      {/* Analyst Profile */}
      <div className="border-t border-slate-800 p-4 flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold text-sm">
          AN
        </div>
        <div className="font-sans text-left">
          <div className="text-xs font-bold text-white">Analyst Active</div>
          <div className="text-[10px] text-slate-400">Clearance Level 5</div>
        </div>
      </div>
    </aside>
  );
}

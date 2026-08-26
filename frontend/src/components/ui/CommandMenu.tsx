"use client";

import React, { useEffect, useState } from "react";
import { Search, Shield, Activity, Flame, RotateCcw, ShieldCheck, Terminal, BrainCircuit, X } from "lucide-react";
import { Dialog } from "./Dialog";

interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (action: string) => void;
  srcIp?: string;
}

export function CommandMenu({
  isOpen,
  onClose,
  onSelectAction,
  srcIp = "192.168.29.124",
}: CommandMenuProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const commands = [
    {
      category: "SOAR Actions",
      items: [
        {
          id: "isolate",
          title: `Micro-Isolate Host (${srcIp})`,
          subtitle: "Drop target IP traffic via iptables netfilter rule",
          icon: Shield,
          color: "text-red-400",
        },
        {
          id: "rollback",
          title: "1-Click Rollback Restoration",
          subtitle: "Clear netfilter drop rules & restore baseline connectivity",
          icon: ShieldCheck,
          color: "text-emerald-400",
        },
        {
          id: "simulate",
          title: "Simulate Attack Spike",
          subtitle: "Inject synthetic high-density threat packets into ST-GNN",
          icon: Flame,
          color: "text-amber-400",
        },
        {
          id: "reset",
          title: "Reset Baseline Telemetry",
          subtitle: "Purge active threat flags and return to nominal state",
          icon: RotateCcw,
          color: "text-slate-300",
        },
      ],
    },
    {
      category: "Navigation",
      items: [
        { id: "nav-topology", title: "ST-GNN Network Topology", subtitle: "Jump to spatial graph inspector", icon: Activity, color: "text-cyan-400" },
        { id: "nav-horizon", title: "Predictive RSSM Horizon", subtitle: "Jump to K-step rollout chart", icon: BrainCircuit, color: "text-violet-400" },
        { id: "nav-logs", title: "Live Event Terminal Logs", subtitle: "Jump to audit trail terminal", icon: Terminal, color: "text-amber-400" },
      ],
    },
  ];

  const filteredCommands = commands.map((group) => ({
    ...group,
    items: group.items.filter(
      (cmd) =>
        cmd.title.toLowerCase().includes(query.toLowerCase()) ||
        cmd.subtitle.toLowerCase().includes(query.toLowerCase())
    ),
  })).filter((group) => group.items.length > 0);

  const handleRun = (id: string) => {
    onSelectAction(id);
    onClose();
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} className="max-w-xl p-0 overflow-hidden bg-[#070d18]/95 border-slate-700/80">
      <div className="flex items-center border-b border-slate-800 px-4 py-3">
        <Search className="h-4 w-4 text-cyan-400 mr-2 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a command or search actions... (Esc to cancel)"
          className="w-full bg-transparent font-mono text-xs text-white placeholder-slate-500 outline-none"
          autoFocus
        />
        <button onClick={onClose} className="text-slate-500 hover:text-white ml-2">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto p-2">
        {filteredCommands.length === 0 ? (
          <div className="p-6 text-center font-mono text-xs text-slate-500">
            No matching SOC command found.
          </div>
        ) : (
          filteredCommands.map((group) => (
            <div key={group.category} className="mb-3">
              <div className="px-3 py-1 font-mono text-[9px] font-bold tracking-widest text-slate-500 uppercase">
                {group.category}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleRun(item.id)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[#121f35] transition text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded bg-slate-900 border border-slate-800 group-hover:border-cyan-500/40">
                        <Icon className={`h-4 w-4 ${item.color}`} />
                      </div>
                      <div>
                        <div className="font-mono text-xs font-semibold text-slate-200 group-hover:text-cyan-300">
                          {item.title}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {item.subtitle}
                        </div>
                      </div>
                    </div>
                    <span className="font-mono text-[9px] text-slate-500 border border-slate-800 px-1.5 py-0.5 rounded group-hover:border-slate-700">
                      ENTER
                    </span>
                  </button>
                );
              })}
            </div>
          ))
        )}
      </div>

      <div className="border-t border-slate-800 bg-[#050810] px-4 py-2 flex items-center justify-between font-mono text-[9px] text-slate-500">
        <span>Navigation: <kbd className="text-slate-400">↑↓</kbd> Select</span>
        <span>Toggle: <kbd className="text-slate-400">Ctrl + K</kbd></span>
      </div>
    </Dialog>
  );
}

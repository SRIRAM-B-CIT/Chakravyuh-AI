"use client";

import React from "react";

export function StatusStrip({ connected }: { connected: boolean }) {
  const items: Array<[string, boolean]> = [
    ["BACKEND API", connected],
    ["WEBSOCKET FEED", connected],
    ["REST FALLBACK", true],
    ["PACKET SNIFFER", true],
    ["RSSM ENGINE", true],
    ["ST-GNN MODEL", true],
    ["SOAR KERNEL", true],
  ];

  return (
    <footer className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-slate-800/90 bg-[#040810]/95 px-4 py-2.5 font-mono text-[9px] tracking-[0.12em] text-slate-400 md:px-6 backdrop-blur-md z-20">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {items.map(([label, ok]) => (
          <span key={label} className="flex items-center gap-1.5">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                ok ? "bg-cyan-400 animate-pulse" : "bg-red-400"
              }`}
            />
            <span className="text-slate-400">{label}:</span>
            <b className={ok ? "text-cyan-400" : "text-red-400"}>
              {ok ? "ONLINE" : "OFFLINE"}
            </b>
          </span>
        ))}
      </div>

      <div className="hidden sm:block text-[9px] text-slate-500">
        CHAKRAVYUH AI ENTERPRISE SOC COMMAND PLATFORM
      </div>
    </footer>
  );
}

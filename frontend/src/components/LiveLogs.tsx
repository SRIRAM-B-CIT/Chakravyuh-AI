"use client";

import React, { useState, useRef, useEffect } from "react";
import { ScrollText, Search, Copy, Check, Pause, Play, Download } from "lucide-react";

interface LiveLogsProps {
  logs: string[];
}

const fallbackDefaultLogs = [
  "[21:35:01] INFO: Connecting State / ST-GNN spatial graph topology online.",
  "[21:35:03] State: Benign | Source IP: 192.168.29.124",
  "[21:35:05] State: Benign | Source IP: 192.168.29.104",
  "[21:35:08] ACTION: 1-Click Rollback Restored. Network connectivity nominal.",
  "[21:35:10] State: Benign | Source IP: 192.168.29.124",
];

export const LiveLogs: React.FC<LiveLogsProps> = ({ logs }) => {
  const [filter, setFilter] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  const displayLogs = logs && logs.length > 0 ? logs : fallbackDefaultLogs;

  useEffect(() => {
    if (autoScroll && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [displayLogs, autoScroll]);

  const filteredLogs = displayLogs.filter((l) =>
    l.toLowerCase().includes(filter.toLowerCase())
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(displayLogs.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([displayLogs.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chakravyuh_soc_audit_${Date.now()}.log`;
    a.click();
  };

  const renderLogLine = (line: string, index: number) => {
    // 1. ALERT / CRITICAL logs (Bold Red / Container)
    if (line.includes("ALERT") || line.includes("CRITICAL")) {
      return (
        <div key={`${line}-${index}`} className="text-red-400 font-mono text-[11px] leading-relaxed py-0.5">
          <span className="text-red-500 font-bold">Red </span>
          <span className="font-semibold">{line}</span>
        </div>
      );
    }

    // 2. SOAR Action - iptables DROP or Rollback (Emerald Green)
    if (line.includes("ACTION:") && (line.includes("DROP") || line.includes("Rollback"))) {
      return (
        <div key={`${line}-${index}`} className="text-emerald-400 font-mono text-[11px] leading-relaxed py-0.5 font-semibold">
          <span className="text-emerald-500 font-bold">Green </span>
          <span>{line}</span>
        </div>
      );
    }

    // 3. Attack State - DoS/Flood or Threat (Red)
    if (line.includes("State: DoS") || line.includes("State: Lateral") || line.includes("State: Recon") || line.includes("RSSM Risk: 9")) {
      return (
        <div key={`${line}-${index}`} className="text-red-400 font-mono text-[11px] leading-relaxed py-0.5">
          <span className="text-red-500 font-bold">Red </span>
          <span>{line}</span>
        </div>
      );
    }

    // 4. Benign State (Cyan)
    if (line.includes("State: Benign")) {
      return (
        <div key={`${line}-${index}`} className="text-cyan-300 font-mono text-[11px] leading-relaxed py-0.5">
          <span className="text-cyan-400 font-bold">Cyan </span>
          <span>{line}</span>
        </div>
      );
    }

    // 5. General Info / System initialization (Slate)
    return (
      <div key={`${line}-${index}`} className="text-slate-400 font-mono text-[11px] leading-relaxed py-0.5">
        <span className="text-slate-500 font-bold">Slate </span>
        <span>{line}</span>
      </div>
    );
  };

  return (
    <div className="tactical-card p-3.5 flex flex-col h-full relative overflow-hidden bg-[#0c121e]/95 border border-slate-800">
      {/* Terminal Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2 mb-2">
        <div className="flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-amber-400" />
          <h2 className="text-xs font-bold text-white tracking-wide uppercase font-mono">
            Live Event Terminal Logs
          </h2>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter..."
              className="pl-7 pr-2 py-0.5 bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded text-[11px] text-white placeholder-slate-500 outline-none w-24 sm:w-32 font-mono"
            />
          </div>

          <button
            onClick={() => setAutoScroll(!autoScroll)}
            title={autoScroll ? "Pause auto-scroll" : "Resume auto-scroll"}
            className={`p-1 rounded border transition ${
              autoScroll
                ? "bg-teal-950/40 text-teal-400 border-teal-800/60"
                : "bg-slate-800 text-slate-400 border-slate-700"
            }`}
          >
            {autoScroll ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          </button>

          <button
            onClick={handleCopy}
            title="Copy audit log"
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>

          <button
            onClick={handleDownload}
            title="Export audit trail"
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            <Download className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Terminal Output Viewport with Guaranteed Pixel Height */}
      <div
        ref={terminalRef}
        className="w-full bg-[#060a11] border border-slate-800/80 rounded-lg p-2.5 overflow-y-auto font-mono text-[11px] leading-relaxed"
        style={{ minHeight: "180px", height: "180px" }}
      >
        {filteredLogs.length === 0 ? (
          <div className="text-slate-500 italic">No matching event logs.</div>
        ) : (
          filteredLogs.map((line, idx) => renderLogLine(line, idx))
        )}
      </div>
    </div>
  );
};



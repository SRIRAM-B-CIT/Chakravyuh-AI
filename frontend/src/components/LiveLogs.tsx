"use client";

import React, { useState, useRef, useEffect } from "react";
import { ScrollText, Search, Copy, Check, Pause, Play, Download } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

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
  const [severity, setSeverity] = useState("ALL");
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  const displayLogs = logs && logs.length > 0 ? logs : fallbackDefaultLogs;

  useEffect(() => {
    if (autoScroll && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [displayLogs, autoScroll]);

  const getSeverity = (line: string) =>
    line.includes("ALERT") || line.includes("CRITICAL") || line.includes("DoS")
      ? "CRITICAL"
      : line.includes("ACTION")
      ? "SOAR"
      : line.includes("State: Benign")
      ? "BENIGN"
      : "INFO";

  const filteredLogs = displayLogs.filter(
    (line) =>
      line.toLowerCase().includes(filter.toLowerCase()) &&
      (severity === "ALL" || getSeverity(line) === severity)
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
    const currentSeverity = getSeverity(line);
    const badgeVariant =
      currentSeverity === "CRITICAL"
        ? "critical"
        : currentSeverity === "SOAR"
        ? "safe"
        : currentSeverity === "BENIGN"
        ? "info"
        : "neutral";

    return (
      <div
        key={`${line}-${index}`}
        className="flex items-start gap-2.5 py-1 font-mono text-[11px] leading-relaxed hover:bg-slate-900/40 px-1 rounded transition"
      >
        <Badge variant={badgeVariant} dot={false} className="shrink-0 text-[9px]">
          {currentSeverity}
        </Badge>
        <span className="text-slate-300 break-all">{line}</span>
      </div>
    );
  };

  return (
    <div className="tactical-card p-4 flex flex-col h-full relative overflow-hidden">
      {/* Terminal Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-cyan-400" />
          <div>
            <h2 className="text-xs font-bold text-white tracking-wide uppercase font-mono">
              Live Event Terminal Logs
            </h2>
            <p className="text-[10px] text-slate-400 font-mono">
              REAL-TIME SECURITY AUDIT TRAIL
            </p>
          </div>
        </div>

        {/* Severity Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1">
          {["ALL", "CRITICAL", "SOAR", "BENIGN", "INFO"].map((item) => (
            <button
              key={item}
              onClick={() => setSeverity(item)}
              className={`rounded px-2 py-0.5 font-mono text-[9px] font-bold border transition ${
                severity === item
                  ? "border-cyan-400/60 bg-cyan-950/40 text-cyan-300"
                  : "border-slate-800 text-slate-500 hover:text-slate-300"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Search & Utility Tools */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter logs..."
              className="pl-7 pr-2 py-1 bg-[#040810] border border-slate-800 focus:border-cyan-400 rounded text-[11px] text-white placeholder-slate-500 outline-none w-28 sm:w-36 font-mono"
            />
          </div>

          <button
            onClick={() => setAutoScroll(!autoScroll)}
            title={autoScroll ? "Pause auto-scroll" : "Resume auto-scroll"}
            className={`p-1.5 rounded border transition ${
              autoScroll
                ? "bg-cyan-950/40 text-cyan-400 border-cyan-800/60"
                : "bg-slate-900 text-slate-400 border-slate-800"
            }`}
          >
            {autoScroll ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleCopy}
            title="Copy audit log"
            className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleDownload}
            title="Export audit trail"
            className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Viewport */}
      <div
        ref={terminalRef}
        className="w-full bg-[#030610] border border-slate-800/90 rounded-xl p-3 overflow-y-auto font-mono text-[11px] leading-relaxed shadow-inner"
        style={{ minHeight: "190px", height: "190px" }}
      >
        {filteredLogs.length === 0 ? (
          <div className="text-slate-500 italic p-2">No matching event logs found.</div>
        ) : (
          filteredLogs.map((line, idx) => renderLogLine(line, idx))
        )}
      </div>
    </div>
  );
};

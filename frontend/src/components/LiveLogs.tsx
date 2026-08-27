"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ScrollText,
  Search,
  Copy,
  Check,
  Pause,
  Play,
  Download,
  Filter,
} from "lucide-react";

interface LiveLogsProps {
  logs: string[];
}

const fallbackDefaultLogs = [
  "10:42:14 · CRITICAL · State: Benign · ML Conf: 99.6% · RSSM K-Horizon Risk: 3.8% · Source IP: 127.0.0.1",
  "10:42:17 · DETECTED · State: Benign · ML Conf: 99.0% · RSSM K-Horizon Risk: 3.8%",
  "10:42:20 · SCAN · Port Scan Detected · 12 Ports · Severity: Low · Source IP: 10.0.0.5",
  "10:42:24 · DETECTED · State: Benign · ML Conf: 98.6% · RSSM K-Horizon Risk: 5.8%",
  "10:42:28 · INFO · Baseline Updated Successfully · Auto-Remediate Engine",
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

  const parseLogLine = (line: string) => {
    let type = "INFO";
    let badgeClass = "badge-gray";

    if (line.includes("CRITICAL") || line.includes("ALERT") || line.includes("DoS")) {
      type = "CRITICAL";
      badgeClass = "badge-coral";
    } else if (line.includes("DETECTED") || line.includes("SCAN") || line.includes("Port Scan")) {
      type = "DETECTED";
      badgeClass = "badge-violet";
    } else if (line.includes("ACTION") || line.includes("SOAR") || line.includes("Remediate") || line.includes("Rollback")) {
      type = "SOAR";
      badgeClass = "badge-mint";
    } else if (line.includes("Benign")) {
      type = "BENIGN";
      badgeClass = "badge-violet";
    }

    return { type, badgeClass };
  };

  const filteredLogs = displayLogs.filter((line) => {
    const matchesText = line.toLowerCase().includes(filter.toLowerCase());
    if (severity === "ALL") return matchesText;
    const { type } = parseLogLine(line);
    return matchesText && (type === severity || (severity === "CRITICAL" && type === "DETECTED"));
  });

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
    a.download = `chakravyuh_audit_trail_${Date.now()}.log`;
    a.click();
  };

  return (
    <div className="card p-4 flex flex-col h-full relative overflow-hidden">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-[var(--border)] pb-3 mb-2.5">
        <div className="flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-[var(--violet)]" />
          <h2 className="font-head text-xs font-bold text-[var(--text-primary)] tracking-wide uppercase">
            REAL-TIME SECURITY AUDIT TRAIL
          </h2>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1">
          {["ALL", "CRITICAL", "SOAR", "BENIGN", "INFO"].map((item) => (
            <button
              key={item}
              onClick={() => setSeverity(item)}
              className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold border transition ${
                severity === item
                  ? "bg-[var(--text-primary)] text-[var(--surface)] border-[var(--text-primary)]"
                  : "bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-primary)]"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Search Field & Tools */}
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search logs..."
              className="pl-7 pr-2 py-1 bg-[var(--surface-2)] border border-[var(--border)] focus:border-[var(--violet)] rounded-md text-[11px] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none w-28 sm:w-36 font-mono"
            />
          </div>

          <button
            onClick={() => setAutoScroll(!autoScroll)}
            title={autoScroll ? "Pause stream" : "Resume stream"}
            className="p-1 rounded-md border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
          >
            {autoScroll ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleCopy}
            title="Copy audit log"
            className="p-1 rounded-md border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[var(--mint)]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleDownload}
            title="Export audit trail"
            className="p-1 rounded-md border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Log Feed Viewport */}
      <div
        ref={terminalRef}
        className="flex-1 w-full overflow-y-auto space-y-1 pr-1 font-mono text-[11px] leading-relaxed select-text"
        style={{ minHeight: "220px", maxHeight: "260px" }}
      >
        {filteredLogs.length === 0 ? (
          <div className="text-[var(--text-muted)] italic p-3 text-center">
            No matching event audit logs found.
          </div>
        ) : (
          filteredLogs.map((line, idx) => {
            const { type, badgeClass } = parseLogLine(line);
            return (
              <div
                key={`${line}-${idx}`}
                className="log-row flex items-start gap-2.5 py-1.5 px-2 rounded hover:bg-[var(--surface-2)] transition"
              >
                <span className={`badge ${badgeClass} text-[9px] shrink-0`}>
                  {type}
                </span>
                <span className="text-[var(--text-primary)] break-all font-mono">
                  {line}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

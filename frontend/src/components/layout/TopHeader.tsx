"use client";

import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
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

const NAV_LINKS = ["Overview", "Threat Monitor", "Predictions", "Attack Graph", "Logs", "Settings"];

export function TopHeader({ uptime, onAction }: TopHeaderProps) {
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [activeNav, setActiveNav] = useState("Overview");

  useEffect(() => {
    const saved = localStorage.getItem("theme") as "dark" | "light" | null;
    const initial = saved || "light";
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  return (
    <header className="topbar sticky top-0 z-40 h-[58px] px-5 flex items-center justify-between gap-4">
      {/* Logo */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Hex logo mark */}
        <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
          <path
            d="M17 2L30.5 9.5V24.5L17 32L3.5 24.5V9.5L17 2Z"
            fill="none"
            stroke="url(#hg)"
            strokeWidth="1.8"
          />
          <path d="M17 8L25 12.5V21.5L17 26L9 21.5V12.5L17 8Z" fill="url(#hg2)" opacity="0.9" />
          <defs>
            <linearGradient id="hg" x1="3" y1="2" x2="31" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#6D28D9" /><stop offset="1" stopColor="#C026D3" />
            </linearGradient>
            <linearGradient id="hg2" x1="9" y1="8" x2="25" y2="26" gradientUnits="userSpaceOnUse">
              <stop stopColor="#7C3AED" /><stop offset="1" stopColor="#DB2777" />
            </linearGradient>
          </defs>
        </svg>
        <div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif" }} className="text-[15px] font-black tracking-tight text-[var(--text-primary)] leading-none">
            CHAKRAVYUH <span style={{ color: "var(--violet)" }}>AI</span>
          </div>
          <div className="text-[9px] font-semibold tracking-[0.18em] text-[var(--text-muted)] uppercase mt-0.5 font-mono">
            AUTONOMOUS SOC COMMAND
          </div>
        </div>
      </div>

      {/* SOC Command dropdown */}
      <div className="hidden md:flex items-center">
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-[12px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition mr-3">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--mint)] animate-blink" />
          SOC Command
          <span className="text-[var(--text-muted)]">▾</span>
        </button>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <button
              key={link}
              onClick={() => setActiveNav(link)}
              className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-all ${
                activeNav === link
                  ? "text-[var(--violet)] font-semibold"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
              style={activeNav === link ? {
                borderBottom: "2px solid var(--violet)",
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
              } : {}}
            >
              {link}
            </button>
          ))}
        </nav>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="h-8 w-8 flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </button>

        {/* Uptime */}
        <div className="hidden xl:flex flex-col items-end">
          <span className="text-[9px] font-semibold text-[var(--text-muted)] uppercase tracking-wider font-mono">UPTIME</span>
          <span className="text-[13px] font-bold font-mono text-[var(--mint)]">{uptime}</span>
        </div>

        {/* Analyst avatar */}
        <div className="relative h-8 w-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
          style={{ background: "linear-gradient(135deg, var(--violet), var(--magenta))" }}>
          SA
          <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-[var(--mint)] border-2 border-[var(--surface)]" />
        </div>
      </div>
    </header>
  );
}

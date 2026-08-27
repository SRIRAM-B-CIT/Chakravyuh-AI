"use client";

import React, { useEffect, useState } from "react";
import { Grid2X2, Globe, Moon, RotateCcw, Shield, ShieldCheck, Sun, Flame } from "lucide-react";
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

export function TopHeader({ currentView, uptime, loading, onSwitchView, onAction }: TopHeaderProps) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = localStorage.getItem("theme") as "dark" | "light" | null;
    const initial = saved || (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "dark");
    setTheme(initial);
    if (initial === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <header className="sticky top-0 z-30 h-[62px] border-b border-[var(--border-muted)] bg-[var(--card-surface)]/95 px-4 shadow-sm backdrop-blur md:px-7 transition-colors duration-200">
      <div className="mx-auto flex h-full max-w-[1800px] items-center justify-between gap-3">
        {/* Left Logo and View Switcher */}
        <div className="flex min-w-0 items-center gap-5">
          <div className="flex shrink-0 items-center gap-2.5">
            <Shield className="h-5 w-5 text-blue-500" strokeWidth={2} />
            <div>
              <div className="font-sans text-[12px] font-black tracking-[.08em] text-[var(--foreground)]">
                CHAKRAVYUH <span className="text-blue-500">AI</span>
              </div>
              <div className="font-sans text-[7px] font-bold tracking-[.08em] text-[var(--muted-text)]">
                AUTONOMOUS SOC COMMAND
              </div>
            </div>
          </div>

          <div className="hidden items-center gap-1 rounded-lg bg-[var(--secondary-bg)] p-1 sm:flex border border-[var(--border-muted)]">
            <button
              onClick={() => onSwitchView("dashboard")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-mono font-bold transition ${
                currentView === "dashboard"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-[var(--secondary-text)] hover:text-[var(--foreground)]"
              }`}
            >
              <Grid2X2 className="h-3.5 w-3.5" />
              SOC Command
            </button>
            <button
              onClick={() => onSwitchView("landing")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-mono font-bold transition ${
                currentView === "landing"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-[var(--secondary-text)] hover:text-[var(--foreground)]"
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              Overview
            </button>
          </div>
        </div>

        {/* Center/Right Controls: Theme Toggle and Quick Action Bar */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border-muted)] bg-[var(--secondary-bg)] px-2.5 py-1.5 text-[11px] font-mono font-bold text-[var(--secondary-text)] hover:text-[var(--foreground)] transition shadow-sm"
            title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <>
                <Moon className="h-3.5 w-3.5 text-cyan-400" />
                <span className="hidden sm:inline text-cyan-300">DARK</span>
              </>
            ) : (
              <>
                <Sun className="h-3.5 w-3.5 text-amber-500" />
                <span className="hidden sm:inline text-amber-600">LIGHT</span>
              </>
            )}
          </button>

          {/* Quick Header Buttons */}
          <button
            onClick={() => onAction("reset")}
            disabled={loading !== null}
            className="action-button text-[11px] font-mono whitespace-nowrap"
          >
            <RotateCcw className="h-3 w-3" />
            <span className="hidden md:inline">Reset Baseline</span>
          </button>

          <button
            onClick={() => onAction("simulate")}
            disabled={loading !== null}
            className="action-button whitespace-nowrap text-[11px] font-mono text-amber-500 hover:text-amber-400 hover:border-amber-500"
          >
            <Flame className="h-3 w-3 text-amber-500" />
            <span className="hidden md:inline">Simulate Attack</span>
          </button>

          <button
            onClick={() => onAction("rollback")}
            disabled={loading !== null}
            className="action-button whitespace-nowrap text-[11px] font-mono text-cyan-500 hover:text-cyan-400 hover:border-cyan-500"
          >
            <ShieldCheck className="h-3 w-3 text-cyan-500" />
            <span className="hidden md:inline">1-Click Rollback</span>
          </button>

          {/* Uptime Badge */}
          <span className="ml-1 hidden rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1.5 font-mono text-[10px] font-bold text-emerald-500 xl:inline-flex">
            ◷&nbsp;Uptime {uptime}
          </span>
        </div>
      </div>
    </header>
  );
}

"use client";

import React from "react";
import { clsx } from "clsx";

interface TabItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ items, activeId, onChange, className }: TabsProps) {
  return (
    <div
      role="tablist"
      className={clsx(
        "inline-flex items-center gap-1 rounded-lg border border-slate-800/90 bg-[#070d17]/80 p-1 backdrop-blur-md",
        className
      )}
    >
      {items.map((item) => {
        const isActive = item.id === activeId;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item.id)}
            className={clsx(
              "relative flex items-center gap-2 rounded-md px-3 py-1.5 font-mono text-xs font-medium transition-all duration-200 focus:outline-none",
              isActive
                ? "bg-[#14233c] text-cyan-300 shadow-sm border border-cyan-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent"
            )}
          >
            {Icon && <Icon className={clsx("h-3.5 w-3.5", isActive ? "text-cyan-400" : "text-slate-400")} />}
            <span>{item.label}</span>
            {item.badge !== undefined && (
              <span
                className={clsx(
                  "ml-1 rounded px-1.5 py-0.2 text-[9px] font-bold font-mono",
                  isActive
                    ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/40"
                    : "bg-slate-800 text-slate-400 border border-slate-700"
                )}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

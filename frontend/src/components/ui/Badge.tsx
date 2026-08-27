"use client";

import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "safe" | "critical" | "warning" | "info" | "purple" | "neutral";
  dot?: boolean;
}

export function Badge({
  children,
  variant = "neutral",
  dot = true,
  className,
  ...props
}: BadgeProps) {
  const variantStyles = {
    safe: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300",
    critical: "border-red-500/40 bg-red-500/10 text-red-300",
    warning: "border-red-500/40 bg-red-500/10 text-red-300",
    info: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300",
    purple: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300",
    neutral: "border-slate-700/60 bg-slate-800/50 text-slate-300",
  };

  const dotColors = {
    safe: "bg-cyan-400 animate-pulse",
    critical: "bg-red-400 animate-ping",
    warning: "bg-red-400 animate-pulse",
    info: "bg-cyan-400",
    purple: "bg-cyan-400",
    neutral: "bg-slate-400",
  };

  return (
    <span
      className={twMerge(
        clsx(
          "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[10px] font-medium tracking-wide transition-colors",
          variantStyles[variant],
          className
        )
      )}
      {...props}
    >
      {dot && (
        <span
          className={clsx("h-1.5 w-1.5 rounded-full shrink-0", dotColors[variant])}
        />
      )}
      {children}
    </span>
  );
}

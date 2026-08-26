"use client";

import React from "react";
import { clsx } from "clsx";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "glass" | "solid" | "bordered" | "threat";
  className?: string;
}

export function Card({
  children,
  variant = "glass",
  className,
  ...props
}: CardProps) {
  const variantStyles = {
    glass:
      "bg-[#08101e]/80 border-slate-800/90 shadow-xl backdrop-blur-xl hover:border-slate-700/80",
    solid: "bg-[#09111f] border-slate-800 shadow-md",
    bordered: "bg-[#060b14] border-slate-700/60 shadow-lg",
    threat:
      "bg-[#16080d]/80 border-red-500/40 shadow-2xl backdrop-blur-xl hover:border-red-500/60",
  };

  return (
    <div
      className={clsx(
        "rounded-xl border p-4 transition-all duration-200",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3
      className={clsx(
        "font-mono text-xs font-bold tracking-wider text-white uppercase flex items-center gap-2",
        className
      )}
    >
      {children}
    </h3>
  );
}

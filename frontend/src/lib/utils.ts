import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRiskScore(score: number): {
  pct: string;
  color: string;
  badgeBg: string;
  borderColor: string;
} {
  const pct = `${Math.round(score * 100)}%`;
  if (score >= 0.8) {
    return {
      pct,
      color: "text-tactical-crimson",
      badgeBg: "bg-red-950/40 text-red-400 border-red-800/60",
      borderColor: "border-red-500",
    };
  }
  if (score >= 0.5) {
    return {
      pct,
      color: "text-tactical-amber",
      badgeBg: "bg-amber-950/40 text-amber-400 border-amber-800/60",
      borderColor: "border-amber-500",
    };
  }
  return {
    pct,
    color: "text-tactical-emerald",
    badgeBg: "bg-emerald-950/40 text-emerald-400 border-emerald-800/60",
    borderColor: "border-emerald-500",
  };
}

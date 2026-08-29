"use client";

import { useState } from "react";
import { api } from "@/lib/api";

export type SoarAction = "isolate" | "rollback" | "simulate" | "reset";

export function useSoarActions(onComplete: () => Promise<void> | void) {
  const [loading, setLoading] = useState<SoarAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: SoarAction, ip?: string) => {
    setLoading(action);
    setError(null);
    try {
      if (action === "isolate" && ip) await api.isolate(ip);
      if (action === "rollback" && ip) await api.rollback(ip);
      if (action === "simulate") await api.simulateAttack(ip || "192.168.29.124");
      if (action === "reset") await api.reset();
      await onComplete();
      return true;
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "SOAR action failed");
      return false;
    } finally {
      setLoading(null);
    }
  };

  return { loading, error, run, clearError: () => setError(null) };
}

"use client";

import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { CyberField } from "@/components/visuals/CyberField";
import { SystemState } from "@/lib/types";

export function DashboardShell({
  children,
  state,
}: {
  children: ReactNode;
  state: SystemState;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F4F7FB] text-[#0F2747] selection:bg-blue-500/20 selection:text-blue-900">
      <CyberField state={state} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_58%_10%,rgba(37,99,235,0.08),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.82),rgba(244,247,251,0.96))]" />
      <div className="relative z-10 flex min-h-screen w-full flex-col">{children}</div>
    </div>
  );
}

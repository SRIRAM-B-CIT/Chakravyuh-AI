"use client";

import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { CyberField } from "@/components/visuals/CyberField";
import { SystemState } from "@/lib/types";

export function DashboardShell({
  children,
}: {
  children: ReactNode;
  state: SystemState;
}) {
  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#F4F7FB] text-[#0F2747] selection:bg-blue-500/20 selection:text-blue-900">
      {/* Content Container */}
      <div className="relative z-10 flex min-h-screen w-full">
        <Sidebar collapsed={false} onToggle={() => {}} />
        <div className="min-w-0 flex-1 flex flex-col">{children}</div>
      </div>
    </div>
  );
}

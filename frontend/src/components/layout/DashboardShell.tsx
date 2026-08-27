"use client";

import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { SystemState } from "@/lib/types";

export function DashboardShell({
  children,
}: {
  children: ReactNode;
  state?: SystemState;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)] transition-colors duration-200">
      <div className="flex w-full">
        {/* Left Minimal 196px Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}

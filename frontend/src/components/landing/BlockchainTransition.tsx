"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, Lock, CheckCircle2, Cpu, Terminal, ArrowRight } from "lucide-react";

interface BlockchainTransitionProps {
  onComplete: () => void;
}

const steps = [
  { id: 1, title: "GENERATING CRYPTOGRAPHIC PROOF", detail: "SHA-256 state hash validation: 0x8f7a9c...4e1b", icon: Terminal },
  { id: 2, title: "VERIFYING MERKLE TREE CONSENSUS", detail: "Block #894,102 consensus weight 99.98%", icon: Cpu },
  { id: 3, title: "SYNCHRONIZING ST-GNN SPATIAL GRAPH", detail: "Locking spatial edge parameters & weights", icon: Lock },
  { id: 4, title: "AUTHENTICATING SOC COMMAND VAULT", detail: "Clearance Level 5 Granted. Launching Command Center...", icon: Shield },
];

export function BlockchainTransition({ onComplete }: BlockchainTransitionProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) return prev + 1;
        clearInterval(timer);
        setTimeout(onComplete, 900);
        return prev;
      });
    }, 850);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#03060c] p-6 text-white font-mono overflow-hidden">
      {/* Background Animated Matrix Lines */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.12),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="relative w-full max-w-2xl rounded-2xl border border-cyan-500/30 bg-[#060c18]/90 p-8 shadow-2xl backdrop-blur-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg border border-cyan-500/40 bg-cyan-500/10 text-cyan-300">
              <Shield className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-widest text-cyan-300">
                BLOCKCHAIN CONSENSUS SEQUENCE
              </h2>
              <p className="text-[10px] text-slate-400">
                ST-GNN WORLD MODEL IMMUTABLE AUDIT VAULT
              </p>
            </div>
          </div>
          <button
            onClick={onComplete}
            className="flex items-center gap-1.5 rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:border-cyan-500 hover:text-cyan-300 transition"
          >
            <span>SKIP SEQUENCE</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Blockchain Visual Block Nodes */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {[0, 1, 2, 3].map((idx) => {
            const isPassed = idx < currentStep;
            const isCurrent = idx === currentStep;
            return (
              <motion.div
                key={idx}
                initial={{ scale: 0.9, opacity: 0.5 }}
                animate={{
                  scale: isCurrent ? 1.05 : 1,
                  opacity: isPassed || isCurrent ? 1 : 0.4,
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all ${
                  isPassed
                    ? "border-cyan-500/50 bg-cyan-950/20 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                    : isCurrent
                    ? "border-red-500 bg-red-950/40 text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse"
                    : "border-slate-800 bg-slate-950/50 text-slate-500"
                }`}
              >
                <div className="text-[10px] font-bold tracking-wider mb-1">
                  BLOCK #{894100 + idx}
                </div>
                <div className="text-[9px] font-mono opacity-80">
                  {isPassed ? "VALIDATED" : isCurrent ? "VERIFYING..." : "QUEUED"}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Terminal Log Console */}
        <div className="space-y-3 rounded-lg border border-slate-800 bg-[#030710] p-4 text-xs font-mono">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = idx === currentStep;
            const isDone = idx < currentStep;
            if (idx > currentStep) return null;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-start gap-3 ${
                  isDone
                    ? "text-cyan-300"
                    : isActive
                    ? "text-red-200"
                    : "text-slate-500"
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                ) : (
                  <Icon className="h-4 w-4 text-red-400 shrink-0 mt-0.5 animate-spin" />
                )}
                <div>
                  <div className="font-bold tracking-wider text-[11px]">
                    {step.title}
                  </div>
                  <div className="text-[10px] text-slate-400">{step.detail}</div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
            <span>CONSENSUS PROGRESS</span>
            <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-900 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-red-500 to-cyan-500"
              initial={{ width: "0%" }}
              animate={{
                width: `${((currentStep + 1) / steps.length) * 100}%`,
              }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

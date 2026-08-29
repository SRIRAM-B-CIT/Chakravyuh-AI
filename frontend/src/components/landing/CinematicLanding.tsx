"use client";

import React, { useState } from "react";
import { Shield, BrainCircuit, Network, Zap, Play, Terminal, ArrowRight, CheckCircle, Lock, Unlock, Cpu, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { CyberPuzzle3D } from "./CyberPuzzle3D";

interface CinematicLandingProps {
  onEnterDashboard: () => void;
  onStartBlockchainSequence: () => void;
}

export function CinematicLanding({
  onEnterDashboard,
  onStartBlockchainSequence,
}: CinematicLandingProps) {
  const [isPuzzleUnlocking, setIsPuzzleUnlocking] = useState(false);

  const handleTriggerPuzzleSolve = () => {
    setIsPuzzleUnlocking(true);
  };

  return (
    <div className="relative min-h-screen w-full text-slate-100 font-sans overflow-hidden selection:bg-cyan-500 selection:text-black">
      {/* 3D Three.js WebGL Cyber Grid & Puzzle Canvas Background */}
      <CyberPuzzle3D
        isUnlocking={isPuzzleUnlocking}
        onUnlocked={onEnterDashboard}
        statusText={isPuzzleUnlocking ? "DECRYPTING CIPHER VAULT..." : "3D CIPHER PUZZLE LOCKED"}
      />

      {/* Top Banner Navigation Header */}
      <nav className="relative z-20 flex items-center justify-between border-b border-slate-800/80 bg-[#040812]/90 px-6 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg border border-cyan-500/50 bg-cyan-500/10 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <Shield className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="font-mono text-sm font-bold tracking-[0.2em] text-white">
              CHAKRAVYUH AI
            </div>
            <div className="font-mono text-[9px] tracking-[0.25em] text-slate-400">
              AUTONOMOUS CYBER DEFENSE PLATFORM
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <Badge variant="safe">● ST-GNN MODEL ONLINE</Badge>
          <Badge variant="purple">● RSSM ROLLOUT ACTIVE</Badge>
          <button
            onClick={onStartBlockchainSequence}
            className="flex items-center gap-2 rounded-lg border border-cyan-500/60 bg-cyan-950/50 px-4 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-900/60 hover:border-cyan-400 transition shadow-[0_0_20px_rgba(6,182,212,0.3)]"
          >
            <Play className="h-3.5 w-3.5 fill-cyan-300" />
            <span>BLOCKCHAIN CONSENSUS</span>
          </button>
        </div>
      </nav>

      {/* Hero Content Section */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-12 pb-24 text-center">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-950/60 px-4 py-1.5 font-mono text-xs text-cyan-300 backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-spin" />
            <span>3D CRYPTOGRAPHIC PUZZLE VAULT</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl font-sans leading-tight">
            Autonomous Threat Defense powered by{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-red-500 to-cyan-500 bg-clip-text text-transparent">
              ST-GNN & RSSM
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto font-sans">
            Solve the 3D WebGL cipher lock to decrypt state parameters and launch the autonomous SOC command platform.
          </p>

          {/* Interactive Trigger Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4 font-mono text-xs">
            <button
              onClick={handleTriggerPuzzleSolve}
              disabled={isPuzzleUnlocking}
              className="flex items-center gap-3 rounded-xl border border-cyan-400/80 bg-gradient-to-r from-red-600 via-cyan-600 to-red-500 px-8 py-4 font-bold text-white shadow-[0_0_35px_rgba(239,68,68,0.3)] hover:shadow-[0_0_50px_rgba(6,182,212,0.5)] transition active:scale-95 disabled:opacity-50"
            >
              {isPuzzleUnlocking ? (
                <Unlock className="h-5 w-5 animate-spin text-cyan-300" />
              ) : (
                <Lock className="h-5 w-5 text-cyan-200" />
              )}
              <span className="tracking-wide">
                {isPuzzleUnlocking
                  ? "UNLOCKING SOC COMMAND VAULT..."
                  : "SOLVE CIPHER & UNLOCK COMMAND CENTER"}
              </span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={onStartBlockchainSequence}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-[#070e1c]/90 px-6 py-4 font-semibold text-slate-200 hover:border-cyan-500 hover:bg-slate-800 transition backdrop-blur-md"
            >
              <Cpu className="h-4 w-4 text-cyan-400" />
              <span>BLOCKCHAIN CONSENSUS</span>
            </button>

            <button
              onClick={onEnterDashboard}
              className="flex items-center gap-2 rounded-xl border border-slate-800 bg-[#040812]/90 px-6 py-4 font-semibold text-slate-400 hover:text-white transition backdrop-blur-md"
            >
              <Terminal className="h-4 w-4" />
              <span>DIRECT SOC ACCESS</span>
            </button>
          </div>
        </div>

        {/* Feature Capability Cards */}
        <div className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 text-left">
          {[
            {
              title: "3D Cyber Puzzle Lock",
              desc: "Three.js WebGL cryptographic cipher assembly with real-time rotation, glowing particles, & fragment explosion.",
              icon: Lock,
              badge: "WebGL 3D Core",
              color: "text-cyan-400 border-cyan-500/40 bg-cyan-950/30",
            },
            {
              title: "ST-GNN Graph Topology",
              desc: "Spatio-Temporal Graph Neural Networks mapping dynamic network node relationships in real-time.",
              icon: Network,
              badge: "Graph Neural Net",
              color: "text-cyan-400 border-cyan-500/40 bg-cyan-950/30",
            },
            {
              title: "RSSM K-Step Rollout",
              desc: "Recurrent State Space Model predicting attack propagation up to t+3 time steps into the future.",
              icon: BrainCircuit,
              badge: "World Model",
              color: "text-red-400 border-red-500/40 bg-red-950/30",
            },
            {
              title: "SOAR Micro-Isolation",
              desc: "Autonomous iptables kernel drop execution with 1-click rollback restoration capabilities.",
              icon: Zap,
              badge: "Active Defense",
              color: "text-red-400 border-red-500/40 bg-red-950/30",
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="tactical-card p-6 flex flex-col justify-between space-y-4 hover:scale-[1.03] transition-transform duration-200 border-slate-700/60 bg-[#060c18]/80 shadow-2xl backdrop-blur-xl"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-2.5 rounded-lg border ${card.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-mono text-[9px] font-bold text-slate-300 border border-slate-700 px-2 py-0.5 rounded bg-slate-900">
                      {card.badge}
                    </span>
                  </div>
                  <h3 className="font-mono text-sm font-bold text-white tracking-wide">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {card.desc}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 font-mono text-[10px] text-cyan-400 pt-2 border-t border-slate-800/80">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>PRODUCTION READY</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live System Posture Spec Strip */}
        <div className="mt-16 rounded-xl border border-slate-800/90 bg-[#050b16]/90 p-6 backdrop-blur-2xl font-mono text-xs shadow-2xl">
          <div className="grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
            <div>
              <div className="text-slate-400 text-[10px]">DETECTION CONFIDENCE</div>
              <div className="mt-1 text-xl font-bold text-cyan-300">98.4%</div>
            </div>
            <div>
              <div className="text-slate-500 text-[10px]">MITIGATION LATENCY</div>
              <div className="mt-1 text-xl font-bold text-cyan-300">&lt; 12ms</div>
            </div>
            <div>
              <div className="text-slate-500 text-[10px]">ACTIVE FLOWS</div>
              <div className="mt-1 text-xl font-bold text-cyan-300">148 FLOWS</div>
            </div>
            <div>
              <div className="text-slate-500 text-[10px]">SYSTEM STATUS</div>
              <div className="mt-1 text-xl font-bold text-cyan-300">NOMINAL</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

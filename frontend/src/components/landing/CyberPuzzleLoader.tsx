"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Sparkles, CheckCircle, Cpu } from "lucide-react";

interface CyberPuzzleLoaderProps {
  onComplete: () => void;
}

interface GridCell {
  id: number;
  letter: string;
  row: number;
  col: number;
}

export function CyberPuzzleLoader({ onComplete }: CyberPuzzleLoaderProps) {
  const targetWord = "CHAKRAVYUH".split("");
  const targetRow = 4; // Word aligns on row index 4

  const [gameState, setGameState] = useState<{
    grid: GridCell[];
    solvedCount: number;
    isSolving: boolean;
  }>({
    grid: [],
    solvedCount: 0,
    isSolving: false,
  });

  // Initialize grid once on mount
  useEffect(() => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const tempGrid: GridCell[] = [];
    
    // 1. Generate 100 random cells
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        const randomLetter = letters[Math.floor(Math.random() * letters.length)];
        tempGrid.push({
          id: r * 10 + c,
          letter: randomLetter,
          row: r,
          col: c,
        });
      }
    }

    // 2. Identify 10 random positions NOT on row 4 to place CHAKRAVYUH letters
    const scatteredCoords: { r: number; c: number }[] = [];
    while (scatteredCoords.length < 10) {
      const r = Math.floor(Math.random() * 10);
      const c = Math.floor(Math.random() * 10);
      if (r !== targetRow && !scatteredCoords.some((coord) => coord.r === r && coord.c === c)) {
        scatteredCoords.push({ r, c });
      }
    }

    // 3. Inject CHAKRAVYUH letters
    scatteredCoords.forEach((coord, idx) => {
      const gridIdx = coord.r * 10 + coord.c;
      tempGrid[gridIdx].letter = targetWord[idx];
    });

    setGameState({
      grid: tempGrid,
      solvedCount: 0,
      isSolving: false,
    });

    // Start solving automatically after 1 second
    const delay = setTimeout(() => {
      setGameState((prev) => ({ ...prev, isSolving: true }));
    }, 1000);

    return () => clearTimeout(delay);
  }, []);

  // Stable Solver Loop using unified state
  useEffect(() => {
    if (!gameState.isSolving || gameState.solvedCount >= 10) return;

    const interval = setInterval(() => {
      setGameState((prev) => {
        const count = prev.solvedCount;
        if (count >= 10) {
          clearInterval(interval);
          return prev;
        }

        const letterToPlace = targetWord[count];
        const targetCol = count;
        const targetGridIdx = targetRow * 10 + targetCol;

        // Find the index of the letter currently in the grid
        let currentIdx = -1;
        for (let i = 0; i < prev.grid.length; i++) {
          const cell = prev.grid[i];
          const isAlreadySolved = cell.row === targetRow && cell.col < count;
          if (cell.letter === letterToPlace && !isAlreadySolved && i !== targetGridIdx) {
            currentIdx = i;
            break;
          }
        }

        if (currentIdx === -1) {
          return {
            ...prev,
            solvedCount: count + 1,
          };
        }

        // Swap letters in grid
        const newGrid = [...prev.grid];
        const temp = newGrid[targetGridIdx].letter;
        newGrid[targetGridIdx].letter = newGrid[currentIdx].letter;
        newGrid[currentIdx].letter = temp;

        return {
          ...prev,
          grid: newGrid,
          solvedCount: count + 1,
        };
      });
    }, 200); // Fast 200ms swaps

    return () => clearInterval(interval);
  }, [gameState.isSolving, gameState.solvedCount]);

  const isSolved = gameState.solvedCount === 10;

  useEffect(() => {
    if (isSolved) {
      const timer = setTimeout(() => {
        onComplete();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isSolved, onComplete]);

  // Sort grid by row/col to render correctly
  const sortedGrid = [...gameState.grid].sort((a, b) => a.row * 10 + a.col - (b.row * 10 + b.col));

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F4F7FB] p-6 text-[#0F2747] font-sans overflow-hidden">
      {/* Background Accent Grid */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.05),transparent_70%)] z-0" />
      <div className="pointer-events-none absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] bg-[size:40px_40px] z-0" />

      {/* Header Bar */}
      <div className="relative z-10 flex w-full max-w-4xl items-center justify-between border border-[#D9E3EF] bg-white px-5 py-4 rounded-xl shadow-sm mb-8">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg border border-[#2563EB]/30 bg-blue-50 text-[#2563EB]">
            <Shield className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="text-sm font-extrabold tracking-wider text-[#0F2747]">
              🛡️ CHAKRAVYUH AI
            </div>
            <div className="text-[10px] tracking-wider text-[#7A8CA0] uppercase">
              AUTONOMOUS SOC SECURITY COMMAND
            </div>
          </div>
        </div>

        <button
          onClick={onComplete}
          className="rounded-lg border border-[#2563EB]/40 bg-blue-50/50 px-4 py-1.5 text-xs font-bold text-[#2563EB] hover:bg-blue-100 transition"
        >
          SKIP PUZZLE
        </button>
      </div>

      {/* Grid Decryption Interface */}
      <div className="relative z-10 w-full max-w-2xl bg-white border border-[#D9E3EF] rounded-2xl shadow-md p-6 flex flex-col items-center space-y-6">
        <div className="text-center max-w-lg">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs text-[#2563EB] font-bold mb-2">
            <Cpu className="w-3.5 h-3.5 animate-spin" />
            <span>🧠 ST-GNN MATRIX SORTING ACTIVE</span>
          </div>
          <h2 className="text-xl font-extrabold text-[#0F2747]">
            Deciphering Spatial Graph Node
          </h2>
          <p className="text-xs text-[#7A8CA0] mt-1">
            Watch the node blocks swap automatically in the 10x10 matrix to align the passcode row.
          </p>
        </div>

        {/* 10x10 Grid Viewport */}
        <div className="bg-[#F8FAFD] border border-[#D9E3EF] p-4 rounded-2xl shadow-inner">
          <div className="grid grid-cols-10 gap-1.5 sm:gap-2">
            {sortedGrid.map((cell) => {
              const isTargetRow = cell.row === targetRow;
              const isSolvedCell = isTargetRow && cell.col < gameState.solvedCount;

              return (
                <motion.div
                  key={cell.id}
                  layout
                  transition={{ type: "spring", stiffness: 220, damping: 20 }}
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm border transition-all duration-200 select-none ${
                    isSolvedCell
                      ? "bg-[#2563EB] border-[#2563EB] text-white shadow-md scale-105"
                      : isTargetRow
                      ? "bg-blue-50/50 border-blue-200 text-[#2563EB]"
                      : "bg-white border-[#D9E3EF] text-[#7A8CA0]/60"
                  }`}
                >
                  {cell.letter}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Success Trigger / Progress Alert */}
        <AnimatePresence>
          {isSolved && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full bg-emerald-50 border border-emerald-250 p-3.5 rounded-xl flex items-center justify-center gap-3 text-emerald-800 font-extrabold text-xs"
            >
              <CheckCircle className="w-4 h-4 text-[#10B981] animate-bounce" />
              <span>🔐 PASSCODE ROW ALIGNED! DECRYPTED VAULT GRANTED...</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Version */}
      <div className="mt-8 text-[10px] text-[#7A8CA0] font-mono tracking-wider">
        CHAKRAVYUH SECURE INTEGRITY AGENT v2.4.0
      </div>
    </div>
  );
}

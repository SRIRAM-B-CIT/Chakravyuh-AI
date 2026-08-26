"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Shield, ArrowRight, Lock, Unlock, Cpu, Activity, Sparkles } from "lucide-react";

interface CyberPuzzleLoaderProps {
  onComplete: () => void;
}

export function CyberPuzzleLoader({ onComplete }: CyberPuzzleLoaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [secondsLeft, setSecondsLeft] = useState(5);
  const [progressPct, setProgressPct] = useState(0);

  const progressPctRef = useRef(0);
  useEffect(() => {
    progressPctRef.current = progressPct;
  }, [progressPct]);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 5000; // 5 seconds duration

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(Math.round((elapsed / duration) * 100), 100);
      setProgressPct(pct);

      const rem = Math.max(Math.ceil((duration - elapsed) / 1000), 0);
      setSecondsLeft(rem);

      if (elapsed >= duration) {
        clearInterval(timer);
        setTimeout(onComplete, 400);
      }
    }, 100);

    return () => clearInterval(timer);
  }, [onComplete]);

  // Three.js 3D WebGL Cyber Puzzle Scene
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xfff0f2, 0.045);

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 0.5, 7.2);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0xfff0f2, 1);

    // Dynamic WebGL Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const pinkLight = new THREE.PointLight(0xdb2777, 4, 18);
    pinkLight.position.set(0, 1, 3);
    scene.add(pinkLight);

    const roseLight = new THREE.PointLight(0xf43f5e, 3.5, 15);
    roseLight.position.set(-3, -2, 2);
    scene.add(roseLight);

    const secondaryPinkLight = new THREE.PointLight(0xec4899, 3, 15);
    secondaryPinkLight.position.set(3, 2, 1);
    scene.add(secondaryPinkLight);

    // 3D Cyber Horizon Grid Plane
    const gridBottom = new THREE.GridHelper(40, 45, 0xdb2777, 0xf5c6d2); // Deep Rose grid lines
    gridBottom.position.y = -2.6;
    scene.add(gridBottom);

    const gridTop = new THREE.GridHelper(40, 30, 0xf43f5e, 0xffe5e9); // Light pink grid lines
    gridTop.position.y = 8;
    gridTop.rotation.x = Math.PI;
    scene.add(gridTop);

    // Central 3D Puzzle Core & Rings
    const lockGroup = new THREE.Group();
    lockGroup.position.set(0, 0.1, 0);

    // Core Wireframe Sphere
    const coreGeom = new THREE.IcosahedronGeometry(0.75, 2);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      wireframe: true,
      emissive: 0x0284c7,
      emissiveIntensity: 0.9,
      roughness: 0.2,
    });
    const coreMesh = new THREE.Mesh(coreGeom, coreMat);
    lockGroup.add(coreMesh);



    // 8 Corner Key Blocks
    const fragmentGroup = new THREE.Group();
    const fragmentMeshes: THREE.Mesh[] = [];
    const fragmentPositions: THREE.Vector3[] = [];

    const offsets = [
      [-0.65, -0.65, -0.65], [0.65, -0.65, -0.65],
      [-0.65, 0.65, -0.65], [0.65, 0.65, -0.65],
      [-0.65, -0.65, 0.65], [0.65, -0.65, 0.65],
      [-0.65, 0.65, 0.65], [0.65, 0.65, 0.65],
    ];

    offsets.forEach(([x, y, z]) => {
      const boxGeom = new THREE.BoxGeometry(0.48, 0.48, 0.48);
      const edges = new THREE.EdgesGeometry(boxGeom);
      const boxMat = new THREE.MeshStandardMaterial({
        color: 0xef4444, // Red puzzle blocks
        transparent: true,
        opacity: 0.75,
        metalness: 0.8,
      });
      const boxMesh = new THREE.Mesh(boxGeom, boxMat);

      const lineMat = new THREE.LineBasicMaterial({ color: 0x06b6d4 }); // Cyan borders
      boxMesh.add(new THREE.LineSegments(edges, lineMat));

      boxMesh.position.set(x, y, z);
      fragmentMeshes.push(boxMesh);
      fragmentPositions.push(new THREE.Vector3(x, y, z));
      fragmentGroup.add(boxMesh);
    });
    lockGroup.add(fragmentGroup);

    // Concentric Cipher Rings
    const ring1Geom = new THREE.TorusGeometry(1.65, 0.03, 16, 100);
    const ring1Mat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0891b2, roughness: 0.1 });
    const ring1 = new THREE.Mesh(ring1Geom, ring1Mat);
    lockGroup.add(ring1);

    const ring2Geom = new THREE.TorusGeometry(2.15, 0.035, 16, 100);
    const ring2Mat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xdc2626, roughness: 0.1 });
    const ring2 = new THREE.Mesh(ring2Geom, ring2Mat);
    ring2.rotation.x = Math.PI / 3.5;
    lockGroup.add(ring2);

    const ring3Geom = new THREE.TorusGeometry(2.7, 0.025, 16, 100);
    const ring3Mat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0891b2, roughness: 0.1 });
    const ring3 = new THREE.Mesh(ring3Geom, ring3Mat);
    ring3.rotation.y = Math.PI / 2.8;
    lockGroup.add(ring3);

    scene.add(lockGroup);

    // Matrix Particle Dust (300 Particles)
    const particleCount = 300;
    const particleGeom = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePos[i] = (Math.random() - 0.5) * 26;
      particlePos[i + 1] = (Math.random() - 0.5) * 16;
      particlePos[i + 2] = (Math.random() - 0.5) * 22;
    }
    particleGeom.setAttribute("position", new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x06b6d4,
      size: 0.05,
      transparent: true,
      opacity: 0.75,
    });
    const particles = new THREE.Points(particleGeom, particleMat);
    scene.add(particles);

    // Mouse Parallax Effect
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 0.5;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 0.5;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Resize Handler
    const handleResize = () => {
      if (!canvas) return;
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    // Animation & Unlock Transition Loop
    let animId = 0;
    let time = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      time += 0.015;

      gridBottom.position.z = (gridBottom.position.z + 0.004) % 1;
      particles.rotation.y += 0.0006;

      const p = progressPctRef.current / 100;

      if (p < 0.75) {
        ring1.rotation.z += 0.015;
        ring2.rotation.y += 0.018;
        ring3.rotation.x += 0.012;

        fragmentMeshes.forEach((mesh, idx) => {
          const pos = fragmentPositions[idx];
          mesh.position.x = pos.x + Math.sin(time * 1.5 + idx) * 0.04;
          mesh.position.y = pos.y + Math.cos(time * 1.2 + idx) * 0.04;
        });

        lockGroup.rotation.y = time * 0.35;
      } else {
        // Alignment & Explosive Decryption Phase (0.75 -> 1.0)
        ring1.rotation.z += (0 - ring1.rotation.z) * 0.1;
        ring2.rotation.y += (0 - ring2.rotation.y) * 0.1;
        ring3.rotation.x += (0 - ring3.rotation.x) * 0.1;

        fragmentMeshes.forEach((mesh, idx) => {
          const orig = fragmentPositions[idx];
          const factor = 1 + (p - 0.75) * 10;
          mesh.position.x = orig.x * factor;
          mesh.position.y = orig.y * factor;
          mesh.position.z = orig.z * factor;
          mesh.rotation.x += 0.08;
          mesh.rotation.y += 0.08;
        });

        coreMat.emissive.setHex(0x06b6d4); // Cyan glow on unlock
        cyanLight.color.setHex(0x06b6d4);
        cyanLight.intensity = 4 + (p - 0.75) * 25;
        camera.position.z -= 0.06;
      }

      // Parallax smooth camera
      camera.position.x += (mouseX - camera.position.x) * 0.05;
      camera.position.y += (0.5 - mouseY - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
    };
  }, []); // Run once on mount

  const currentStepText =
    progressPct < 30
      ? "AUTHENTICATING CRYPTOGRAPHIC CIPHER STATE..."
      : progressPct < 70
      ? "ALIGNING ST-GNN SPATIAL GRAPH KEYS..."
      : progressPct < 95
      ? "PUZZLE DECRYPTED · UNLOCKING COMMAND VAULT..."
      : "AUTHENTICATION COMPLETE · LAUNCHING DASHBOARD";

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#F3F6FA] p-6 text-slate-800 font-mono selection:bg-blue-500 selection:text-white overflow-hidden">
      {/* 3D WebGL Canvas Background */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full pointer-events-none z-0" />

      {/* Laser Scanline Grid Overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.06),transparent_70%)] z-0" />
      <div className="pointer-events-none absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] bg-[size:40px_40px] z-0" />

      {/* Top Header Navigation */}
      <div className="relative z-10 flex w-full max-w-5xl items-center justify-between border border-slate-200 bg-white/95 p-4 backdrop-blur-md rounded-xl shadow-md">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg border border-blue-500/50 bg-blue-500/10 text-blue-600 shadow-[0_4px_12px_rgba(37,99,235,0.15)]">
            <Shield className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-[0.2em] text-slate-800">
              CHAKRAVYUH AI
            </div>
            <div className="text-[9px] tracking-[0.25em] text-slate-500">
              AUTONOMOUS SOC COMMAND GATEWAY
            </div>
          </div>
        </div>

        <button
          onClick={onComplete}
          className="flex items-center gap-2 rounded-lg border border-blue-500/40 bg-blue-50/50 px-4 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-100 hover:border-blue-500 transition shadow-sm"
        >
          <span>SKIP INTRO ({secondsLeft}s)</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Center Callout */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-4 max-w-xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/40 bg-blue-50/80 px-4 py-1.5 text-xs text-blue-700 backdrop-blur-md shadow-sm">
          <Lock className="h-3.5 w-3.5 text-blue-600" />
          <span>3D CRYPTOGRAPHIC CIPHER DECIPHERING ({secondsLeft}s)</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-wider">
          DECIPHERING SOC COMMAND VAULT
        </h1>

        <p className="text-xs text-slate-600 leading-relaxed font-sans max-w-md">
          Synchronizing spatial ST-GNN graph embeddings, RSSM rollout states, and iptables netfilter security policies.
        </p>
      </div>

      {/* Bottom Progress Bar & Details Card */}
      <div className="relative z-10 w-full max-w-xl space-y-3 border border-slate-200 bg-white/95 p-5 rounded-xl backdrop-blur-md shadow-md">
        <div className="flex items-center justify-between text-xs">
          <span className="text-blue-600 font-bold text-[11px] flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-blue-500 animate-spin" />
            {currentStepText}
          </span>
          <span className="text-slate-800 font-bold">{progressPct}%</span>
        </div>

        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-150 shadow-sm"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-200">
          <span>CLEARANCE: LEVEL 5</span>
          <span className="text-blue-600 font-bold">SECURITY STATUS: NOMINAL</span>
        </div>
      </div>
    </div>
  );
}

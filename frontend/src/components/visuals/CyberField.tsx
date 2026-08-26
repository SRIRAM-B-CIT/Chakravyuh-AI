"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { SystemState } from "@/lib/types";

export function CyberField({ state }: { state: SystemState }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const risk = state?.risk_score || 0;
  const isAttack = risk >= 0.5 || (state?.label && state?.label !== "Benign");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x04070d, 0.08);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 4.5, 9);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x04070d, 0);

    // 1. Dual Cyber Grid Planes (Bottom & Top Far Depth)
    const gridColor1 = isAttack ? 0xef4444 : 0x0ea5e9;
    const gridColor2 = 0x0b172a;
    const gridBottom = new THREE.GridHelper(30, 40, gridColor1, gridColor2);
    gridBottom.position.y = -2;
    scene.add(gridBottom);

    const gridTop = new THREE.GridHelper(30, 20, 0x0284c7, 0x071120);
    gridTop.position.y = 8;
    gridTop.rotation.x = Math.PI;
    scene.add(gridTop);

    // 2. Floating 3D Particle Cloud
    const particleCount = 180;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 24;
      particlePositions[i + 1] = (Math.random() - 0.5) * 12;
      particlePositions[i + 2] = (Math.random() - 0.5) * 20;
    }

    particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: isAttack ? 0xf87171 : 0x38bdf8,
      size: 0.05,
      transparent: true,
      opacity: 0.7,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // 3. Connected 3D Network Node Graph
    const nodeGroup = new THREE.Group();
    const nodeCoords = [
      { x: -4, y: 0.5, z: -2, color: 0x38bdf8 },
      { x: -1.5, y: -0.2, z: -1, color: 0x34d399 },
      { x: 1, y: 0.8, z: -3, color: 0xa78bfa },
      { x: 3.5, y: -0.5, z: -1.5, color: isAttack ? 0xf87171 : 0x38bdf8 },
      { x: 0, y: -1, z: 1, color: 0x00f5d4 },
    ];

    const nodeMeshes: THREE.Mesh[] = [];
    nodeCoords.forEach((nc) => {
      const geom = new THREE.SphereGeometry(nc.color === 0xf87171 ? 0.18 : 0.12, 16, 16);
      const mat = new THREE.MeshBasicMaterial({
        color: nc.color,
        wireframe: true,
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(nc.x, nc.y, nc.z);
      nodeGroup.add(mesh);
      nodeMeshes.push(mesh);
    });
    scene.add(nodeGroup);

    // 4. Connecting Vector Lines
    const linesGroup = new THREE.Group();
    const connections = [
      [0, 1], [1, 2], [2, 3], [1, 4], [3, 4]
    ];

    connections.forEach(([fromIdx, toIdx]) => {
      const from = nodeCoords[fromIdx];
      const to = nodeCoords[toIdx];
      const lineGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(from.x, from.y, from.z),
        new THREE.Vector3(to.x, to.y, to.z)
      ]);
      const lineMat = new THREE.LineBasicMaterial({
        color: (fromIdx === 3 || toIdx === 3) && isAttack ? 0xf87171 : 0x0284c7,
        transparent: true,
        opacity: 0.45,
      });
      linesGroup.add(new THREE.Line(lineGeom, lineMat));
    });
    scene.add(linesGroup);

    // Mouse parallax tracking
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 0.4;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 0.4;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Resize Handler
    const handleResize = () => {
      if (!canvas) return;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };
    handleResize();

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvas);

    // Animation Loop
    let animId = 0;
    let time = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      time += 0.01;

      gridBottom.position.z = (gridBottom.position.z + 0.003) % 1;
      particles.rotation.y += 0.0005;
      nodeGroup.rotation.y = Math.sin(time * 0.3) * 0.15;
      linesGroup.rotation.y = Math.sin(time * 0.3) * 0.15;

      // Pulse nodes
      nodeMeshes.forEach((m, idx) => {
        m.rotation.x += 0.01;
        m.rotation.y += 0.01;
        m.position.y += Math.sin(time * 2 + idx) * 0.002;
      });

      // Smooth camera parallax
      camera.position.x += (mouseX - camera.position.x) * 0.05;
      camera.position.y += (4.5 - mouseY - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", handleMouseMove);
      resizeObserver.disconnect();
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points || obj instanceof THREE.Line) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
    };
  }, [risk, isAttack]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-60 z-0"
    />
  );
}

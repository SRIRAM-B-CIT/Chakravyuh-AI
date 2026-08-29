"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface CyberPuzzle3DProps {
  isUnlocking: boolean;
  onUnlocked: () => void;
  statusText?: string;
}

export function CyberPuzzle3D({
  isUnlocking,
  onUnlocked,
  statusText = "CYBER CIPHER PUZZLE LOCKED",
}: CyberPuzzle3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isUnlockingRef = useRef(isUnlocking);
  const onUnlockedRef = useRef(onUnlocked);

  useEffect(() => {
    isUnlockingRef.current = isUnlocking;
    onUnlockedRef.current = onUnlocked;
  }, [isUnlocking, onUnlocked]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 1. Scene, Perspective Camera & Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xfff0f2, 0.045);

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 1.2, 7.5);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0xfff0f2, 1);

    // 2. Dynamic Point Lights & Ambient Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const pinkPointLight = new THREE.PointLight(0xdb2777, 4, 18);
    pinkPointLight.position.set(0, 1, 3);
    scene.add(pinkPointLight);

    const rosePointLight = new THREE.PointLight(0xf43f5e, 3, 15);
    rosePointLight.position.set(-4, -2, 2);
    scene.add(rosePointLight);

    const secondaryPinkLight = new THREE.PointLight(0xec4899, 3, 15);
    secondaryPinkLight.position.set(4, 3, 1);
    scene.add(secondaryPinkLight);

    // 3. Cyber Grid Horizon Plane (Bottom Grid)
    const gridHelper = new THREE.GridHelper(40, 45, 0xdb2777, 0xf5c6d2); // Deep Rose grid lines
    gridHelper.position.y = -2.8;
    scene.add(gridHelper);

    // Top Far Ceiling Grid
    const topGrid = new THREE.GridHelper(40, 30, 0xf43f5e, 0xffe5e9); // Light pink grid lines
    topGrid.position.y = 8;
    topGrid.rotation.x = Math.PI;
    scene.add(topGrid);

    // 4. Central 3D Cyber Cryptographic Lock Assembly
    const lockGroup = new THREE.Group();
    lockGroup.position.set(0, 0.2, 0);

    // Core Glowing Sphere
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



    // Nested Cyber Fragment Cubes (8 Corner Key Blocks)
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
        color: 0xef4444, // Red blocks
        transparent: true,
        opacity: 0.75,
        roughness: 0.2,
        metalness: 0.8,
      });
      const boxMesh = new THREE.Mesh(boxGeom, boxMat);

      const lineMat = new THREE.LineBasicMaterial({ color: 0x06b6d4 }); // Cyan outlines
      const lineSegments = new THREE.LineSegments(edges, lineMat);
      boxMesh.add(lineSegments);

      boxMesh.position.set(x, y, z);
      fragmentMeshes.push(boxMesh);
      fragmentPositions.push(new THREE.Vector3(x, y, z));
      fragmentGroup.add(boxMesh);
    });
    lockGroup.add(fragmentGroup);

    // Concentric Cryptographic Cipher Rings
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

    // 5. Surrounding 3D Network Graph Nodes & Vector Lines
    const nodeGroup = new THREE.Group();
    const nodeCoords = [
      { x: -4.5, y: 1.5, z: -2.5, color: 0x06b6d4 },
      { x: -3, y: -1.2, z: -1, color: 0xef4444 },
      { x: 3, y: 2, z: -3, color: 0x06b6d4 },
      { x: 4.5, y: -1, z: -2, color: 0xef4444 },
      { x: -1, y: 2.8, z: -3.5, color: 0x06b6d4 },
      { x: 1.5, y: -2.5, z: -2, color: 0xef4444 },
    ];

    const networkNodes: THREE.Mesh[] = [];
    nodeCoords.forEach((nc) => {
      const geom = new THREE.SphereGeometry(0.12, 16, 16);
      const mat = new THREE.MeshStandardMaterial({
        color: nc.color,
        emissive: nc.color,
        emissiveIntensity: 0.5,
        wireframe: true,
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(nc.x, nc.y, nc.z);
      nodeGroup.add(mesh);
      networkNodes.push(mesh);
    });
    scene.add(nodeGroup);

    // Vector Connection Lines
    const linesGroup = new THREE.Group();
    const connections = [
      [0, 1], [1, 5], [5, 3], [3, 2], [2, 4], [4, 0]
    ];
    connections.forEach(([fromIdx, toIdx]) => {
      const from = nodeCoords[fromIdx];
      const to = nodeCoords[toIdx];
      const lineGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(from.x, from.y, from.z),
        new THREE.Vector3(to.x, to.y, to.z)
      ]);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x06b6d4, // Cyan line connection
        transparent: true,
        opacity: 0.45,
      });
      linesGroup.add(new THREE.Line(lineGeom, lineMat));
    });
    scene.add(linesGroup);

    // 6. Floating Data Matrix Particle Cloud (300 Particles)
    const particleCount = 300;
    const particleGeom = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePos[i] = (Math.random() - 0.5) * 28;
      particlePos[i + 1] = (Math.random() - 0.5) * 16;
      particlePos[i + 2] = (Math.random() - 0.5) * 24;
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

    // Mouse parallax movement
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

    // Animation & Unlock Transition State
    let animId = 0;
    let time = 0;
    let unlockProgress = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      time += 0.015;

      // Scroll cyber grid plane continuously
      gridHelper.position.z = (gridHelper.position.z + 0.004) % 1;
      particles.rotation.y += 0.0006;
      nodeGroup.rotation.y = Math.sin(time * 0.2) * 0.15;
      linesGroup.rotation.y = Math.sin(time * 0.2) * 0.15;

      if (isUnlockingRef.current) {
        unlockProgress = Math.min(unlockProgress + 0.016, 1);
      }

      // 3D Puzzle Lock Behavior
      if (unlockProgress === 0) {
        ring1.rotation.z += 0.012;
        ring2.rotation.y += 0.015;
        ring3.rotation.x += 0.01;

        // Ambient puzzle floating
        fragmentMeshes.forEach((mesh, idx) => {
          const pos = fragmentPositions[idx];
          mesh.position.x = pos.x + Math.sin(time * 1.5 + idx) * 0.04;
          mesh.position.y = pos.y + Math.cos(time * 1.2 + idx) * 0.04;
        });

        lockGroup.rotation.y = time * 0.35;
      } else {
        // Alignment & Vault Decryption Opening
        ring1.rotation.z += (0 - ring1.rotation.z) * 0.1;
        ring2.rotation.y += (0 - ring2.rotation.y) * 0.1;
        ring3.rotation.x += (0 - ring3.rotation.x) * 0.1;

        // Fragment explosion outwards (3D Vault Opening)
        fragmentMeshes.forEach((mesh, idx) => {
          const origPos = fragmentPositions[idx];
          mesh.position.x = origPos.x * (1 + unlockProgress * 4.5);
          mesh.position.y = origPos.y * (1 + unlockProgress * 4.5);
          mesh.position.z = origPos.z * (1 + unlockProgress * 4.5);
          mesh.rotation.x += 0.06;
          mesh.rotation.y += 0.06;
        });

        // Surge Cyan lighting
        coreMat.emissive.setHex(0x06b6d4);
        cyanPointLight.color.setHex(0x06b6d4);
        cyanPointLight.intensity = 4 + unlockProgress * 12;

        // Camera zooms forward into open vault core
        camera.position.z -= unlockProgress * 0.1;

        if (unlockProgress >= 0.98) {
          onUnlockedRef.current();
        }
      }

      // Smooth camera parallax
      camera.position.x += (mouseX - camera.position.x) * 0.05;
      camera.position.y += (1.2 - mouseY - camera.position.y) * 0.05;
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
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points || obj instanceof THREE.Line) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
    };
  }, []); // Run once on mount

  return (
    <div className="fixed inset-0 z-0 h-full w-full pointer-events-none">
      <canvas ref={canvasRef} className="h-full w-full" />

      {/* Cyber Grid Scanline Overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.12),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-25 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:48px_48px]" />
    </div>
  );
}

#!/usr/bin/env python3
"""
Chakravyuh AI: Unified Multi-Vector Adversarial Attack Suite
Provides an interactive menu and CLI launcher for all trained MITRE attack categories:
  [1] High-Density DoS / Traffic Flood (traffic_flood.py)
  [2] SYN Reconnaissance Port Scan (recon_scan.py)
  [3] Credential Stuffing & Brute Force (brute_force.py)
  [4] Infiltration / RCE / Exploit Payload (infiltration_exploit.py)
  [5] Botnet C2 Beacons & Lateral Movement (bot_lateral.py)
  [6] Slowloris Low-and-Slow Socket Exhaustion (slowloris_dos.py)
"""

import os
import sys
import time
import socket
import subprocess

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PYTHON_EXE = sys.executable

ATTACK_VECTORS = {
    "1": {
        "name": "High-Density DoS / Traffic Surge",
        "category": "DoS/Flood (Class 4)",
        "script": "traffic_flood.py",
        "default_port": 8000,
        "default_duration": 30
    },
    "2": {
        "name": "SYN Reconnaissance Port Scan",
        "category": "Recon/PortScan (Class 1)",
        "script": "recon_scan.py",
        "default_port": 80,
        "default_duration": 30
    },
    "3": {
        "name": "SSH / FTP / Auth Credential Brute-Force",
        "category": "Recon/BruteForce (Class 1)",
        "script": "brute_force.py",
        "default_port": 8000,
        "default_duration": 30
    },
    "4": {
        "name": "Infiltration / RCE & Command Injection",
        "category": "Infiltration (Class 2)",
        "script": "infiltration_exploit.py",
        "default_port": 8000,
        "default_duration": 30
    },
    "5": {
        "name": "Botnet C2 Beaconing & Lateral Spread",
        "category": "Bot/LateralMovement (Class 3)",
        "script": "bot_lateral.py",
        "default_port": 8000,
        "default_duration": 30
    },
    "6": {
        "name": "Slowloris Low-and-Slow Socket Exhaustion",
        "category": "DoS/Flood (Slowloris Variant)",
        "script": "slowloris_dos.py",
        "default_port": 8000,
        "default_duration": 30
    }
}

def print_banner():
    print("""
╔══════════════════════════════════════════════════════════════════════════╗
║               CHAKRAVYUH AI: ADVERSARIAL ATTACK TEST SUITE               ║
║           Simulate Real-World Attacks against ST-GNN & RSSM Defense      ║
╚══════════════════════════════════════════════════════════════════════════╝
""")

def run_attack(choice: str, target_ip: str, target_port: int, duration: int = 10):
    vec = ATTACK_VECTORS.get(choice)
    if not vec:
        print("[!] Invalid attack vector choice.")
        return

    script_path = os.path.join(BASE_DIR, vec["script"])
    if not os.path.exists(script_path):
        print(f"[!] Attack script not found: {script_path}")
        return

    cmd = [PYTHON_EXE, script_path, target_ip, str(target_port)]
    if choice != "2":
        cmd.extend(["--duration", str(duration)])

    print(f"\n[🚀] Launching Vector: {vec['name']} ({vec['category']})")
    print(f"[🎯] Target: {target_ip}:{target_port} | Duration: {duration}s\n")
    
    try:
        subprocess.run(cmd)
    except KeyboardInterrupt:
        print("\n[!] Attack interrupted by operator.")

def get_default_target_ip() -> str:
    return "127.0.0.1"

def interactive_menu():
    print_banner()
    print("Available Adversarial Vectors:")
    for k, v in sorted(ATTACK_VECTORS.items()):
        print(f"  [{k}] {v['name']:<48} → {v['category']}")
    print("  [0] Exit")
    print("─" * 74)

    choice = input("\nSelect Attack Vector [1-6, 0 to exit]: ").strip()
    if choice in ("0", "exit", "q"):
        print("Exiting attack console.")
        return

    if choice not in ATTACK_VECTORS:
        print("[!] Invalid selection.")
        return

    vec = ATTACK_VECTORS[choice]
    default_port = vec["default_port"]
    default_dur = vec["default_duration"]

    target_ip = input("\nEnter Target IP (default 127.0.0.1): ").strip() or "127.0.0.1"
    port_in = input(f"Enter Target Port (default {default_port}): ").strip()
    target_port = int(port_in) if port_in else default_port
    dur_in = input(f"Enter Duration in seconds (default {default_dur}s): ").strip()
    duration = int(dur_in) if dur_in else default_dur

    run_attack(choice, target_ip, target_port, duration)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # CLI direct mode: attack_suite.py <vector_num> [target_ip] [target_port] [duration]
        vector = sys.argv[1]
        t_ip = sys.argv[2] if len(sys.argv) > 2 else get_default_target_ip()
        t_port = int(sys.argv[3]) if len(sys.argv) > 3 else ATTACK_VECTORS.get(vector, {}).get("default_port", 8000)
        t_dur = int(sys.argv[4]) if len(sys.argv) > 4 else 10
        run_attack(vector, t_ip, t_port, t_dur)
    else:
        interactive_menu()

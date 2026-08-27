#!/usr/bin/env python3
"""
Chakravyuh AI: Botnet C2 Beaconing & Multi-Node Lateral Movement Simulator
Target MITRE Class: Bot/LateralMovement (Class 3: Botnet C2 & Internal Spreading)
Simulates periodic Command & Control heartbeat beacons and multi-destination lateral movement sweeps.
"""

import socket
import sys
import time
import argparse
import threading
import random

stop_event = threading.Event()

# Multi-node target IP list representing lateral movement discovery targets
INTERNAL_HOST_TARGETS = [
    "127.0.0.1",
    "192.168.29.104",  # Defense Controller
    "192.168.29.42",   # Internal Server
    "192.168.29.1",    # Gateway Router
    "192.168.29.150",  # Database Host
    "192.168.29.180"   # Workstation Node
]

LATERAL_PORTS = [8000, 445, 139, 3389, 22, 8080, 5432]

def c2_beacon_worker(target_ip: str, target_port: int, worker_id: int):
    """Simulates persistent Botnet C2 heartbeat check-ins and command polling."""
    bot_guid = f"BOT-NODE-{worker_id:03d}-X86"
    
    while not stop_event.is_set():
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(0.7)
            s.connect((target_ip, target_port))
            
            # Encrypted / encoded C2 beacon packet simulation
            beacon_payload = (
                f"POST /c2/heartbeat HTTP/1.1\r\n"
                f"Host: {target_ip}\r\n"
                f"X-Bot-ID: {bot_guid}\r\n"
                f"X-C2-Stage: Checkin_Active\r\n"
                f"User-Agent: Mozilla/5.0 (compatible; BotnetAgent/2.4)\r\n"
                f"Content-Length: 42\r\n\r\n"
                f"status=ready&uptime=3600&task=await_command"
            ).encode()
            
            s.send(beacon_payload)
            s.close()
        except Exception:
            pass
            
        time.sleep(random.uniform(0.05, 0.15))

def lateral_sweep_worker(target_ip: str, target_port: int):
    """Simulates multi-destination spreading / port sweep characteristic of lateral movement."""
    while not stop_event.is_set():
        probe_port = random.choice(LATERAL_PORTS)
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(0.4)
            # Connect to designated defense target port
            s.connect((target_ip, target_port))
            
            # Send SMB/RPC/RDP lateral propagation probe signature
            lateral_probe = (
                f"GET /probe?node={random.choice(INTERNAL_HOST_TARGETS)}&port={probe_port} HTTP/1.1\r\n"
                f"Host: {target_ip}\r\n"
                f"X-Lateral-Spread: True\r\n\r\n"
            ).encode()
            s.send(lateral_probe)
            s.close()
        except Exception:
            pass
            
        time.sleep(0.03)

def start_bot_lateral(target_ip: str, target_port: int = 8000, threads: int = 10, duration: int = 10):
    print("=" * 55)
    print(f"[ATTACK SIMULATION] Launching Botnet C2 & Lateral Spread on {target_ip}:{target_port}")
    print(f"Target MITRE Class: Bot/LateralMovement (Class 3)")
    print(f"Workers: {threads} | Duration: {duration}s | Vectors: C2 Beacons & Multi-Host Lateral Probing")
    print("=" * 55)

    stop_event.clear()
    thread_pool = []
    
    # Half workers do C2 heartbeat, half do lateral propagation sweeps
    for i in range(threads):
        if i % 2 == 0:
            t = threading.Thread(target=c2_beacon_worker, args=(target_ip, target_port, i))
        else:
            t = threading.Thread(target=lateral_sweep_worker, args=(target_ip, target_port))
            
        t.daemon = True
        t.start()
        thread_pool.append(t)

    try:
        for remaining in range(duration, 0, -1):
            sys.stdout.write(f"\r[⚡] Bot C2 beaconing & lateral probing underway... {remaining}s remaining (Press Ctrl+C) ")
            sys.stdout.flush()
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nAborted by user.")

    stop_event.set()
    print("\n[✓] Botnet / Lateral movement simulation finished.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Chakravyuh AI: Botnet C2 & Lateral Movement Simulator")
    parser.add_argument("target", nargs="?", default="127.0.0.1", help="Target Defense IP (default: 127.0.0.1)")
    parser.add_argument("port", nargs="?", type=int, default=8000, help="Target Port (default: 8000)")
    parser.add_argument("--workers", "-w", type=int, default=10, help="Concurrent workers (default: 10)")
    parser.add_argument("--duration", "-d", type=int, default=10, help="Duration in seconds (default: 10)")
    
    args = parser.parse_args()
    start_bot_lateral(args.target, args.port, args.workers, args.duration)

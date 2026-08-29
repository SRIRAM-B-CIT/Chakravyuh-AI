#!/usr/bin/env python3
"""
Chakravyuh AI: Reconnaissance SYN Port Scanner
Simulates an adversarial reconnaissance / lateral movement discovery probe.
"""

import socket
import sys
import time
import argparse
from concurrent.futures import ThreadPoolExecutor

def scan_port(target_ip: str, port: int):
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(0.4)
        result = sock.connect_ex((target_ip, port))
        if result == 0:
            print(f"[+] Port {port:5d} OPEN on {target_ip}")
        sock.close()
    except Exception:
        pass

def start_recon_scan(target_ip: str, start_port: int = 20, end_port: int = 1024, max_workers: int = 50):
    print(f"==================================================")
    print(f"[ATTACK SIMULATION] Starting SYN Recon Port Scan on {target_ip}")
    print(f"Targeting Ports: {start_port} to {end_port} | Threads: {max_workers}")
    print(f"==================================================")
    
    start_time = time.time()
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        for port in range(start_port, end_port + 1):
            executor.submit(scan_port, target_ip, port)
            
    duration = time.time() - start_time
    print(f"[✓] Recon scan complete in {duration:.2f} seconds.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Chakravyuh AI: Reconnaissance SYN Port Scanner")
    parser.add_argument("target", nargs="?", default="127.0.0.1", help="Target Defense IP (default: 127.0.0.1)")
    parser.add_argument("port", nargs="?", type=int, default=80, help="Target Port")
    parser.add_argument("--start-port", type=int, default=20, help="Start port range")
    parser.add_argument("--end-port", type=int, default=1024, help="End port range")
    parser.add_argument("--workers", "-w", type=int, default=50, help="Thread count")
    parser.add_argument("--duration", "-d", type=int, default=8, help="Duration (optional)")

    args, unknown = parser.parse_known_args()
    start_recon_scan(args.target, args.start_port, args.end_port, args.workers)

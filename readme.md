# Chakravyuh AI: World Model Cyber Defense

**NTRO Problem Statement SIH26153** | Predictive Attack Horizon & Targeted Host Micro-Isolation

Chakravyuh AI is a proactive, world-model-driven cybersecurity platform designed to predict threat trajectories across network nodes and automate targeted host micro-isolation via SOAR playbooks before critical compromise occurs.

---

## Key Features

* **Predictive Attack Horizon (RSSM):** Utilizes a Recurrent State-Space Model with continuous latent projections $P(S_{t+k} \mid S_t)$ to forecast forward threat scores across a $K$-step horizon without requiring immediate external observations.
* **Dynamic Graph Spatial Relational Topology (ST-GNN):** Aggregates multi-node topology features across Gateway, Defense Controller, Internal Core Servers, and detected external threat vectors.
* **Decoupled High-Performance Architecture:** High-throughput **FastAPI backend** streaming real-time JSON and WebSockets (`/ws/stream`) to an ultra-modern **Next.js 14+ command center dashboard**.
* **Automated SOAR Host Micro-Isolation:** Triggers targeted Linux Netfilter (`iptables DROP`) rules dynamically when ML confidence or RSSM $K$-horizon risk crosses 90%, with 1-click analyst rollback.
* **Integrated Adversarial Simulation Suite:** Ready-to-use attack scripts (`recon_scan.py`, `traffic_flood.py`, and interactive UI triggers) for live hackathon and operational demonstrations.

---

## System Architecture & File Structure

```text
SIH 2026/
├── data/                          # CSE-CIC-IDS2018 Training Datasets
└── Chakravyuh-AI/
    ├── server.py                  # FastAPI Real-time Backend & WebSocket Streamer
    ├── live_sniffer.py            # Live PyShark packet capture & ST-GNN topology generator
    ├── soar_agent.py              # Automated Linux iptables micro-isolation & rollback
    ├── model_rssm_gnn.py          # PyTorch ST-GNN & RSSM World Model implementation
    ├── recon_scan.py              # Test script: Multi-threaded SYN port scanner
    ├── traffic_flood.py           # Test script: High-density TCP connection flood
    ├── events.log                 # Shared live audit log stream
    ├── state.json                 # Real-time state exchange pipe
    ├── models/                    # Serialized models, scalers, and encoders
    │   ├── scaler.pkl
    │   ├── threat_classifier.pkl
    │   ├── label_encoder.pkl
    │   └── feature_names.pkl
    └── frontend/                  # Next.js 14+ Cyber Command Center Dashboard
        ├── src/app/page.tsx       # Main dashboard layout & real-time WS sync
        ├── src/components/        # MetricCards, TopologyGraph, HorizonChart, SoarControl, LiveLogs
        └── package.json
```

---

## Setup & Installation

### 1. Prerequisites
- **Defense Host (Laptop B):** Linux (Ubuntu/Zorin OS/Debian) with Python 3.10+, Wireshark/Tshark, and sudo iptables access.
- **Attacker Host (Laptop A):** Any OS on the same local subnet.
- **Node.js & npm:** Node 18+ and npm 9+.

### 2. Environment Setup
```bash
cd "/home/sriram/Desktop/SIH 2026"
source .venv/bin/activate
pip install -r requirements.txt  # Or install fastapi, uvicorn, pyshark, torch, torch-geometric
```

### 3. Frontend Setup
```bash
cd "/home/sriram/Desktop/SIH 2026/Chakravyuh-AI/frontend"
npm install
```

---

## Execution Guide

### Step 1: Start the FastAPI Backend Server
```bash
cd "/home/sriram/Desktop/SIH 2026/Chakravyuh-AI"
../.venv/bin/python server.py
```
*API running at `http://localhost:8000` (Docs: `http://localhost:8000/docs`)*

### Step 2: Start the Next.js Cyber Command Center
In a second terminal:
```bash
cd "/home/sriram/Desktop/SIH 2026/Chakravyuh-AI/frontend"
npm run dev
```
*Open `http://localhost:3000` in your browser.*

### Step 3: Start the Live Sniffer Engine (Optional / For Live Capture)
In a third terminal with superuser privileges:
```bash
cd "/home/sriram/Desktop/SIH 2026/Chakravyuh-AI"
sudo ../.venv/bin/python live_sniffer.py
```

---

## Simulating Cyber Attacks for Live Demonstration

### Option A: 1-Click Attack Spike via Next.js UI
Use the **"Simulate Attack Spike"** button in the **SOAR Autonomous Defense Console** on the web dashboard to instantly project threat trajectories and observe automated containment.

### Option B: High-Density Traffic Surge (Laptop A)
```bash
python traffic_flood.py 192.168.29.104
```

### Option C: SYN Reconnaissance Scan (Laptop A)
```bash
python recon_scan.py 192.168.29.104
```

---

## Netfilter Rule Verification & Management

- **Verify Dropped Packets in Linux Kernel:**
  ```bash
  sudo iptables -L INPUT -v -n | grep 192.168.29.124
  ```
- **Flush All Firewall Block Rules:**
  ```bash
  sudo iptables -F INPUT
  ```
- **Manually Unblock Specific IP:**
  ```bash
  sudo iptables -D INPUT -s 192.168.29.124 -j DROP
  ```
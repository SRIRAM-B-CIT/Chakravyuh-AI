# Chakravyuh AI: World Model Cyber Defense

**NTRO Problem Statement SIH26153** | Predictive Attack Horizon & Targeted Host Micro-Isolation

Chakravyuh AI is a proactive, world-model-driven cybersecurity platform designed to predict threat trajectories across network nodes and automate targeted host micro-isolation via SOAR playbooks before critical compromise occurs.

Supports both **Linux (Ubuntu/Debian/Zorin/RHEL)** and **Windows (10/11)**.

---

## Key Features

* **Predictive Attack Horizon (RSSM):** Recurrent State-Space Model with continuous latent projections $P(S_{t+k} \mid S_t)$ forecasting threat scores across a $K$-step horizon without waiting for external breach confirmation.
* **Dynamic Graph Spatial Relational Topology (ST-GNN):** Aggregates multi-node topology features across Gateway, Defense Controller, Internal Core Servers, and detected external threat vectors.
* **High-Throughput Decoupled Architecture:** High-performance **FastAPI backend** streaming real-time JSON and WebSockets (`/ws/stream`) with automatic HTTP polling fallback to a **Next.js 14+ cyber command dashboard**.
* **Cross-Platform Automated SOAR Micro-Isolation:**
  * **Linux:** Targeted Linux Netfilter (`iptables -A INPUT -s <IP> -j DROP`) micro-isolation.
  * **Windows:** Windows Defender Firewall (`netsh advfirewall firewall add rule ... action=block remoteip=<IP>`) micro-isolation.
  * 1-click analyst rollback across both platforms.
* **Lightning-Fast Dependency Management (`uv`):** Powered by `uv` for 10x-100x faster package resolution and cross-platform reproducibility.
* **Integrated Adversarial Attack Simulator:** Out-of-the-box attack tools (`traffic_flood.py`, `recon_scan.py`, and 1-click UI triggers) for live hackathon and operational demonstrations.

---

## System Architecture & File Structure

```text
Chakravyuh-AI/
├── pyproject.toml             # Modern uv / PEP 621 package specification
├── requirements.txt           # Pinned dependency manifest for uv/pip
├── server.py                  # FastAPI Backend & WebSocket Streamer (/ws/stream)
├── live_sniffer.py            # Live PyShark packet capture & ST-GNN topology engine
├── soar_agent.py              # Cross-platform SOAR micro-isolation (iptables & netsh)
├── model_rssm_gnn.py          # PyTorch ST-GNN & RSSM World Model implementation
├── recon_scan.py              # Adversarial SYN port scanner simulation
├── traffic_flood.py           # High-density DoS connection burst simulator
├── events.log                 # Real-time shared audit log stream
├── state.json                 # Real-time state exchange pipe
├── models/                    # Serialized models, scalers, and encoders
│   ├── scaler.pkl
│   ├── threat_classifier.pkl
│   ├── label_encoder.pkl
│   └── feature_names.pkl
└── frontend/                  # Next.js 14+ Cyber Command Center Dashboard
    ├── src/app/page.tsx       # Main dashboard layout & real-time WS manager
    ├── src/components/        # TopologyGraph, HorizonChart, MetricCards, SoarControl, LiveLogs
    └── package.json
```

---

## ⚡ Fast Installation with `uv`

[`uv`](https://github.com/astral-sh/uv) is an extremely fast Python package and environment manager.

### 1. Install `uv`

* **Linux / macOS:**
  ```bash
  curl -LsSf https://astral.sh/uv/install.sh | sh
  ```
* **Windows (PowerShell):**
  ```powershell
  powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
  ```
* *Alternatively (via pip on any OS):*
  ```bash
  pip install uv
  ```

---

### 2. Create Virtual Environment & Install Dependencies

Navigate into `Chakravyuh-AI` and run:

#### Linux / macOS:
```bash
cd Chakravyuh-AI
uv venv
source .venv/bin/activate
uv pip install -r requirements.txt
```

#### Windows (PowerShell / CMD):
```powershell
cd Chakravyuh-AI
uv venv
.venv\Scripts\activate
uv pip install -r requirements.txt
```

---

### 3. Frontend Setup (Next.js 14+)

In another terminal:
```bash
cd Chakravyuh-AI/frontend
npm install
```

---

## 🖥️ Running the Project

### On Linux (Ubuntu / Debian / Zorin OS)

Open 3 terminal tabs:

1. **Terminal 1 — FastAPI Backend**:
   ```bash
   cd Chakravyuh-AI
   uv run server.py
   ```
   *(Running on `http://localhost:8000` | API Docs: `http://localhost:8000/docs`)*

2. **Terminal 2 — Next.js Cyber Dashboard**:
   ```bash
   cd Chakravyuh-AI/frontend
   npm run dev
   ```
   *(Open **`http://localhost:3000`** in your browser)*

3. **Terminal 3 — Live Packet Sniffer (Superuser for Wi-Fi / Raw Capture)**:
   ```bash
   cd Chakravyuh-AI
   sudo .venv/bin/python live_sniffer.py
   ```

---

### On Windows 10 / 11

> **Prerequisite for Live Packet Sniffing on Windows:** Install [Wireshark for Windows](https://www.wireshark.org/download.html) or [Npcap](https://npcap.com/) (ensure *"Install Npcap in WinPcap API-compatible Mode"* is checked).

Open PowerShell (Run as Administrator for firewall containment):

1. **PowerShell 1 — FastAPI Backend**:
   ```powershell
   cd Chakravyuh-AI
   uv run server.py
   ```

2. **PowerShell 2 — Next.js Cyber Dashboard**:
   ```powershell
   cd Chakravyuh-AI\frontend
   npm run dev
   ```
   *(Open **`http://localhost:3000`** in your browser)*

3. **PowerShell 3 — Live Packet Sniffer (Administrator)**:
   ```powershell
   cd Chakravyuh-AI
   .venv\Scripts\python.exe live_sniffer.py
   ```

---

## 🧪 Testing & Attack Demonstrations

You can demonstrate proactive threat detection on a **single laptop (localhost)** or across **two laptops on the same Wi-Fi/LAN**.

### Option 1: High-Density DoS / Traffic Flood Test
Sends concurrent connection surges against the defense target:

* **Same Laptop:**
  ```bash
  uv run traffic_flood.py 127.0.0.1 8000
  ```
* **Two Laptops (From Attacker Laptop A to Defense Laptop B):**
  ```bash
  uv run traffic_flood.py <DEFENSE_IP> 8000
  ```

---

### Option 2: SYN Port Reconnaissance Scanner
Simulates adversarial network scanning and discovery:

* **Same Laptop:**
  ```bash
  uv run recon_scan.py 127.0.0.1
  ```
* **Two Laptops:**
  ```bash
  uv run recon_scan.py <DEFENSE_IP>
  ```

---

### Option 3: 1-Click UI Attack Simulation (No Script Needed)
* Click **`[ ⚡ Simulate Attack ]`** in the top navigation header of the dashboard.
* Or click **`Simulate Attack Spike`** inside the **SOAR Autonomous Defense Console**.

---

## 📊 Expected SOC Dashboard Behavior

1. **Topology Graph:**
   * Attacker node pulses in **Radiant Red** (`ISOLATED` / `ATTACKER`).
   * **Threat Flow** curved edge animates with glowing particles and live packet velocity.
2. **RSSM Horizon Chart:**
   * Plots forward threat trajectory surging up to **`96.0% Critical Risk`**.
3. **Live Event Logs:**
   * Displays rich telemetry:
     ```text
     State: DoS/Flood | ML Conf: 98.0% | RSSM K-Horizon Risk: 96.0% | Source IP: 192.168.29.124
     ALERT: Intercepting threat from 192.168.29.124! Triggering host micro-isolation...
     ACTION: iptables -A INPUT -s 192.168.29.124 -j DROP (or netsh advfirewall on Windows)
     ```
4. **Analyst Rollback & Baseline Reset:**
   * Click **`[ 🛡 1-Click Rollback ]`** to restore traffic without restarting.
   * Click **`[ 🔄 Reset Baseline ]`** to return system state to nominal.

---

## 🔒 Firewall Verification Commands

### Linux (iptables):
* **View blocked hosts:** `sudo iptables -L INPUT -v -n`
* **Manually remove block rule:** `sudo iptables -D INPUT -s <IP> -j DROP`
* **Flush input rules:** `sudo iptables -F INPUT`

### Windows (netsh):
* **View blocked rules:** `netsh advfirewall firewall show rule name="all" | findstr "Chakravyuh"`
* **Manually remove block rule:** `netsh advfirewall firewall delete rule name="Chakravyuh-Block-<IP>"`
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
├── docker-compose.yml         # Multi-container Docker orchestration (Backend, Sniffer, Frontend)
├── Dockerfile                 # Unified Python 3.11 Backend, AI Sniffer & SOAR Container
├── docker-start.sh            # 1-Click Docker launcher for Linux / macOS / WSL
├── docker-start.bat           # 1-Click Docker launcher for Windows (CMD)
├── docker-start.ps1           # 1-Click Docker launcher for Windows (PowerShell)
├── DOCKER.md                  # Comprehensive Docker containerization documentation
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
├── models/                    # Serialized models, weights, metrics, and scalers
│   ├── netdreamer_weights.pth # PyTorch NetDreamer RSSM Neural World Model
│   ├── train_scaler.pkl       # 32-feature MinMaxScaler
│   ├── feature_names.pkl      # 32 canonical schema feature definitions
│   ├── label_encoder.pkl      # 5 MITRE multi-stage classes
│   └── metrics/               # Official ROC/PR curves, confusion matrix & t-SNE evaluation plots
└── frontend/                  # Next.js 14+ Cyber Command Center Dashboard
    ├── Dockerfile             # Multi-stage production container for Next.js 14
    ├── src/app/page.tsx       # Main dashboard layout & real-time WS manager
    ├── src/components/        # TopologyGraph, HorizonChart, MetricCards, SoarControl, LiveLogs
    └── package.json
```

---

## 🐳 1-Click Docker Quickstart (Recommended for Linux & Windows)

Running with Docker ensures consistent environments across **Linux** and **Windows (Docker Desktop / WSL2)** without manual package or dependency management.

### 🐧 On Linux / macOS / WSL:
```bash
./docker-start.sh
```
*(Or manually: `docker compose up --build -d backend sniffer frontend`)*

### 🪟 On Windows (Windows 10 / 11):
Double-click **`docker-start.bat`** (or run `.\docker-start.ps1` in PowerShell).
*(Or manually: `docker compose up --build -d backend sniffer frontend`)*

### 🌐 Accessing Services:
* **Cyber Command Center Dashboard**: [http://localhost:3000](http://localhost:3000)
* **FastAPI Backend & API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
* **WebSocket Stream**: `ws://localhost:8000/ws/stream`

> 📖 **See [DOCKER.md](file:///home/sriram/Desktop/SIH%202026/Chakravyuh-AI/DOCKER.md) for full container management and testing details.**

---

## ⚡ Native Installation (Alternative via `uv`)

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

### 🚀 Multi-Terminal Run Commands (Linux / Ubuntu)

#### Terminal 1 — FastAPI Backend:
```bash
cd "/home/sriram/Desktop/SIH 2026/Chakravyuh-AI"
../.venv/bin/python server.py
```
*(Running on `http://localhost:8000` | API Docs: `http://localhost:8000/docs`)*

#### Terminal 2 — Next.js Cyber Dashboard:
```bash
cd "/home/sriram/Desktop/SIH 2026/Chakravyuh-AI/frontend"
npm run dev
```
*(Open [http://localhost:3000](http://localhost:3000/) in your browser)*

#### Terminal 3 — Live AI Sniffer & SOAR Defense:
```bash
cd "/home/sriram/Desktop/SIH 2026/Chakravyuh-AI"
sudo /home/sriram/Desktop/"SIH 2026"/.venv/bin/python live_sniffer.py
```

#### Terminal 4 (Optional) — Interactive Attack Suite:
```bash
cd "/home/sriram/Desktop/SIH 2026/Chakravyuh-AI"
../.venv/bin/python attack_suite.py
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

## 🧪 Testing & Attack Demonstration Suite

Chakravyuh AI includes a complete multi-vector attack testing suite covering all trained MITRE and CIC-IDS attack categories. You can demonstrate proactive threat forecasting and automated self-healing on a **single machine (localhost)** or across **multiple nodes on the same Wi-Fi/LAN**.

### 🎮 Option 1: Unified Interactive Attack Suite Menu
Launch the interactive terminal console to pick and execute any attack vector with custom parameters:
```bash
../.venv/bin/python attack_suite.py
```
*(Or launch directly by vector number, e.g., `../.venv/bin/python attack_suite.py 3 127.0.0.1 8000 10`)*

---

### 🚀 Option 2: Individual Attack Simulators

| Attack Vector | Script | Target MITRE Category | Description | Command |
|---|---|---|---|---|
| **DoS / Traffic Flood** | `traffic_flood.py` | `DoS/Flood` (Class 4) | 12-worker concurrent connection surge | `../.venv/bin/python traffic_flood.py 127.0.0.1 8000` |
| **SYN Recon Port Scan** | `recon_scan.py` | `Recon/PortScan` (Class 1) | Multi-port network reconnaissance sweep (Ports 20–1024) | `../.venv/bin/python recon_scan.py 127.0.0.1` |
| **Credential Brute-Force** | `brute_force.py` | `Recon/BruteForce` (Class 1) | High-frequency password stuffing & dictionary probe | `../.venv/bin/python brute_force.py 127.0.0.1 8000` |
| **Infiltration / Exploit** | `infiltration_exploit.py` | `Infiltration` (Class 2) | Command injection & RCE payload dropper delivery | `../.venv/bin/python infiltration_exploit.py 127.0.0.1 8000` |
| **Botnet C2 & Lateral** | `bot_lateral.py` | `Bot/LateralMovement` (Class 3) | Periodic C2 heartbeat beacons & internal propagation | `../.venv/bin/python bot_lateral.py 127.0.0.1 8000` |
| **Slowloris DoS** | `slowloris_dos.py` | `DoS/Flood` (Slowloris Variant) | Low-and-slow HTTP header connection pool starvation | `../.venv/bin/python slowloris_dos.py 127.0.0.1 8000` |

---

### 🛡️ Option 3: Automated SOAR Self-Healing Playbooks ("Fix the Issue")

When an attack occurs, Chakravyuh AI executes an end-to-end automated containment and self-healing cycle:
1. **Targeted Micro-Isolation**: Immediate OS-level firewall drop rule applied (`iptables -A INPUT -s <IP> -j DROP` on Linux, `netsh advfirewall` on Windows).
2. **Active Socket Connection Teardown**: Immediately severs active malicious TCP sockets from the threat source using `ss -K dst <IP>` and purges connection tracking table entries.
3. **Attack-Specific Remediation Playbooks**:
   - **DoS / Flood Playbook**: Activates kernel TCP SYN Cookies (`net.ipv4.tcp_syncookies=1`), purges conntrack pools, and enforces ingress burst rate-limiting.
   - **Brute-Force Playbook**: Quarantines auth endpoints, terminates rogue auth sessions, creates Fail2ban jail policies, and triggers credential security audits.
   - **Infiltration Playbook**: Kills suspicious spawned child processes/reverse shells, audits filesystem binary hashes, and creates forensic telemetry snapshots.
   - **Botnet / Lateral Playbook**: Quarantines internal spreading channels, blackholes outbound C2 command beacons, and updates ST-GNN neighbor routing tables.
4. **1-Click Analyst Rollback & Self-Healing Baseline Reset**:
   - Click **`[ 🛡 1-Click Rollback ]`** in the dashboard to restore traffic, or click **`[ 🔄 Auto-Remediate ]`** to re-run automated playbooks on demand.

---

## 📊 Expected SOC Dashboard Behavior

1. **Topology Graph:**
   * Attacker node pulses in **Radiant Red** (`ISOLATED` / `ATTACKER`).
   * **Threat Flow** curved edge animates with glowing particles and live protocol signatures (`TCP/SYN`, `TCP/Auth`, `HTTP/Payload`, `TCP/C2`).
2. **RSSM Horizon Chart:**
   * Plots forward threat trajectory surging up to **`96.0% Critical Risk`**.
3. **Live Event Logs:**
   * Displays rich telemetry:
     ```text
     State: Infiltration | ML Conf: 98.0% | RSSM K-Horizon Risk: 98.0% | Source IP: 192.168.29.124
     ALERT: Intercepting threat from 192.168.29.124! Triggering host micro-isolation & active neutralization...
     ACTION: iptables -A INPUT -s 192.168.29.124 -j DROP
     SOAR REMEDIATION: Host micro-isolation engaged against exploit vector 192.168.29.124
     SOAR REMEDIATION: Terminated rogue child sockets and interactive shell pipes for 192.168.29.124
     SOAR REMEDIATION: Integrity hash check completed on sensitive system binaries
     SOAR REMEDIATION: Privilege escalation vectors blocked: session sandbox policy enforced
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
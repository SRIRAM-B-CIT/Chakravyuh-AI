# 🐳 Chakravyuh AI — Docker Containerization Guide

This guide provides instructions for running the complete **Chakravyuh AI** defense system inside Docker containers on both **Windows** (via Docker Desktop / WSL2) and **Linux**.

---

## 📋 Architecture & Container Composition

```text
+------------------------------------------------------------------------------------+
|  Docker Compose Network: chakravyuh-net                                            |
|                                                                                    |
|  +---------------------------+              +------------------------------------+ |
|  | frontend                  |              | backend                            | |
|  | (Next.js 14 Cyber SOC)    | <--- WS ---> | (FastAPI Core & REST Endpoints)    | |
|  | Port: 3000                |   HTTP/API   | Port: 8000                         | |
|  +---------------------------+              +-----------------+------------------+ |
|                                                               |                    |
|                                                     IPC State | & Audit Logs       |
|                                                     (Shared)  v                    |
|                                             +-----------------+------------------+ |
|                                             | sniffer                            | |
|                                             | (AI Packet Sniffer & ST-GNN/SOAR)  | |
|                                             +------------------------------------+ |
+------------------------------------------------------------------------------------+
```

| Service | Technology | Port | Description |
|---|---|---|---|
| **`frontend`** | Next.js 14, React 18, TailwindCSS, Framer Motion | `3000` | Cyber Command SOC Dashboard |
| **`backend`** | FastAPI, Uvicorn, Python 3.11 | `8000` | REST API, WebSocket Stream (`/ws/stream`) & SOAR Actions |
| **`sniffer`** | PyShark, PyTorch (NetDreamer RSSM), ST-GNN | Host/Net | Live packet capture, feature extraction, neural forecasting & containment |
| **`attack-suite`** | Python 3.11, Socket Flood / Exploit Simulators | CLI | Multi-vector MITRE attack simulation console |

---

## 🚀 Quickstart

### 🖥️ Windows (Windows 10 / 11)

#### Prerequisites:
1. Install [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/).
2. Ensure **WSL 2 backend** is enabled in Docker Desktop Settings (*Settings > General > Use the WSL 2 based engine*).

#### Option A — 1-Click Launch (Recommended):
Double-click **`docker-start.bat`** (or run `.\docker-start.ps1` in PowerShell).

#### Option B — Command Line:
```powershell
# Inside Chakravyuh-AI directory
docker compose up --build -d backend sniffer frontend
```

---

### 🐧 Linux (Ubuntu / Debian / Arch / Fedora / WSL)

#### Prerequisites:
Install Docker Engine & Docker Compose plugin:
```bash
# Ubuntu / Debian
sudo apt update && sudo apt install -y docker.io docker-compose-v2
sudo usermod -aG docker $USER  # Log out and log back in to apply group changes
```

#### Option A — 1-Click Launch (Recommended):
```bash
./docker-start.sh
```

#### Option B — Command Line:
```bash
docker compose up --build -d backend sniffer frontend
```

---

## 🌐 Accessing the System

Once the containers are running:
* **Cyber Command Center Dashboard**: [http://localhost:3000](http://localhost:3000)
* **FastAPI Backend & Interactive API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
* **Real-time WebSocket Telemetry Feed**: `ws://localhost:8000/ws/stream`

---

## 🧪 Running Attack Simulations with Docker

You can launch attack vectors in multiple ways:

### 1. From the Web Dashboard (Easiest)
Open [http://localhost:3000](http://localhost:3000) and click any of the **1-Click Attack Simulator** buttons in the left navigation bar or SOAR control panel.

### 2. Interactive Terminal Console via Docker Compose
Run the interactive attack suite menu inside a container:
```bash
docker compose run --rm attack-suite
```

### 3. Launch Specific Attack Scripts inside Docker
```bash
# DoS / Flood Surge (12-worker burst)
docker compose exec backend python traffic_flood.py 127.0.0.1 8000

# SYN Port Sweep
docker compose exec backend python recon_scan.py 127.0.0.1

# Credential Brute-Force Probing
docker compose exec backend python brute_force.py 127.0.0.1 8000

# Infiltration Exploit Dropper
docker compose exec backend python infiltration_exploit.py 127.0.0.1 8000

# Botnet C2 & Lateral Spread
docker compose exec backend python bot_lateral.py 127.0.0.1 8000
```

---

## 🛠️ Operational & Management Commands

### Viewing Live Container Logs
```bash
# Follow logs across all services
docker compose logs -f

# Follow specific service logs
docker compose logs -f backend
docker compose logs -f sniffer
docker compose logs -f frontend
```

### Restarting or Rebuilding
```bash
# Restart without rebuilding
docker compose restart

# Rebuild containers after code changes
docker compose up --build -d
```

### Stopping the Stack
```bash
docker compose down
```

---

## 🔍 Troubleshooting & FAQ

### Q1: "Port 3000 or 8000 is already in use"
**Fix:** Stop any non-docker processes running locally on those ports:
- **Windows:** `netstat -ano | findstr :8000` followed by `taskkill /PID <PID> /F`
- **Linux:** `sudo lsof -i :8000` or `sudo lsof -i :3000` followed by `kill -9 <PID>`

### Q2: Changes to Python code or Frontend not updating
**Fix:** The backend and sniffer mount `./:/app` so Python file changes are reflected immediately. For frontend changes, rebuild the image:
```bash
docker compose build frontend && docker compose up -d frontend
```

### Q3: On Windows, packets are not triggering live defense
**Fix:** Inside Docker on Windows, traffic sent to `http://localhost:8000` or between containers is monitored by the sniffer. You can also trigger all vectors directly via the Dashboard UI 1-click buttons or `docker compose run --rm attack-suite`.

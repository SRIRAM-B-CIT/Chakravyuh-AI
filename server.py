import os
import json
import time
import asyncio
from typing import Optional, List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import soar_agent

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATE_JSON = os.path.join(BASE_DIR, "state.json")
EVENTS_LOG = os.path.join(BASE_DIR, "events.log")

app = FastAPI(
    title="Chakravyuh AI Defense Core",
    description="Proactive ST-GNN & RSSM World Model Cyber Defense Operations API",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class HostActionRequest(BaseModel):
    ip: str

class SimulationRequest(BaseModel):
    ip: Optional[str] = "192.168.29.124"
    attack_type: Optional[str] = "DoS/Flood"
    risk_level: Optional[float] = 0.96

def load_current_state():
    """Safely loads state.json with fallback defaults."""
    if os.path.exists(STATE_JSON):
        try:
            with open(STATE_JSON, "r") as f:
                return json.load(f)
        except Exception:
            pass
    
    return {
        "src_ip": "192.168.29.124",
        "label": "Benign",
        "ml_conf": 0.98,
        "risk_score": 0.05,
        "isolated": False,
        "netfilter_drops": "41.3k Drops",
        "rollout": [0.02, 0.03, 0.04, 0.05],
        "rollout_series": {
            "Gateway": [0.02, 0.02, 0.02, 0.02],
            "Defense Host": [0.05, 0.05, 0.05, 0.05],
            "Internal Server": [0.12, 0.12, 0.12, 0.12],
            "Threat Host": [0.02, 0.03, 0.04, 0.05]
        },
        "topology": {
            "nodes": [
                {"id": "192.168.29.1", "ip": "192.168.29.1", "label": "Gateway", "role": "Gateway Router", "risk_score": 0.02, "status": "SAFE", "packet_count": 24, "byte_rate": "1.2 MB/s", "is_defense": False, "is_isolated": False},
                {"id": "192.168.29.104", "ip": "192.168.29.104", "label": "Defense", "role": "Defense Controller", "risk_score": 0.05, "status": "SAFE", "packet_count": 148, "byte_rate": "3.8 MB/s", "is_defense": True, "is_isolated": False},
                {"id": "192.168.29.42", "ip": "192.168.29.42", "label": "Server", "role": "Internal Core Server", "risk_score": 0.12, "status": "SAFE", "packet_count": 18, "byte_rate": "850 KB/s", "is_defense": False, "is_isolated": False},
                {"id": "192.168.29.124", "ip": "192.168.29.124", "label": "Attacker", "role": "Threat Host", "risk_score": 0.96, "status": "ATTACKER", "packet_count": 148, "byte_rate": "18.4 MB/s", "is_defense": False, "is_isolated": False}
            ],
            "edges": [
                {"id": "e-gw-def", "source": "192.168.29.1", "target": "192.168.29.104", "weight": 14, "traffic": "Safe Path", "protocol": "TCP/HTTPS", "animated": False, "threat": False},
                {"id": "e-def-internal", "source": "192.168.29.104", "target": "192.168.29.42", "weight": 8, "traffic": "Safe Path", "protocol": "gRPC/TLS", "animated": False, "threat": False},
                {"id": "e-gw-internal", "source": "192.168.29.1", "target": "192.168.29.42", "weight": 6, "traffic": "Internal Route", "protocol": "TCP/TLS", "animated": False, "threat": False},
                {"id": "e-att-def", "source": "192.168.29.124", "target": "192.168.29.104", "weight": 86, "traffic": "Threat Flow (148 pkts/s)", "protocol": "TCP/SYN", "animated": True, "threat": True},
                {"id": "e-att-srv", "source": "192.168.29.124", "target": "192.168.29.42", "weight": 34, "traffic": "Lateral Probe", "protocol": "TCP/SYN", "animated": True, "threat": True}
            ],
            "stats": {
                "total_nodes": 4,
                "total_edges": 5,
                "threat_level": "ELEVATED",
                "active_flows": 148
            }
        },
        "last_updated": time.time()
    }

def read_logs(limit: int = 50) -> List[str]:
    """Reads latest log lines from events.log."""
    if not os.path.exists(EVENTS_LOG):
        # Default initial seed logs matching SOC layout
        timestamp = time.strftime('%H:%M:%S')
        return [
            f"[{timestamp}] INFO: Connecting State / ST-GNN spatial graph topology online.",
            f"[{timestamp}] State: Benign | Source IP: 192.168.29.124",
            f"[{timestamp}] State: DoS/Flood | RSSM Risk: 96.0% | Source IP: 192.168.29.124",
            f"[{timestamp}] ALERT: Intercepting threat from 192.168.29.124! Triggering host micro-isolation...",
            f"[{timestamp}] ACTION: iptables -A INPUT -s 192.168.29.124 -j DROP"
        ]
    try:
        with open(EVENTS_LOG, "r") as f:
            lines = [line.strip() for line in f.readlines() if line.strip()]
            return lines[-limit:]
    except Exception as e:
        return [f"Error reading logs: {e}"]

def write_audit_log(message: str):
    timestamp = time.strftime('%H:%M:%S')
    log_line = f"[{timestamp}] {message}"
    try:
        with open(EVENTS_LOG, "a") as f:
            f.write(log_line + "\n")
            f.flush()
    except Exception:
        pass

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "Chakravyuh AI Defense Core",
        "version": "2.0.0",
        "docs": "/docs"
    }

@app.get("/api/state")
def get_state():
    return load_current_state()

@app.get("/api/topology")
def get_topology():
    state = load_current_state()
    return state.get("topology", {})

@app.get("/api/logs")
def get_logs(limit: int = 60):
    return {"logs": read_logs(limit)}

@app.post("/api/soar/isolate")
def isolate_endpoint(req: HostActionRequest):
    ip = req.ip.strip()
    if not ip:
        raise HTTPException(status_code=400, detail="IP address required")
    
    # Execute SOAR isolation
    soar_agent.isolate_host(ip)
    write_audit_log(f"ALERT: Intercepting threat from {ip}! Triggering host micro-isolation...")
    write_audit_log(f"ACTION: iptables -A INPUT -s {ip} -j DROP")

    # Update state file
    state = load_current_state()
    state["isolated"] = True
    state["netfilter_drops"] = "41.3k Drops"
    if "topology" in state and "nodes" in state["topology"]:
        for node in state["topology"]["nodes"]:
            if node["ip"] == ip:
                node["status"] = "ISOLATED"
                node["is_isolated"] = True

    try:
        with open(STATE_JSON, "w") as f:
            json.dump(state, f, indent=2)
    except Exception as e:
        print(f"Failed to update state: {e}")

    return {
        "status": "success",
        "action": "isolated",
        "ip": ip,
        "message": f"Host {ip} isolated successfully via iptables."
    }

@app.post("/api/soar/rollback")
def rollback_endpoint(req: HostActionRequest):
    ip = req.ip.strip()
    if not ip:
        raise HTTPException(status_code=400, detail="IP address required")
    
    # Execute SOAR rollback
    soar_agent.rollback_isolation(ip)
    write_audit_log(f"ACTION: 1-Click Rollback Restored. iptables -D INPUT -s {ip} -j DROP")

    # Update state file
    state = load_current_state()
    state["isolated"] = False
    if "topology" in state and "nodes" in state["topology"]:
        for node in state["topology"]["nodes"]:
            if node["ip"] == ip:
                node["status"] = "SAFE" if node.get("risk_score", 0) < 0.6 else "MONITORING"
                node["is_isolated"] = False

    try:
        with open(STATE_JSON, "w") as f:
            json.dump(state, f, indent=2)
    except Exception as e:
        print(f"Failed to update state: {e}")

    return {
        "status": "success",
        "action": "rollback",
        "ip": ip,
        "message": f"Host {ip} isolation successfully rolled back."
    }

@app.post("/api/simulate/attack")
def simulate_attack_scenario(req: SimulationRequest):
    """Generates an immediate attack simulation state for SOC demonstration and testing."""
    ip = req.ip or "192.168.29.124"
    attack = req.attack_type or "DoS/Flood"
    risk = float(req.risk_level or 0.96)

    rollout_step0 = round(risk * 0.15, 2)
    rollout_step1 = round(risk * 0.40, 2)
    rollout_step2 = round(risk * 0.75, 2)
    rollout_step3 = round(risk, 2)

    sim_state = {
        "src_ip": ip,
        "label": attack,
        "ml_conf": 0.98,
        "risk_score": risk,
        "isolated": False,
        "netfilter_drops": "41.3k Drops",
        "rollout": [rollout_step0, rollout_step1, rollout_step2, rollout_step3],
        "rollout_series": {
            "Gateway": [0.02, 0.02, 0.02, 0.02],
            "Defense Host": [0.05, 0.05, 0.05, 0.05],
            "Internal Server": [0.12, 0.12, 0.12, 0.12],
            "Threat Node": [rollout_step0, rollout_step1, rollout_step2, rollout_step3]
        },
        "topology": {
            "nodes": [
                {"id": "192.168.29.1", "ip": "192.168.29.1", "label": "Gateway", "role": "Gateway Router", "risk_score": 0.02, "status": "SAFE", "packet_count": 24, "byte_rate": "1.2 MB/s", "is_defense": False, "is_isolated": False},
                {"id": "192.168.29.104", "ip": "192.168.29.104", "label": "Defense", "role": "Defense Controller", "risk_score": 0.05, "status": "SAFE", "packet_count": 148, "byte_rate": "3.8 MB/s", "is_defense": True, "is_isolated": False},
                {"id": "192.168.29.42", "ip": "192.168.29.42", "label": "Server", "role": "Internal Core Server", "risk_score": 0.12, "status": "SAFE", "packet_count": 18, "byte_rate": "850 KB/s", "is_defense": False, "is_isolated": False},
                {"id": ip, "ip": ip, "label": "Attacker", "role": "Threat Host", "risk_score": risk, "status": "ATTACKER", "packet_count": 148, "byte_rate": "18.4 MB/s", "is_defense": False, "is_isolated": False}
            ],
            "edges": [
                {"id": "e-gw-def", "source": "192.168.29.1", "target": "192.168.29.104", "weight": 14, "traffic": "Safe Path", "protocol": "TCP/HTTPS", "animated": False, "threat": False},
                {"id": "e-def-internal", "source": "192.168.29.104", "target": "192.168.29.42", "weight": 8, "traffic": "Safe Path", "protocol": "gRPC/TLS", "animated": False, "threat": False},
                {"id": "e-gw-internal", "source": "192.168.29.1", "target": "192.168.29.42", "weight": 6, "traffic": "Internal Route", "protocol": "TCP/TLS", "animated": False, "threat": False},
                {"id": "e-att-def", "source": ip, "target": "192.168.29.104", "weight": 86, "traffic": "Threat Flow (148 pkts/s)", "protocol": "TCP/SYN", "animated": True, "threat": True},
                {"id": "e-att-srv", "source": ip, "target": "192.168.29.42", "weight": 34, "traffic": "Lateral Probe", "protocol": "TCP/SYN", "animated": True, "threat": True}
            ],
            "stats": {
                "total_nodes": 4,
                "total_edges": 5,
                "threat_level": "CRITICAL",
                "active_flows": 148
            }
        },
        "last_updated": time.time()
    }

    try:
        with open(STATE_JSON, "w") as f:
            json.dump(sim_state, f, indent=2)
    except Exception as e:
        print(f"Failed to write state.json: {e}")

    write_audit_log(f"State: {attack} | ML Conf: 98.0% | RSSM K-Horizon Risk: {risk*100:.1f}% | Source IP: {ip}")
    write_audit_log(f"ALERT: Intercepting threat from {ip}! Triggering host micro-isolation...")
    write_audit_log(f"ACTION: iptables -A INPUT -s {ip} -j DROP")
    return {"status": "success", "message": f"Simulation initiated for {attack} on {ip}"}

@app.post("/api/simulate/reset")
def reset_simulation():
    """Resets the network state back to nominal baseline."""
    reset_state = {
        "src_ip": "192.168.29.124",
        "label": "Benign",
        "ml_conf": 0.98,
        "risk_score": 0.05,
        "isolated": False,
        "netfilter_drops": "0 Drops",
        "rollout": [0.02, 0.03, 0.04, 0.05],
        "rollout_series": {
            "Gateway": [0.02, 0.02, 0.02, 0.02],
            "Defense Host": [0.05, 0.05, 0.05, 0.05],
            "Internal Server": [0.12, 0.12, 0.12, 0.12],
            "Threat Node": [0.02, 0.03, 0.04, 0.05]
        },
        "topology": {
            "nodes": [
                {"id": "192.168.29.1", "ip": "192.168.29.1", "label": "Gateway", "role": "Gateway Router", "risk_score": 0.02, "status": "SAFE", "packet_count": 22, "byte_rate": "1.1 MB/s", "is_defense": False, "is_isolated": False},
                {"id": "192.168.29.104", "ip": "192.168.29.104", "label": "Defense", "role": "Defense Controller", "risk_score": 0.05, "status": "SAFE", "packet_count": 92, "byte_rate": "2.9 MB/s", "is_defense": True, "is_isolated": False},
                {"id": "192.168.29.42", "ip": "192.168.29.42", "label": "Server", "role": "Internal Core Server", "risk_score": 0.12, "status": "SAFE", "packet_count": 14, "byte_rate": "620 KB/s", "is_defense": False, "is_isolated": False},
                {"id": "192.168.29.124", "ip": "192.168.29.124", "label": "Attacker", "role": "External Node", "risk_score": 0.05, "status": "SAFE", "packet_count": 28, "byte_rate": "210 KB/s", "is_defense": False, "is_isolated": False}
            ],
            "edges": [
                {"id": "e-gw-def", "source": "192.168.29.1", "target": "192.168.29.104", "weight": 12, "traffic": "Safe Path", "protocol": "TCP/HTTPS", "animated": False, "threat": False},
                {"id": "e-def-internal", "source": "192.168.29.104", "target": "192.168.29.42", "weight": 6, "traffic": "Safe Path", "protocol": "gRPC/TLS", "animated": False, "threat": False},
                {"id": "e-gw-internal", "source": "192.168.29.1", "target": "192.168.29.42", "weight": 6, "traffic": "Internal Route", "protocol": "TCP/TLS", "animated": False, "threat": False},
                {"id": "e-att-def", "source": "192.168.29.124", "target": "192.168.29.104", "weight": 16, "traffic": "Safe Path", "protocol": "TCP/SYN", "animated": False, "threat": False}
            ],
            "stats": {
                "total_nodes": 4,
                "total_edges": 4,
                "threat_level": "NORMAL",
                "active_flows": 148
            }
        },
        "last_updated": time.time()
    }
    try:
        with open(STATE_JSON, "w") as f:
            json.dump(reset_state, f, indent=2)
    except Exception:
        pass
    write_audit_log("State: Benign | ML Conf: 91.0% | RSSM K-Horizon Risk: 54.2% | Source IP: 192.168.29.124")
    write_audit_log("ACTION: Network telemetry reset to nominal baseline state.")
    return {"status": "success", "message": "Baseline restored."}

@app.websocket("/ws/stream")
async def websocket_stream_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            state = load_current_state()
            logs = read_logs(limit=40)
            payload = {
                "timestamp": time.time(),
                "state": state,
                "logs": logs
            }
            await websocket.send_text(json.dumps(payload))
            await asyncio.sleep(1.0)
    except (WebSocketDisconnect, asyncio.CancelledError):
        pass
    except Exception as e:
        print(f"WebSocket stream error: {e}")

if __name__ == "__main__":
    import uvicorn
    print("Starting Chakravyuh AI High-Performance Defense Server on http://0.0.0.0:8000")
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)


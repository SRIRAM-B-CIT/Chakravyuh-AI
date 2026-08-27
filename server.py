import os
import json
import time
import asyncio
from typing import Optional, List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Request
from fastapi.responses import JSONResponse
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
    """Safely loads state.json with retry on read concurrency."""
    if os.path.exists(STATE_JSON):
        for _ in range(3):
            try:
                with open(STATE_JSON, "r") as f:
                    data = json.load(f)
                    if isinstance(data, dict) and "risk_score" in data:
                        return data
            except Exception:
                time.sleep(0.01)
                continue
    
    return {
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
            "Threat Host": [0.02, 0.03, 0.04, 0.05]
        },
        "topology": {
            "nodes": [
                {"id": "node-gateway", "ip": "10.42.0.1", "label": "Gateway", "role": "Gateway Router", "risk_score": 0.02, "status": "SAFE", "packet_count": 24, "byte_rate": "1.2 MB/s", "is_defense": False, "is_isolated": False},
                {"id": "node-defense", "ip": "10.42.0.1", "label": "Defense", "role": "Defense Controller", "risk_score": 0.05, "status": "SAFE", "packet_count": 148, "byte_rate": "3.8 MB/s", "is_defense": True, "is_isolated": False},
                {"id": "node-server", "ip": "192.168.29.42", "label": "Server", "role": "Internal Core Server", "risk_score": 0.12, "status": "SAFE", "packet_count": 18, "byte_rate": "850 KB/s", "is_defense": False, "is_isolated": False},
                {"id": "node-attacker", "ip": "10.42.0.181", "label": "Attacker", "role": "Threat Host", "risk_score": 0.05, "status": "SAFE", "packet_count": 88, "byte_rate": "340 KB/s", "is_defense": False, "is_isolated": False}
            ],
            "edges": [
                {"id": "e-gw-def", "source": "node-gateway", "target": "node-defense", "weight": 14, "traffic": "Safe Path", "protocol": "TCP/HTTPS", "animated": False, "threat": False},
                {"id": "e-def-internal", "source": "node-defense", "target": "node-server", "weight": 8, "traffic": "Safe Path", "protocol": "gRPC/TLS", "animated": False, "threat": False},
                {"id": "e-gw-internal", "source": "node-gateway", "target": "node-server", "weight": 6, "traffic": "Internal Route", "protocol": "TCP/TLS", "animated": False, "threat": False},
                {"id": "e-att-def", "source": "node-attacker", "target": "node-defense", "weight": 86, "traffic": "Safe Path", "protocol": "TCP/SYN", "animated": False, "threat": False},
                {"id": "e-att-srv", "source": "node-attacker", "target": "node-server", "weight": 34, "traffic": "Internal Route", "protocol": "TCP/SYN", "animated": False, "threat": False}
            ],
            "stats": {
                "total_nodes": 4,
                "total_edges": 5,
                "threat_level": "NOMINAL",
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
    action_str = soar_agent.get_firewall_action_string(ip, "block")
    write_audit_log(f"ACTION: {action_str}")

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
        "message": f"Host {ip} isolated successfully."
    }

@app.post("/api/soar/rollback")
def rollback_endpoint(req: HostActionRequest):
    ip = req.ip.strip()
    if not ip:
        raise HTTPException(status_code=400, detail="IP address required")
    
    # Execute SOAR rollback
    soar_agent.rollback_isolation(ip)
    action_str = soar_agent.get_firewall_action_string(ip, "unblock")
    write_audit_log(f"ACTION: 1-Click Rollback Restored. {action_str}")

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

class RemediationRequest(BaseModel):
    ip: str
    threat_type: Optional[str] = "DoS/Flood"

class LaunchAttackRequest(BaseModel):
    vector: str
    target_ip: Optional[str] = "127.0.0.1"
    target_port: Optional[int] = 8000
    duration: Optional[int] = 10

# ==========================================
# HONEYPOT & ATTACK RECEPTOR ENDPOINTS
# (Intercepts simulation traffic cleanly without 404s)
# ==========================================

@app.post("/c2/heartbeat")
@app.post("/c2/register")
def c2_heartbeat_honeypot(req: Request):
    """Honeypot trap for Botnet C2 beaconing."""
    write_audit_log("TRAP: Botnet C2 beacon check-in intercepted by honeypot sensor.")
    return {"status": "trapped", "service": "c2_honeypot", "action": "telemetry_recorded"}

@app.get("/probe")
def probe_honeypot(node: Optional[str] = None, port: Optional[int] = None):
    """Honeypot trap for lateral movement port probes."""
    return {"status": "probed", "target": node, "port": port, "banner": "Chakravyuh-Trap-Service 1.0"}

@app.post("/api/login")
@app.post("/auth/ssh")
@app.post("/login")
def auth_honeypot(req: Request):
    """Honeypot trap for brute-force credential stuffing."""
    return JSONResponse(status_code=401, content={"status": "auth_failed", "error": "Invalid credentials", "delay_applied": True})

@app.post("/api/exec")
@app.post("/api/execute")
@app.post("/upload")
def execute_honeypot(req: Request):
    """Honeypot trap for RCE and payload dropper delivery."""
    write_audit_log("TRAP: Infiltration / RCE payload intercepted and safely sandboxed.")
    return {"status": "sandboxed", "result": "Execution halted by Chakravyuh SOAR security policy"}

@app.get("/api/soar/playbooks")
def get_soar_playbooks():
    """Returns the catalog of active automated SOAR self-healing playbooks."""
    return {
        "active_isolations": list(soar_agent.ACTIVE_ISOLATIONS),
        "playbooks": [
            {
                "id": "playbook_dos",
                "name": "DoS / Flood Mitigation & Self-Healing",
                "target_class": "DoS/Flood",
                "actions": ["Micro-Isolation (Netfilter/Firewall)", "Active Socket Severing (ss -K)", "TCP SYN Cookies Activation", "Ingress Burst Rate-Limiting"]
            },
            {
                "id": "playbook_bruteforce",
                "name": "Credential Brute-Force Containment & Account Safeguard",
                "target_class": "Recon/BruteForce",
                "actions": ["Quarantine Isolation", "Auth Session Teardown", "Fail2ban Jail Lockout Staging", "Credential Audit Event Dispatch"]
            },
            {
                "id": "playbook_infiltration",
                "name": "Infiltration & RCE Exploit Containment",
                "target_class": "Infiltration",
                "actions": ["Targeted Host Isolation", "Reverse Shell Socket Teardown", "Binary Integrity Verification", "Forensic Log Snapshot"]
            },
            {
                "id": "playbook_bot_lateral",
                "name": "Botnet C2 Neutralization & Lateral Quarantine",
                "target_class": "Bot/LateralMovement",
                "actions": ["Node Network Segmentation", "C2 Beacon Egress Blackhole", "ST-GNN Dynamic Route Re-routing", "Memory Dropper Artifact Scan"]
            }
        ]
    }

@app.post("/api/soar/remediate")
def remediate_threat_endpoint(req: RemediationRequest):
    """Executes the full automated SOAR self-healing playbook for a detected threat."""
    ip = req.ip.strip()
    threat_type = req.threat_type or "DoS/Flood"
    if not ip:
        raise HTTPException(status_code=400, detail="IP address required")

    write_audit_log(f"SOAR TRIGGER: Initiating automated self-healing remediation for {threat_type} from {ip}...")
    
    # Execute full SOAR playbook
    result = soar_agent.execute_remediation_playbook(threat_type, ip)
    
    for step in result.get("steps", []):
        write_audit_log(f"SOAR ACTION: {step}")

    # Update state file to reflect isolated & remediated status
    state = load_current_state()
    state["isolated"] = True
    state["netfilter_drops"] = "41.3k Drops"
    if "topology" in state and "nodes" in state["topology"]:
        for node in state["topology"]["nodes"]:
            if node["ip"] == ip:
                node["status"] = "ISOLATED"
                node["is_isolated"] = True
                node["role"] = f"Isolated Threat ({threat_type})"

    try:
        with open(STATE_JSON, "w") as f:
            json.dump(state, f, indent=2)
    except Exception as e:
        print(f"Failed to update state: {e}")

    write_audit_log(f"SOAR STATUS: Remediation playbook '{result['playbook']}' successfully executed.")
    return {
        "status": "success",
        "threat_ip": ip,
        "threat_type": threat_type,
        "playbook_result": result
    }

@app.post("/api/attack/launch")
def launch_attack_simulator_endpoint(req: LaunchAttackRequest):
    """Launches an actual background attack simulation script."""
    import subprocess
    script_map = {
        "1": "traffic_flood.py",
        "2": "recon_scan.py",
        "3": "brute_force.py",
        "4": "infiltration_exploit.py",
        "5": "bot_lateral.py",
        "6": "slowloris_dos.py"
    }
    script = script_map.get(req.vector, "traffic_flood.py")
    script_path = os.path.join(BASE_DIR, script)
    
    if not os.path.exists(script_path):
        raise HTTPException(status_code=404, detail=f"Script {script} not found")

    cmd = [sys.executable, script_path, req.target_ip, str(req.target_port), "--duration", str(req.duration)]
    if req.vector == "2":
        cmd = [sys.executable, script_path, req.target_ip]
        
    try:
        subprocess.Popen(cmd)
        write_audit_log(f"ATTACK LAUNCHED: {script} executed against {req.target_ip}:{req.target_port} (Duration: {req.duration}s)")
        return {"status": "success", "message": f"Launched {script} in background."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/simulate/attack")
def simulate_attack_scenario(req: SimulationRequest):
    """Generates a rich attack simulation state across all 5 MITRE threat categories."""
    ip = req.ip or "192.168.29.124"
    attack = req.attack_type or "DoS/Flood"
    risk = float(req.risk_level or 0.96)

    rollout_step0 = round(risk * 0.15, 2)
    rollout_step1 = round(risk * 0.40, 2)
    rollout_step2 = round(risk * 0.75, 2)
    rollout_step3 = round(risk, 2)

    # Tailored network protocol, edge traffic descriptions, and animations per vector
    vector_profiles = {
        "DoS/Flood": {"protocol": "TCP/SYN", "traffic": "High-Density Flood (148 pkts/s)", "weight": 86, "byte_rate": "18.4 MB/s"},
        "Recon/PortScan": {"protocol": "TCP/Probe", "traffic": "SYN Port Sweep (Ports 20-1024)", "weight": 42, "byte_rate": "1.8 MB/s"},
        "Recon/BruteForce": {"protocol": "TCP/Auth", "traffic": "Credential Stuffing (86 attempts/s)", "weight": 54, "byte_rate": "3.4 MB/s"},
        "Infiltration": {"protocol": "HTTP/Payload", "traffic": "RCE Exploit Dropper Payload", "weight": 68, "byte_rate": "7.2 MB/s"},
        "Bot/LateralMovement": {"protocol": "TCP/C2", "traffic": "C2 Heartbeat & Lateral Spread", "weight": 76, "byte_rate": "9.6 MB/s"}
    }
    prof = vector_profiles.get(attack, vector_profiles["DoS/Flood"])

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
                {"id": ip, "ip": ip, "label": "Attacker", "role": f"Active {attack} Host", "risk_score": risk, "status": "ATTACKER", "packet_count": 148, "byte_rate": prof["byte_rate"], "is_defense": False, "is_isolated": False}
            ],
            "edges": [
                {"id": "e-gw-def", "source": "192.168.29.1", "target": "192.168.29.104", "weight": 14, "traffic": "Safe Path", "protocol": "TCP/HTTPS", "animated": False, "threat": False},
                {"id": "e-def-internal", "source": "192.168.29.104", "target": "192.168.29.42", "weight": 8, "traffic": "Safe Path", "protocol": "gRPC/TLS", "animated": False, "threat": False},
                {"id": "e-gw-internal", "source": "192.168.29.1", "target": "192.168.29.42", "weight": 6, "traffic": "Internal Route", "protocol": "TCP/TLS", "animated": False, "threat": False},
                {"id": "e-att-def", "source": ip, "target": "192.168.29.104", "weight": prof["weight"], "traffic": prof["traffic"], "protocol": prof["protocol"], "animated": True, "threat": True},
                {"id": "e-att-srv", "source": ip, "target": "192.168.29.42", "weight": int(prof["weight"] * 0.4), "traffic": "Lateral Vector", "protocol": prof["protocol"], "animated": True, "threat": True}
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
    write_audit_log(f"ALERT: Intercepting threat vector '{attack}' from {ip}! Triggering host micro-isolation...")
    action_str = soar_agent.get_firewall_action_string(ip, "block")
    write_audit_log(f"ACTION: {action_str}")
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
    write_audit_log("State: Benign | ML Conf: 98.0% | RSSM K-Horizon Risk: 5.0% | Source IP: 192.168.29.124")
    write_audit_log("ACTION: Network telemetry reset to nominal baseline state.")
    return {"status": "success", "message": "Baseline restored."}

@app.get("/api/metrics")
def get_model_metrics():
    """Returns metadata and chart URLs for the newly evaluated NetDreamer World Model."""
    metrics_dir = os.path.join(BASE_DIR, "models", "metrics")
    charts = []
    if os.path.exists(metrics_dir):
        for fname in sorted(os.listdir(metrics_dir)):
            if fname.endswith(".png"):
                charts.append({
                    "name": fname.replace(".png", "").replace("_", " ").title(),
                    "file": fname,
                    "url": f"/metrics/{fname}"
                })
    return {
        "model_name": "NetDreamer RSSM Neural World Model",
        "feature_dim": 32,
        "latent_dim": 64,
        "recurrent_dim": 64,
        "classes": ["Benign", "Recon/BruteForce", "Infiltration", "Bot/LateralMovement", "DoS/Flood"],
        "charts": charts
    }

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
            await asyncio.sleep(0.25)
    except (WebSocketDisconnect, asyncio.CancelledError):
        pass
    except Exception as e:
        print(f"WebSocket stream error: {e}")

if __name__ == "__main__":
    import uvicorn
    print("Starting Chakravyuh AI High-Performance Defense Server on http://0.0.0.0:8000")
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)


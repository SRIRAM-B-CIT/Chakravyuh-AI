import streamlit as st
import pandas as pd
import time
import os
import json
from soar_agent import isolate_host, rollback_isolation

st.set_page_config(page_title="Chakravyuh AI Command Center", layout="wide")

st.title("🛡️ Chakravyuh AI: World Model Cyber Defense")
st.caption("NTRO Problem Statement SIH26153 | Predictive Attack Horizon & Targeted Host Micro-Isolation")

state = {
    "src_ip": "192.168.29.124",
    "label": "Benign",
    "ml_conf": 0.85,
    "risk_score": 0.52,
    "isolated": False,
    "rollout": [0.05, 0.12, 0.25, 0.52]
}

if os.path.exists("state.json"):
    try:
        with open("state.json", "r") as sf:
            state = json.load(sf)
    except Exception:
        pass

attacker_ip = state.get("src_ip", "192.168.29.124")
risk_val = state.get("risk_score", 0.52)
risk_pct = f"{int(risk_val * 100)}%"
is_iso = state.get("isolated", False)
status_str = "ISOLATED" if is_iso else ("MONITORING" if risk_val > 0.60 else "SAFE")
rollout_vals = state.get("rollout", [0.05, 0.12, 0.25, 0.52])

col1, col2, col3, col4 = st.columns(4)
col1.metric("System Status", "ACTIVE", "Protected")
col2.metric("Defense Strategy", "Targeted Host Isolation", f"Status: {status_str}")
col3.metric("World Model Engine", "RSSM + ST-GNN", f"State: {state.get('label', 'Benign')}")
col4.metric("Evaluator Baseline", "Logistic Regression", "F1: ~0.89")

st.markdown("---")

left_col, right_col = st.columns([2, 1])

with left_col:
    st.subheader("🌐 Dynamic Network Topology & Threat Horizon")
    
    nodes_df = pd.DataFrame({
        "Host IP": ["192.168.29.1 (Gateway)", "192.168.29.104 (Laptop B - Defense)", "192.168.29.42 (Target Node)", f"{attacker_ip} (Laptop A - Attacker)"],
        "Role": ["Router", "Defense Host", "Internal Server", "External Node"],
        "Risk Score": ["2%", "5%", "12%", risk_pct],
        "Status": ["SAFE", "SAFE", "MONITORING", status_str]
    })
    st.table(nodes_df)

    st.subheader("📈 RSSM K-Step Attack Horizon Rollout Projection")
    chart_data = pd.DataFrame({
        "Step t (Current)": [0.02, 0.05, 0.08, rollout_vals[0]],
        "Step t+1": [0.03, 0.06, 0.10, rollout_vals[1]],
        "Step t+2 (Forecast)": [0.04, 0.07, 0.12, rollout_vals[2]],
        "Step t+3 (Forecast)": [0.05, 0.08, 0.15, rollout_vals[3]],
    }, index=["Gateway (Router)", "Defense Host (Laptop B)", "Internal Server", f"Attacker ({attacker_ip})"])
    
    st.line_chart(chart_data.T)

with right_col:
    st.subheader("⚡ SOAR Host Isolation Agent")
    
    target_ip = st.text_input("Target Host IP to Manage", attacker_ip)
    
    col_btn1, col_btn2 = st.columns(2)
    with col_btn1:
        if st.button("🔴 Micro-Isolate Host"):
            result = isolate_host(target_ip)
            if result.get("verified"):
                st.error(f"Host {result['ip']} isolation verified in the firewall.")
            elif result.get("mode") == "simulation":
                st.warning(f"Local source {result['ip']} identified; firewall isolation was not applied.")
            else:
                st.error(f"Isolation failed: {result.get('error', 'unknown error')}")
            
    with col_btn2:
        if st.button("🟢 Rollback Isolation"):
            result = rollback_isolation(target_ip)
            if result.get("success") and result.get("verified"):
                st.success(f"Host {result['ip']} connectivity restoration verified.")
            else:
                st.error(f"Rollback failed: {result.get('error', 'unknown error')}")
            
    st.markdown("---")
    st.subheader("📜 Live Event Logs")
    
    if os.path.exists("events.log"):
        with open("events.log", "r") as f:
            lines = f.readlines()
            log_content = "".join(lines[-12:])
    else:
        log_content = "Initializing live sniffer event stream..."

    st.code(log_content, language="bash")

time.sleep(2)
st.rerun()

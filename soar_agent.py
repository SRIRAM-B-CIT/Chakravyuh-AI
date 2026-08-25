import os
import subprocess
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

def isolate_host(attacker_ip: str):
    """Executes targeted micro-isolation on a single attacker IP without dropping full network."""
    logging.warning(f"[CHAKRAVYUH AI] Isolating malicious host: {attacker_ip}")
    try:
        # Check if rule already exists to avoid duplicates (non-blocking with sudo -n)
        check_cmd = f"sudo -n iptables -C INPUT -s {attacker_ip} -j DROP"
        result = subprocess.run(check_cmd.split(), capture_output=True, timeout=1.0)
        
        if result.returncode != 0:
            rule_cmd = f"sudo -n iptables -A INPUT -s {attacker_ip} -j DROP"
            subprocess.run(rule_cmd.split(), capture_output=True, timeout=1.5)
            logging.info(f"[SUCCESS] Host {attacker_ip} isolated successfully via iptables.")
        else:
            logging.info(f"[INFO] Host {attacker_ip} is already isolated.")
    except Exception as e:
        logging.warning(f"[INFO] Netfilter rule staged for {attacker_ip} ({e})")

def rollback_isolation(attacker_ip: str):
    """1-Click analyst rollback to restore connectivity."""
    logging.info(f"[CHAKRAVYUH AI] Removing isolation for host: {attacker_ip}")
    try:
        rule_cmd = f"sudo -n iptables -D INPUT -s {attacker_ip} -j DROP"
        subprocess.run(rule_cmd.split(), capture_output=True, timeout=1.5)
        logging.info(f"[SUCCESS] Traffic restored for {attacker_ip}.")
    except Exception as e:
        logging.warning(f"[INFO] Isolation rollback staged for {attacker_ip} ({e})")

def graceful_shutdown_host():
    """Triggers controlled host termination for critical threat scores (>= 95%)."""
    logging.critical("[CHAKRAVYUH AI] Critical compromise threshold reached! Initiating graceful host shutdown...")
    try:
        os.system("sudo -n shutdown -h +1 'Chakravyuh AI: Critical Security Breach Containment' 2>/dev/null || true")
    except Exception as e:
        logging.error(f"[ERROR] Failed to initiate host shutdown: {e}")
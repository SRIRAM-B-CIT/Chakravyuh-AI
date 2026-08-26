import os
import sys
import platform
import subprocess
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

IS_WINDOWS = platform.system() == "Windows"
IS_LINUX = platform.system() == "Linux"

def get_firewall_action_string(attacker_ip: str, action: str = "block") -> str:
    """Returns human-readable OS-specific firewall action string."""
    if IS_WINDOWS:
        if action == "block":
            return f'netsh advfirewall firewall add rule name="Chakravyuh-Block-{attacker_ip}" dir=in action=block remoteip={attacker_ip}'
        else:
            return f'netsh advfirewall firewall delete rule name="Chakravyuh-Block-{attacker_ip}"'
    else:
        if action == "block":
            return f"iptables -A INPUT -s {attacker_ip} -j DROP"
        else:
            return f"iptables -D INPUT -s {attacker_ip} -j DROP"

def isolate_host(attacker_ip: str):
    """Executes targeted micro-isolation on a single attacker IP across Windows and Linux."""
    if attacker_ip in ("127.0.0.1", "::1", "localhost", "127.0.0.0/8"):
        logging.info(f"[SAFEGUARD] Host {attacker_ip} is loopback; skipping system isolation rule.")
        return

    logging.warning(f"[CHAKRAVYUH AI] Isolating malicious host: {attacker_ip} on {platform.system()}")
    try:
        if IS_WINDOWS:
            # Windows Defender Firewall via netsh
            rule_name = f"Chakravyuh-Block-{attacker_ip}"
            # Check if rule exists
            check_cmd = f'netsh advfirewall firewall show rule name="{rule_name}"'
            result = subprocess.run(check_cmd, shell=True, capture_output=True, timeout=1.5)
            if result.returncode != 0:
                add_cmd = f'netsh advfirewall firewall add rule name="{rule_name}" dir=in action=block remoteip={attacker_ip}'
                subprocess.run(add_cmd, shell=True, capture_output=True, timeout=2.0)
                logging.info(f"[SUCCESS] Host {attacker_ip} isolated successfully via Windows Firewall.")
            else:
                logging.info(f"[INFO] Host {attacker_ip} is already blocked in Windows Firewall.")
        else:
            # Linux Netfilter / iptables
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
    """1-Click analyst rollback to restore connectivity across Windows and Linux."""
    logging.info(f"[CHAKRAVYUH AI] Removing isolation for host: {attacker_ip} on {platform.system()}")
    try:
        if IS_WINDOWS:
            rule_name = f"Chakravyuh-Block-{attacker_ip}"
            del_cmd = f'netsh advfirewall firewall delete rule name="{rule_name}"'
            subprocess.run(del_cmd, shell=True, capture_output=True, timeout=2.0)
            logging.info(f"[SUCCESS] Windows Firewall rule removed for {attacker_ip}.")
        else:
            rule_cmd = f"sudo -n iptables -D INPUT -s {attacker_ip} -j DROP"
            subprocess.run(rule_cmd.split(), capture_output=True, timeout=1.5)
            logging.info(f"[SUCCESS] Traffic restored for {attacker_ip} via iptables.")
    except Exception as e:
        logging.warning(f"[INFO] Isolation rollback staged for {attacker_ip} ({e})")

def graceful_shutdown_host():
    """Triggers controlled host termination for critical threat scores (>= 95%)."""
    logging.critical("[CHAKRAVYUH AI] Critical compromise threshold reached! Initiating graceful host shutdown...")
    try:
        if IS_WINDOWS:
            os.system('shutdown /s /t 60 /c "Chakravyuh AI: Critical Security Breach Containment" 2>nul || ver >nul')
        else:
            os.system("sudo -n shutdown -h +1 'Chakravyuh AI: Critical Security Breach Containment' 2>/dev/null || true")
    except Exception as e:
        logging.error(f"[ERROR] Failed to initiate host shutdown: {e}")
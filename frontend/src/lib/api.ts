import { SystemState, StreamPayload } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export type TelemetryMessage = StreamPayload;

export function getWebSocketUrl(): string {
  if (typeof window !== "undefined") {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (wsUrl) return wsUrl;
    return "ws://127.0.0.1:8000/ws/stream";
  }
  return "ws://127.0.0.1:8000/ws/stream";
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    let errorDetail = `Request failed: ${res.status} ${res.statusText}`;
    try {
      const errJson = await res.json();
      if (errJson.detail) errorDetail = errJson.detail;
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return res.json() as Promise<T>;
}

export const api = {
  getState: () => request<SystemState>("/api/state"),
  getLogs: (limit = 50) => request<{ logs: string[] }>(`/api/logs?limit=${limit}`),
  getTopology: () => request<SystemState["topology"]>("/api/topology"),
  getMetrics: () => request<any>("/api/metrics"),
  getPlaybooks: () => request<any>("/api/soar/playbooks"),

  isolate: (ip: string) =>
    request<{ status: string; message: string }>("/api/soar/isolate", {
      method: "POST",
      body: JSON.stringify({ ip }),
    }),

  rollback: (ip: string) =>
    request<{ status: string; message: string }>("/api/soar/rollback", {
      method: "POST",
      body: JSON.stringify({ ip }),
    }),

  remediate: (ip: string, threatType: string = "DoS/Flood") =>
    request<{ status: string; threat_ip: string; playbook_result: any }>("/api/soar/remediate", {
      method: "POST",
      body: JSON.stringify({ ip, threat_type: threatType }),
    }),

  simulateAttack: (ip = "192.168.29.124", attackType = "DoS/Flood", riskLevel = 0.96) =>
    request<{ status: string; message: string }>("/api/simulate/attack", {
      method: "POST",
      body: JSON.stringify({ ip, attack_type: attackType, risk_level: riskLevel }),
    }),

  reset: () =>
    request<{ status: string; message: string }>("/api/simulate/reset", {
      method: "POST",
    }),

  launchAttack: (vector: string, targetIp = "127.0.0.1", targetPort = 8000, duration = 10) =>
    request<{ status: string; message: string }>("/api/attack/launch", {
      method: "POST",
      body: JSON.stringify({
        vector,
        target_ip: targetIp,
        target_port: targetPort,
        duration,
      }),
    }),
};

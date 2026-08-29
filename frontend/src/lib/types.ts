export interface TopologyNode {
  id: string;
  ip: string;
  label: string;
  role: string;
  risk_score: number;
  status: "SAFE" | "MONITORING" | "ISOLATED" | "ATTACKER" | "SIMULATED" | "FAILED";
  packet_count: number;
  byte_rate: string;
  is_defense: boolean;
  is_isolated: boolean;
}

export interface TopologyEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
  traffic: string;
  protocol: string;
  animated: boolean;
  threat: boolean;
}

export interface TopologyData {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
  stats: {
    total_nodes: number;
    total_edges: number;
    threat_level: "NORMAL" | "ELEVATED" | "CRITICAL";
    active_flows: number;
  };
}

export interface RolloutSeries {
  Gateway: number[];
  "Defense Host": number[];
  "Internal Server": number[];
  "Threat Host": number[];
}

export interface SystemState {
  src_ip: string;
  label: string;
  ml_conf: number;
  risk_score: number;
  raw_model_risk?: number;
  guardrail_action?: "NONE" | "FALSE_POSITIVE_SUPPRESSED" | "ATTACK_CONFIRMED" | "ATTACK_UNATTRIBUTED";
  attack_attribution?: {
    verified: boolean;
    source_ip: string | null;
  };
  isolated: boolean;
  netfilter_drops?: string;
  rollout: number[];
  rollout_series?: RolloutSeries;
  topology: TopologyData;
  last_updated?: number;
}

export interface StreamPayload {
  timestamp: number;
  state: SystemState;
  logs: string[];
}

import os
import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Dict, Tuple, List, Optional

# Canonical 32-Feature Schema (matches model_training.py and NetDreamer architecture)
FEATURE_NAMES: List[str] = [
    "flow_duration",      # 0
    "forward_packets",    # 1
    "backward_packets",   # 2
    "total_packets",      # 3
    "forward_bytes",      # 4
    "backward_bytes",     # 5
    "total_bytes",        # 6
    "byte_ratio",         # 7
    "packet_ratio",       # 8
    "syn_count",          # 9
    "ack_count",          # 10
    "fin_count",          # 11
    "rst_count",          # 12
    "psh_count",          # 13
    "urg_count",          # 14
    "syn_ratio",          # 15
    "ack_ratio",          # 16
    "fin_ratio",          # 17
    "rst_ratio",          # 18
    "psh_ratio",          # 19
    "urg_ratio",          # 20
    "iat_mean",           # 21
    "iat_var",            # 22
    "iat_max",            # 23
    "ttl_mean",           # 24
    "ttl_var",            # 25
    "win_mean",           # 26
    "win_var",            # 27
    "frag_count",         # 28
    "pkt_size_mean",      # 29
    "pkt_size_var",       # 30
    "pkt_size_entropy"    # 31
]

MITRE_CLASSES: List[str] = [
    "Benign",                  # 0
    "Recon/BruteForce",        # 1
    "Infiltration",            # 2
    "Bot/LateralMovement",     # 3
    "DoS/Flood"                # 4
]


class NetworkWorldModel(nn.Module):
    """
    Recurrent State-Space World Model (RSSM) / NetDreamer for cyber threat trajectory forecasting.
    Includes:
      - Continuous Latent Encoder (32 -> 64)
      - Transition Core GRU Cell (64 -> 64)
      - Transition Latent Predictor (64 -> 64)
      - Continuous Threat Risk Head (64 -> 32 -> 1, Sigmoid)
      - MITRE Multi-stage Threat Classification Head (64 -> 32 -> 5, Softmax)
      - Self-Supervised Flow Reconstruction Decoder (64 -> 64 -> 32)
    """
    def __init__(self, input_dim: int = 32, latent_dim: int = 64, recurrent_dim: int = 64):
        super().__init__()
        self.input_dim = input_dim
        self.latent_dim = latent_dim
        self.recurrent_dim = recurrent_dim

        self.encoder = nn.Sequential(
            nn.Linear(input_dim, latent_dim),
            nn.ReLU(),
            nn.Linear(latent_dim, latent_dim)
        )
        self.transition_core = nn.GRUCell(latent_dim, recurrent_dim)
        self.transition_predictor = nn.Linear(recurrent_dim, latent_dim)

        self.risk_head = nn.Sequential(
            nn.Linear(latent_dim, 32),
            nn.ReLU(),
            nn.Linear(32, 1),
            nn.Sigmoid()
        )
        self.mitre_head = nn.Sequential(
            nn.Linear(latent_dim, 32),
            nn.ReLU(),
            nn.Linear(32, 5),
            nn.Softmax(dim=-1)
        )
        self.decoder = nn.Sequential(
            nn.Linear(latent_dim, latent_dim),
            nn.ReLU(),
            nn.Linear(latent_dim, input_dim)
        )

    def forward(self, x: torch.Tensor) -> Dict[str, torch.Tensor]:
        """
        Forward pass.
        Args:
            x: Tensor of shape (Batch, SeqLen, 32) or (Batch, 32)
        """
        if x.dim() == 2:
            x = x.unsqueeze(1)  # (B, 1, 32)
            
        B, T, D = x.shape
        x_flat = x.contiguous().view(B * T, D)
        z_flat = self.encoder(x_flat)
        z = z_flat.view(B, T, self.latent_dim)

        x_recon = self.decoder(z_flat).view(B, T, D)
        risk = self.risk_head(z_flat).view(B, T, 1)
        mitre = self.mitre_head(z_flat).view(B, T, 5)

        h = torch.zeros(B, self.recurrent_dim, device=x.device, dtype=x.dtype)
        predicted_z_list = []
        for t in range(T - 1):
            h = self.transition_core(z[:, t, :], h)
            z_next = self.transition_predictor(h)
            predicted_z_list.append(z_next)

        predicted_z = torch.stack(predicted_z_list, dim=1) if predicted_z_list else torch.empty((B, 0, self.latent_dim), device=x.device)

        return {
            "reconstructed_x": x_recon,
            "predicted_z": predicted_z,
            "actual_z": z,
            "risk_scores": risk,
            "mitre_stages": mitre
        }

    def predict_k_steps_forward(self, z_current: torch.Tensor, k_steps: int = 4) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Simulates K-step forward horizon rollout inside continuous latent space without external observations.
        Args:
            z_current: Tensor of shape (Batch, latent_dim) or (latent_dim,)
            k_steps: Horizon rollout steps (default 4)
        Returns:
            rollout_risks: Tensor of shape (Batch, k_steps)
            rollout_mitres: Tensor of shape (Batch, k_steps, 5)
        """
        if z_current.dim() == 1:
            z_current = z_current.unsqueeze(0)
            
        B = z_current.shape[0]
        h = torch.zeros(B, self.recurrent_dim, device=z_current.device, dtype=z_current.dtype)
        z = z_current
        rollout_risks = []
        rollout_mitres = []
        
        for _ in range(k_steps):
            h = self.transition_core(z, h)
            z = self.transition_predictor(h)
            risk = self.risk_head(z)
            mitre = self.mitre_head(z)
            rollout_risks.append(risk.squeeze(-1))
            rollout_mitres.append(mitre)
            
        return torch.stack(rollout_risks, dim=1), torch.stack(rollout_mitres, dim=1)

    @classmethod
    def load_pretrained(cls, weights_path: str, device: str = "cpu") -> "NetworkWorldModel":
        model = cls(input_dim=32, latent_dim=64, recurrent_dim=64)
        if os.path.exists(weights_path):
            state_dict = torch.load(weights_path, map_location=device, weights_only=True)
            model.load_state_dict(state_dict)
        model.to(device)
        model.eval()
        return model


# Backwards compatibility alias
RSSMWorldModel = NetworkWorldModel

import os
import sys
import glob
import json
import warnings
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from typing import List, Dict, Tuple, Any

# ── suppress minor warnings that clutter Kaggle output ──────────────────────
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=FutureWarning)

# ── Add project root to path so local imports work ──────────────────────────
PROJECT_ROOT = os.path.abspath(os.path.join(os.getcwd(), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# ── Kaggle paths (override for local runs via env vars) ─────────────────────
INPUT_DIR    = os.environ.get("EVAL_INPUT_DIR",   "/kaggle/input")
WEIGHTS_PATH = os.environ.get("EVAL_WEIGHTS",    "/kaggle/working/netdreamer_weights.pth")
SCALER_PATH  = os.environ.get("EVAL_SCALER",     "/kaggle/working/train_scaler.pkl")
OUTPUT_DIR   = os.environ.get("EVAL_OUTPUT_DIR", "/kaggle/working/evaluation")
ROWS_PER_FILE = int(os.environ.get("EVAL_ROWS",  "150000"))  # same as training rows_per_file
BATCH_SIZE    = int(os.environ.get("EVAL_BATCH",  "512"))
TRAIN_RATIO   = float(os.environ.get("TRAIN_RATIO", "0.8"))  # must match model_training.py

os.makedirs(OUTPUT_DIR, exist_ok=True)


# ============================================================
# 1.  IMPORTS (deferred so missing packages give clear errors)
# ============================================================
def _require(pkg: str):
    try:
        return __import__(pkg)
    except ImportError:
        raise ImportError(
            f"Required package '{pkg}' not found. "
            f"Install it with: pip install {pkg}"
        )

plt        = _require("matplotlib.pyplot")
sns        = _require("seaborn")
mpl        = _require("matplotlib")

from matplotlib import pyplot as plt
import seaborn as sns
import matplotlib

matplotlib.use("Agg")   # headless backend for Kaggle / CI

from sklearn.metrics import (
    roc_auc_score, average_precision_score,
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report,
    roc_curve, precision_recall_curve,
)
from sklearn.preprocessing import label_binarize
from sklearn.manifold import TSNE

# ── Local imports ────────────────────────────────────────────────────────────
# from src.models.model_training import CICIDSMultiFileDataset, NetworkWorldModel
class CICIDSMultiFileDataset(Dataset):
    """
    Ingests multiple CIC-IDS-2018 CSV files and produces temporal sliding windows
    of shape (Batch, T=10, D=32) with features aligned to the canonical
    packet_parser.py FEATURE_NAMES schema defined in feature_schema.py.

    Feature order matches:
      [flow_duration, forward_packets, backward_packets, total_packets,
       forward_bytes, backward_bytes, total_bytes, byte_ratio, packet_ratio,
       syn_count, ack_count, fin_count, rst_count, psh_count, urg_count,
       syn_ratio, ack_ratio, fin_ratio, rst_ratio, psh_ratio, urg_ratio,
       iat_mean, iat_var, iat_max,
       ttl_mean*, ttl_var*, win_mean, win_var*, frag_count*,
       pkt_size_mean, pkt_size_var, pkt_size_entropy*]
    (* = approximated from closest CIC-IDS column)
    """

    # Explicit CIC-IDS-2018 column names that map to each of our 32 features.
    # None = computed from other columns.
    CIC_SOURCE_COLS = [
        "Flow Duration",      # 0  flow_duration
        "Tot Fwd Pkts",       # 1  forward_packets
        "Tot Bwd Pkts",       # 2  backward_packets
        None,                 # 3  total_packets       (computed)
        "TotLen Fwd Pkts",    # 4  forward_bytes
        "TotLen Bwd Pkts",    # 5  backward_bytes
        None,                 # 6  total_bytes         (computed)
        None,                 # 7  byte_ratio          (computed)
        None,                 # 8  packet_ratio        (computed)
        "SYN Flag Cnt",       # 9  syn_count
        "ACK Flag Cnt",       # 10 ack_count
        "FIN Flag Cnt",       # 11 fin_count
        "RST Flag Cnt",       # 12 rst_count
        "PSH Flag Cnt",       # 13 psh_count
        "URG Flag Cnt",       # 14 urg_count
        None,                 # 15 syn_ratio           (computed)
        None,                 # 16 ack_ratio           (computed)
        None,                 # 17 fin_ratio           (computed)
        None,                 # 18 rst_ratio           (computed)
        None,                 # 19 psh_ratio           (computed)
        None,                 # 20 urg_ratio           (computed)
        "Flow IAT Mean",      # 21 iat_mean
        "Flow IAT Std",       # 22 iat_var   (std used as proxy; scale is consistent)
        "Flow IAT Max",       # 23 iat_max
        "Fwd Pkt Len Mean",   # 24 ttl_mean  (no TTL in CIC-IDS; best proxy)
        "Fwd Pkt Len Std",    # 25 ttl_var   (proxy)
        "Init Fwd Win Byts",  # 26 win_mean
        "Init Bwd Win Byts",  # 27 win_var   (proxy)
        "Fwd Byts/b Avg",     # 28 frag_count (no fragmentation field; proxy)
        "Pkt Size Avg",       # 29 pkt_size_mean
        "Pkt Len Var",        # 30 pkt_size_var
        "Pkt Len Std",        # 31 pkt_size_entropy (proxy)
    ]

    def __init__(
        self,
        file_paths: List[str],
        seq_len: int = 10,
        feature_dim: int = 32,
        rows_per_file: int = 150000,
        split: str = 'eval',
        train_ratio: float = 0.8,
    ):
        """
        Args:
            split: 'train' uses the first `train_ratio` fraction of each file's rows.
                   'eval'  uses the remaining (1-train_ratio) fraction — unseen data.
            train_ratio: Fraction of each file dedicated to training (default 0.80).
        """
        assert feature_dim == 32, "feature_dim must be 32 to match the canonical schema."
        assert split in ('train', 'eval'), "split must be 'train' or 'eval'."
        df_list = []

        label_mapping = {
            'Benign': 0,
            'FTP-BruteForce': 1,
            'SSH-Bruteforce': 1,
            'Infiltration': 2,
            'Bot': 3,
            'DDoS attacks-LOIC-HTTP': 4,
            'DDOS attack-HOIC': 4,
            'DoS attacks-Slowloris': 4,
            'DoS attacks-Hulk': 4,
            'DoS attacks-GoldenEye': 4
        }

        for path in file_paths:
            if os.path.exists(path):
                print(f"Loading {rows_per_file:,} rows from: {os.path.basename(path)}")
                sub_df = pd.read_csv(path, nrows=rows_per_file, low_memory=False)
                sub_df.columns = sub_df.columns.str.strip()

                # Drop repeated header rows embedded inside the data
                label_col = 'Label' if 'Label' in sub_df.columns else sub_df.columns[-1]
                sub_df = sub_df[sub_df[label_col] != 'Label']
                sub_df = sub_df[sub_df[label_col] != label_col]

                # Map labels immediately to enable stratified splitting
                sub_df['mitre_stage'] = sub_df[label_col].astype(str).str.strip().map(label_mapping).fillna(0).astype(int)
                sub_df['risk_score'] = (sub_df['mitre_stage'] > 0).astype(float)
                sub_df['orig_order'] = np.arange(len(sub_df))

                # Stratify split by mitre_stage class to ensure all labels are represented
                train_chunks = []
                eval_chunks = []
                for stage_cls, group in sub_df.groupby('mitre_stage'):
                    n_samples = len(group)
                    if n_samples == 1:
                        # Rare class: include in both train and eval to avoid class starvation
                        train_chunks.append(group)
                        eval_chunks.append(group)
                    else:
                        # Ensure both splits get at least 1 sample if n_samples >= 2
                        split_idx = max(1, min(n_samples - 1, int(n_samples * train_ratio)))
                        train_chunks.append(group.iloc[:split_idx])
                        eval_chunks.append(group.iloc[split_idx:])

                if split == 'train':
                    file_split_df = pd.concat(train_chunks, ignore_index=True)
                else:
                    file_split_df = pd.concat(eval_chunks, ignore_index=True)

                # Restore original temporal/chronological order
                file_split_df = file_split_df.sort_values('orig_order').drop(columns=['orig_order']).reset_index(drop=True)
                df_list.append(file_split_df)
            else:
                print(f"Skipping (not found): {path}")

        if not df_list:
            raise FileNotFoundError("No valid CSV files found at the specified paths.")

        df = pd.concat(df_list, ignore_index=True)
        print(f"[{split.upper()} SPLIT] Total rows after stratified split: {len(df):,}")

        # Force numeric conversion on all source columns we need
        required_src_cols = [c for c in self.CIC_SOURCE_COLS if c is not None]
        for col in required_src_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0.0)
            else:
                print(f"  [WARN] Column '{col}' not found in CSV, filling with zeros.")
                df[col] = 0.0

        def _get(col: str) -> np.ndarray:
            """Return column as float array, zeros if missing."""
            return df[col].values.astype(np.float64) if col in df.columns else np.zeros(len(df), dtype=np.float64)

        # ---- Build the 32 features explicitly ----
        flow_dur    = _get("Flow Duration")
        fwd_pkts    = _get("Tot Fwd Pkts")
        bwd_pkts    = _get("Tot Bwd Pkts")
        total_pkts  = fwd_pkts + bwd_pkts
        fwd_bytes   = _get("TotLen Fwd Pkts")
        bwd_bytes   = _get("TotLen Bwd Pkts")
        total_bytes = fwd_bytes + bwd_bytes
        byte_ratio  = fwd_bytes / (bwd_bytes + 1.0)
        pkt_ratio   = fwd_pkts  / (bwd_pkts  + 1.0)

        syn = _get("SYN Flag Cnt")
        ack = _get("ACK Flag Cnt")
        fin = _get("FIN Flag Cnt")
        rst = _get("RST Flag Cnt")
        psh = _get("PSH Flag Cnt")
        urg = _get("URG Flag Cnt")
        tp1 = total_pkts + 1.0  # avoid /0

        syn_r = syn / tp1
        ack_r = ack / tp1
        fin_r = fin / tp1
        rst_r = rst / tp1
        psh_r = psh / tp1
        urg_r = urg / tp1

        iat_mean    = _get("Flow IAT Mean")
        iat_var     = _get("Flow IAT Std")   # std as proxy
        iat_max     = _get("Flow IAT Max")

        ttl_mean    = _get("Fwd Pkt Len Mean")  # proxy
        ttl_var     = _get("Fwd Pkt Len Std")   # proxy
        win_mean    = _get("Init Fwd Win Byts")
        win_var     = _get("Init Bwd Win Byts")  # proxy
        frag_count  = _get("Fwd Byts/b Avg")    # proxy (no fragmentation field)

        pkt_sz_mean = _get("Pkt Size Avg")
        pkt_sz_var  = _get("Pkt Len Var")
        pkt_sz_ent  = _get("Pkt Len Std")       # proxy for entropy

        # Stack into (N, 32) matrix in canonical order
        feature_matrix = np.column_stack([
            flow_dur, fwd_pkts, bwd_pkts, total_pkts,
            fwd_bytes, bwd_bytes, total_bytes, byte_ratio, pkt_ratio,
            syn, ack, fin, rst, psh, urg,
            syn_r, ack_r, fin_r, rst_r, psh_r, urg_r,
            iat_mean, iat_var, iat_max,
            ttl_mean, ttl_var, win_mean, win_var, frag_count,
            pkt_sz_mean, pkt_sz_var, pkt_sz_ent,
        ]).astype(np.float32)

        # Clip Inf/-Inf, fill NaN
        feature_matrix = np.where(np.isfinite(feature_matrix), feature_matrix, 0.0)

        # Scaling strategy:
        #   train split → fit + transform with a fresh scaler (stored in self.scaler).
        #   eval  split → store raw features; caller MUST call apply_scaler() with
        #                  the training scaler before using this dataset.
        self.scaler = MinMaxScaler()
        if split == 'train':
            self.features = self.scaler.fit_transform(feature_matrix).astype(np.float32)
        else:
            self._raw_features = feature_matrix
            self.features = feature_matrix  # placeholder; overwritten by apply_scaler()

        self.mitre_stages = df['mitre_stage'].values.astype(np.int64)
        self.risk_scores = df['risk_score'].values.astype(np.float32)

        print(f"Dataset ready: {len(self.features):,} rows × 32 schema-aligned features [{split.upper()} split].")
        self.seq_len = seq_len
        self.feature_dim = feature_dim
        self.split = split

    def apply_scaler(self, scaler: MinMaxScaler) -> None:
        """
        Apply a pre-fitted training scaler to the evaluation split.
        MUST be called before creating the DataLoader for an 'eval' dataset.
        """
        assert self.split == 'eval', "apply_scaler() is only for eval datasets."
        self.scaler = scaler
        self.features = np.clip(
            scaler.transform(self._raw_features), 0.0, 1.0
        ).astype(np.float32)
        print(f"[EVAL] Applied training scaler. "
              f"Features range: [{self.features.min():.3f}, {self.features.max():.3f}]")

    def __len__(self) -> int:
        return max(0, len(self.features) - self.seq_len)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        return (
            torch.tensor(self.features[idx : idx + self.seq_len], dtype=torch.float32),
            torch.tensor(self.risk_scores[idx : idx + self.seq_len], dtype=torch.float32).unsqueeze(-1),
            torch.tensor(self.mitre_stages[idx : idx + self.seq_len], dtype=torch.long)
        )

class NetworkWorldModel(nn.Module):
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

# ============================================================
# 2.  HELPER: DARK PLOT STYLE
# ============================================================
MITRE_LABELS = [
    "Benign/Recon",
    "Initial Access",
    "Lateral Movement",
    "Command & Control",
    "Impact / DoS",
]

PALETTE = ["#4fc3f7", "#ef5350", "#ab47bc", "#26c6da", "#ff7043"]

def _style():
    """Apply a consistent dark theme to all plots."""
    plt.rcParams.update({
        "figure.facecolor":  "#0e1117",
        "axes.facecolor":    "#0e1117",
        "axes.edgecolor":    "#2b2b2b",
        "axes.labelcolor":   "#e0e0e0",
        "xtick.color":       "#a0a0a0",
        "ytick.color":       "#a0a0a0",
        "text.color":        "#e0e0e0",
        "grid.color":        "#1e1e2e",
        "font.family":       "monospace",
        "figure.dpi":        120,
    })

_style()


def savefig(name: str):
    path = os.path.join(OUTPUT_DIR, name)
    plt.savefig(path, bbox_inches="tight", facecolor=plt.rcParams["figure.facecolor"])
    plt.close()
    print(f"  [SAVED] {path}")
    return path


# ============================================================
# 3.  DATA LOADING
# ============================================================
def load_eval_data() -> DataLoader:
    """
    Builds an evaluation DataLoader using the held-out 20% of the same files
    used for training.  Applies the training MinMaxScaler (loaded from disk)
    to prevent data leakage from re-fitting.
    """
    import pickle

    selected = [
        "/kaggle/input/datasets/solarmainframe/ids-intrusion-csv/02-14-2018.csv",
        "/kaggle/input/datasets/solarmainframe/ids-intrusion-csv/02-15-2018.csv",
        "/kaggle/input/datasets/solarmainframe/ids-intrusion-csv/03-01-2018.csv",
        "/kaggle/input/datasets/solarmainframe/ids-intrusion-csv/03-02-2018.csv"
    ]
    # Filter to files that actually exist on this Kaggle session
    selected = [p for p in selected if os.path.exists(p)]
    if not selected:
        raise FileNotFoundError(
            "None of the expected CIC-IDS CSV files found. "
            "Check that the dataset is attached to this Kaggle notebook."
        )

    print(f"\n[DATA] Building EVAL split (last {int((1-TRAIN_RATIO)*100)}% of each file).")
    dataset = CICIDSMultiFileDataset(
        file_paths=selected,
        seq_len=10,
        feature_dim=32,
        rows_per_file=ROWS_PER_FILE,
        split='eval',
        train_ratio=TRAIN_RATIO,
    )

    # Load the training scaler and apply it to the eval features
    if os.path.exists(SCALER_PATH):
        with open(SCALER_PATH, "rb") as f:
            train_scaler = pickle.load(f)
        dataset.apply_scaler(train_scaler)
        print(f"[DATA] Training scaler loaded from {SCALER_PATH}")
    else:
        print(
            f"[DATA] WARNING: Training scaler not found at {SCALER_PATH}.\n"
            "       Evaluation features will be scaled independently — "
            "metrics may be inflated.  Run train_kaggle() first to produce train_scaler.pkl."
        )
        # Fallback: fit a local scaler (suboptimal but doesn't crash)
        dataset.apply_scaler(MinMaxScaler().fit(dataset._raw_features))

    loader = DataLoader(
        dataset,
        batch_size=BATCH_SIZE,
        shuffle=False,
        drop_last=False,
        num_workers=0,
    )
    print(f"[DATA] Evaluation dataset: {len(dataset):,} sequences × (T=10, D=32)")
    return loader


# ============================================================
# 4.  MODEL LOADING
# ============================================================
def load_model(device: torch.device) -> NetworkWorldModel:
    model = NetworkWorldModel(input_dim=32, latent_dim=64, recurrent_dim=64)
    if os.path.exists(WEIGHTS_PATH):
        model.load_state_dict(torch.load(WEIGHTS_PATH, map_location=device))
        print(f"[MODEL] Loaded weights from {WEIGHTS_PATH}")
    else:
        print(f"[MODEL] WARNING: Weights not found at {WEIGHTS_PATH}. "
              "Using randomly initialised model (metrics will be random).")
    model.to(device)
    model.eval()
    return model


# ============================================================
# 5.  INFERENCE LOOP
# ============================================================
@torch.no_grad()
def run_inference(
    model: NetworkWorldModel,
    loader: DataLoader,
    device: torch.device,
) -> Dict[str, np.ndarray]:
    """
    Runs the full evaluation dataset through the model and collects:
      - risk_probs:     (N, T)      predicted risk probability per timestep
      - risk_targets:   (N, T)      ground truth binary risk labels
      - mitre_probs:    (N, T, 5)   predicted MITRE stage probabilities
      - mitre_targets:  (N, T)      ground truth MITRE stage labels (0-4)
      - recon_mse:      (N,)        per-sample reconstruction MSE
      - latent_z:       (N, 64)     last-step latent vector (for t-SNE)
      - losses:         dict of per-batch scalar losses
    """
    risk_probs_list    = []
    risk_targets_list  = []
    mitre_probs_list   = []
    mitre_targets_list = []
    recon_mse_list     = []
    latent_z_list      = []

    batch_recon_losses = []
    batch_trans_losses = []
    batch_task_losses  = []
    batch_total_losses = []

    print("\n[EVAL] Running inference...")
    n_batches = len(loader)

    for i, (batch_x, batch_risk, batch_mitre) in enumerate(loader):
        if (i + 1) % max(1, n_batches // 10) == 0:
            print(f"  Batch {i+1:4d}/{n_batches}")

        batch_x     = batch_x.to(device)      # (B, T, 32)
        batch_risk  = batch_risk.to(device)   # (B, T, 1)
        batch_mitre = batch_mitre.to(device)  # (B, T)

        outputs = model(batch_x)

        # ── Risk probabilities & targets ──────────────────────────────────
        risk_prob  = outputs["risk_scores"].squeeze(-1).cpu().numpy()   # (B, T)
        risk_tgt   = batch_risk.squeeze(-1).cpu().numpy()               # (B, T)

        # ── MITRE probabilities & targets ─────────────────────────────────
        mitre_prob = outputs["mitre_stages"].cpu().numpy()              # (B, T, 5)
        mitre_tgt  = batch_mitre.cpu().numpy()                          # (B, T)

        # ── Reconstruction MSE per sample ─────────────────────────────────
        recon_sq_err = ((outputs["reconstructed_x"] - batch_x) ** 2)   # (B, T, 32)
        recon_mse    = recon_sq_err.mean(dim=(1, 2)).cpu().numpy()      # (B,)

        # ── Last-step latent vector for t-SNE ─────────────────────────────
        z_last = outputs["actual_z"][:, -1, :].cpu().numpy()            # (B, 64)

        # ── Per-batch losses ──────────────────────────────────────────────
        recon_loss = nn.functional.mse_loss(outputs["reconstructed_x"], batch_x).item()

        pred_z      = outputs["predicted_z"]
        actual_z_next = outputs["actual_z"][:, 1:, :]
        trans_loss = (
            nn.functional.mse_loss(pred_z, actual_z_next).item()
            if pred_z.shape[1] > 0 else 0.0
        )

        risk_loss = nn.functional.binary_cross_entropy(
            outputs["risk_scores"], batch_risk
        ).item()
        mitre_flat = outputs["mitre_stages"].view(-1, 5)
        mitre_loss = nn.functional.nll_loss(
            torch.log(mitre_flat + 1e-8), batch_mitre.view(-1)
        ).item()
        task_loss  = risk_loss + mitre_loss
        total_loss = recon_loss + trans_loss + task_loss

        risk_probs_list.append(risk_prob)
        risk_targets_list.append(risk_tgt)
        mitre_probs_list.append(mitre_prob)
        mitre_targets_list.append(mitre_tgt)
        recon_mse_list.append(recon_mse)
        latent_z_list.append(z_last)
        batch_recon_losses.append(recon_loss)
        batch_trans_losses.append(trans_loss)
        batch_task_losses.append(task_loss)
        batch_total_losses.append(total_loss)

    return {
        "risk_probs":    np.concatenate(risk_probs_list,   axis=0),    # (N, T)
        "risk_targets":  np.concatenate(risk_targets_list, axis=0),    # (N, T)
        "mitre_probs":   np.concatenate(mitre_probs_list,  axis=0),    # (N, T, 5)
        "mitre_targets": np.concatenate(mitre_targets_list, axis=0),   # (N, T)
        "recon_mse":     np.concatenate(recon_mse_list,    axis=0),    # (N,)
        "latent_z":      np.concatenate(latent_z_list,     axis=0),    # (N, 64)
        "losses": {
            "recon": np.array(batch_recon_losses),
            "transition": np.array(batch_trans_losses),
            "task":  np.array(batch_task_losses),
            "total": np.array(batch_total_losses),
        }
    }


# ============================================================
# 6.  METRIC COMPUTATION
# ============================================================
def compute_metrics(results: Dict[str, np.ndarray]) -> Dict[str, Any]:
    """Computes all scalar evaluation metrics."""
    metrics = {}

    # Flatten temporal dimension for classification metrics
    risk_prob_flat = results["risk_probs"].ravel()          # (N*T,)
    risk_tgt_flat  = results["risk_targets"].ravel().astype(int)
    risk_pred_flat = (risk_prob_flat >= 0.5).astype(int)

    mitre_prob_flat = results["mitre_probs"].reshape(-1, 5)  # (N*T, 5)
    mitre_tgt_flat  = results["mitre_targets"].ravel().astype(int)
    mitre_pred_flat = np.argmax(mitre_prob_flat, axis=1)

    # ── Risk Head ────────────────────────────────────────────────────────────
    metrics["risk_accuracy"]       = float(accuracy_score(risk_tgt_flat, risk_pred_flat))
    metrics["risk_precision"]      = float(precision_score(risk_tgt_flat, risk_pred_flat, zero_division=0))
    metrics["risk_recall"]         = float(recall_score(risk_tgt_flat, risk_pred_flat, zero_division=0))
    metrics["risk_f1"]             = float(f1_score(risk_tgt_flat, risk_pred_flat, zero_division=0))
    metrics["risk_auc_roc"]        = float(roc_auc_score(risk_tgt_flat, risk_prob_flat))
    metrics["risk_pr_auc"]         = float(average_precision_score(risk_tgt_flat, risk_prob_flat))

    # ── MITRE Stage Head ─────────────────────────────────────────────────────
    metrics["mitre_accuracy"]      = float(accuracy_score(mitre_tgt_flat, mitre_pred_flat))
    metrics["mitre_macro_f1"]      = float(f1_score(
        mitre_tgt_flat, mitre_pred_flat,
        labels=list(range(5)), average="macro", zero_division=0
    ))
    metrics["mitre_weighted_f1"]   = float(f1_score(
        mitre_tgt_flat, mitre_pred_flat,
        labels=list(range(5)), average="weighted", zero_division=0
    ))

    # Per-class metrics
    per_class = classification_report(
        mitre_tgt_flat, mitre_pred_flat,
        labels=list(range(5)),
        target_names=MITRE_LABELS,
        output_dict=True,
        zero_division=0,
    )
    metrics["mitre_per_class"] = per_class

    # ── Reconstruction ───────────────────────────────────────────────────────
    metrics["recon_mse_mean"] = float(results["recon_mse"].mean())
    metrics["recon_mse_std"]  = float(results["recon_mse"].std())
    metrics["recon_mse_p95"]  = float(np.percentile(results["recon_mse"], 95))

    # ── Losses ───────────────────────────────────────────────────────────────
    for k, v in results["losses"].items():
        metrics[f"avg_{k}_loss"] = float(v.mean())

    return metrics


# ============================================================
# 7.  VISUALISATIONS
# ============================================================

def plot_roc_pr_curves(results: Dict[str, np.ndarray]):
    """Plot 1: ROC Curve + PR Curve (Risk Head)."""
    risk_prob = results["risk_probs"].ravel()
    risk_tgt  = results["risk_targets"].ravel().astype(int)

    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    fig.suptitle("Risk Prediction Head — ROC & PR Curves", fontsize=14, color="#e0e0e0", y=1.01)

    # ROC
    fpr, tpr, _ = roc_curve(risk_tgt, risk_prob)
    auc_val = roc_auc_score(risk_tgt, risk_prob)
    ax = axes[0]
    ax.plot(fpr, tpr, color="#4fc3f7", lw=2, label=f"AUC = {auc_val:.4f}")
    ax.plot([0, 1], [0, 1], color="#555", lw=1, linestyle="--", label="Random")
    ax.fill_between(fpr, tpr, alpha=0.15, color="#4fc3f7")
    ax.set_xlabel("False Positive Rate")
    ax.set_ylabel("True Positive Rate")
    ax.set_title("ROC Curve")
    ax.legend(loc="lower right")
    ax.grid(alpha=0.3)

    # PR
    prec, rec, _ = precision_recall_curve(risk_tgt, risk_prob)
    pr_auc = average_precision_score(risk_tgt, risk_prob)
    ax = axes[1]
    ax.plot(rec, prec, color="#ef5350", lw=2, label=f"PR-AUC = {pr_auc:.4f}")
    ax.fill_between(rec, prec, alpha=0.15, color="#ef5350")
    ax.set_xlabel("Recall")
    ax.set_ylabel("Precision")
    ax.set_title("Precision-Recall Curve")
    ax.legend(loc="upper right")
    ax.grid(alpha=0.3)

    plt.tight_layout()
    return savefig("01_roc_pr_curves.png")


def plot_confusion_matrix(results: Dict[str, np.ndarray]):
    """Plot 2: MITRE Stage Confusion Matrix."""
    mitre_tgt  = results["mitre_targets"].ravel().astype(int)
    mitre_pred = np.argmax(results["mitre_probs"].reshape(-1, 5), axis=1)

    cm = confusion_matrix(mitre_tgt, mitre_pred, labels=list(range(5)))
    cm_norm = cm.astype(float) / (cm.sum(axis=1, keepdims=True) + 1e-9)

    fig, axes = plt.subplots(1, 2, figsize=(18, 7))
    fig.suptitle("MITRE ATT&CK Stage Classification — Confusion Matrices", fontsize=14, color="#e0e0e0")

    for ax, data, title, fmt in [
        (axes[0], cm,      "Raw Counts",        "d"),
        (axes[1], cm_norm, "Row-Normalised (%)", ".2%"),
    ]:
        sns.heatmap(
            data, ax=ax,
            annot=True, fmt=fmt,
            cmap="Blues",
            xticklabels=MITRE_LABELS,
            yticklabels=MITRE_LABELS,
            linewidths=0.5,
            linecolor="#2b2b2b",
            cbar_kws={"shrink": 0.8},
        )
        ax.set_xlabel("Predicted Stage", labelpad=10)
        ax.set_ylabel("True Stage", labelpad=10)
        ax.set_title(title, pad=12)
        ax.tick_params(axis="x", rotation=30)
        ax.tick_params(axis="y", rotation=0)

    plt.tight_layout()
    return savefig("02_confusion_matrix.png")


def plot_mitre_per_class_metrics(metrics: Dict[str, Any]):
    """Plot 3: Per-class Precision, Recall, F1 bar chart."""
    per_class = metrics["mitre_per_class"]
    labels_present = [l for l in MITRE_LABELS if l in per_class]

    prec_vals = [per_class[l]["precision"]  for l in labels_present]
    rec_vals  = [per_class[l]["recall"]     for l in labels_present]
    f1_vals   = [per_class[l]["f1-score"]   for l in labels_present]

    x = np.arange(len(labels_present))
    width = 0.26

    fig, ax = plt.subplots(figsize=(14, 6))
    ax.bar(x - width, prec_vals, width, label="Precision", color="#4fc3f7", alpha=0.9)
    ax.bar(x,         rec_vals,  width, label="Recall",    color="#ab47bc", alpha=0.9)
    ax.bar(x + width, f1_vals,   width, label="F1-Score",  color="#26c6da", alpha=0.9)

    ax.set_xticks(x)
    ax.set_xticklabels(labels_present, rotation=20, ha="right")
    ax.set_ylim(0, 1.05)
    ax.set_ylabel("Score")
    ax.set_title("MITRE Stage — Per-Class Metrics", fontsize=13)
    ax.legend()
    ax.grid(axis="y", alpha=0.3)
    ax.axhline(0.5, color="#ef5350", linestyle="--", linewidth=0.8, label="0.5 baseline")

    plt.tight_layout()
    return savefig("03_per_class_metrics.png")


def plot_multiclass_roc(results: Dict[str, np.ndarray]):
    """Plot 4: One-vs-Rest ROC curves for each MITRE stage."""
    mitre_tgt  = results["mitre_targets"].ravel().astype(int)
    mitre_prob = results["mitre_probs"].reshape(-1, 5)

    # Binarize
    mitre_tgt_bin = label_binarize(mitre_tgt, classes=list(range(5)))
    if mitre_tgt_bin.shape[1] == 1:
        # label_binarize collapses to 1-col when only 2 classes present; expand manually
        mitre_tgt_bin = np.hstack([1 - mitre_tgt_bin, mitre_tgt_bin])

    fig, ax = plt.subplots(figsize=(10, 7))

    for cls_idx, (label, color) in enumerate(zip(MITRE_LABELS, PALETTE)):
        if mitre_tgt_bin[:, cls_idx].sum() == 0:
            continue
        fpr, tpr, _ = roc_curve(mitre_tgt_bin[:, cls_idx], mitre_prob[:, cls_idx])
        auc_val = roc_auc_score(mitre_tgt_bin[:, cls_idx], mitre_prob[:, cls_idx])
        ax.plot(fpr, tpr, color=color, lw=2, label=f"{label}  (AUC={auc_val:.3f})")

    ax.plot([0, 1], [0, 1], "k--", lw=1)
    ax.set_xlabel("False Positive Rate")
    ax.set_ylabel("True Positive Rate")
    ax.set_title("MITRE Stage OvR — ROC Curves per Class", fontsize=13)
    ax.legend(loc="lower right", fontsize=9)
    ax.grid(alpha=0.3)
    plt.tight_layout()
    return savefig("04_mitre_multiclass_roc.png")


def plot_reconstruction_distribution(results: Dict[str, np.ndarray]):
    """Plot 5: Reconstruction MSE distribution, split by Benign vs Attack."""
    recon_mse  = results["recon_mse"]
    risk_tgt   = results["risk_targets"][:, -1].astype(int)   # last timestep label

    fig, ax = plt.subplots(figsize=(12, 5))

    for label, mask, color in [
        ("Benign",  risk_tgt == 0, "#4fc3f7"),
        ("Attack",  risk_tgt == 1, "#ef5350"),
    ]:
        subset = recon_mse[mask]
        if len(subset) == 0:
            continue
        ax.hist(subset, bins=80, alpha=0.6, color=color, label=f"{label} (n={len(subset):,})",
                density=True, range=(0, np.percentile(recon_mse, 99)))

    ax.set_xlabel("Reconstruction MSE (per sample)")
    ax.set_ylabel("Density")
    ax.set_title("Encoder-Decoder Reconstruction MSE — Benign vs Attack", fontsize=13)
    ax.legend()
    ax.grid(alpha=0.3)
    plt.tight_layout()
    return savefig("05_reconstruction_mse_dist.png")


def plot_loss_curves(results: Dict[str, np.ndarray]):
    """Plot 6: Per-batch loss breakdown across the evaluation set."""
    losses = results["losses"]
    n = len(losses["total"])
    x = np.arange(1, n + 1)

    fig, axes = plt.subplots(2, 2, figsize=(14, 9))
    fig.suptitle("Evaluation Loss Decomposition (per batch)", fontsize=14, color="#e0e0e0")

    pairs = [
        (axes[0, 0], "total",      "Total Loss",        "#ff7043"),
        (axes[0, 1], "recon",      "Reconstruction MSE","#4fc3f7"),
        (axes[1, 0], "transition", "Transition Loss",   "#ab47bc"),
        (axes[1, 1], "task",       "Task Loss (BCE+NLL)","#26c6da"),
    ]

    for ax, key, title, color in pairs:
        vals = losses[key]
        ax.plot(x, vals, color=color, lw=1.2, alpha=0.9)
        ax.fill_between(x, vals, alpha=0.15, color=color)
        ax.axhline(vals.mean(), color="#ffffff", lw=0.8, linestyle="--",
                   label=f"μ = {vals.mean():.4f}")
        ax.set_title(title)
        ax.set_xlabel("Batch index")
        ax.set_ylabel("Loss value")
        ax.legend(fontsize=9)
        ax.grid(alpha=0.3)

    plt.tight_layout()
    return savefig("06_loss_curves.png")


def plot_tsne_latent(results: Dict[str, np.ndarray], max_samples: int = 5000):
    """Plot 7: t-SNE 2-D projection of the latent space, coloured by MITRE stage."""
    latent_z   = results["latent_z"]
    mitre_tgt  = results["mitre_targets"][:, -1].astype(int)   # last timestep stage

    # Sub-sample to keep t-SNE tractable
    N = len(latent_z)
    if N > max_samples:
        idx = np.random.choice(N, max_samples, replace=False)
        latent_z  = latent_z[idx]
        mitre_tgt = mitre_tgt[idx]

    print(f"  [t-SNE] Fitting on {len(latent_z):,} latent vectors...")
    from sklearn.manifold import TSNE
    z_2d = TSNE(n_components=2, perplexity=40, random_state=42,
                n_iter=500, learning_rate="auto", init="pca").fit_transform(latent_z)

    fig, ax = plt.subplots(figsize=(12, 9))
    for cls_idx, (label, color) in enumerate(zip(MITRE_LABELS, PALETTE)):
        mask = mitre_tgt == cls_idx
        if mask.sum() == 0:
            continue
        ax.scatter(
            z_2d[mask, 0], z_2d[mask, 1],
            c=color, label=label, alpha=0.5, s=12, linewidths=0
        )

    ax.set_title("t-SNE Latent Space Projection (coloured by MITRE Stage)", fontsize=13)
    ax.set_xlabel("t-SNE dim 1")
    ax.set_ylabel("t-SNE dim 2")
    ax.legend(markerscale=2, fontsize=9)
    ax.grid(alpha=0.2)
    plt.tight_layout()
    return savefig("07_tsne_latent_space.png")


def plot_risk_score_distribution(results: Dict[str, np.ndarray]):
    """Plot 8: Distribution of predicted risk scores, split by Benign vs Attack."""
    risk_prob = results["risk_probs"].ravel()
    risk_tgt  = results["risk_targets"].ravel().astype(int)

    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    fig.suptitle("Predicted Risk Score Distribution", fontsize=13, color="#e0e0e0")

    # Histogram
    ax = axes[0]
    ax.hist(risk_prob[risk_tgt == 0], bins=60, alpha=0.7, color="#4fc3f7",
            label="Benign", density=True)
    ax.hist(risk_prob[risk_tgt == 1], bins=60, alpha=0.7, color="#ef5350",
            label="Attack", density=True)
    ax.axvline(0.5, color="#ffffff", linestyle="--", lw=1.2, label="Threshold 0.5")
    ax.set_xlabel("Predicted Risk Score")
    ax.set_ylabel("Density")
    ax.set_title("Histogram")
    ax.legend()
    ax.grid(alpha=0.3)

    # Box plot
    ax = axes[1]
    data_to_plot = [risk_prob[risk_tgt == 0], risk_prob[risk_tgt == 1]]
    bp = ax.boxplot(data_to_plot, patch_artist=True, notch=True,
                    medianprops=dict(color="white", lw=2),
                    widths=0.4)
    for patch, color in zip(bp["boxes"], ["#4fc3f7", "#ef5350"]):
        patch.set_facecolor(color)
        patch.set_alpha(0.7)
    ax.set_xticklabels(["Benign", "Attack"])
    ax.set_ylabel("Predicted Risk Score")
    ax.set_title("Box Plot (Benign vs Attack)")
    ax.grid(axis="y", alpha=0.3)

    plt.tight_layout()
    return savefig("08_risk_score_distribution.png")


def plot_rollout_horizon_error(
    model: NetworkWorldModel,
    loader: DataLoader,
    device: torch.device,
    max_k: int = 5,
    n_batches_to_check: int = 30,
):
    """
    Plot 9: Transition prediction error vs rollout horizon k (t+1 … t+max_k).
    Shows how latent prediction quality degrades as we forecast further ahead.
    """
    horizon_mse = {k: [] for k in range(1, max_k + 1)}

    with torch.no_grad():
        for i, (batch_x, _, _) in enumerate(loader):
            if i >= n_batches_to_check:
                break
            batch_x = batch_x.to(device)
            outputs  = model(batch_x)
            z_actual = outputs["actual_z"]   # (B, T, 64)
            B, T, D  = z_actual.shape

            # Start rollout from z at step T-max_k-1 so we have ground truth for all k steps
            start_step = max(0, T - max_k - 1)
            z_t   = z_actual[:, start_step, :]
            h_t   = torch.zeros(B, model.recurrent_dim, device=device, dtype=batch_x.dtype)

            for k in range(1, max_k + 1):
                h_t = model.transition_core(z_t, h_t)
                z_pred = model.transition_predictor(h_t)
                if (start_step + k) < T:
                    z_gt = z_actual[:, start_step + k, :]
                    mse  = nn.functional.mse_loss(z_pred, z_gt).item()
                    horizon_mse[k].append(mse)
                z_t = z_pred   # autoregressive rollout

    ks   = [k for k in range(1, max_k + 1) if horizon_mse[k]]
    mses = [np.mean(horizon_mse[k]) for k in ks]
    stds = [np.std(horizon_mse[k])  for k in ks]

    fig, ax = plt.subplots(figsize=(9, 5))
    ax.plot(ks, mses, "o-", color="#ff7043", lw=2, markersize=8)
    ax.fill_between(ks,
                    [m - s for m, s in zip(mses, stds)],
                    [m + s for m, s in zip(mses, stds)],
                    alpha=0.2, color="#ff7043")
    ax.set_xticks(ks)
    ax.set_xticklabels([f"t+{k}" for k in ks])
    ax.set_xlabel("Rollout Horizon")
    ax.set_ylabel("Latent State MSE")
    ax.set_title("Transition Model — Prediction Error vs Rollout Horizon", fontsize=13)
    ax.grid(alpha=0.3)
    plt.tight_layout()
    return savefig("09_rollout_horizon_error.png")


def plot_summary_card(metrics: Dict[str, Any], saved_plots: List[str]):
    """Plot 10: Text-based summary card of all scalar metrics."""
    fig, ax = plt.subplots(figsize=(11, 8))
    ax.axis("off")

    lines = [
        "╔══════════════════════════════════════════════════════════╗",
        "║        Chakravyuh-AI  ·  NetworkWorldModel Evaluation       ║",
        "╠══════════════════════════════════════════════════════════╣",
        "║  RISK HEAD (Binary: Benign vs Attack)                       ║",
        f"║    Accuracy  : {metrics['risk_accuracy']:.4f}                                    ║",
        f"║    Precision : {metrics['risk_precision']:.4f}                                    ║",
        f"║    Recall    : {metrics['risk_recall']:.4f}                                    ║",
        f"║    F1        : {metrics['risk_f1']:.4f}                                    ║",
        f"║    AUC-ROC   : {metrics['risk_auc_roc']:.4f}                                    ║",
        f"║    PR-AUC    : {metrics['risk_pr_auc']:.4f}                                    ║",
        "╠══════════════════════════════════════════════════════════╣",
        "║  MITRE STAGE HEAD (5-class)                                 ║",
        f"║    Accuracy  : {metrics['mitre_accuracy']:.4f}                                    ║",
        f"║    Macro F1  : {metrics['mitre_macro_f1']:.4f}                                    ║",
        f"║    Wgtd  F1  : {metrics['mitre_weighted_f1']:.4f}                                    ║",
        "╠══════════════════════════════════════════════════════════╣",
        "║  RECONSTRUCTION (Encoder-Decoder)                           ║",
        f"║    MSE mean  : {metrics['recon_mse_mean']:.6f}                                 ║",
        f"║    MSE std   : {metrics['recon_mse_std']:.6f}                                 ║",
        f"║    MSE p95   : {metrics['recon_mse_p95']:.6f}                                 ║",
        "╠══════════════════════════════════════════════════════════╣",
        "║  EVAL LOSSES (avg over batches)                             ║",
        f"║    Total     : {metrics['avg_total_loss']:.4f}                                    ║",
        f"║    Recon     : {metrics['avg_recon_loss']:.4f}                                    ║",
        f"║    Transition: {metrics['avg_transition_loss']:.4f}                                    ║",
        f"║    Task      : {metrics['avg_task_loss']:.4f}                                    ║",
        "╚══════════════════════════════════════════════════════════╝",
    ]

    ax.text(
        0.02, 0.98, "\n".join(lines),
        transform=ax.transAxes,
        fontsize=9.5, fontfamily="monospace",
        verticalalignment="top",
        color="#e0e0e0",
        bbox=dict(facecolor="#0e1117", edgecolor="#4fc3f7", boxstyle="round,pad=0.5", lw=1.5),
    )
    return savefig("10_summary_card.png")


# ============================================================
# 8.  MAIN
# ============================================================
def evaluate():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"\n{'='*60}")
    print(f"  Chakravyuh-AI — NetworkWorldModel Evaluation")
    print(f"  Device  : {device}")
    print(f"  Weights : {WEIGHTS_PATH}")
    print(f"  Output  : {OUTPUT_DIR}")
    print(f"{'='*60}")

    # 1. Load data & model
    loader = load_eval_data()
    model  = load_model(device)

    # 2. Run inference
    results = run_inference(model, loader, device)
    print(f"\n[EVAL] Collected {len(results['risk_probs']):,} sequence predictions.")

    # 3. Compute metrics
    print("\n[METRICS] Computing evaluation metrics...")
    metrics = compute_metrics(results)

    # Print summary to stdout
    print("\n" + "─" * 50)
    print(f"  Risk Head  → Acc={metrics['risk_accuracy']:.4f}  F1={metrics['risk_f1']:.4f}  "
          f"AUC={metrics['risk_auc_roc']:.4f}  PR-AUC={metrics['risk_pr_auc']:.4f}")
    print(f"  MITRE Head → Acc={metrics['mitre_accuracy']:.4f}  Macro-F1={metrics['mitre_macro_f1']:.4f}")
    print(f"  Recon MSE  → {metrics['recon_mse_mean']:.6f} ± {metrics['recon_mse_std']:.6f}")
    print(f"  Avg Total Loss: {metrics['avg_total_loss']:.4f}")
    print("─" * 50)

    # 4. Save metrics JSON
    metrics_safe = {k: v for k, v in metrics.items() if k != "mitre_per_class"}
    metrics_safe["mitre_per_class"] = metrics["mitre_per_class"]
    json_path = os.path.join(OUTPUT_DIR, "metrics.json")
    with open(json_path, "w") as f:
        json.dump(metrics_safe, f, indent=2, default=float)
    print(f"\n[SAVED] Metrics → {json_path}")

    # 5. Generate all visualisations
    print("\n[PLOTS] Generating visualisations...")
    saved_plots = []

    saved_plots.append(plot_roc_pr_curves(results))
    saved_plots.append(plot_confusion_matrix(results))
    saved_plots.append(plot_mitre_per_class_metrics(metrics))
    saved_plots.append(plot_multiclass_roc(results))
    saved_plots.append(plot_reconstruction_distribution(results))
    saved_plots.append(plot_loss_curves(results))
    saved_plots.append(plot_tsne_latent(results))
    saved_plots.append(plot_risk_score_distribution(results))
    saved_plots.append(plot_rollout_horizon_error(model, loader, device))
    saved_plots.append(plot_summary_card(metrics, saved_plots))

    print(f"\n{'='*60}")
    print(f"  Evaluation complete! {len(saved_plots)} plots saved to:")
    print(f"  {OUTPUT_DIR}")
    print(f"{'='*60}\n")

    return metrics

if __name__ == "__main__":
    evaluate()
import os
import sys
import glob
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torch.optim.lr_scheduler import ReduceLROnPlateau
from sklearn.preprocessing import MinMaxScaler
from typing import Tuple, List, Dict, Any, Optional

# ==========================================
# 1. ROBUST MULTI-FILE DATASET LOADER
# ==========================================
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
        split: str = 'train',
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

        # MinMax scale to [0, 1]
        # Training split: fit + transform (scaler is stored as an attribute so the
        # caller can persist it).  Evaluation split: expects a pre-fitted scaler
        # to be passed in via self.scaler after construction (or uses a fresh one).
        self.scaler = MinMaxScaler()
        if split == 'train':
            self.features = self.scaler.fit_transform(feature_matrix).astype(np.float32)
        else:
            # Evaluation: scaler will be replaced by the caller with the training scaler.
            # We store the raw matrix and transform lazily so the caller can inject it.
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
        Must be called on 'eval' datasets before creating the DataLoader.
        """
        assert self.split == 'eval', "apply_scaler() is only for eval datasets."
        self.scaler = scaler
        self.features = np.clip(
            scaler.transform(self._raw_features), 0.0, 1.0
        ).astype(np.float32)
        print(f"[EVAL] Applied training scaler. Features range: "
              f"[{self.features.min():.3f}, {self.features.max():.3f}]")

    def __len__(self) -> int:
        return max(0, len(self.features) - self.seq_len)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        return (
            torch.tensor(self.features[idx : idx + self.seq_len], dtype=torch.float32),
            torch.tensor(self.risk_scores[idx : idx + self.seq_len], dtype=torch.float32).unsqueeze(-1),
            torch.tensor(self.mitre_stages[idx : idx + self.seq_len], dtype=torch.long)
        )




# ==========================================
# 2. WORLD MODEL ARCHITECTURE
# ==========================================
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


# ==========================================
# 3. KAGGLE TRAINING FUNCTION
# ==========================================
def train_kaggle():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}")

    # Discover CSV files in Kaggle input
    csv_candidates = sorted(glob.glob("/kaggle/input/**/*.csv", recursive=True))
    print(f"Found {len(csv_candidates)} CSV files in Kaggle input.")

    # Select top 4 attack files
    selected_files = [
        "/kaggle/input/datasets/solarmainframe/ids-intrusion-csv/02-14-2018.csv",
        "/kaggle/input/datasets/solarmainframe/ids-intrusion-csv/03-01-2018.csv",
        "/kaggle/input/datasets/solarmainframe/ids-intrusion-csv/03-02-2018.csv",
        "/kaggle/input/datasets/solarmainframe/ids-intrusion-csv/02-15-2018.csv"
    ]

    dataset = CICIDSMultiFileDataset(
        file_paths=selected_files, seq_len=10, feature_dim=32,
        rows_per_file=150000, split='train', train_ratio=0.8
    )
    dataloader = DataLoader(dataset, batch_size=256, shuffle=True, drop_last=True)

    model = NetworkWorldModel(input_dim=32, latent_dim=64, recurrent_dim=64).to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)
    scheduler = ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=2)

    epochs = 10
    print(f"\nBeginning training ({epochs} epochs)...")

    for epoch in range(1, epochs + 1):
        model.train()
        epoch_recon, epoch_trans, epoch_task, epoch_total = 0.0, 0.0, 0.0, 0.0

        for batch_x, batch_risk, batch_mitre in dataloader:
            batch_x, batch_risk, batch_mitre = batch_x.to(device), batch_risk.to(device), batch_mitre.to(device)

            optimizer.zero_grad()
            outputs = model(batch_x)

            # Losses
            recon_loss = nn.functional.mse_loss(outputs["reconstructed_x"], batch_x)
            pred_z = outputs["predicted_z"]
            actual_z_next = outputs["actual_z"][:, 1:, :]
            trans_loss = nn.functional.mse_loss(pred_z, actual_z_next) if pred_z.shape[1] > 0 else torch.tensor(0.0, device=device)

            risk_loss = nn.functional.binary_cross_entropy(outputs["risk_scores"], batch_risk)
            mitre_probs = outputs["mitre_stages"].view(-1, 5)
            mitre_targets = batch_mitre.view(-1)
            mitre_loss = nn.functional.nll_loss(torch.log(mitre_probs + 1e-8), mitre_targets)

            task_loss = risk_loss + mitre_loss
            total_loss = recon_loss + trans_loss + task_loss

            total_loss.backward()
            optimizer.step()

            epoch_recon += recon_loss.item()
            epoch_trans += trans_loss.item()
            epoch_task += task_loss.item()
            epoch_total += total_loss.item()

        n = len(dataloader)
        avg_total = epoch_total / n
        scheduler.step(avg_total)
        print(f"Epoch {epoch:02d}/{epochs:02d} | Total Loss: {avg_total:.4f} (Recon: {epoch_recon/n:.4f}, Trans: {epoch_trans/n:.4f}, Task: {epoch_task/n:.4f})")

    # Save weights to Kaggle working directory
    import pickle
    save_path = "/kaggle/working/netdreamer_weights.pth"
    torch.save(model.state_dict(), save_path)
    print(f"\n[COMPLETE] Model saved to {save_path}.")

    # Save the training scaler so the eval script can apply the same normalization
    # to the unseen 20% eval split — avoids data leakage from re-fitting.
    scaler_path = "/kaggle/working/train_scaler.pkl"
    with open(scaler_path, "wb") as f:
        pickle.dump(dataset.scaler, f)
    print(f"[COMPLETE] Scaler saved to {scaler_path}. Download both files from the Kaggle Output tab!")

if __name__ == "__main__":
    train_kaggle()
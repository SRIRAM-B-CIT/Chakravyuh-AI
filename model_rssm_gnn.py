import torch
import torch.nn as nn
import torch.nn.functional as F
from torch_geometric.nn import GCNConv

class SpatioTemporalGNN(nn.Module):
    """Spatio-Temporal GNN to aggregate node (host) & edge (flow) features."""
    def __init__(self, in_channels, hidden_channels):
        super(SpatioTemporalGNN, self).__init__()
        self.conv1 = GCNConv(in_channels, hidden_channels)
        self.conv2 = GCNConv(hidden_channels, hidden_channels)

    def forward(self, x, edge_index):
        x = self.conv1(x, edge_index)
        x = F.relu(x)
        x = self.conv2(x, edge_index)
        return x

class RSSMWorldModel(nn.Module):
    """Recurrent State-Space World Model (RSSM) for K-step forward state rollouts P(S_{t+1} | S_t)."""
    def __init__(self, feature_dim, hidden_dim, latent_dim, num_classes):
        super(RSSMWorldModel, self).__init__()
        self.gnn = SpatioTemporalGNN(feature_dim, hidden_dim)
        
        # Recurrent GRU Cell for state dynamics
        self.gru = nn.GRUCell(hidden_dim, hidden_dim)
        
        # Continuous Latent Representation Projection
        self.fc_latent = nn.Linear(hidden_dim, latent_dim)
        
        # Forward Attack Trajectory Predictor
        self.classifier = nn.Linear(latent_dim, num_classes)

    def forward(self, x, edge_index, hidden_state=None):
        # 1. Graph Spatial Feature Extraction across all active topology nodes
        node_embed = self.gnn(x, edge_index)
        graph_pooled = torch.mean(node_embed, dim=0, keepdim=True) # Pool global network graph
        
        if hidden_state is None:
            hidden_state = torch.zeros_like(graph_pooled)
            
        # 2. RSSM Temporal Transition Step
        new_hidden = self.gru(graph_pooled, hidden_state)
        
        # 3. Continuous Latent Space Representation z_t
        latent_z = F.relu(self.fc_latent(new_hidden))
        
        # 4. Multi-step Infiltration Horizon Forecast
        logits = self.classifier(latent_z)
        
        # 5. Node-level risk projections
        node_latent = F.relu(self.fc_latent(node_embed))
        node_logits = self.classifier(node_latent)
        
        return logits, new_hidden, node_logits

    def predict_k_steps_forward(self, current_hidden, k_steps=5):
        """Simulates K-step forward horizon rollout inside latent continuous space."""
        simulated_states = []
        state = current_hidden
        for _ in range(k_steps):
            # Recurrent forward projection without external observation
            state = self.gru(state, state)
            latent = F.relu(self.fc_latent(state))
            prob = F.softmax(self.classifier(latent), dim=-1)
            simulated_states.append(prob)
        return torch.stack(simulated_states)
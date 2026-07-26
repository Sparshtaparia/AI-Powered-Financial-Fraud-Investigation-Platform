import torch
import torch.nn.functional as F
from torch_geometric.nn import SAGEConv

class GraphSAGE(torch.nn.Module):
    """
    GraphSAGE model for node classification (anomaly detection in graph).
    """
    def __init__(self, in_channels, hidden_channels, out_channels):
        super(GraphSAGE, self).__init__()
        self.conv1 = SAGEConv(in_channels, hidden_channels)
        self.conv2 = SAGEConv(hidden_channels, out_channels)

    def forward(self, x, edge_index):
        x = self.conv1(x, edge_index)
        x = F.relu(x)
        x = F.dropout(x, p=0.2, training=self.training)
        x = self.conv2(x, edge_index)
        return F.log_softmax(x, dim=1)

# Dummy instance and mock inference
def get_graph_anomaly_score(node_id):
    """Mock function to simulate GraphSAGE inference."""
    # In reality, we would pull the ego graph from Neo4j, 
    # convert to PyG Data object, and run inference.
    return 0.85 # High anomaly

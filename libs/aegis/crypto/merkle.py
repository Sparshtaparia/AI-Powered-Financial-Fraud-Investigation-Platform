from typing import List
from .hashing import hash_bytes

def compute_merkle_root(hashes: List[str]) -> str:
    """Computes a simple Merkle root from a list of hex hashes."""
    if not hashes:
        return hash_bytes(b"")

    current_layer = hashes[:]
    while len(current_layer) > 1:
        next_layer = []
        for i in range(0, len(current_layer), 2):
            left = current_layer[i]
            right = current_layer[i+1] if i+1 < len(current_layer) else left
            combined = (left + right).encode('utf-8')
            next_layer.append(hash_bytes(combined))
        current_layer = next_layer

    return current_layer[0]

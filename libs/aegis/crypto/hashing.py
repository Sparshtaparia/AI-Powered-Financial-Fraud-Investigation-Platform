import hashlib

def hash_bytes(data: bytes) -> str:
    """Hashes bytes using SHA-256 and returns hex string."""
    return hashlib.sha256(data).hexdigest()

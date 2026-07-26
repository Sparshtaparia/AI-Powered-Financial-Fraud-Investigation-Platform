from aegis.crypto.canonical import canonicalize
from aegis.crypto.hashing import hash_bytes
from aegis.crypto.merkle import compute_merkle_root

class CryptoService:
    @staticmethod
    def serialize_and_hash(payload: dict) -> tuple[str, str]:
        canonical = canonicalize(payload)
        bundle_hash = hash_bytes(canonical)
        return canonical.decode('utf-8'), bundle_hash

    @staticmethod
    def build_tree(hashes: list[str]) -> str:
        return compute_merkle_root(hashes)

crypto_service = CryptoService()

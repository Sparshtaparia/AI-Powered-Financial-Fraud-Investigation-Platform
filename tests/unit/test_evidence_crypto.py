import os
import sys

sys.path.append(os.path.abspath("./libs"))

from aegis.crypto.canonical import canonicalize
from aegis.crypto.hashing import hash_bytes
from aegis.crypto.merkle import compute_merkle_root


def test_canonical_json_ordering():
    d1 = {"a": 1, "b": 2}
    d2 = {"b": 2, "a": 1}
    assert canonicalize(d1) == canonicalize(d2)
    assert canonicalize(d1) == b'{"a":1,"b":2}'


def test_merkle_root():
    hashes = [hash_bytes(b"A"), hash_bytes(b"B"), hash_bytes(b"C")]
    root = compute_merkle_root(hashes)
    assert isinstance(root, str)
    assert len(root) == 64

    # Changing order changes root
    hashes2 = [hash_bytes(b"B"), hash_bytes(b"A"), hash_bytes(b"C")]
    root2 = compute_merkle_root(hashes2)
    assert root != root2

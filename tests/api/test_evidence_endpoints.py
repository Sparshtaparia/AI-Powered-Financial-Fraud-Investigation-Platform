import os
import sys

from fastapi.testclient import TestClient

sys.path.append(os.path.abspath("./services/evidence-service"))
sys.path.append(os.path.abspath("./libs"))

import api.routes

# Mocking LedgerRepository before importing main
import services.evidence_manager


class MockLedgerRepo:
    def __init__(self):
        self.bundles = []
        self.merkle = {}

    def save_bundle(self, bid, cid, bhash, cjson, meta):
        self.bundles.append(
            {
                "id": bid,
                "case_id": cid,
                "bundle_hash": bhash,
                "canonical_json": cjson,
                "created_at": "now",
            }
        )

    def get_bundle(self, bhash):
        for b in self.bundles:
            if b["bundle_hash"] == bhash:
                return b
        return None

    def list_case_bundles(self, cid):
        return [b for b in self.bundles if b["case_id"] == cid]

    def save_merkle_root(self, cid, mroot, count):
        self.merkle[cid] = {"case_id": cid, "merkle_root": mroot, "bundle_count": count}

    def get_merkle_root(self, cid):
        return self.merkle.get(cid)


mock_repo = MockLedgerRepo()
services.evidence_manager.evidence_manager.repo = mock_repo
api.routes.ledger_repo = mock_repo

from main import app

client = TestClient(app)


def test_commit_and_verify():
    # Commit 1
    payload1 = {
        "case_id": "CASE_1",
        "metadata": {"source": "ml"},
        "data": {"score": 0.9},
    }
    r1 = client.post("/commit", json=payload1)
    assert r1.status_code == 200
    data1 = r1.json()
    assert data1["case_id"] == "CASE_1"
    assert "bundle_hash" in data1
    root1 = data1["merkle_root"]

    # Commit 2
    payload2 = {
        "case_id": "CASE_1",
        "metadata": {"source": "graph"},
        "data": {"pagerank": 0.1},
    }
    r2 = client.post("/commit", json=payload2)
    assert r2.status_code == 200
    data2 = r2.json()
    root2 = data2["merkle_root"]

    # Root should change
    assert root1 != root2

    # Verify first bundle
    v1 = client.post(
        "/verify", json={"case_id": "CASE_1", "bundle_hash": data1["bundle_hash"]}
    )
    assert v1.status_code == 200
    assert v1.json()["valid"] is True

import uuid
from datetime import datetime

from aegis.schemas.evidence import CommitResponse, EvidencePayload, VerifyResponse
from repositories.ledger_repository import ledger_repo
from services.crypto_service import crypto_service


class EvidenceManager:
    def __init__(self, repo, crypto):
        self.repo = repo
        self.crypto = crypto

    def commit_evidence(self, payload: EvidencePayload) -> CommitResponse:
        case_id = payload.case_id

        # 1. Canonicalize & Hash
        canonical_json, bundle_hash = self.crypto.serialize_and_hash(
            payload.model_dump()
        )

        # 2. Store bundle
        bundle_id = str(uuid.uuid4())
        self.repo.save_bundle(
            bundle_id, case_id, bundle_hash, canonical_json, payload.metadata
        )

        # 3. Update Merkle
        bundles = self.repo.list_case_bundles(case_id)
        hashes = [b["bundle_hash"] for b in bundles]
        merkle_root = self.crypto.build_tree(hashes)
        self.repo.save_merkle_root(case_id, merkle_root, len(hashes))

        return CommitResponse(
            case_id=case_id,
            bundle_hash=bundle_hash,
            merkle_root=merkle_root,
            timestamp=datetime.utcnow().isoformat() + "Z",
            version="v1",
        )

    def verify_evidence(self, case_id: str, bundle_hash: str) -> VerifyResponse:
        bundle = self.repo.get_bundle(bundle_hash)
        if not bundle or bundle["case_id"] != case_id:
            return VerifyResponse(valid=False, reason="Bundle not found in case ledger")

        # Verify bundle hash integrity against canonical JSON
        canonical_bytes = bundle["canonical_json"].encode("utf-8")
        # computed_hash = self.crypto.serialize_and_hash(
        #     import_json(bundle["canonical_json"])
        # )[1]
        # Since canonical_json is already a string, we can just hash it.
        import hashlib

        raw_computed = hashlib.sha256(canonical_bytes).hexdigest()

        if raw_computed != bundle_hash:
            return VerifyResponse(valid=False, reason="Bundle hash mismatch (tampered)")

        return VerifyResponse(valid=True, reason=None)


def import_json(s):
    import json

    return json.loads(s)


evidence_manager = EvidenceManager(ledger_repo, crypto_service)

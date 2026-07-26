import os
import textwrap

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(textwrap.dedent(content))

# 1. Update libs/aegis/config/settings.py to include Postgres
write_file('libs/aegis/config/settings.py', """\
    from pydantic_settings import BaseSettings

    class AegisSettings(BaseSettings):
        environment: str = "development"
        model_artifacts_path: str = "../../artifacts/models"
        feature_store_path: str = "../../artifacts/feature_store"
        
        # Neo4j Settings
        neo4j_uri: str = "bolt://localhost:7687"
        neo4j_user: str = "neo4j"
        neo4j_password: str = "password"
        
        # Postgres Settings
        postgres_dsn: str = "postgresql://postgres:aegis@localhost:5432/postgres"
        
        class Config:
            env_prefix = "AEGIS_"
""")

# 2. Add crypto libs
write_file('libs/aegis/crypto/__init__.py', "")
write_file('libs/aegis/crypto/canonical.py', """\
    import json

    def canonicalize(data: dict) -> bytes:
        \"\"\"
        Converts a dictionary into a canonical JSON byte string.
        Sorting keys, removing whitespace, encoding to UTF-8.
        \"\"\"
        return json.dumps(data, sort_keys=True, separators=(',', ':')).encode('utf-8')
""")
write_file('libs/aegis/crypto/hashing.py', """\
    import hashlib

    def hash_bytes(data: bytes) -> str:
        \"\"\"Hashes bytes using SHA-256 and returns hex string.\"\"\"
        return hashlib.sha256(data).hexdigest()
""")
write_file('libs/aegis/crypto/merkle.py', """\
    from typing import List
    from .hashing import hash_bytes

    def compute_merkle_root(hashes: List[str]) -> str:
        \"\"\"Computes a simple Merkle root from a list of hex hashes.\"\"\"
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
""")

# 3. Add evidence schemas
write_file('libs/aegis/schemas/evidence.py', """\
    from pydantic import BaseModel, Field
    from typing import Dict, Any, Optional, List

    class EvidencePayload(BaseModel):
        case_id: str
        metadata: Dict[str, Any]
        data: Dict[str, Any]

    class CommitResponse(BaseModel):
        case_id: str
        bundle_hash: str
        merkle_root: str
        timestamp: str
        version: str
        algorithm: str = "SHA-256"

    class VerifyRequest(BaseModel):
        case_id: str
        bundle_hash: str

    class VerifyResponse(BaseModel):
        valid: bool
        reason: Optional[str] = None
        
    class BundleRecord(BaseModel):
        id: str
        case_id: str
        bundle_hash: str
        canonical_json: str
        created_at: str
        
    class LedgerResponse(BaseModel):
        case_id: str
        merkle_root: str
        bundle_count: int
        bundles: List[BundleRecord]
""")

# 4. Evidence Service Requirements
write_file('services/evidence-service/requirements.txt', """\
    -e ../../libs
    fastapi
    uvicorn
    pydantic-settings
    psycopg2-binary
""")

# 5. Core Config
write_file('services/evidence-service/core/config.py', """\
    from aegis.config.settings import AegisSettings

    class EvidenceServiceSettings(AegisSettings):
        pass

    settings = EvidenceServiceSettings()
""")

# 6. Postgres Repository
write_file('services/evidence-service/repositories/ledger_repository.py', """\
    import psycopg2
    from psycopg2.extras import RealDictCursor
    from core.config import settings
    from aegis.logging.logger import get_logger

    logger = get_logger("ledger_repository")

    class LedgerRepository:
        def __init__(self):
            self.dsn = settings.postgres_dsn
            self._create_tables()

        def _get_connection(self):
            return psycopg2.connect(self.dsn, cursor_factory=RealDictCursor)

        def _create_tables(self):
            try:
                with self._get_connection() as conn:
                    with conn.cursor() as cur:
                        cur.execute(\"\"\"
                            CREATE TABLE IF NOT EXISTS evidence_bundle (
                                id UUID PRIMARY KEY,
                                case_id VARCHAR(255) NOT NULL,
                                bundle_hash VARCHAR(64) NOT NULL,
                                canonical_json TEXT NOT NULL,
                                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                created_by VARCHAR(255),
                                metadata_json JSONB
                            );
                            CREATE INDEX IF NOT EXISTS idx_bundle_case_id ON evidence_bundle(case_id);
                            
                            CREATE TABLE IF NOT EXISTS case_merkle (
                                case_id VARCHAR(255) PRIMARY KEY,
                                merkle_root VARCHAR(64) NOT NULL,
                                bundle_count INT NOT NULL,
                                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                            );
                        \"\"\")
                    conn.commit()
            except Exception as e:
                logger.error(f"Failed to initialize Postgres schema: {e}")

        def save_bundle(self, bundle_id: str, case_id: str, bundle_hash: str, canonical_json: str, metadata: dict):
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    import json
                    cur.execute(\"\"\"
                        INSERT INTO evidence_bundle (id, case_id, bundle_hash, canonical_json, metadata_json)
                        VALUES (%s, %s, %s, %s, %s)
                    \"\"\", (bundle_id, case_id, bundle_hash, canonical_json, json.dumps(metadata)))
                conn.commit()

        def get_bundle(self, bundle_hash: str):
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT * FROM evidence_bundle WHERE bundle_hash = %s", (bundle_hash,))
                    return cur.fetchone()

        def list_case_bundles(self, case_id: str):
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT * FROM evidence_bundle WHERE case_id = %s ORDER BY created_at ASC", (case_id,))
                    return cur.fetchall()

        def save_merkle_root(self, case_id: str, merkle_root: str, bundle_count: int):
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(\"\"\"
                        INSERT INTO case_merkle (case_id, merkle_root, bundle_count)
                        VALUES (%s, %s, %s)
                        ON CONFLICT (case_id) DO UPDATE SET 
                        merkle_root = EXCLUDED.merkle_root,
                        bundle_count = EXCLUDED.bundle_count,
                        updated_at = CURRENT_TIMESTAMP
                    \"\"\", (case_id, merkle_root, bundle_count))
                conn.commit()

        def get_merkle_root(self, case_id: str):
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT * FROM case_merkle WHERE case_id = %s", (case_id,))
                    return cur.fetchone()

    # For dependency injection / global usage
    ledger_repo = LedgerRepository()
""")

# 7. Services Layer
write_file('services/evidence-service/services/crypto_service.py', """\
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
""")

write_file('services/evidence-service/services/evidence_manager.py', """\
    import uuid
    from datetime import datetime
    from repositories.ledger_repository import ledger_repo
    from services.crypto_service import crypto_service
    from aegis.schemas.evidence import EvidencePayload, CommitResponse, VerifyResponse

    class EvidenceManager:
        def __init__(self, repo, crypto):
            self.repo = repo
            self.crypto = crypto

        def commit_evidence(self, payload: EvidencePayload) -> CommitResponse:
            case_id = payload.case_id
            
            # 1. Canonicalize & Hash
            canonical_json, bundle_hash = self.crypto.serialize_and_hash(payload.model_dump())
            
            # 2. Store bundle
            bundle_id = str(uuid.uuid4())
            self.repo.save_bundle(bundle_id, case_id, bundle_hash, canonical_json, payload.metadata)
            
            # 3. Update Merkle
            bundles = self.repo.list_case_bundles(case_id)
            hashes = [b['bundle_hash'] for b in bundles]
            merkle_root = self.crypto.build_tree(hashes)
            self.repo.save_merkle_root(case_id, merkle_root, len(hashes))
            
            return CommitResponse(
                case_id=case_id,
                bundle_hash=bundle_hash,
                merkle_root=merkle_root,
                timestamp=datetime.utcnow().isoformat() + "Z",
                version="v1"
            )

        def verify_evidence(self, case_id: str, bundle_hash: str) -> VerifyResponse:
            bundle = self.repo.get_bundle(bundle_hash)
            if not bundle or bundle['case_id'] != case_id:
                return VerifyResponse(valid=False, reason="Bundle not found in case ledger")
                
            # Verify bundle hash integrity against canonical JSON
            canonical_bytes = bundle['canonical_json'].encode('utf-8')
            computed_hash = self.crypto.serialize_and_hash(import_json(bundle['canonical_json']))[1]
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
""")

# 8. API Routes
write_file('services/evidence-service/api/routes.py', """\
    from fastapi import APIRouter, HTTPException
    from aegis.schemas.evidence import EvidencePayload, CommitResponse, VerifyRequest, VerifyResponse, LedgerResponse, BundleRecord
    from services.evidence_manager import evidence_manager
    from repositories.ledger_repository import ledger_repo

    router = APIRouter()

    @router.post("/commit", response_model=CommitResponse)
    def commit_evidence(payload: EvidencePayload):
        return evidence_manager.commit_evidence(payload)

    @router.post("/verify", response_model=VerifyResponse)
    def verify_evidence(req: VerifyRequest):
        return evidence_manager.verify_evidence(req.case_id, req.bundle_hash)

    @router.get("/ledger/{case_id}", response_model=LedgerResponse)
    def get_ledger(case_id: str):
        merkle_record = ledger_repo.get_merkle_root(case_id)
        if not merkle_record:
            raise HTTPException(status_code=404, detail="Case ledger not found")
            
        bundles = ledger_repo.list_case_bundles(case_id)
        bundle_records = [
            BundleRecord(
                id=b['id'],
                case_id=b['case_id'],
                bundle_hash=b['bundle_hash'],
                canonical_json=b['canonical_json'],
                created_at=str(b['created_at'])
            ) for b in bundles
        ]
        
        return LedgerResponse(
            case_id=case_id,
            merkle_root=merkle_record['merkle_root'],
            bundle_count=merkle_record['bundle_count'],
            bundles=bundle_records
        )
""")

write_file('services/evidence-service/main.py', """\
    from fastapi import FastAPI
    from api.routes import router
    from aegis.logging.logger import get_logger

    logger = get_logger("evidence-service")

    app = FastAPI(title='Evidence Service')
    app.include_router(router)
""")

# 9. Tests
write_file('tests/unit/test_evidence_crypto.py', """\
    import pytest
    import sys
    import os
    sys.path.append(os.path.abspath('./libs'))

    from aegis.crypto.canonical import canonicalize
    from aegis.crypto.merkle import compute_merkle_root
    from aegis.crypto.hashing import hash_bytes

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
""")

write_file('tests/api/test_evidence_endpoints.py', """\
    import pytest
    from fastapi.testclient import TestClient
    from unittest.mock import patch, MagicMock

    import sys
    import os
    sys.path.append(os.path.abspath('./services/evidence-service'))
    sys.path.append(os.path.abspath('./libs'))
    
    # Mocking LedgerRepository before importing main
    import services.evidence_manager
    import api.routes
    
    class MockLedgerRepo:
        def __init__(self):
            self.bundles = []
            self.merkle = {}
            
        def save_bundle(self, bid, cid, bhash, cjson, meta):
            self.bundles.append({"id": bid, "case_id": cid, "bundle_hash": bhash, "canonical_json": cjson, "created_at": "now"})
            
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
        payload1 = {"case_id": "CASE_1", "metadata": {"source": "ml"}, "data": {"score": 0.9}}
        r1 = client.post("/commit", json=payload1)
        assert r1.status_code == 200
        data1 = r1.json()
        assert data1["case_id"] == "CASE_1"
        assert "bundle_hash" in data1
        root1 = data1["merkle_root"]
        
        # Commit 2
        payload2 = {"case_id": "CASE_1", "metadata": {"source": "graph"}, "data": {"pagerank": 0.1}}
        r2 = client.post("/commit", json=payload2)
        assert r2.status_code == 200
        data2 = r2.json()
        root2 = data2["merkle_root"]
        
        # Root should change
        assert root1 != root2
        
        # Verify first bundle
        v1 = client.post("/verify", json={"case_id": "CASE_1", "bundle_hash": data1["bundle_hash"]})
        assert v1.status_code == 200
        assert v1.json()["valid"] is True
""")

print("Successfully generated all files for Evidence Service")

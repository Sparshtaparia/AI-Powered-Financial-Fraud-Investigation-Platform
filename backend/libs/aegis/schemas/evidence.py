from typing import Any, Dict, List, Optional

from pydantic import BaseModel


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

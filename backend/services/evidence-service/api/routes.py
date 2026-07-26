import time

from aegis.schemas.evidence import (
    BundleRecord,
    CommitResponse,
    EvidencePayload,
    LedgerResponse,
    VerifyRequest,
    VerifyResponse,
)
from aegis.schemas.health import DependencyHealth, HealthResponse
from fastapi import APIRouter, HTTPException
from repositories.ledger_repository import ledger_repo
from services.evidence_manager import evidence_manager

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health():
    import main

    uptime = int(time.time() - main.START_TIME)
    db_status = "healthy"
    try:
        # lightweight ping
        with ledger_repo._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
    except Exception:
        db_status = "unhealthy"

    return HealthResponse(
        status="healthy" if db_status == "healthy" else "degraded",
        service="evidence-service",
        version="1.0.0",
        dependencies=[DependencyHealth(name="postgresql", status=db_status)],
        uptime_seconds=uptime,
    )


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
            id=b["id"],
            case_id=b["case_id"],
            bundle_hash=b["bundle_hash"],
            canonical_json=b["canonical_json"],
            created_at=str(b["created_at"]),
        )
        for b in bundles
    ]

    return LedgerResponse(
        case_id=case_id,
        merkle_root=merkle_record["merkle_root"],
        bundle_count=merkle_record["bundle_count"],
        bundles=bundle_records,
    )

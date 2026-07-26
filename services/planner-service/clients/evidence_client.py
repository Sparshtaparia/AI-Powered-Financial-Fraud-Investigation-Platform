import time
from core.config import settings
from aegis.schemas.planner import ServiceResult
from aegis.logging.logger import get_logger
from aegis.http.client import get_async_client

logger = get_logger("evidence_client")

async def commit_evidence(case_id: str, data: dict) -> ServiceResult:
    start_time = time.time()
    try:
        async with get_async_client() as client:
            resp = await client.post(
                f"{settings.evidence_service_url}/commit",
                json={
                    "case_id": case_id,
                    "metadata": {"source": "planner"},
                    "data": data
                }
            )
            resp.raise_for_status()
            payload = resp.json()
            logger.info(f"Evidence Service returned {resp.status_code}")
            return ServiceResult(
                service="evidence-service",
                success=True,
                latency_ms=(time.time() - start_time) * 1000,
                payload=payload
            )
    except Exception as e:
        logger.error(f"Evidence Service failed: {e}")
        return ServiceResult(
            service="evidence-service",
            success=False,
            latency_ms=(time.time() - start_time) * 1000,
            error=str(e)
        )

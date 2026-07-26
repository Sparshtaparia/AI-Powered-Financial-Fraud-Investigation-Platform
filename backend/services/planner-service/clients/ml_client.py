import time

from aegis.http.client import get_async_client
from aegis.logging.logger import get_logger
from aegis.schemas.planner import ServiceResult
from core.config import settings

logger = get_logger("ml_client")


async def get_risk_assessment(customer_id: str) -> ServiceResult:
    start_time = time.time()
    try:
        async with get_async_client() as client:
            resp = await client.post(
                f"{settings.ml_service_url}/predict", json={"customer_id": customer_id}
            )
            resp.raise_for_status()
            payload = resp.json()
            logger.info(f"ML Service returned {resp.status_code}")
            return ServiceResult(
                service="ml-service",
                success=True,
                latency_ms=(time.time() - start_time) * 1000,
                payload=payload,
            )
    except Exception as e:
        logger.error(f"ML Service failed: {e}")
        return ServiceResult(
            service="ml-service",
            success=False,
            latency_ms=(time.time() - start_time) * 1000,
            error=str(e),
        )

import time

from aegis.http.client import get_async_client
from aegis.logging.logger import get_logger
from aegis.schemas.planner import ServiceResult
from core.config import settings

logger = get_logger("graph_client")


async def get_customer_context(customer_id: str) -> ServiceResult:
    start_time = time.time()
    try:
        async with get_async_client() as client:
            resp = await client.get(
                f"{settings.graph_service_url}/customer/{customer_id}"
            )
            resp.raise_for_status()
            payload = resp.json()
            logger.info(f"Graph Service returned {resp.status_code}")
            return ServiceResult(
                service="graph-service",
                success=True,
                latency_ms=(time.time() - start_time) * 1000,
                payload=payload,
            )
    except Exception as e:
        logger.error(f"Graph Service failed: {e}")
        return ServiceResult(
            service="graph-service",
            success=False,
            latency_ms=(time.time() - start_time) * 1000,
            error=str(e),
        )

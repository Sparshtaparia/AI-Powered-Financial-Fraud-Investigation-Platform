from aegis.http.client import get_async_client
from aegis.logging.logger import get_logger
from core.config import settings
from fastapi import HTTPException

logger = get_logger("planner_client")


async def forward_investigate(payload: dict) -> dict:
    try:
        async with get_async_client() as client:
            resp = await client.post(
                f"{settings.planner_service_url}/investigate", json=payload
            )
            resp.raise_for_status()
            return resp.json()
    except Exception as e:
        logger.error(f"Planner service unavailable: {e}")
        raise HTTPException(status_code=503, detail="Service Unavailable")

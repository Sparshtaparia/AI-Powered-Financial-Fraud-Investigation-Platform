import time
import uuid

from aegis.http.client import get_async_client
from aegis.schemas.health import DependencyHealth, HealthResponse
from aegis.schemas.planner import InvestigateRequest
from core.config import settings
from fastapi import APIRouter
from workflow.graph import app_workflow

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health():
    import main

    uptime = int(time.time() - main.START_TIME)

    deps = []
    async with get_async_client() as client:
        for name, url in [
            ("ml-service", settings.ml_service_url),
            ("graph-service", settings.graph_service_url),
            ("evidence-service", settings.evidence_service_url),
        ]:
            status = "unhealthy"
            try:
                r = await client.get(f"{url}/health")
                if r.status_code == 200:
                    status = "healthy"
            except Exception:
                pass
            deps.append(DependencyHealth(name=name, status=status))

    all_healthy = all(d.status == "healthy" for d in deps)

    return HealthResponse(
        status="healthy" if all_healthy else "degraded",
        service="planner-service",
        version="1.0.0",
        dependencies=deps,
        uptime_seconds=uptime,
    )


@router.post("/investigate")
async def investigate(req: InvestigateRequest):
    initial_state = {
        "request_id": str(uuid.uuid4()),
        "case_id": f"CASE-{uuid.uuid4().hex[:8].upper()}",
        "customer_id": req.customer_id,
        "status": "INITIALIZED",
        "risk_prediction": None,
        "graph_context": None,
        "evidence_commit": None,
        "timeline": [],
        "summary": None,
        "errors": [],
        "metadata": {},
    }

    final_state = await app_workflow.ainvoke(initial_state)

    return {
        "case_id": final_state["case_id"],
        "status": final_state["status"],
        "errors": final_state["errors"],
        "summary": final_state["summary"].model_dump()
        if final_state.get("summary")
        else None,
    }

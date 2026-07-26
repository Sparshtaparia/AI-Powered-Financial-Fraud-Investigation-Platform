from aegis.schemas.planner import InvestigateRequest
from clients.planner_client import forward_investigate
from dependencies.auth import require_roles
from fastapi import APIRouter, Depends, Request

router = APIRouter()


@router.post("/investigate")
async def investigate_endpoint(
    request: Request,
    payload: InvestigateRequest,
    user: dict = Depends(require_roles("investigator")),
):
    return await forward_investigate(payload.model_dump())


@router.get("/health")
def health():
    return {"status": "healthy", "service": "gateway-service"}

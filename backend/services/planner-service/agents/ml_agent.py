from clients.ml_client import get_risk_assessment
from core.state import InvestigationState


async def run(state: InvestigationState) -> InvestigationState:
    result = await get_risk_assessment(state["customer_id"])
    state["risk_prediction"] = result
    if not result.success:
        state["errors"].append(result.error)
        state["status"] = "PARTIAL_SUCCESS"
    return state

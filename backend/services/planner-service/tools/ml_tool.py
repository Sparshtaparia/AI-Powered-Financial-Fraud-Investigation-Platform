from clients.ml_client import get_risk_assessment
from core.state import InvestigationState


async def run(state: InvestigationState) -> InvestigationState:
    customer_id = state.get("customer_id")
    if not customer_id:
        return state

    result = await get_risk_assessment(customer_id)
    state["risk_prediction"] = result
    state["timeline"].append(result)
    if not result.success:
        state["errors"].append(result.error)
        state["status"] = "PARTIAL_SUCCESS"
    return state

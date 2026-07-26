from clients.graph_client import get_customer_context
from core.state import InvestigationState


async def run(state: InvestigationState) -> InvestigationState:
    customer_id = state.get("customer_id")
    if not customer_id:
        return state

    result = await get_customer_context(customer_id)
    state["graph_context"] = result
    state["timeline"].append(result)
    if not result.success:
        state["errors"].append(result.error)
        state["status"] = "PARTIAL_SUCCESS"
    return state

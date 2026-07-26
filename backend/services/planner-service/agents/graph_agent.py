from core.state import InvestigationState
from clients.graph_client import get_customer_context

async def run(state: InvestigationState) -> InvestigationState:
    result = await get_customer_context(state["customer_id"])
    state["graph_context"] = result
    if not result.success:
        state["errors"].append(result.error)
        state["status"] = "PARTIAL_SUCCESS"
    return state

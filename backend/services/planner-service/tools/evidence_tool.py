from clients.evidence_client import commit_evidence
from core.state import InvestigationState


async def run(state: InvestigationState) -> InvestigationState:
    customer_id = state.get("customer_id")
    if not customer_id:
        return state

    result = await commit_evidence(
        case_id=state["case_id"],
        data={
            "customer_id": customer_id,
            "summary": (
                state.get("summary").model_dump() if state.get("summary") else {}
            ),
        },
    )
    state["evidence_commit"] = result
    state["timeline"].append(result)
    if not result.success:
        state["errors"].append(result.error)
        state["status"] = "PARTIAL_SUCCESS"
    return state

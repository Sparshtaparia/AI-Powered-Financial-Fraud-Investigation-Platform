from clients.evidence_client import commit_evidence
from core.state import InvestigationState


async def run(state: InvestigationState) -> InvestigationState:
    # Collect context to commit
    evidence_payload = {}
    if state.get("risk_prediction") and state["risk_prediction"].success:
        evidence_payload["risk"] = state["risk_prediction"].payload
    if state.get("graph_context") and state["graph_context"].success:
        evidence_payload["graph"] = state["graph_context"].payload

    result = await commit_evidence(state["case_id"], evidence_payload)
    state["evidence_commit"] = result
    if not result.success:
        state["errors"].append(result.error)
        state["status"] = "PARTIAL_SUCCESS"
    return state

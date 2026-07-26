from core.state import InvestigationState
from aegis.schemas.planner import InvestigationSummary

async def run(state: InvestigationState) -> InvestigationState:
    risk = state["risk_prediction"].payload if state.get("risk_prediction") and state["risk_prediction"].success else None
    graph = state["graph_context"].payload if state.get("graph_context") and state["graph_context"].success else None
    evidence = state["evidence_commit"].payload if state.get("evidence_commit") and state["evidence_commit"].success else None

    recommendations = []
    if risk and risk.get("label") == "HIGH":
        recommendations.append("Immediate manual review required due to HIGH risk score.")

    summary = InvestigationSummary(
        risk=risk,
        graph=graph,
        evidence=evidence,
        recommendations=recommendations,
        audit=[{"action": "Investigation completed", "errors": state["errors"]}]
    )

    state["summary"] = summary
    if state["status"] == "IN_PROGRESS":
        state["status"] = "COMPLETED"

    return state

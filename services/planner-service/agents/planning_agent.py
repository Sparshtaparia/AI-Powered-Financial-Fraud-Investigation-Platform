from core.state import InvestigationState

async def run(state: InvestigationState) -> InvestigationState:
    # Phase 4 Deterministic Planning
    state["status"] = "IN_PROGRESS"
    state["timeline"].append({
        "service": "planner", 
        "success": True, 
        "latency_ms": 0, 
        "payload": {"action": "started_investigation"}
    })
    return state

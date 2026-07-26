from aegis.schemas.planner import ServiceResult
from core.state import InvestigationState


async def run(state: InvestigationState) -> InvestigationState:
    customer_id = state.get("customer_id", "UNKNOWN")
    state.get("query", "")

    # Mocking database response based on query
    payload = {
        "customer": {"id": customer_id, "status": "ACTIVE"},
        "transactions": [
            {"id": "TX1", "amount": 10000, "type": "WIRE", "suspicious": True},
            {"id": "TX2", "amount": 9500, "type": "WIRE", "suspicious": True},
        ],
        "merchants": ["M_1", "M_2"],
        "recent_transactions_count": 15,
    }

    result = ServiceResult(
        service="database_tool", success=True, latency_ms=12.5, payload=payload
    )

    state["database_result"] = result
    state["timeline"].append(result)
    return state

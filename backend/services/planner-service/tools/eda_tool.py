from aegis.schemas.planner import ServiceResult
from core.state import InvestigationState


async def run(state: InvestigationState) -> InvestigationState:
    state.get("customer_id", "UNKNOWN")
    state.get("query", "")

    # Mocking EDA response
    payload = {
        "missing_values": 0,
        "summary_statistics": {"mean_amount": 540.5, "max_amount": 10000.0},
        "duplicate_detection": 2,
        "transaction_distributions": "skewed",
        "top_merchants": ["M_1"],
        "outlier_counts": 5,
        "risk_class_distribution": {"high": 5, "medium": 15, "low": 80},
    }

    result = ServiceResult(
        service="eda_tool", success=True, latency_ms=45.2, payload=payload
    )

    state["eda_result"] = result
    state["timeline"].append(result)
    return state

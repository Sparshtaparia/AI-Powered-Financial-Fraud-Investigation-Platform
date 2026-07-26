from typing import Any, Dict, List, Optional, TypedDict

from aegis.schemas.planner import InvestigationSummary, ServiceResult


class InvestigationState(TypedDict):
    request_id: str
    case_id: str
    customer_id: str
    status: str
    risk_prediction: Optional[ServiceResult]
    graph_context: Optional[ServiceResult]
    evidence_commit: Optional[ServiceResult]
    timeline: List[ServiceResult]
    summary: Optional[InvestigationSummary]
    errors: List[str]
    metadata: Dict[str, Any]

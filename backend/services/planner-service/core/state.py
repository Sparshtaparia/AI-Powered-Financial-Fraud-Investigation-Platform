from typing import Any, Dict, List, Optional, TypedDict

from aegis.schemas.planner import InvestigationSummary, ServiceResult


class InvestigationState(TypedDict):
    request_id: str
    case_id: str
    customer_id: Optional[str]
    query: Optional[str]
    tools_to_run: List[str]
    status: str
    eda_result: Optional[ServiceResult]
    database_result: Optional[ServiceResult]
    risk_prediction: Optional[ServiceResult]
    graph_context: Optional[ServiceResult]
    evidence_commit: Optional[ServiceResult]
    timeline: List[ServiceResult]
    summary: Optional[InvestigationSummary]
    errors: List[str]
    metadata: Dict[str, Any]

from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class ServiceResult(BaseModel):
    service: str
    success: bool
    latency_ms: float
    payload: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class InvestigationSummary(BaseModel):
    risk: Optional[Dict[str, Any]] = None
    graph: Optional[Dict[str, Any]] = None
    evidence: Optional[Dict[str, Any]] = None
    eda: Optional[Dict[str, Any]] = None
    database: Optional[Dict[str, Any]] = None
    recommendations: List[str] = []
    audit: List[Dict[str, Any]] = []


class InvestigateRequest(BaseModel):
    customer_id: Optional[str] = None
    query: Optional[str] = None

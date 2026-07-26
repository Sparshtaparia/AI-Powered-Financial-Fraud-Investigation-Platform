from pydantic import BaseModel
from typing import Optional, List, Dict, Any

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
    recommendations: List[str] = []
    audit: List[Dict[str, Any]] = []

class InvestigateRequest(BaseModel):
    customer_id: str

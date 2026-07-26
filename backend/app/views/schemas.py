from pydantic import BaseModel, Field
from typing import Optional, List

class InvestigationRequest(BaseModel):
    query: str = Field(..., description="The query or alert text describing the suspicious behavior.")
    target_account_id: Optional[str] = Field(None, description="The account ID to focus the investigation on, if any.")

class InvestigationResponse(BaseModel):
    status: str = Field("success", description="Status of the investigation request.")
    execution_plan: List[str] = Field(..., description="The agents executed during this investigation.")
    graph_evidence: str = Field(..., description="Evidence gathered from the graph analysis.")
    ml_evidence: str = Field(..., description="Evidence gathered from the ML model analysis.")
    final_report: str = Field(..., description="The generated Suspicious Activity Report summary.")

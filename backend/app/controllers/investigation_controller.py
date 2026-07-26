from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.planner.workflow import app_graph

router = APIRouter(prefix="/api/v1", tags=["Investigation"])

class InvestigationRequest(BaseModel):
    query: str
    target_account_id: Optional[str] = None

@router.post("/investigate")
async def run_investigation(request: InvestigationRequest):
    try:
        # Initialize the LangGraph state
        initial_state = {
            "query": request.query,
            "target_account_id": request.target_account_id,
            "plan": [],
            "planner_reasoning": "",
            "current_step_idx": 0,
            "graph_evidence": "",
            "ml_evidence": "",
            "final_report": ""
        }
        
        # Execute the LangGraph DAG
        final_state = app_graph.invoke(initial_state)
        
        return {
            "status": "success",
            "target": request.target_account_id,
            "plan": final_state.get("plan"),
            "planner_reasoning": final_state.get("planner_reasoning"),
            "graph_evidence": final_state.get("graph_evidence"),
            "ml_evidence": final_state.get("ml_evidence"),
            "final_report": final_state.get("final_report")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

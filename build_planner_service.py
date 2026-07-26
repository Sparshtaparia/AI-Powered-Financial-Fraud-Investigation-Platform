import os
import textwrap

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(textwrap.dedent(content))

# 1. Update libs/aegis/config/settings.py
write_file('libs/aegis/config/settings.py', """\
    from pydantic_settings import BaseSettings

    class AegisSettings(BaseSettings):
        environment: str = "development"
        model_artifacts_path: str = "../../artifacts/models"
        feature_store_path: str = "../../artifacts/feature_store"
        
        # Neo4j Settings
        neo4j_uri: str = "bolt://localhost:7687"
        neo4j_user: str = "neo4j"
        neo4j_password: str = "password"
        
        # Postgres Settings
        postgres_dsn: str = "postgresql://postgres:aegis@localhost:5432/postgres"
        
        # Service URLs
        ml_service_url: str = "http://localhost:8000"
        graph_service_url: str = "http://localhost:8001"
        evidence_service_url: str = "http://localhost:8002"
        
        class Config:
            env_prefix = "AEGIS_"
""")

# 2. Add planner schemas
write_file('libs/aegis/schemas/planner.py', """\
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
""")

# 3. Planner Service Requirements
write_file('services/planner-service/requirements.txt', """\
    -e ../../libs
    fastapi
    uvicorn
    pydantic-settings
    langgraph
    httpx
""")

# 4. Core Config and State
write_file('services/planner-service/core/config.py', """\
    from aegis.config.settings import AegisSettings

    class PlannerServiceSettings(AegisSettings):
        pass

    settings = PlannerServiceSettings()
""")

write_file('services/planner-service/core/state.py', """\
    from typing import TypedDict, Optional, List, Dict, Any
    from aegis.schemas.planner import ServiceResult, InvestigationSummary

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
""")

# 5. HTTP Clients
write_file('services/planner-service/clients/ml_client.py', """\
    import httpx
    import time
    from core.config import settings
    from aegis.schemas.planner import ServiceResult
    from aegis.logging.logger import get_logger

    logger = get_logger("ml_client")

    async def get_risk_assessment(customer_id: str) -> ServiceResult:
        start_time = time.time()
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    f"{settings.ml_service_url}/predict",
                    json={"customer_id": customer_id}
                )
                resp.raise_for_status()
                payload = resp.json()
                return ServiceResult(
                    service="ml-service",
                    success=True,
                    latency_ms=(time.time() - start_time) * 1000,
                    payload=payload
                )
        except Exception as e:
            logger.error(f"ML Service failed: {e}")
            return ServiceResult(
                service="ml-service",
                success=False,
                latency_ms=(time.time() - start_time) * 1000,
                error=str(e)
            )
""")

write_file('services/planner-service/clients/graph_client.py', """\
    import httpx
    import time
    from core.config import settings
    from aegis.schemas.planner import ServiceResult
    from aegis.logging.logger import get_logger

    logger = get_logger("graph_client")

    async def get_customer_context(customer_id: str) -> ServiceResult:
        start_time = time.time()
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    f"{settings.graph_service_url}/customer/{customer_id}"
                )
                resp.raise_for_status()
                payload = resp.json()
                return ServiceResult(
                    service="graph-service",
                    success=True,
                    latency_ms=(time.time() - start_time) * 1000,
                    payload=payload
                )
        except Exception as e:
            logger.error(f"Graph Service failed: {e}")
            return ServiceResult(
                service="graph-service",
                success=False,
                latency_ms=(time.time() - start_time) * 1000,
                error=str(e)
            )
""")

write_file('services/planner-service/clients/evidence_client.py', """\
    import httpx
    import time
    from core.config import settings
    from aegis.schemas.planner import ServiceResult
    from aegis.logging.logger import get_logger

    logger = get_logger("evidence_client")

    async def commit_evidence(case_id: str, data: dict) -> ServiceResult:
        start_time = time.time()
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    f"{settings.evidence_service_url}/commit",
                    json={
                        "case_id": case_id,
                        "metadata": {"source": "planner"},
                        "data": data
                    }
                )
                resp.raise_for_status()
                payload = resp.json()
                return ServiceResult(
                    service="evidence-service",
                    success=True,
                    latency_ms=(time.time() - start_time) * 1000,
                    payload=payload
                )
        except Exception as e:
            logger.error(f"Evidence Service failed: {e}")
            return ServiceResult(
                service="evidence-service",
                success=False,
                latency_ms=(time.time() - start_time) * 1000,
                error=str(e)
            )
""")

# 6. Agents (Nodes)
write_file('services/planner-service/agents/planning_agent.py', """\
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
""")

write_file('services/planner-service/agents/ml_agent.py', """\
    from core.state import InvestigationState
    from clients.ml_client import get_risk_assessment

    async def run(state: InvestigationState) -> InvestigationState:
        result = await get_risk_assessment(state["customer_id"])
        state["risk_prediction"] = result
        if not result.success:
            state["errors"].append(result.error)
            state["status"] = "PARTIAL_SUCCESS"
        return state
""")

write_file('services/planner-service/agents/graph_agent.py', """\
    from core.state import InvestigationState
    from clients.graph_client import get_customer_context

    async def run(state: InvestigationState) -> InvestigationState:
        result = await get_customer_context(state["customer_id"])
        state["graph_context"] = result
        if not result.success:
            state["errors"].append(result.error)
            state["status"] = "PARTIAL_SUCCESS"
        return state
""")

write_file('services/planner-service/agents/evidence_agent.py', """\
    from core.state import InvestigationState
    from clients.evidence_client import commit_evidence

    async def run(state: InvestigationState) -> InvestigationState:
        # Collect context to commit
        evidence_payload = {}
        if state.get("risk_prediction") and state["risk_prediction"].success:
            evidence_payload["risk"] = state["risk_prediction"].payload
        if state.get("graph_context") and state["graph_context"].success:
            evidence_payload["graph"] = state["graph_context"].payload
            
        result = await commit_evidence(state["case_id"], evidence_payload)
        state["evidence_commit"] = result
        if not result.success:
            state["errors"].append(result.error)
            state["status"] = "PARTIAL_SUCCESS"
        return state
""")

write_file('services/planner-service/agents/summary_agent.py', """\
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
""")

# 7. LangGraph Builder
write_file('services/planner-service/workflow/graph.py', """\
    from langgraph.graph import StateGraph, END
    from core.state import InvestigationState
    
    from agents.planning_agent import run as planning_node
    from agents.ml_agent import run as ml_node
    from agents.graph_agent import run as graph_node
    from agents.evidence_agent import run as evidence_node
    from agents.summary_agent import run as summary_node

    def build_graph():
        workflow = StateGraph(InvestigationState)
        
        workflow.add_node("planning", planning_node)
        workflow.add_node("ml", ml_node)
        workflow.add_node("graph", graph_node)
        workflow.add_node("evidence", evidence_node)
        workflow.add_node("summary", summary_node)
        
        workflow.set_entry_point("planning")
        
        workflow.add_edge("planning", "ml")
        workflow.add_edge("ml", "graph")
        workflow.add_edge("graph", "evidence")
        workflow.add_edge("evidence", "summary")
        workflow.add_edge("summary", END)
        
        return workflow.compile()

    app_workflow = build_graph()
""")

# 8. API Routes
write_file('services/planner-service/api/routes.py', """\
    from fastapi import APIRouter
    import uuid
    from aegis.schemas.planner import InvestigateRequest
    from workflow.graph import app_workflow

    router = APIRouter()

    @router.post("/investigate")
    async def investigate(req: InvestigateRequest):
        initial_state = {
            "request_id": str(uuid.uuid4()),
            "case_id": f"CASE-{uuid.uuid4().hex[:8].upper()}",
            "customer_id": req.customer_id,
            "status": "INITIALIZED",
            "risk_prediction": None,
            "graph_context": None,
            "evidence_commit": None,
            "timeline": [],
            "summary": None,
            "errors": [],
            "metadata": {}
        }
        
        # Async execution of LangGraph
        final_state = await app_workflow.ainvoke(initial_state)
        
        return {
            "case_id": final_state["case_id"],
            "status": final_state["status"],
            "errors": final_state["errors"],
            "summary": final_state["summary"].model_dump() if final_state.get("summary") else None
        }
        
    @router.get("/health")
    def health():
        return {"status": "healthy"}
""")

write_file('services/planner-service/main.py', """\
    from fastapi import FastAPI
    from api.routes import router

    app = FastAPI(title='Planner Service')
    app.include_router(router)
""")

# 9. Tests
write_file('tests/unit/test_planner_nodes.py', """\
    import pytest
    import sys
    import os
    sys.path.append(os.path.abspath('./services/planner-service'))
    sys.path.append(os.path.abspath('./libs'))

    from agents.planning_agent import run as planning_run
    from core.state import InvestigationState

    @pytest.mark.asyncio
    async def test_planning_agent():
        state = {
            "request_id": "r1", "case_id": "c1", "customer_id": "CUST_521",
            "status": "INIT", "risk_prediction": None, "graph_context": None,
            "evidence_commit": None, "timeline": [], "summary": None, "errors": [], "metadata": {}
        }
        new_state = await planning_run(state)
        assert new_state["status"] == "IN_PROGRESS"
        assert len(new_state["timeline"]) == 1
""")

write_file('tests/api/test_planner_endpoints.py', """\
    import pytest
    from fastapi.testclient import TestClient
    from unittest.mock import patch, AsyncMock
    from aegis.schemas.planner import ServiceResult

    import sys
    import os
    sys.path.append(os.path.abspath('./services/planner-service'))
    sys.path.append(os.path.abspath('./libs'))
    
    from main import app

    client = TestClient(app)

    @patch('agents.ml_agent.get_risk_assessment')
    @patch('agents.graph_agent.get_customer_context')
    @patch('agents.evidence_agent.commit_evidence')
    def test_investigate_partial_failure(mock_evidence, mock_graph, mock_ml):
        # Setup mocks
        mock_ml.return_value = ServiceResult(service="ml", success=True, latency_ms=10, payload={"risk": 0.9, "label": "HIGH"})
        mock_graph.return_value = ServiceResult(service="graph", success=False, latency_ms=10, error="Timeout")
        mock_evidence.return_value = ServiceResult(service="evidence", success=True, latency_ms=10, payload={"merkle_root": "ABC"})
        
        response = client.post("/investigate", json={"customer_id": "CUST_521"})
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "PARTIAL_SUCCESS"
        assert "Timeout" in data["errors"]
        assert data["summary"] is not None
        assert data["summary"]["risk"] is not None
        # Graph failed, so payload should be none
        assert data["summary"]["graph"] is None
        assert "recommendations" in data["summary"]
""")

print("Successfully generated all files for Planner Service")

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

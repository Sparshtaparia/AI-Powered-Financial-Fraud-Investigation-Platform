import os
import sys

import pytest

sys.path.append(os.path.abspath("./services/planner-service"))
sys.path.append(os.path.abspath("./libs"))

from agents.planning_agent import run as planning_run


@pytest.mark.asyncio
async def test_planning_agent():
    state = {
        "request_id": "r1",
        "case_id": "c1",
        "customer_id": "CUST_521",
        "status": "INIT",
        "risk_prediction": None,
        "graph_context": None,
        "evidence_commit": None,
        "timeline": [],
        "summary": None,
        "errors": [],
        "metadata": {},
    }
    new_state = await planning_run(state)
    assert new_state["status"] == "IN_PROGRESS"
    assert len(new_state["timeline"]) == 1

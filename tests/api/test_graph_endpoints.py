import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch

import sys
import os
sys.path.append(os.path.abspath('./services/graph-service'))
sys.path.append(os.path.abspath('./libs'))

from main import app

client = TestClient(app)

@patch('repositories.neo4j_repository.neo4j_repo.get_db_stats')
def test_health_mocked(mock_stats):
    mock_stats.return_value = {"node_count": 4, "relationship_count": 3, "connected": True}
    # Using TestClient's lifespan management
    with TestClient(app) as client:
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["node_count"] == 4

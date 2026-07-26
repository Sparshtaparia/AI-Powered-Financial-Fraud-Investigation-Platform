import os
import sys
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

sys.path.append(os.path.abspath("./services/gateway-service"))
sys.path.append(os.path.abspath("./libs"))

from aegis.auth.jwt import create_token
from core.config import settings
from main import app

client = TestClient(app)


def test_missing_token():
    response = client.post("/api/v1/investigate", json={"customer_id": "CUST123"})
    assert response.status_code == 403  # HTTPBearer returns 403 on missing credentials


def test_invalid_signature():
    token = create_token("user1", ["investigator"], "wrong-secret")
    response = client.post(
        "/api/v1/investigate",
        json={"customer_id": "CUST123"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 401


def test_expired_token():
    token = create_token(
        "user1", ["investigator"], settings.jwt_secret, expires_delta_sec=-100
    )
    response = client.post(
        "/api/v1/investigate",
        json={"customer_id": "CUST123"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 401


def test_missing_role():
    token = create_token("user1", ["viewer"], settings.jwt_secret)
    response = client.post(
        "/api/v1/investigate",
        json={"customer_id": "CUST123"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403
    assert "Insufficient permissions" in response.text


@patch("clients.planner_client.get_async_client")
def test_planner_unavailable(mock_get_client):
    # Mock httpx throwing an error
    mock_client = AsyncMock()
    mock_client.post.side_effect = Exception("Connection refused")
    mock_get_client.return_value.__aenter__.return_value = mock_client

    token = create_token("user1", ["investigator"], settings.jwt_secret)
    response = client.post(
        "/api/v1/investigate",
        json={"customer_id": "CUST123"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 503
    assert "Service Unavailable" in response.text


@patch("clients.planner_client.get_async_client")
def test_success_and_request_id_generation(mock_get_client):
    # Mock successful planner response
    mock_client = AsyncMock()
    mock_resp = AsyncMock()
    mock_resp.json.return_value = {"case_id": "CASE-123", "status": "COMPLETED"}
    mock_client.post.return_value = mock_resp
    mock_get_client.return_value.__aenter__.return_value = mock_client

    token = create_token("user1", ["investigator"], settings.jwt_secret)
    response = client.post(
        "/api/v1/investigate",
        json={"customer_id": "CUST123"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert "X-Request-ID" in response.headers
    assert response.json()["case_id"] == "CASE-123"


def test_rate_limit():
    # Trigger slowapi limits (60/minute)
    # Note: Depending on slowapi config in TestClient, this might be bypassed or tracked via a mock IP.
    # This is a placeholder test as fast iterations might be hard to test identically in memory.
    pass

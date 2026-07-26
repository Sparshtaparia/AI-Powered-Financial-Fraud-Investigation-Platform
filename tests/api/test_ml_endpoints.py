import sys

from fastapi.testclient import TestClient

sys.path.append("./services/ml-service")
sys.path.append("./libs")

from main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_model_info():
    response = client.get("/model_info")
    assert response.status_code == 200
    assert response.json()["version"] == "xgboost_v1"


def test_predict():
    response = client.post("/predict", json={"customer_id": "CUST_521"})
    assert response.status_code == 200
    data = response.json()
    assert data["label"] == "HIGH"
    assert "risk_score" in data

import os
import textwrap

def write_file(path, content):
    if os.path.dirname(path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(textwrap.dedent(content))

# 1. JWT Auth Lib
write_file('libs/aegis/auth/jwt.py', """\
    from jose import jwt, JWTError
    from typing import List, Optional

    def create_token(sub: str, roles: List[str], secret: str, expires_delta_sec: int = 3600) -> str:
        import time
        now = int(time.time())
        payload = {
            "sub": sub,
            "roles": roles,
            "iat": now,
            "exp": now + expires_delta_sec,
            "iss": "aegis-auth"
        }
        return jwt.encode(payload, secret, algorithm="HS256")

    def decode_token(token: str, secret: str) -> Optional[dict]:
        try:
            return jwt.decode(token, secret, algorithms=["HS256"], issuer="aegis-auth")
        except JWTError:
            return None
""")

write_file('libs/aegis/schemas/gateway.py', """\
    from pydantic import BaseModel

    class ErrorResponse(BaseModel):
        detail: str
""")

# 2. Gateway Config & Requirements
write_file('services/gateway-service/requirements.txt', """\
    -e ../../libs
    fastapi
    uvicorn
    pydantic-settings
    httpx
    python-jose[cryptography]
    slowapi
    prometheus-fastapi-instrumentator
""")

write_file('services/gateway-service/core/config.py', """\
    from aegis.config.settings import AegisSettings

    class GatewayServiceSettings(AegisSettings):
        jwt_secret: str = "super-secret-aegis-key-for-local-dev-only"
        planner_service_url: str = "http://planner-service:8003"

    settings = GatewayServiceSettings()
""")

# 3. Dependencies
write_file('services/gateway-service/dependencies/auth.py', """\
    from fastapi import Depends, HTTPException, Security
    from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
    from core.config import settings
    from aegis.auth.jwt import decode_token

    security = HTTPBearer()

    def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
        token = credentials.credentials
        payload = decode_token(token, settings.jwt_secret)
        if not payload:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        return payload

    def require_roles(*allowed_roles: str):
        def role_checker(user: dict = Depends(get_current_user)):
            user_roles = user.get("roles", [])
            if "admin" in user_roles:
                return user
            for role in allowed_roles:
                if role in user_roles:
                    return user
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return role_checker
""")

# 4. Clients
write_file('services/gateway-service/clients/planner_client.py', """\
    from fastapi import HTTPException
    from core.config import settings
    from aegis.http.client import get_async_client
    from aegis.logging.logger import get_logger

    logger = get_logger("planner_client")

    async def forward_investigate(payload: dict) -> dict:
        try:
            async with get_async_client() as client:
                resp = await client.post(
                    f"{settings.planner_service_url}/investigate",
                    json=payload
                )
                resp.raise_for_status()
                return resp.json()
        except Exception as e:
            logger.error(f"Planner service unavailable: {e}")
            raise HTTPException(status_code=503, detail="Service Unavailable")
""")

# 5. Routes
write_file('services/gateway-service/api/routes.py', """\
    from fastapi import APIRouter, Depends, Request
    from dependencies.auth import require_roles
    from clients.planner_client import forward_investigate
    from aegis.schemas.planner import InvestigateRequest

    router = APIRouter()

    @router.post("/investigate")
    async def investigate_endpoint(
        request: Request,
        payload: InvestigateRequest,
        user: dict = Depends(require_roles("investigator"))
    ):
        return await forward_investigate(payload.model_dump())
        
    @router.get("/health")
    def health():
        return {"status": "healthy", "service": "gateway-service"}
""")

# 6. Main
write_file('services/gateway-service/main.py', """\
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.util import get_remote_address
    from slowapi.errors import RateLimitExceeded
    from slowapi.middleware import SlowAPIMiddleware
    
    from api.routes import router
    from aegis.middleware.correlation import CorrelationMiddleware
    from prometheus_fastapi_instrumentator import Instrumentator
    
    limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])

    app = FastAPI(title="API Gateway", version="1.0.0", openapi_url="/api/v1/openapi.json")
    
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    
    app.add_middleware(SlowAPIMiddleware)
    app.add_middleware(CorrelationMiddleware)
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    Instrumentator().instrument(app).expose(app)
    
    app.include_router(router, prefix="/api/v1")
""")

# 7. Docker
write_file('docker/gateway-service.Dockerfile', """\
FROM python:3.11-slim
WORKDIR /app
COPY ./libs /app/libs
COPY ./services/gateway-service /app/services/gateway-service
COPY ./artifacts /app/artifacts
RUN pip install -e /app/libs
RUN pip install -r /app/services/gateway-service/requirements.txt
ENV PYTHONPATH=/app
ENV AEGIS_ENVIRONMENT=production
EXPOSE 8080
CMD ["uvicorn", "services.gateway-service.main:app", "--host", "0.0.0.0", "--port", "8080"]
""")

# Update Prometheus
write_file('docker/prometheus.yml', """\
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'aegis_services'
    static_configs:
      - targets:
        - 'ml-service:8000'
        - 'graph-service:8001'
        - 'evidence-service:8002'
        - 'planner-service:8003'
        - 'gateway-service:8080'
""")

# Re-write Docker Compose (Exposing only 8080, removing inner ports)
write_file('docker-compose.yml', """\
version: "3.9"

services:
  gateway-service:
    build:
      context: .
      dockerfile: docker/gateway-service.Dockerfile
    ports:
      - "8080:8080"
    environment:
      - AEGIS_PLANNER_SERVICE_URL=http://planner-service:8003
    depends_on:
      - planner-service
    networks:
      - aegis_net

  ml-service:
    build:
      context: .
      dockerfile: docker/ml-service.Dockerfile
    environment:
      - AEGIS_MODEL_ARTIFACTS_PATH=/app/artifacts/models
      - AEGIS_FEATURE_STORE_PATH=/app/artifacts/feature_store
    networks:
      - aegis_net
      
  graph-service:
    build:
      context: .
      dockerfile: docker/graph-service.Dockerfile
    environment:
      - AEGIS_NEO4J_URI=bolt://neo4j:7687
    depends_on:
      - neo4j
    networks:
      - aegis_net

  evidence-service:
    build:
      context: .
      dockerfile: docker/evidence-service.Dockerfile
    environment:
      - AEGIS_POSTGRES_DSN=postgresql://postgres:aegis@postgres:5432/postgres
    depends_on:
      - postgres
    networks:
      - aegis_net

  planner-service:
    build:
      context: .
      dockerfile: docker/planner-service.Dockerfile
    environment:
      - AEGIS_ML_SERVICE_URL=http://ml-service:8000
      - AEGIS_GRAPH_SERVICE_URL=http://graph-service:8001
      - AEGIS_EVIDENCE_SERVICE_URL=http://evidence-service:8002
    depends_on:
      - ml-service
      - graph-service
      - evidence-service
    networks:
      - aegis_net

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=aegis
      - POSTGRES_DB=postgres
    networks:
      - aegis_net

  neo4j:
    image: neo4j:5.12.0
    environment:
      - NEO4J_AUTH=neo4j/password
    networks:
      - aegis_net

  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./docker/prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"
    networks:
      - aegis_net

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_AUTH_ANONYMOUS_ENABLED=true
      - GF_AUTH_ANONYMOUS_ORG_ROLE=Admin
    volumes:
      - ./docker/grafana/provisioning:/etc/grafana/provisioning
      - ./docker/grafana/dashboards:/var/lib/grafana/dashboards
    depends_on:
      - prometheus
    networks:
      - aegis_net

networks:
  aegis_net:
""")

# 8. Tests
write_file('tests/api/test_gateway.py', """\
    import pytest
    from fastapi.testclient import TestClient
    from unittest.mock import patch, AsyncMock
    
    import sys
    import os
    sys.path.append(os.path.abspath('./services/gateway-service'))
    sys.path.append(os.path.abspath('./libs'))
    
    from main import app
    from aegis.auth.jwt import create_token
    from core.config import settings

    client = TestClient(app)

    def test_missing_token():
        response = client.post("/api/v1/investigate", json={"customer_id": "CUST123"})
        assert response.status_code == 403 # HTTPBearer returns 403 on missing credentials

    def test_invalid_signature():
        token = create_token("user1", ["investigator"], "wrong-secret")
        response = client.post("/api/v1/investigate", json={"customer_id": "CUST123"}, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 401

    def test_expired_token():
        token = create_token("user1", ["investigator"], settings.jwt_secret, expires_delta_sec=-100)
        response = client.post("/api/v1/investigate", json={"customer_id": "CUST123"}, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 401
        
    def test_missing_role():
        token = create_token("user1", ["viewer"], settings.jwt_secret)
        response = client.post("/api/v1/investigate", json={"customer_id": "CUST123"}, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 403
        assert "Insufficient permissions" in response.text
        
    @patch('clients.planner_client.get_async_client')
    def test_planner_unavailable(mock_get_client):
        # Mock httpx throwing an error
        mock_client = AsyncMock()
        mock_client.post.side_effect = Exception("Connection refused")
        mock_get_client.return_value.__aenter__.return_value = mock_client
        
        token = create_token("user1", ["investigator"], settings.jwt_secret)
        response = client.post("/api/v1/investigate", json={"customer_id": "CUST123"}, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 503
        assert "Service Unavailable" in response.text

    @patch('clients.planner_client.get_async_client')
    def test_success_and_request_id_generation(mock_get_client):
        # Mock successful planner response
        mock_client = AsyncMock()
        mock_resp = AsyncMock()
        mock_resp.json.return_value = {"case_id": "CASE-123", "status": "COMPLETED"}
        mock_client.post.return_value = mock_resp
        mock_get_client.return_value.__aenter__.return_value = mock_client
        
        token = create_token("user1", ["investigator"], settings.jwt_secret)
        response = client.post("/api/v1/investigate", json={"customer_id": "CUST123"}, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        assert "X-Request-ID" in response.headers
        assert response.json()["case_id"] == "CASE-123"
        
    def test_rate_limit():
        # Trigger slowapi limits (60/minute)
        # Note: Depending on slowapi config in TestClient, this might be bypassed or tracked via a mock IP.
        # This is a placeholder test as fast iterations might be hard to test identically in memory.
        pass
""")

print("Successfully generated all files for Phase 6 (API Gateway)")

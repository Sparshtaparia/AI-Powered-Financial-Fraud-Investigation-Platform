import os
import textwrap

def write_file(path, content):
    if os.path.dirname(path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(textwrap.dedent(content))

# 1. Environment and .gitignore
write_file('.gitignore', """\
    # Python
    __pycache__/
    *.py[cod]
    *$py.class
    .pytest_cache/
    htmlcov/
    coverage.xml
    .coverage

    # Node
    node_modules/
    dist/
    npm-debug.log*
    yarn-debug.log*
    yarn-error.log*

    # Environment
    .env
    .venv/
    venv/
    ENV/

    # OS
    .DS_Store
    Thumbs.db
""")

write_file('.env.example', """\
    ##################################
    # APPLICATION
    ##################################
    AEGIS_APP_NAME=AegisAML
    AEGIS_ENVIRONMENT=development
    AEGIS_DEBUG=True
    AEGIS_VERSION=1.0.0

    ##################################
    # GATEWAY
    ##################################
    AEGIS_GATEWAY_PORT=8080
    AEGIS_JWT_SECRET=super-secret-aegis-key-for-local-dev-only
    AEGIS_JWT_ALGORITHM=HS256
    AEGIS_JWT_EXPIRE_MINUTES=120
    AEGIS_RATE_LIMIT=60/minute
    AEGIS_ALLOWED_ORIGINS=http://localhost:3000

    ##################################
    # PLANNER
    ##################################
    AEGIS_PLANNER_PORT=8003
    AEGIS_ML_SERVICE_URL=http://ml-service:8000
    AEGIS_GRAPH_SERVICE_URL=http://graph-service:8001
    AEGIS_EVIDENCE_SERVICE_URL=http://evidence-service:8002

    ##################################
    # ML SERVICE
    ##################################
    AEGIS_ML_PORT=8000
    AEGIS_MODEL_ARTIFACTS_PATH=/app/artifacts/models/
    AEGIS_FEATURE_STORE_PATH=/app/artifacts/feature_store/
    AEGIS_MODEL_VERSION=1.0.0
    AEGIS_THRESHOLD=0.73

    ##################################
    # GRAPH SERVICE
    ##################################
    AEGIS_GRAPH_PORT=8001
    AEGIS_NEO4J_URI=bolt://neo4j:7687
    AEGIS_NEO4J_USERNAME=neo4j
    AEGIS_NEO4J_PASSWORD=password

    ##################################
    # EVIDENCE SERVICE
    ##################################
    AEGIS_EVIDENCE_PORT=8002
    AEGIS_POSTGRES_DSN=postgresql://postgres:aegis@postgres:5432/postgres
    AEGIS_HASH_ALGORITHM=SHA256
""")

write_file('.env', """\
    # (Copied from .env.example for local execution)
    AEGIS_APP_NAME=AegisAML
    AEGIS_ENVIRONMENT=development
    AEGIS_DEBUG=True
    AEGIS_VERSION=1.0.0
    AEGIS_GATEWAY_PORT=8080
    AEGIS_JWT_SECRET=super-secret-aegis-key-for-local-dev-only
    AEGIS_JWT_ALGORITHM=HS256
    AEGIS_JWT_EXPIRE_MINUTES=120
    AEGIS_RATE_LIMIT=60/minute
    AEGIS_ALLOWED_ORIGINS=http://localhost:3000
    AEGIS_PLANNER_PORT=8003
    AEGIS_ML_SERVICE_URL=http://ml-service:8000
    AEGIS_GRAPH_SERVICE_URL=http://graph-service:8001
    AEGIS_EVIDENCE_SERVICE_URL=http://evidence-service:8002
    AEGIS_ML_PORT=8000
    AEGIS_MODEL_ARTIFACTS_PATH=/app/artifacts/models/
    AEGIS_FEATURE_STORE_PATH=/app/artifacts/feature_store/
    AEGIS_MODEL_VERSION=1.0.0
    AEGIS_THRESHOLD=0.73
    AEGIS_GRAPH_PORT=8001
    AEGIS_NEO4J_URI=bolt://neo4j:7687
    AEGIS_NEO4J_USERNAME=neo4j
    AEGIS_NEO4J_PASSWORD=password
    AEGIS_EVIDENCE_PORT=8002
    AEGIS_POSTGRES_DSN=postgresql://postgres:aegis@postgres:5432/postgres
    AEGIS_HASH_ALGORITHM=SHA256
""")

# 2. Frontend Config overrides
write_file('frontend/.env', """\
    VITE_API_URL=http://localhost:8080/api/v1
    VITE_APP_NAME=AegisAML
    VITE_ENV=development
""")

write_file('frontend/src/api/client.ts', """\
    import axios from 'axios'
    import { useAuthStore } from '../store/authStore'

    export const apiClient = axios.create({
        baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
    });

    apiClient.interceptors.request.use((config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });
""")

# 3. GitHub Actions CI
write_file('.github/workflows/ci.yml', """\
name: AegisAML CI/CD Pipeline

on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

jobs:
  build_and_test:
    runs-on: ubuntu-latest
    
    steps:
      # Stage 1: Checkout
      - name: Checkout Repository
        uses: actions/checkout@v3

      # Stage 2: Environment Setup & Caching
      - name: Set up Python 3.11
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
          cache: 'pip'

      - name: Set up Node.js 18
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: 'frontend/package-lock.json'

      - name: Install Python Dependencies
        run: |
          python -m pip install --upgrade pip
          pip install flake8 black isort mypy bandit pip-audit pytest pytest-cov pytest-asyncio
          pip install -e libs/
          # In a real CI, loop over services and install requirements
          pip install -r services/ml-service/requirements.txt || true
          pip install -r services/graph-service/requirements.txt || true
          pip install -r services/evidence-service/requirements.txt || true
          pip install -r services/planner-service/requirements.txt || true
          pip install -r services/gateway-service/requirements.txt || true

      - name: Install Node Dependencies
        working-directory: ./frontend
        run: npm ci || npm install

      # Stage 3: Linting & Security Scans
      - name: Python Formatting (Black & Isort)
        run: |
          black --check libs/ services/ tests/ || true
          isort --check-only libs/ services/ tests/ || true

      - name: Python Linting (Flake8)
        run: flake8 libs/ services/ tests/ --count --max-complexity=10 --max-line-length=127 --statistics || true

      - name: Static Type Checking (MyPy)
        run: mypy libs/ services/ || true

      - name: Security Scan (Bandit)
        run: bandit -r libs/ services/ || true

      - name: Dependency Scan (Pip-Audit)
        run: pip-audit || true

      - name: Node Security Scan (npm audit)
        working-directory: ./frontend
        run: npm audit || true

      # Stage 4: Backend Tests & Coverage
      - name: Run Pytest
        env:
          PYTHONPATH: libs/
        run: |
          pytest tests/ --cov=libs --cov=services --cov-report=xml --cov-report=term

      # Stage 5: Frontend Build
      - name: Build Frontend
        working-directory: ./frontend
        run: |
          npm run build

      # Stage 6: Docker Build
      - name: Build Docker Images
        run: |
          docker-compose build

      # Stage 7: Docker Compose E2E Resilience Test
      - name: End-to-End Test
        run: |
          cp .env.example .env
          docker-compose up -d
          echo "Waiting 30 seconds for Neo4j and Postgres..."
          sleep 30
          pytest tests/e2e/test_investigation_flow.py -v
          docker-compose down
""")

# Setup Flake8 Config
write_file('.flake8', """\
[flake8]
max-line-length = 120
exclude = .git,__pycache__,.venv,venv,node_modules
""")

print("Successfully generated all files for Phase 8 (CI/CD)")

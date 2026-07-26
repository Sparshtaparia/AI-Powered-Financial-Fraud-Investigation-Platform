import os
import textwrap

def write_file(path, content):
    if os.path.dirname(path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(textwrap.dedent(content))

# Update CI Workflow
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
      - name: Checkout Repository
        uses: actions/checkout@v3

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
          pip install -r services/ml-service/requirements.txt || true
          pip install -r services/graph-service/requirements.txt || true
          pip install -r services/evidence-service/requirements.txt || true
          pip install -r services/planner-service/requirements.txt || true
          pip install -r services/gateway-service/requirements.txt || true

      - name: Install Node Dependencies
        working-directory: ./frontend
        run: npm ci || npm install

      # Quality Gates (Strict fail on error)
      - name: Python Formatting (Black & Isort)
        run: |
          black --check libs/ services/ tests/
          isort --check-only libs/ services/ tests/

      - name: Python Linting (Flake8)
        run: flake8 libs/ services/ tests/ --count --max-complexity=10 --max-line-length=127 --statistics

      - name: Static Type Checking (MyPy)
        run: mypy libs/ services/

      - name: Security Scan (Bandit)
        run: bandit -r libs/ services/

      - name: Dependency Scan (Pip-Audit)
        run: pip-audit || true # Temporarily soft-fail for pip-audit if there are unpatched upstream CVEs we can't control easily

      - name: Node Security Scan (npm audit)
        working-directory: ./frontend
        run: npm audit || true

      # Backend Tests & Coverage
      - name: Run Pytest
        env:
          PYTHONPATH: libs/
        run: |
          pytest tests/ --cov=libs --cov=services --cov-report=xml --cov-report=html

      - name: Upload Coverage Artifact
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: python-coverage
          path: |
            coverage.xml
            htmlcov/

      # Frontend Build
      - name: Build Frontend
        working-directory: ./frontend
        run: npm run build

      # Docker Build & E2E
      - name: Build Docker Images
        run: docker-compose build

      - name: End-to-End Test
        run: |
          cp .env.example .env
          docker-compose up -d
          echo "Waiting 30 seconds for Neo4j and Postgres..."
          sleep 30
          pytest tests/e2e/test_investigation_flow.py -v > e2e_test.log
          docker-compose down

      - name: Upload E2E Test Logs
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: e2e-logs
          path: e2e_test.log
""")

# BASE
write_file('k8s/base/namespace.yaml', """\
apiVersion: v1
kind: Namespace
metadata:
  name: aegis-aml
""")

write_file('k8s/base/configmap.yaml', """\
apiVersion: v1
kind: ConfigMap
metadata:
  name: aegis-config
  namespace: aegis-aml
data:
  AEGIS_ENVIRONMENT: "production"
  AEGIS_DEBUG: "False"
  AEGIS_VERSION: "1.0.0"
  AEGIS_GATEWAY_PORT: "8080"
  AEGIS_PLANNER_PORT: "8003"
  AEGIS_ML_PORT: "8000"
  AEGIS_GRAPH_PORT: "8001"
  AEGIS_EVIDENCE_PORT: "8002"
  AEGIS_PLANNER_SERVICE_URL: "http://planner-service:8003"
  AEGIS_ML_SERVICE_URL: "http://ml-service:8000"
  AEGIS_GRAPH_SERVICE_URL: "http://graph-service:8001"
  AEGIS_EVIDENCE_SERVICE_URL: "http://evidence-service:8002"
  AEGIS_MODEL_ARTIFACTS_PATH: "/app/artifacts/models/"
  AEGIS_FEATURE_STORE_PATH: "/app/artifacts/feature_store/"
  AEGIS_MODEL_VERSION: "1.0.0"
  AEGIS_THRESHOLD: "0.73"
  AEGIS_HASH_ALGORITHM: "SHA256"
  AEGIS_JWT_ALGORITHM: "HS256"
  AEGIS_JWT_EXPIRE_MINUTES: "120"
  AEGIS_RATE_LIMIT: "60/minute"
  AEGIS_ALLOWED_ORIGINS: "*"
  AEGIS_NEO4J_URI: "bolt://neo4j:7687"
""")

write_file('k8s/base/secrets.yaml', """\
apiVersion: v1
kind: Secret
metadata:
  name: aegis-secrets
  namespace: aegis-aml
type: Opaque
stringData:
  AEGIS_JWT_SECRET: "super-secret-aegis-key-for-local-dev-only"
  AEGIS_POSTGRES_DSN: "postgresql://postgres:aegis@postgres:5432/postgres"
  AEGIS_NEO4J_USERNAME: "neo4j"
  AEGIS_NEO4J_PASSWORD: "password"
  POSTGRES_USER: "postgres"
  POSTGRES_PASSWORD: "aegis"
  POSTGRES_DB: "postgres"
  NEO4J_AUTH: "neo4j/password"
""")

# GATEWAY
write_file('k8s/gateway/deployment.yaml', """\
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gateway-service
  namespace: aegis-aml
spec:
  replicas: 1
  selector:
    matchLabels:
      app: gateway-service
  template:
    metadata:
      labels:
        app: gateway-service
    spec:
      containers:
        - name: gateway-service
          image: aegisaml/gateway-service:latest
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 8080
          envFrom:
            - configMapRef:
                name: aegis-config
            - secretRef:
                name: aegis-secrets
          resources:
            requests:
              cpu: "100m"
              memory: "128Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"
          livenessProbe:
            httpGet:
              path: /api/v1/health
              port: 8080
            initialDelaySeconds: 15
            periodSeconds: 20
          readinessProbe:
            httpGet:
              path: /api/v1/health
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 10
""")

write_file('k8s/gateway/service.yaml', """\
apiVersion: v1
kind: Service
metadata:
  name: gateway-service
  namespace: aegis-aml
spec:
  type: ClusterIP
  selector:
    app: gateway-service
  ports:
    - protocol: TCP
      port: 8080
      targetPort: 8080
""")

write_file('k8s/gateway/hpa.yaml', """\
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: gateway-service-hpa
  namespace: aegis-aml
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: gateway-service
  minReplicas: 1
  maxReplicas: 5
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
""")

# PLANNER
write_file('k8s/planner/deployment.yaml', """\
apiVersion: apps/v1
kind: Deployment
metadata:
  name: planner-service
  namespace: aegis-aml
spec:
  replicas: 1
  selector:
    matchLabels:
      app: planner-service
  template:
    metadata:
      labels:
        app: planner-service
    spec:
      containers:
        - name: planner-service
          image: aegisaml/planner-service:latest
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 8003
          envFrom:
            - configMapRef:
                name: aegis-config
            - secretRef:
                name: aegis-secrets
          resources:
            requests:
              cpu: "200m"
              memory: "256Mi"
            limits:
              cpu: "1"
              memory: "1Gi"
          livenessProbe:
            httpGet:
              path: /health
              port: 8003
            initialDelaySeconds: 15
            periodSeconds: 20
          readinessProbe:
            httpGet:
              path: /health
              port: 8003
            initialDelaySeconds: 5
            periodSeconds: 10
""")

write_file('k8s/planner/service.yaml', """\
apiVersion: v1
kind: Service
metadata:
  name: planner-service
  namespace: aegis-aml
spec:
  type: ClusterIP
  selector:
    app: planner-service
  ports:
    - protocol: TCP
      port: 8003
      targetPort: 8003
""")

write_file('k8s/planner/hpa.yaml', """\
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: planner-service-hpa
  namespace: aegis-aml
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: planner-service
  minReplicas: 1
  maxReplicas: 3
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
""")

# ML
write_file('k8s/ml/deployment.yaml', """\
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-service
  namespace: aegis-aml
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ml-service
  template:
    metadata:
      labels:
        app: ml-service
    spec:
      containers:
        - name: ml-service
          image: aegisaml/ml-service:latest
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 8000
          envFrom:
            - configMapRef:
                name: aegis-config
            - secretRef:
                name: aegis-secrets
          resources:
            requests:
              cpu: "500m"
              memory: "512Mi"
            limits:
              cpu: "2"
              memory: "2Gi"
          livenessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 15
            periodSeconds: 20
          readinessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 5
            periodSeconds: 10
""")

write_file('k8s/ml/service.yaml', """\
apiVersion: v1
kind: Service
metadata:
  name: ml-service
  namespace: aegis-aml
spec:
  type: ClusterIP
  selector:
    app: ml-service
  ports:
    - protocol: TCP
      port: 8000
      targetPort: 8000
""")

# GRAPH
write_file('k8s/graph/deployment.yaml', """\
apiVersion: apps/v1
kind: Deployment
metadata:
  name: graph-service
  namespace: aegis-aml
spec:
  replicas: 1
  selector:
    matchLabels:
      app: graph-service
  template:
    metadata:
      labels:
        app: graph-service
    spec:
      containers:
        - name: graph-service
          image: aegisaml/graph-service:latest
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 8001
          envFrom:
            - configMapRef:
                name: aegis-config
            - secretRef:
                name: aegis-secrets
          resources:
            requests:
              cpu: "250m"
              memory: "256Mi"
            limits:
              cpu: "1"
              memory: "1Gi"
          livenessProbe:
            httpGet:
              path: /health
              port: 8001
            initialDelaySeconds: 15
            periodSeconds: 20
          readinessProbe:
            httpGet:
              path: /health
              port: 8001
            initialDelaySeconds: 5
            periodSeconds: 10
""")

write_file('k8s/graph/service.yaml', """\
apiVersion: v1
kind: Service
metadata:
  name: graph-service
  namespace: aegis-aml
spec:
  type: ClusterIP
  selector:
    app: graph-service
  ports:
    - protocol: TCP
      port: 8001
      targetPort: 8001
""")

# EVIDENCE
write_file('k8s/evidence/deployment.yaml', """\
apiVersion: apps/v1
kind: Deployment
metadata:
  name: evidence-service
  namespace: aegis-aml
spec:
  replicas: 1
  selector:
    matchLabels:
      app: evidence-service
  template:
    metadata:
      labels:
        app: evidence-service
    spec:
      containers:
        - name: evidence-service
          image: aegisaml/evidence-service:latest
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 8002
          envFrom:
            - configMapRef:
                name: aegis-config
            - secretRef:
                name: aegis-secrets
          resources:
            requests:
              cpu: "150m"
              memory: "256Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"
          livenessProbe:
            httpGet:
              path: /health
              port: 8002
            initialDelaySeconds: 15
            periodSeconds: 20
          readinessProbe:
            httpGet:
              path: /health
              port: 8002
            initialDelaySeconds: 5
            periodSeconds: 10
""")

write_file('k8s/evidence/service.yaml', """\
apiVersion: v1
kind: Service
metadata:
  name: evidence-service
  namespace: aegis-aml
spec:
  type: ClusterIP
  selector:
    app: evidence-service
  ports:
    - protocol: TCP
      port: 8002
      targetPort: 8002
""")

# FRONTEND
write_file('k8s/frontend/deployment.yaml', """\
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: aegis-aml
spec:
  replicas: 1
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
        - name: frontend
          image: aegisaml/frontend:latest
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 80
          resources:
            requests:
              cpu: "100m"
              memory: "64Mi"
            limits:
              cpu: "250m"
              memory: "128Mi"
          livenessProbe:
            httpGet:
              path: /
              port: 80
            initialDelaySeconds: 5
            periodSeconds: 15
          readinessProbe:
            httpGet:
              path: /
              port: 80
            initialDelaySeconds: 2
            periodSeconds: 10
""")

write_file('k8s/frontend/service.yaml', """\
apiVersion: v1
kind: Service
metadata:
  name: frontend
  namespace: aegis-aml
spec:
  type: ClusterIP
  selector:
    app: frontend
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
""")

# DATABASES (StatefulSets)
write_file('k8s/postgres/statefulset.yaml', """\
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: aegis-aml
spec:
  serviceName: "postgres"
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:15
          ports:
            - containerPort: 5432
          envFrom:
            - secretRef:
                name: aegis-secrets
          volumeMounts:
            - name: postgres-data
              mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
    - metadata:
        name: postgres-data
      spec:
        accessModes: [ "ReadWriteOnce" ]
        resources:
          requests:
            storage: 10Gi
""")

write_file('k8s/postgres/service.yaml', """\
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: aegis-aml
spec:
  type: ClusterIP
  selector:
    app: postgres
  ports:
    - protocol: TCP
      port: 5432
      targetPort: 5432
""")

write_file('k8s/neo4j/statefulset.yaml', """\
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: neo4j
  namespace: aegis-aml
spec:
  serviceName: "neo4j"
  replicas: 1
  selector:
    matchLabels:
      app: neo4j
  template:
    metadata:
      labels:
        app: neo4j
    spec:
      containers:
        - name: neo4j
          image: neo4j:5.12.0
          ports:
            - containerPort: 7474
            - containerPort: 7687
          envFrom:
            - secretRef:
                name: aegis-secrets
          volumeMounts:
            - name: neo4j-data
              mountPath: /data
  volumeClaimTemplates:
    - metadata:
        name: neo4j-data
      spec:
        accessModes: [ "ReadWriteOnce" ]
        resources:
          requests:
            storage: 10Gi
""")

write_file('k8s/neo4j/service.yaml', """\
apiVersion: v1
kind: Service
metadata:
  name: neo4j
  namespace: aegis-aml
spec:
  type: ClusterIP
  selector:
    app: neo4j
  ports:
    - name: http
      protocol: TCP
      port: 7474
      targetPort: 7474
    - name: bolt
      protocol: TCP
      port: 7687
      targetPort: 7687
""")

# OBSERVABILITY
write_file('k8s/observability/prometheus/configmap.yaml', """\
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: aegis-aml
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
    scrape_configs:
      - job_name: 'aegis_services'
        kubernetes_sd_configs:
          - role: pod
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_label_app]
            regex: (gateway-service|planner-service|ml-service|graph-service|evidence-service)
            action: keep
""")

write_file('k8s/observability/prometheus/deployment.yaml', """\
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus
  namespace: aegis-aml
spec:
  replicas: 1
  selector:
    matchLabels:
      app: prometheus
  template:
    metadata:
      labels:
        app: prometheus
    spec:
      containers:
        - name: prometheus
          image: prom/prometheus:latest
          ports:
            - containerPort: 9090
          volumeMounts:
            - name: config-volume
              mountPath: /etc/prometheus/
            - name: prometheus-data
              mountPath: /prometheus
      volumes:
        - name: config-volume
          configMap:
            name: prometheus-config
        - name: prometheus-data
          persistentVolumeClaim:
            claimName: prometheus-pvc
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: prometheus-pvc
  namespace: aegis-aml
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
""")

write_file('k8s/observability/prometheus/service.yaml', """\
apiVersion: v1
kind: Service
metadata:
  name: prometheus
  namespace: aegis-aml
spec:
  type: ClusterIP
  selector:
    app: prometheus
  ports:
    - protocol: TCP
      port: 9090
      targetPort: 9090
""")

write_file('k8s/observability/grafana/deployment.yaml', """\
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grafana
  namespace: aegis-aml
spec:
  replicas: 1
  selector:
    matchLabels:
      app: grafana
  template:
    metadata:
      labels:
        app: grafana
    spec:
      containers:
        - name: grafana
          image: grafana/grafana:latest
          ports:
            - containerPort: 3000
          env:
            - name: GF_AUTH_ANONYMOUS_ENABLED
              value: "true"
            - name: GF_AUTH_ANONYMOUS_ORG_ROLE
              value: "Admin"
          volumeMounts:
            - name: grafana-data
              mountPath: /var/lib/grafana
      volumes:
        - name: grafana-data
          persistentVolumeClaim:
            claimName: grafana-pvc
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: grafana-pvc
  namespace: aegis-aml
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
""")

write_file('k8s/observability/grafana/service.yaml', """\
apiVersion: v1
kind: Service
metadata:
  name: grafana
  namespace: aegis-aml
spec:
  type: ClusterIP
  selector:
    app: grafana
  ports:
    - protocol: TCP
      port: 3000
      targetPort: 3000
""")

# INGRESS
write_file('k8s/ingress/ingress.yaml', """\
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: aegis-ingress
  namespace: aegis-aml
  annotations:
    kubernetes.io/ingress.class: "nginx"
    nginx.ingress.kubernetes.io/rewrite-target: /$1
spec:
  rules:
    - http:
        paths:
          - path: /api/v1/?(.*)
            pathType: Prefix
            backend:
              service:
                name: gateway-service
                port:
                  number: 8080
          - path: /?(.*)
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 80
""")

print("Successfully generated Kubernetes manifests and updated CI workflow for Phase 9.")

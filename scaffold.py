import os
import textwrap

structure = {
    "artifacts/": {
        "models/": {},
        "feature_store/": {},
        "mlflow/": {},
        "reports/": {},
        "explainability/": {}
    },
    "configs/": {
        "development.yaml": "",
        "production.yaml": "",
        "docker.yaml": ""
    },
    "libs/": {
        "pyproject.toml": textwrap.dedent("""\
            [build-system]
            requires = ["setuptools>=61.0"]
            build-backend = "setuptools.build_meta"

            [project]
            name = "aegis"
            version = "0.1.0"
            description = "Shared library for AegisAML"
            dependencies = [
                "pydantic>=2.0.0",
                "fastapi>=0.100.0"
            ]
        """),
        "aegis/": {
            "__init__.py": "",
            "config/": {"__init__.py": ""},
            "constants/": {"__init__.py": ""},
            "logging/": {"__init__.py": ""},
            "utils/": {"__init__.py": ""},
            "schemas/": {
                "__init__.py": "",
                "requests.py": "",
                "responses.py": "",
                "evidence.py": "",
                "graph.py": "",
                "ml.py": "",
                "planner.py": ""
            },
            "feature_engineering/": {"__init__.py": ""},
            "graph/": {"__init__.py": ""},
            "evidence/": {"__init__.py": ""},
            "models/": {
                "__init__.py": "",
                "feature_store.py": "",
                "risk.py": "",
                "investigation.py": "",
                "customer.py": "",
                "transaction.py": ""
            }
        }
    },
    "services/": {
        "ml-service/": {
            "main.py": "from fastapi import FastAPI\n\napp = FastAPI(title='ML Service')\n",
            "requirements.txt": "-e ../../libs\n"
        },
        "graph-service/": {
            "main.py": "from fastapi import FastAPI\n\napp = FastAPI(title='Graph Service')\n",
            "requirements.txt": "-e ../../libs\n"
        },
        "evidence-service/": {
            "main.py": "from fastapi import FastAPI\n\napp = FastAPI(title='Evidence Service')\n",
            "requirements.txt": "-e ../../libs\n"
        },
        "planner-service/": {
            "main.py": "from fastapi import FastAPI\n\napp = FastAPI(title='Planner Service')\n",
            "requirements.txt": "-e ../../libs\n"
        },
        "gateway/": {
            "main.py": "from fastapi import FastAPI\n\napp = FastAPI(title='Gateway')\n",
            "requirements.txt": "-e ../../libs\n"
        },
        "data-service/": {
            "main.py": "from fastapi import FastAPI\n\napp = FastAPI(title='Data Service')\n",
            "requirements.txt": "-e ../../libs\n"
        }
    },
    "frontend/": {},
    "tests/": {
        "unit/": {},
        "integration/": {},
        "api/": {},
        "performance/": {}
    },
    "deployment/": {},
    "docker/": {},
    "docs/": {
        "architecture.md": "# Architecture\n",
        "api.md": "# API\n",
        "deployment.md": "# Deployment\n",
        "planner.md": "# Planner\n"
    },
    "docker-compose.yml": textwrap.dedent("""\
        version: '3.8'
        services:
          neo4j:
            image: neo4j:5
            ports:
              - "7474:7474"
              - "7687:7687"
          redis:
            image: redis:7
            ports:
              - "6379:6379"
          postgres:
            image: postgres:15
            environment:
              POSTGRES_PASSWORD: aegis
            ports:
              - "5432:5432"
          mlflow:
            image: bitnami/mlflow:2
            ports:
              - "5000:5000"
          prometheus:
            image: prom/prometheus
            ports:
              - "9090:9090"
          grafana:
            image: grafana/grafana
            ports:
              - "3000:3000"
    """),
    ".env.example": ""
}

def create_structure(base_path, struct):
    for name, content in struct.items():
        path = os.path.join(base_path, name)
        if isinstance(content, dict):
            os.makedirs(path, exist_ok=True)
            create_structure(path, content)
        else:
            with open(path, 'w') as f:
                f.write(content)

if __name__ == "__main__":
    create_structure(".", structure)
    print("Scaffold created successfully.")

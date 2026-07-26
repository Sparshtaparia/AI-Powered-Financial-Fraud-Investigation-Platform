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

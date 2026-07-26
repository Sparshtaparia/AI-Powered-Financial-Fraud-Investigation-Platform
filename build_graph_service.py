import os
import textwrap

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(textwrap.dedent(content))

# 1. Update libs/aegis/config/settings.py to include neo4j
write_file('libs/aegis/config/settings.py', """\
    from pydantic_settings import BaseSettings

    class AegisSettings(BaseSettings):
        environment: str = "development"
        model_artifacts_path: str = "../../artifacts/models"
        feature_store_path: str = "../../artifacts/feature_store"
        
        # Neo4j Settings
        neo4j_uri: str = "bolt://localhost:7687"
        neo4j_user: str = "neo4j"
        neo4j_password: str = "password"
        
        class Config:
            env_prefix = "AEGIS_"
""")

# 2. Add graph schemas
write_file('libs/aegis/schemas/graph.py', """\
    from pydantic import BaseModel
    from typing import Optional, List, Dict, Any

    class GraphHealthResponse(BaseModel):
        status: str
        neo4j_connected: bool
        database: str
        node_count: int
        relationship_count: int

    class NodeBase(BaseModel):
        id: str
        labels: List[str]
        properties: Dict[str, Any]

    class EdgeBase(BaseModel):
        id: str
        type: str
        start_node: str
        end_node: str
        properties: Dict[str, Any]

    class SubgraphResponse(BaseModel):
        nodes: List[NodeBase]
        edges: List[EdgeBase]

    class CustomerResponse(BaseModel):
        customer: NodeBase
        accounts: List[NodeBase]
        
    class PageRankResponse(BaseModel):
        node_id: str
        pagerank_score: float
""")

# 3. Graph Service Requirements
write_file('services/graph-service/requirements.txt', """\
    -e ../../libs
    fastapi
    uvicorn
    pydantic-settings
    neo4j
""")

# 4. Core Config
write_file('services/graph-service/core/config.py', """\
    from aegis.config.settings import AegisSettings

    class GraphServiceSettings(AegisSettings):
        pass

    settings = GraphServiceSettings()
""")

# 5. Neo4j Repository
write_file('services/graph-service/repositories/neo4j_repository.py', """\
    from neo4j import GraphDatabase
    from core.config import settings
    from aegis.logging.logger import get_logger

    logger = get_logger("neo4j_repository")

    class Neo4jRepository:
        def __init__(self):
            self.driver = None

        def connect(self):
            try:
                self.driver = GraphDatabase.driver(
                    settings.neo4j_uri, 
                    auth=(settings.neo4j_user, settings.neo4j_password)
                )
                # Verify connectivity
                self.driver.verify_connectivity()
                logger.info("Connected to Neo4j successfully.")
            except Exception as e:
                logger.error(f"Failed to connect to Neo4j: {e}")
                self.driver = None

        def close(self):
            if self.driver:
                self.driver.close()

        def get_db_stats(self):
            if not self.driver:
                return {"node_count": 0, "relationship_count": 0, "connected": False}
            try:
                with self.driver.session() as session:
                    n_count = session.run("MATCH (n) RETURN count(n) AS c").single()["c"]
                    r_count = session.run("MATCH ()-[r]->() RETURN count(r) AS c").single()["c"]
                    return {"node_count": n_count, "relationship_count": r_count, "connected": True}
            except Exception as e:
                logger.error(f"Error fetching stats: {e}")
                return {"node_count": 0, "relationship_count": 0, "connected": False}

        def execute_query(self, query: str, parameters: dict = None):
            if not self.driver:
                return []
            with self.driver.session() as session:
                result = session.run(query, parameters or {})
                return [record.data() for record in result]
                
    # Global instance
    neo4j_repo = Neo4jRepository()
""")

# 6. Services Layer
write_file('services/graph-service/services/graph_queries.py', """\
    from repositories.neo4j_repository import neo4j_repo
    from aegis.schemas.graph import CustomerResponse, NodeBase

    def get_customer(customer_id: str) -> dict:
        query = \"\"\"
        MATCH (c:Customer {id: $customer_id})
        OPTIONAL MATCH (c)-[:OWNS]->(a:Account)
        RETURN c, collect(a) AS accounts
        \"\"\"
        records = neo4j_repo.execute_query(query, {"customer_id": customer_id})
        if not records or records[0].get('c') is None:
            return None
            
        c_node = records[0]['c']
        a_nodes = records[0]['accounts']
        
        return {
            "customer": {
                "id": c_node.get('id', customer_id),
                "labels": ["Customer"],
                "properties": dict(c_node)
            },
            "accounts": [
                {
                    "id": a.get('id', 'unknown'),
                    "labels": ["Account"],
                    "properties": dict(a)
                } for a in a_nodes if a
            ]
        }
""")

write_file('services/graph-service/services/subgraph_builder.py', """\
    from repositories.neo4j_repository import neo4j_repo

    def get_subgraph(account_id: str, depth: int = 1):
        query = \"\"\"
        MATCH path = (a:Account {id: $account_id})-[*1..2]-(b)
        RETURN [n in nodes(path) | n] AS nodes, [r in relationships(path) | r] AS relationships
        \"\"\"
        records = neo4j_repo.execute_query(query, {"account_id": account_id})
        # Simplified parsing for the scaffold
        nodes = []
        edges = []
        if records:
            # We would parse the Neo4j Graph objects here properly in production
            pass
        return {"nodes": nodes, "edges": edges}
""")

write_file('services/graph-service/services/graph_analytics.py', """\
    from repositories.neo4j_repository import neo4j_repo

    def get_pagerank(node_id: str):
        # We read pre-computed pagerank from the node property as recommended
        query = "MATCH (n {id: $node_id}) RETURN n.pagerank AS score"
        records = neo4j_repo.execute_query(query, {"node_id": node_id})
        score = records[0]['score'] if records and records[0].get('score') is not None else 0.0
        return {"node_id": node_id, "pagerank_score": score}
        
    def get_community(node_id: str):
        query = "MATCH (n {id: $node_id}) RETURN n.community_id AS community"
        records = neo4j_repo.execute_query(query, {"node_id": node_id})
        comm = records[0]['community'] if records and records[0].get('community') is not None else "unknown"
        return {"node_id": node_id, "community": comm}
""")

# 7. API Routes
write_file('services/graph-service/api/routes.py', """\
    from fastapi import APIRouter, HTTPException
    from aegis.schemas.graph import GraphHealthResponse, CustomerResponse, SubgraphResponse, PageRankResponse
    from repositories.neo4j_repository import neo4j_repo
    from services.graph_queries import get_customer
    from services.subgraph_builder import get_subgraph
    from services.graph_analytics import get_pagerank, get_community

    router = APIRouter()

    @router.get("/health", response_model=GraphHealthResponse)
    def health():
        stats = neo4j_repo.get_db_stats()
        return GraphHealthResponse(
            status="healthy" if stats["connected"] else "degraded",
            neo4j_connected=stats["connected"],
            database="neo4j",
            node_count=stats["node_count"],
            relationship_count=stats["relationship_count"]
        )

    @router.get("/customer/{customer_id}", response_model=CustomerResponse)
    def customer_endpoint(customer_id: str):
        result = get_customer(customer_id)
        if not result:
            raise HTTPException(status_code=404, detail="Customer not found")
        return CustomerResponse(**result)

    @router.get("/subgraph", response_model=SubgraphResponse)
    def subgraph_endpoint(account_id: str, depth: int = 1):
        result = get_subgraph(account_id, depth)
        return SubgraphResponse(**result)
        
    @router.get("/pagerank/{node_id}", response_model=PageRankResponse)
    def pagerank_endpoint(node_id: str):
        return PageRankResponse(**get_pagerank(node_id))
        
    @router.get("/community/{node_id}")
    def community_endpoint(node_id: str):
        return get_community(node_id)
""")

# 8. Main App with Lifespan
write_file('services/graph-service/main.py', """\
    from fastapi import FastAPI
    from contextlib import asynccontextmanager
    from repositories.neo4j_repository import neo4j_repo
    from api.routes import router

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        # Startup: Connect to Neo4j
        neo4j_repo.connect()
        yield
        # Shutdown: Close connection
        neo4j_repo.close()

    app = FastAPI(title='Graph Service', lifespan=lifespan)
    app.include_router(router)
""")

# 9. Seed Script
write_file('services/graph-service/scripts/seed_graph.py', """\
    import sys
    import os
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../')))

    from libs.aegis.config.settings import AegisSettings
    from services.graph_service.repositories.neo4j_repository import neo4j_repo
    import logging

    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger("seed")

    def seed():
        neo4j_repo.connect()
        if not neo4j_repo.driver:
            logger.error("Could not connect to Neo4j. Start docker container first.")
            return

        # Deterministic seed data
        queries = [
            "MATCH (n) DETACH DELETE n", # Clean graph
            \"\"\"
            CREATE (c1:Customer {id: 'CUST_521', name: 'Alice', risk_score: 0.1})
            CREATE (c2:Customer {id: 'CUST_999', name: 'Bob', risk_score: 0.9})
            CREATE (a1:Account {id: 'ACC_100', balance: 5000, pagerank: 0.05, community_id: 'C1'})
            CREATE (a2:Account {id: 'ACC_200', balance: 15000, pagerank: 0.85, community_id: 'C2'})
            CREATE (c1)-[:OWNS]->(a1)
            CREATE (c2)-[:OWNS]->(a2)
            CREATE (a1)-[:TRANSFERRED_TO {amount: 2000, date: '2023-01-01'}]->(a2)
            \"\"\"
        ]
        
        for q in queries:
            neo4j_repo.execute_query(q)
            
        logger.info("Database successfully seeded.")
        neo4j_repo.close()

    if __name__ == "__main__":
        seed()
""")

# 10. Tests
write_file('tests/unit/test_graph_service.py', """\
    import pytest
    from unittest.mock import patch, MagicMock

    import sys
    import os
    sys.path.append(os.path.abspath('./services/graph-service'))
    sys.path.append(os.path.abspath('./libs'))

    from services.graph_queries import get_customer

    @patch('repositories.neo4j_repository.neo4j_repo.execute_query')
    def test_get_customer(mock_execute):
        # Mocking the repository layer
        mock_execute.return_value = [
            {
                'c': {'id': 'CUST_521', 'name': 'Alice'},
                'accounts': [{'id': 'ACC_100', 'balance': 5000}]
            }
        ]
        
        res = get_customer('CUST_521')
        assert res is not None
        assert res['customer']['id'] == 'CUST_521'
        assert len(res['accounts']) == 1
        assert res['accounts'][0]['id'] == 'ACC_100'
""")

write_file('tests/api/test_graph_endpoints.py', """\
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
""")

print("Successfully generated all files for Graph Service")

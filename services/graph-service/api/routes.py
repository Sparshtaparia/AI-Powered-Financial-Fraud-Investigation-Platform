from fastapi import APIRouter, HTTPException
from aegis.schemas.graph import CustomerResponse, SubgraphResponse, PageRankResponse
from aegis.schemas.health import HealthResponse, DependencyHealth
from repositories.neo4j_repository import neo4j_repo
from services.graph_queries import get_customer
from services.subgraph_builder import get_subgraph
from services.graph_analytics import get_pagerank, get_community
import time

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
def health():
    import main
    uptime = int(time.time() - main.START_TIME)
    stats = neo4j_repo.get_db_stats()
    return HealthResponse(
        status="healthy" if stats["connected"] else "degraded",
        service="graph-service",
        version="1.0.0",
        dependencies=[
            DependencyHealth(name="neo4j", status="healthy" if stats["connected"] else "unhealthy")
        ],
        uptime_seconds=uptime
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

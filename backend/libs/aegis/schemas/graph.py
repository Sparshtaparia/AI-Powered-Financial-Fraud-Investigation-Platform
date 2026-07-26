from typing import Any, Dict, List

from pydantic import BaseModel


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

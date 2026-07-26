from repositories.neo4j_repository import neo4j_repo


def get_pagerank(node_id: str):
    # We read pre-computed pagerank from the node property as recommended
    query = "MATCH (n {id: $node_id}) RETURN n.pagerank AS score"
    records = neo4j_repo.execute_query(query, {"node_id": node_id})
    score = (
        records[0]["score"] if records and records[0].get("score") is not None else 0.0
    )
    return {"node_id": node_id, "pagerank_score": score}


def get_community(node_id: str):
    query = "MATCH (n {id: $node_id}) RETURN n.community_id AS community"
    records = neo4j_repo.execute_query(query, {"node_id": node_id})
    comm = (
        records[0]["community"]
        if records and records[0].get("community") is not None
        else "unknown"
    )
    return {"node_id": node_id, "community": comm}

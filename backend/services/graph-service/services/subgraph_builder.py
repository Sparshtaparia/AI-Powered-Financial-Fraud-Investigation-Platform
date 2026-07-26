from repositories.neo4j_repository import neo4j_repo


def get_subgraph(account_id: str, depth: int = 1):
    query = """
    MATCH path = (a:Account {id: $account_id})-[*1..2]-(b)
    RETURN [n in nodes(path) | n] AS nodes, [r in relationships(path) | r] AS relationships
    """
    records = neo4j_repo.execute_query(query, {"account_id": account_id})
    # Simplified parsing for the scaffold
    nodes = []
    edges = []
    if records:
        # We would parse the Neo4j Graph objects here properly in production
        pass
    return {"nodes": nodes, "edges": edges}

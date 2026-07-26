from repositories.neo4j_repository import neo4j_repo
from aegis.schemas.graph import CustomerResponse, NodeBase

def get_customer(customer_id: str) -> dict:
    query = """
    MATCH (c:Customer {id: $customer_id})
    OPTIONAL MATCH (c)-[:OWNS]->(a:Account)
    RETURN c, collect(a) AS accounts
    """
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

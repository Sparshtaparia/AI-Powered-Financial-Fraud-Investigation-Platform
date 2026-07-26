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
        """
        CREATE (c1:Customer {id: 'CUST_521', name: 'Alice', risk_score: 0.1})
        CREATE (c2:Customer {id: 'CUST_999', name: 'Bob', risk_score: 0.9})
        CREATE (a1:Account {id: 'ACC_100', balance: 5000, pagerank: 0.05, community_id: 'C1'})
        CREATE (a2:Account {id: 'ACC_200', balance: 15000, pagerank: 0.85, community_id: 'C2'})
        CREATE (c1)-[:OWNS]->(a1)
        CREATE (c2)-[:OWNS]->(a2)
        CREATE (a1)-[:TRANSFERRED_TO {amount: 2000, date: '2023-01-01'}]->(a2)
        """
    ]

    for q in queries:
        neo4j_repo.execute_query(q)

    logger.info("Database successfully seeded.")
    neo4j_repo.close()

if __name__ == "__main__":
    seed()

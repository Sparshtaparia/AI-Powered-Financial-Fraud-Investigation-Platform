import os
from neo4j import GraphDatabase

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))

def seed_neo4j():
    uri = os.getenv("NEO4J_URI", "bolt://localhost:7688")
    user = os.getenv("NEO4J_USERNAME", "neo4j")
    password = os.getenv("NEO4J_PASSWORD", "password")

    print(f"Connecting to Neo4j: {uri}")
    driver = GraphDatabase.driver(uri, auth=(user, password))

    with driver.session() as session:
        # Clear existing data for a clean demo
        session.run("MATCH (n) DETACH DELETE n")

        print("Seeding Nodes and Relationships...")
        # Create a localized fraud ring
        session.run('''
            CREATE (c1:Customer {id: 'CUST_001', risk_score: 0.8})
            CREATE (c2:Customer {id: 'CUST_002', risk_score: 0.9})
            CREATE (c3:Customer {id: 'CUST_003', risk_score: 0.2})
            CREATE (c521:Customer {id: 'CUST_521', risk_score: 0.95, name: 'Suspect Entity'})

            CREATE (a1:Account {id: 'ACC_001', balance: 15000})
            CREATE (a2:Account {id: 'ACC_002', balance: 2000})
            CREATE (a3:Account {id: 'ACC_003', balance: 50000})
            CREATE (a521:Account {id: 'ACC_521', balance: 1200000})

            CREATE (c1)-[:OWNS]->(a1)
            CREATE (c2)-[:OWNS]->(a2)
            CREATE (c3)-[:OWNS]->(a3)
            CREATE (c521)-[:OWNS]->(a521)

            CREATE (a1)-[:TRANSFERRED_TO {amount: 9000, date: '2023-10-01'}]->(a2)
            CREATE (a2)-[:TRANSFERRED_TO {amount: 8500, date: '2023-10-02'}]->(a3)
            CREATE (a1)-[:TRANSFERRED_TO {amount: 4000, date: '2023-10-03'}]->(a3)
            CREATE (a521)-[:TRANSFERRED_TO {amount: 50000, date: '2023-10-05'}]->(a1)
            CREATE (a521)-[:TRANSFERRED_TO {amount: 75000, date: '2023-10-06'}]->(a2)
        ''')

    driver.close()
    print("Neo4j Seeding Complete.")

if __name__ == "__main__":
    seed_neo4j()

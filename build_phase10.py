import os
import textwrap

def write_file(path, content):
    if os.path.dirname(path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(textwrap.dedent(content))

write_file('scripts/seed_postgres.py', """\
    import asyncio
    import os
    import asyncpg
    from datetime import datetime, timedelta
    import uuid

    async def main():
        dsn = os.getenv("AEGIS_POSTGRES_DSN", "postgresql://postgres:aegis@localhost:5432/postgres")
        print(f"Connecting to Postgres: {dsn}")
        conn = await asyncpg.connect(dsn)
        
        # Create Tables if they don't exist
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS evidence_logs (
                id UUID PRIMARY KEY,
                case_id VARCHAR(50) NOT NULL,
                timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                evidence_type VARCHAR(50) NOT NULL,
                payload JSONB NOT NULL,
                hash_sha256 VARCHAR(64) NOT NULL
            );
        ''')
        
        print("Tables verified. Seeding sample evidence...")
        # Add a dummy evidence log for demo purposes
        await conn.execute('''
            INSERT INTO evidence_logs (id, case_id, evidence_type, payload, hash_sha256)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (id) DO NOTHING
        ''', uuid.uuid4(), 'INV-001', 'RISK_ASSESSMENT', '{"risk_score": 0.85, "reason": "High velocity transfers"}', 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e')
        
        print("Postgres Seeding Complete.")
        await conn.close()

    if __name__ == "__main__":
        asyncio.run(main())
""")

write_file('scripts/seed_neo4j.py', """\
    import os
    from neo4j import GraphDatabase

    def seed_neo4j():
        uri = os.getenv("AEGIS_NEO4J_URI", "bolt://localhost:7687")
        user = os.getenv("AEGIS_NEO4J_USERNAME", "neo4j")
        password = os.getenv("AEGIS_NEO4J_PASSWORD", "password")
        
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
                
                CREATE (a1:Account {id: 'ACC_001', balance: 15000})
                CREATE (a2:Account {id: 'ACC_002', balance: 2000})
                CREATE (a3:Account {id: 'ACC_003', balance: 50000})
                
                CREATE (c1)-[:OWNS]->(a1)
                CREATE (c2)-[:OWNS]->(a2)
                CREATE (c3)-[:OWNS]->(a3)
                
                CREATE (a1)-[:TRANSFERRED_TO {amount: 9000, date: '2023-10-01'}]->(a2)
                CREATE (a2)-[:TRANSFERRED_TO {amount: 8500, date: '2023-10-02'}]->(a3)
                CREATE (a1)-[:TRANSFERRED_TO {amount: 4000, date: '2023-10-03'}]->(a3)
            ''')
            
        driver.close()
        print("Neo4j Seeding Complete.")

    if __name__ == "__main__":
        seed_neo4j()
""")

write_file('scripts/generate_mock_models.py', """\
    import os
    import pickle
    import json

    def generate_mock_models():
        model_dir = "artifacts/models"
        os.makedirs(model_dir, exist_ok=True)
        
        print(f"Generating mock ML artifacts in {model_dir}...")
        
        # We'll just dump a dummy dictionary that the ML service can 'load' to verify paths work
        dummy_model = {"model_type": "mock_xgboost", "version": "1.0.0"}
        
        with open(os.path.join(model_dir, 'xgboost.pkl'), 'wb') as f:
            pickle.dump(dummy_model, f)
            
        with open(os.path.join(model_dir, 'iforest.pkl'), 'wb') as f:
            pickle.dump(dummy_model, f)
            
        metadata = {
            "model_version": "1.0.0",
            "features_expected": ["tx_volume", "velocity", "age"]
        }
        with open(os.path.join(model_dir, 'metadata.json'), 'w') as f:
            json.dump(metadata, f, indent=4)
            
        print("Mock ML models generated successfully.")

    if __name__ == "__main__":
        generate_mock_models()
""")

print("Phase 10 scripts generated.")

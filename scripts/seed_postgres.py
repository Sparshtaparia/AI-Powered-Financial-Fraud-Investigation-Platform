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

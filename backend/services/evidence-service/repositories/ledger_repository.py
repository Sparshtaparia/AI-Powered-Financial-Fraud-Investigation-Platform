import psycopg2
from psycopg2.extras import RealDictCursor
from core.config import settings
from aegis.logging.logger import get_logger

logger = get_logger("ledger_repository")

class LedgerRepository:
    def __init__(self):
        self.dsn = settings.postgres_dsn
        self._create_tables()

    def _get_connection(self):
        return psycopg2.connect(self.dsn, cursor_factory=RealDictCursor)

    def _create_tables(self):
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        CREATE TABLE IF NOT EXISTS evidence_bundle (
                            id UUID PRIMARY KEY,
                            case_id VARCHAR(255) NOT NULL,
                            bundle_hash VARCHAR(64) NOT NULL,
                            canonical_json TEXT NOT NULL,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            created_by VARCHAR(255),
                            metadata_json JSONB
                        );
                        CREATE INDEX IF NOT EXISTS idx_bundle_case_id ON evidence_bundle(case_id);

                        CREATE TABLE IF NOT EXISTS case_merkle (
                            case_id VARCHAR(255) PRIMARY KEY,
                            merkle_root VARCHAR(64) NOT NULL,
                            bundle_count INT NOT NULL,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        );
                    """)
                conn.commit()
        except Exception as e:
            logger.error(f"Failed to initialize Postgres schema: {e}")

    def save_bundle(self, bundle_id: str, case_id: str, bundle_hash: str, canonical_json: str, metadata: dict):
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                import json
                cur.execute("""
                    INSERT INTO evidence_bundle (id, case_id, bundle_hash, canonical_json, metadata_json)
                    VALUES (%s, %s, %s, %s, %s)
                """, (bundle_id, case_id, bundle_hash, canonical_json, json.dumps(metadata)))
            conn.commit()

    def get_bundle(self, bundle_hash: str):
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM evidence_bundle WHERE bundle_hash = %s", (bundle_hash,))
                return cur.fetchone()

    def list_case_bundles(self, case_id: str):
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM evidence_bundle WHERE case_id = %s ORDER BY created_at ASC", (case_id,))
                return cur.fetchall()

    def save_merkle_root(self, case_id: str, merkle_root: str, bundle_count: int):
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO case_merkle (case_id, merkle_root, bundle_count)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (case_id) DO UPDATE SET 
                    merkle_root = EXCLUDED.merkle_root,
                    bundle_count = EXCLUDED.bundle_count,
                    updated_at = CURRENT_TIMESTAMP
                """, (case_id, merkle_root, bundle_count))
            conn.commit()

    def get_merkle_root(self, case_id: str):
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM case_merkle WHERE case_id = %s", (case_id,))
                return cur.fetchone()

# For dependency injection / global usage
ledger_repo = LedgerRepository()

from aegis.logging.logger import get_logger
from core.config import settings
from neo4j import GraphDatabase

logger = get_logger("neo4j_repository")


class Neo4jRepository:
    def __init__(self):
        self.driver = None

    def connect(self):
        try:
            self.driver = GraphDatabase.driver(
                settings.neo4j_uri, auth=(settings.neo4j_user, settings.neo4j_password)
            )
            # Verify connectivity
            self.driver.verify_connectivity()
            logger.info("Connected to Neo4j successfully.")
        except Exception as e:
            logger.error(f"Failed to connect to Neo4j: {e}")
            self.driver = None

    def close(self):
        if self.driver:
            self.driver.close()

    def get_db_stats(self):
        if not self.driver:
            return {"node_count": 0, "relationship_count": 0, "connected": False}
        try:
            with self.driver.session() as session:
                n_count = session.run("MATCH (n) RETURN count(n) AS c").single()["c"]
                r_count = session.run("MATCH ()-[r]->() RETURN count(r) AS c").single()[
                    "c"
                ]
                return {
                    "node_count": n_count,
                    "relationship_count": r_count,
                    "connected": True,
                }
        except Exception as e:
            logger.error(f"Error fetching stats: {e}")
            return {"node_count": 0, "relationship_count": 0, "connected": False}

    def execute_query(self, query: str, parameters: dict = None):
        if not self.driver:
            return []
        with self.driver.session() as session:
            result = session.run(query, parameters or {})
            return [record.data() for record in result]


# Global instance
neo4j_repo = Neo4jRepository()

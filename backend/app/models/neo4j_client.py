import os
from dotenv import load_dotenv
load_dotenv()

from neo4j import GraphDatabase

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "password")

class Neo4jClient:
    def __init__(self, uri=NEO4J_URI, user=NEO4J_USER, password=NEO4J_PASSWORD):
        self.driver = GraphDatabase.driver(uri, auth=(user, password))

    def close(self):
        self.driver.close()

    def run_query(self, query, parameters=None):
        with self.driver.session() as session:
            result = session.run(query, parameters)
            return [record.data() for record in result]

    def create_customer(self, customer_id, name, risk_category):
        query = """
        MERGE (c:Customer {id: $customer_id})
        SET c.name = $name, c.risk_category = $risk_category
        """
        self.run_query(query, {"customer_id": customer_id, "name": name, "risk_category": risk_category})

    def create_account(self, account_id, customer_id):
        query = """
        MERGE (a:Account {id: $account_id})
        MERGE (c:Customer {id: $customer_id})
        MERGE (c)-[:OWNS]->(a)
        """
        self.run_query(query, {"account_id": account_id, "customer_id": customer_id})

    def create_transaction(self, tx_id, sender_acc, receiver_acc, amount, timestamp):
        query = """
        MERGE (sender:Account {id: $sender_acc})
        MERGE (receiver:Account {id: $receiver_acc})
        MERGE (sender)-[r:TRANSFERRED_TO {tx_id: $tx_id}]->(receiver)
        SET r.amount = $amount, r.timestamp = $timestamp
        """
        self.run_query(query, {
            "tx_id": tx_id,
            "sender_acc": sender_acc,
            "receiver_acc": receiver_acc,
            "amount": amount,
            "timestamp": timestamp
        })

    def get_multi_hop_path(self, account_id, max_hops=3):
        # Example graph intelligence query
        query = f"""
        MATCH p=(start:Account {{id: $account_id}})-[:TRANSFERRED_TO*1..{max_hops}]->(end:Account)
        RETURN p LIMIT 50
        """
        return self.run_query(query, {"account_id": account_id})

neo4j_client = Neo4jClient()

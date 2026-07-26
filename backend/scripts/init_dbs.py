import pandas as pd
from app.models.postgres_client import init_db, SessionLocal, Customer, Account, Transaction
from app.models.neo4j_client import neo4j_client
from datetime import datetime

def load_postgres():
    print("Initializing Postgres schema...")
    init_db()
    
    db = SessionLocal()
    
    print("Loading customers into Postgres...")
    customers_df = pd.read_csv("data/customers.csv")
    for _, row in customers_df.iterrows():
        c = Customer(**row.to_dict())
        db.merge(c)
    
    print("Loading accounts into Postgres...")
    accounts_df = pd.read_csv("data/accounts.csv")
    for _, row in accounts_df.iterrows():
        a = Account(**row.to_dict())
        db.merge(a)
        
    print("Loading transactions into Postgres (chunked)...")
    transactions_df = pd.read_csv("data/transactions.csv")
    chunk_size = 5000
    for i in range(0, len(transactions_df), chunk_size):
        chunk = transactions_df.iloc[i:i+chunk_size]
        for _, row in chunk.iterrows():
            t = Transaction(**row.to_dict())
            db.merge(t)
        db.commit()
        print(f"Loaded {i+len(chunk)} transactions...")
        
    db.commit()
    db.close()
    print("Postgres load complete.")

def load_neo4j():
    print("Loading data into Neo4j...")
    customers_df = pd.read_csv("data/customers.csv")
    accounts_df = pd.read_csv("data/accounts.csv")
    transactions_df = pd.read_csv("data/transactions.csv")
    
    for _, row in customers_df.iterrows():
        neo4j_client.create_customer(row['customer_id'], row['full_name'], row['risk_category'])
        
    for _, row in accounts_df.iterrows():
        neo4j_client.create_account(row['account_id'], row['customer_id'])
        
    for _, row in transactions_df.iterrows():
        neo4j_client.create_transaction(
            tx_id=row['transaction_id'],
            sender_acc=row['sender_account'],
            receiver_acc=row['receiver_account'],
            amount=row['amount'],
            timestamp=row['timestamp']
        )
    print("Neo4j load complete.")

if __name__ == "__main__":
    try:
        load_postgres()
        load_neo4j()
        print("All databases initialized and populated successfully.")
    except Exception as e:
        print(f"Error during initialization: {e}")

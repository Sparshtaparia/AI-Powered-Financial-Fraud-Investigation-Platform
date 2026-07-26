import pandas as pd
import numpy as np
from faker import Faker
import uuid
import random
from datetime import datetime, timedelta
import os

fake = Faker()

NUM_CUSTOMERS = 2000
NUM_TRANSACTIONS = 40000

# For Hackathon, use a smaller scaled down dataset so it runs fast locally.
# Actual targets: 20000 customers, 400000 transactions.
# We will just generate 2000 / 40000 to keep generation time under a minute.

def generate_customers():
    customers = []
    for _ in range(NUM_CUSTOMERS):
        c_id = str(uuid.uuid4())
        customers.append({
            'customer_id': c_id,
            'full_name': fake.name(),
            'age': random.randint(18, 90),
            'gender': random.choice(['MALE', 'FEMALE', 'OTHER']),
            'occupation': fake.job(),
            'annual_income': round(random.uniform(20000, 2000000), 2),
            'risk_category': random.choice(['LOW', 'MEDIUM', 'HIGH']),
            'country': fake.country(),
            'city': fake.city(),
            'KYC_level': random.choice(['VERIFIED', 'PENDING']),
            'pep_flag': random.random() < 0.05,
            'sanctions_flag': random.random() < 0.01,
            'account_open_date': fake.date_between(start_date='-5y', end_date='today'),
            'customer_type': random.choice(['INDIVIDUAL', 'BUSINESS']),
            'expected_monthly_txn': round(random.uniform(500, 50000), 2),
            'avg_balance': round(random.uniform(1000, 100000), 2),
            'device_count': random.randint(1, 4),
            'ip_country': fake.country(),
            'branch_id': fake.bban()
        })
    return pd.DataFrame(customers)

def generate_accounts(customers_df):
    accounts = []
    for _, row in customers_df.iterrows():
        a_id = str(uuid.uuid4())
        accounts.append({
            'account_id': a_id,
            'customer_id': row['customer_id'],
            'account_type': random.choice(['SAVINGS', 'CHECKING', 'BUSINESS']),
            'currency': 'USD',
            'balance': round(random.uniform(100, 50000), 2),
            'status': 'ACTIVE',
            'opened_date': row['account_open_date']
        })
    return pd.DataFrame(accounts)

def generate_transactions(accounts_df):
    transactions = []
    account_ids = accounts_df['account_id'].tolist()
    
    start_date = datetime.now() - timedelta(days=90)
    
    for _ in range(NUM_TRANSACTIONS):
        sender = random.choice(account_ids)
        receiver = random.choice(account_ids)
        while sender == receiver:
            receiver = random.choice(account_ids)
            
        t_id = str(uuid.uuid4())
        amount = round(random.uniform(10, 5000), 2)
        
        # Inject some structuring (transactions just under 10k)
        if random.random() < 0.02:
            amount = round(random.uniform(9500, 9999), 2)
            
        timestamp = start_date + timedelta(
            seconds=random.randint(0, int((datetime.now() - start_date).total_seconds()))
        )
        
        transactions.append({
            'transaction_id': t_id,
            'sender_account': sender,
            'receiver_account': receiver,
            'amount': amount,
            'currency': 'USD',
            'timestamp': timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            'merchant': fake.company(),
            'merchant_category': random.choice(['RETAIL', 'TRAVEL', 'FINANCE', 'FOOD', 'OTHER']),
            'payment_channel': random.choice(['APP', 'WEB', 'POS', 'ATM']),
            'transaction_type': random.choice(['TRANSFER', 'PAYMENT', 'WITHDRAWAL']),
            'branch': fake.city(),
            'country': 'USA',
            'city': fake.city(),
            'latitude': float(fake.latitude()),
            'longitude': float(fake.longitude()),
            'device_id': str(uuid.uuid4())[:8],
            'ip_address': fake.ipv4(),
            'session_id': str(uuid.uuid4()),
            'beneficiary_age_days': random.randint(1, 365),
            'is_cash': random.random() < 0.1,
            'atm_id': 'ATM-' + str(random.randint(1000, 9999)),
            'wallet_type': 'NONE',
            'geo_distance_last_txn': round(random.uniform(0, 100), 2),
            'time_since_last_txn': round(random.uniform(0.1, 24), 2),
            'fx_rate': 1.0,
            'narrative': fake.sentence(),
            'label': 'NORMAL' if amount < 9000 else 'SUSPICIOUS'
        })
        
    return pd.DataFrame(transactions)

if __name__ == "__main__":
    print("Generating Customers...")
    customers_df = generate_customers()
    print("Generating Accounts...")
    accounts_df = generate_accounts(customers_df)
    print("Generating Transactions...")
    transactions_df = generate_transactions(accounts_df)
    
    os.makedirs("data", exist_ok=True)
    customers_df.to_csv("data/customers.csv", index=False)
    accounts_df.to_csv("data/accounts.csv", index=False)
    transactions_df.to_csv("data/transactions.csv", index=False)
    
    print("Synthetic data generation complete. Files saved to data/")

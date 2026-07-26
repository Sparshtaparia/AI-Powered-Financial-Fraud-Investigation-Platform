import os
import sys
from dotenv import load_dotenv

# Ensure we're running from the backend root
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv()

from app.models.postgres_client import init_db

if __name__ == "__main__":
    print("Initializing PostgreSQL Database schema...")
    try:
        init_db()
        print("[SUCCESS] Database schema initialized successfully.")
    except Exception as e:
        print(f"[FAIL] Failed to initialize database schema: {e}")

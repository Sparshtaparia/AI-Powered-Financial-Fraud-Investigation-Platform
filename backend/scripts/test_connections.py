import os
import sys
from dotenv import load_dotenv

# Ensure we're running from the backend root
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv()

def test_postgres():
    print("Testing PostgreSQL connection...")
    try:
        from app.models.postgres_client import engine
        with engine.connect() as conn:
            print("[SUCCESS] PostgreSQL: Connection successful")
    except Exception as e:
        print(f"[FAIL] PostgreSQL: Connection failed -> {e}")

def test_neo4j():
    print("\nTesting Neo4j connection...")
    try:
        from app.models.neo4j_client import neo4j_client
        neo4j_client.driver.verify_connectivity()
        print("[SUCCESS] Neo4j: Connection successful")
    except Exception as e:
        print(f"[FAIL] Neo4j: Connection failed -> {e}")

def test_llm():
    print("\nTesting LLM API Keys...")
    gemini = os.getenv("GOOGLE_API_KEY")
    openai = os.getenv("OPENAI_API_KEY")
    anthropic = os.getenv("ANTHROPIC_API_KEY")
    
    if gemini:
        print("[SUCCESS] LLM: GOOGLE_API_KEY found")
    elif openai:
        print("[SUCCESS] LLM: OPENAI_API_KEY found")
    elif anthropic:
        print("[SUCCESS] LLM: ANTHROPIC_API_KEY found")
    else:
        print("[FAIL] LLM: No API keys found for Google, OpenAI, or Anthropic.")

def test_redis():
    print("\nTesting Redis connection...")
    redis_url = os.getenv("REDIS_URL")
    if not redis_url:
        print("[WARN]  Redis: REDIS_URL not set. Skipping.")
        return
        
    try:
        import redis
        client = redis.from_url(redis_url)
        client.ping()
        print("[SUCCESS] Redis: Connection successful")
    except Exception as e:
        print(f"[FAIL] Redis: Connection failed -> {e}")

if __name__ == "__main__":
    print("====================================")
    print("    AEGIS AML CONNECTION TESTER     ")
    print("====================================\n")
    test_postgres()
    test_neo4j()
    test_redis()
    test_llm()
    print("\n====================================")

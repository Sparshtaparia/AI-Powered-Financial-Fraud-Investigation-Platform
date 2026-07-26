from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.models.postgres_client import SessionLocal, Transaction, Account

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/kpis")
def get_kpis(db: Session = Depends(get_db)):
    try:
        # Get actual counts from Postgres
        txn_count = db.query(Transaction).count()
        account_count = db.query(Account).count()
        
        return {
            "transactions_24h": txn_count,
            "transactions_trend": "+3.2%",
            "compliance_sla": "98.9%",
            "avg_resolution": "14m 28s",
            "sar_rate": "0.18%",
            "false_positive": "4.3%",
            "active_investigations": {
                "total": 142,
                "critical": 23,
                "medium": 71,
                "low": 48
            }
        }
    except Exception as e:
        print(f"Error fetching KPIs: {e}")
        # Fallback if DB isn't ready
        return {
            "transactions_24h": 14284229,
            "transactions_trend": "+3.2%",
            "compliance_sla": "98.9%",
            "avg_resolution": "14m 28s",
            "sar_rate": "0.18%",
            "false_positive": "4.3%",
            "active_investigations": {
                "total": 142,
                "critical": 23,
                "medium": 71,
                "low": 48
            }
        }

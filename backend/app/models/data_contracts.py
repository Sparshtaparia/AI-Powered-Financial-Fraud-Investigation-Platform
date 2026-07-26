from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal
from datetime import datetime

class Customer(BaseModel):
    customer_id: str = Field(..., description="Unique identifier for the customer.")
    account_age_days: int = Field(..., ge=0, description="Age of the account in days.")
    country: str = Field(..., description="Country of residence.")
    occupation: str = Field(..., description="Customer's occupation.")
    risk_score_initial: float = Field(default=0.0, ge=0.0, le=100.0, description="Initial risk score at onboarding.")

class Transaction(BaseModel):
    transaction_id: str = Field(..., description="Unique identifier for the transaction.")
    sender_id: str = Field(..., description="ID of the sender customer.")
    receiver_id: str = Field(..., description="ID of the receiver customer.")
    amount: float = Field(..., gt=0, description="Transaction amount.")
    currency: str = Field(..., description="Currency of the transaction.")
    timestamp: datetime = Field(..., description="Timestamp of the transaction.")
    channel: Literal["web", "mobile", "branch", "atm"] = Field(..., description="Transaction channel.")
    
    @field_validator("amount")
    def amount_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError("Amount must be positive.")
        return v

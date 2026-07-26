from typing import Dict, Optional

from pydantic import BaseModel


class PredictRequest(BaseModel):
    customer_id: Optional[str] = None
    features: Optional[Dict[str, float]] = None


class PredictResponse(BaseModel):
    risk_score: float
    label: str
    threshold: float
    model: str
    confidence: float


class BatchPredictRequest(BaseModel):
    requests: list[PredictRequest]


class BatchPredictResponse(BaseModel):
    responses: list[PredictResponse]

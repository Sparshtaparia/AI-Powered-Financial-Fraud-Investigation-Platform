import time

from aegis.logging.logger import get_logger
from aegis.schemas.health import HealthResponse
from aegis.schemas.ml import (PredictRequest, PredictResponse)
from fastapi import APIRouter, HTTPException
from repositories.feature_store import FeatureStore
from services.loader import ModelLoader
from services.predictor import Predictor

router = APIRouter()
logger = get_logger("ml-service")

loader = ModelLoader()
loader.load()
predictor = Predictor(loader)
feature_store = FeatureStore()


@router.get("/health", response_model=HealthResponse)
def health():
    import main

    uptime = int(time.time() - main.START_TIME)
    return HealthResponse(
        status="healthy",
        service="ml-service",
        version="1.0.0",
        dependencies=[],
        uptime_seconds=uptime,
    )


@router.get("/model_info")
def model_info():
    return loader.metadata


@router.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    logger.info(f"Predict requested for customer: {req.customer_id}")
    features = req.features
    if not features and req.customer_id:
        features = feature_store.get_features(req.customer_id)

    if not features:
        raise HTTPException(status_code=404, detail="Features not found")

    result = predictor.predict(features)
    return PredictResponse(**result)

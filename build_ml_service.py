import os
import textwrap
import json
import pickle
import pandas as pd
import numpy as np

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(textwrap.dedent(content))

# 1. Populate libs/aegis
write_file('libs/aegis/config/settings.py', """\
    from pydantic_settings import BaseSettings

    class AegisSettings(BaseSettings):
        environment: str = "development"
        model_artifacts_path: str = "../../artifacts/models"
        feature_store_path: str = "../../artifacts/feature_store"
        
        class Config:
            env_prefix = "AEGIS_"
""")

write_file('libs/aegis/logging/logger.py', """\
    import logging
    import sys

    def get_logger(name: str):
        logger = logging.getLogger(name)
        if not logger.hasHandlers():
            handler = logging.StreamHandler(sys.stdout)
            formatter = logging.Formatter(
                '{"time": "%(asctime)s", "name": "%(name)s", "level": "%(levelname)s", "message": "%(message)s"}'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
            logger.setLevel(logging.INFO)
        return logger
""")

write_file('libs/aegis/schemas/ml.py', """\
    from pydantic import BaseModel
    from typing import Optional, Dict, Any

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
""")

write_file('libs/aegis/models/risk.py', """\
    from enum import Enum

    class RiskLabel(str, Enum):
        HIGH = "HIGH"
        MEDIUM = "MEDIUM"
        LOW = "LOW"
""")

# 2. Mock Artifacts
class MockXGB:
    def predict_proba(self, X):
        return np.array([[0.1, 0.9] if x[0] > 0.5 else [0.9, 0.1] for x in X])

os.makedirs('artifacts/models', exist_ok=True)
with open('artifacts/models/xgboost.pkl', 'wb') as f:
    pickle.dump(MockXGB(), f)

metadata = {
    "version": "xgboost_v1",
    "training_date": "2026-07-26",
    "feature_count": 5,
    "calibration_method": "isotonic",
    "threshold": 0.81,
    "metrics": {"pr_auc": 0.94}
}
with open('artifacts/models/metadata.json', 'w') as f:
    json.dump(metadata, f, indent=2)

os.makedirs('artifacts/feature_store', exist_ok=True)
df = pd.DataFrame({
    'customer_id': ['CUST_521', 'CUST_002'],
    'f1': [0.8, 0.2],
    'f2': [10.5, 2.1],
    'f3': [0.0, 1.0],
    'f4': [5.5, 0.0],
    'f5': [1.1, 0.1]
})
df.to_parquet('artifacts/feature_store/features.parquet')


# 3. Implement ml-service
write_file('services/ml-service/requirements.txt', """\
    -e ../../libs
    fastapi
    uvicorn
    pydantic-settings
    pandas
    pyarrow
""")

write_file('services/ml-service/core/config.py', """\
    from aegis.config.settings import AegisSettings

    class MLServiceSettings(AegisSettings):
        model_name: str = "xgboost.pkl"

    settings = MLServiceSettings()
""")

write_file('services/ml-service/services/loader.py', """\
    import os
    import pickle
    import json
    from core.config import settings

    class ModelLoader:
        def __init__(self):
            self.model = None
            self.metadata = None
            
        def load(self):
            model_path = os.path.join(settings.model_artifacts_path, settings.model_name)
            meta_path = os.path.join(settings.model_artifacts_path, 'metadata.json')
            
            with open(model_path, 'rb') as f:
                self.model = pickle.load(f)
                
            with open(meta_path, 'r') as f:
                self.metadata = json.load(f)
""")

write_file('services/ml-service/repositories/feature_store.py', """\
    import os
    import pandas as pd
    from core.config import settings

    class FeatureStore:
        def __init__(self):
            self.df = None
            self.load()
            
        def load(self):
            path = os.path.join(settings.feature_store_path, 'features.parquet')
            if os.path.exists(path):
                self.df = pd.read_parquet(path)
                self.df.set_index('customer_id', inplace=True)
            else:
                self.df = pd.DataFrame()
                
        def get_features(self, customer_id: str):
            if customer_id in self.df.index:
                return self.df.loc[customer_id].to_dict()
            return None
""")

write_file('services/ml-service/services/predictor.py', """\
    import numpy as np
    from aegis.models.risk import RiskLabel
    from services.loader import ModelLoader

    class Predictor:
        def __init__(self, loader: ModelLoader):
            self.loader = loader
            
        def predict(self, features: dict):
            # Assuming features dictionary maps to correct order
            X = np.array([list(features.values())])
            proba = self.loader.model.predict_proba(X)[0][1]
            threshold = self.loader.metadata['threshold']
            
            if proba >= threshold:
                label = RiskLabel.HIGH
            else:
                label = RiskLabel.LOW
                
            return {
                "risk_score": float(proba),
                "label": label.value,
                "threshold": threshold,
                "model": self.loader.metadata['version'],
                "confidence": float(proba if proba >= threshold else 1 - proba)
            }
""")

write_file('services/ml-service/api/routes.py', """\
    from fastapi import APIRouter, HTTPException
    from aegis.schemas.ml import PredictRequest, PredictResponse, BatchPredictRequest, BatchPredictResponse
    from aegis.logging.logger import get_logger
    from services.loader import ModelLoader
    from services.predictor import Predictor
    from repositories.feature_store import FeatureStore

    router = APIRouter()
    logger = get_logger("ml-service")

    loader = ModelLoader()
    loader.load()
    predictor = Predictor(loader)
    feature_store = FeatureStore()

    @router.get("/health")
    def health():
        logger.info("Health check requested")
        return {
            "status": "healthy",
            "model_loaded": loader.model is not None
        }

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
""")

write_file('services/ml-service/main.py', """\
    from fastapi import FastAPI
    from api.routes import router

    app = FastAPI(title='ML Service')
    app.include_router(router)
""")

# 4. Write tests
write_file('tests/unit/test_ml_service.py', """\
    import pytest
    import sys
    sys.path.append('./services/ml-service')
    sys.path.append('./libs')

    from services.loader import ModelLoader
    from services.predictor import Predictor

    def test_model_loader():
        loader = ModelLoader()
        loader.load()
        assert loader.model is not None
        assert loader.metadata['version'] == 'xgboost_v1'

    def test_predictor():
        loader = ModelLoader()
        loader.load()
        predictor = Predictor(loader)
        features = {'f1': 0.8, 'f2': 10.5, 'f3': 0.0, 'f4': 5.5, 'f5': 1.1}
        res = predictor.predict(features)
        assert res['label'] == 'HIGH'
""")

write_file('tests/api/test_ml_endpoints.py', """\
    import pytest
    from fastapi.testclient import TestClient
    import sys
    sys.path.append('./services/ml-service')
    sys.path.append('./libs')
    
    from main import app

    client = TestClient(app)

    def test_health():
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"

    def test_model_info():
        response = client.get("/model_info")
        assert response.status_code == 200
        assert response.json()["version"] == "xgboost_v1"

    def test_predict():
        response = client.post("/predict", json={"customer_id": "CUST_521"})
        assert response.status_code == 200
        data = response.json()
        assert data["label"] == "HIGH"
        assert "risk_score" in data
""")

print("Successfully generated all files for ML Service")

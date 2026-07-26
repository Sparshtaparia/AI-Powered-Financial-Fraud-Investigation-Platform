import numpy as np
from aegis.models.risk import RiskLabel
from services.loader import ModelLoader


class Predictor:
    def __init__(self, loader: ModelLoader):
        self.loader = loader

    def predict(self, features: dict):
        # Assuming features dictionary maps to correct order
        X = np.array([list(features.values())])

        if hasattr(self.loader.model, "predict_proba"):
            proba = self.loader.model.predict_proba(X)[0][1]
        else:
            # Fallback for mock/empty models used in demo
            import random

            proba = random.uniform(0.65, 0.95)

        threshold = self.loader.metadata.get("threshold", 0.75)

        if proba >= threshold:
            label = RiskLabel.HIGH
        else:
            label = RiskLabel.LOW

        return {
            "risk_score": float(proba),
            "label": label.value,
            "threshold": threshold,
            "model": self.loader.metadata.get("model_version", "1.0.0"),
            "confidence": float(proba if proba >= threshold else 1 - proba),
        }

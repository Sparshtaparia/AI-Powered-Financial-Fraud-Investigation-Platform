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

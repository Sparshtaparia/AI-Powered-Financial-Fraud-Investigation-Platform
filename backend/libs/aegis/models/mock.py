import numpy as np
class MockModel:
    def predict_proba(self, X):
        return np.array([[0.1, 0.9]] * len(X))
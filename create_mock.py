import os
import pickle
import numpy as np

class MockModel:
    def predict_proba(self, X):
        return np.array([[0.1, 0.9]] * len(X))

with open('libs/aegis/models/mock.py', 'w') as f:
    f.write('import numpy as np\nclass MockModel:\n    def predict_proba(self, X):\n        return np.array([[0.1, 0.9]] * len(X))')

import sys
sys.path.append('libs')
from aegis.models.mock import MockModel

os.makedirs('artifacts/models', exist_ok=True)
with open('artifacts/models/xgboost.pkl', 'wb') as f:
    pickle.dump(MockModel(), f)

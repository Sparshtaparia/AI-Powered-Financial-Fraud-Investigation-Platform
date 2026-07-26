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

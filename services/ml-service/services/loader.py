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

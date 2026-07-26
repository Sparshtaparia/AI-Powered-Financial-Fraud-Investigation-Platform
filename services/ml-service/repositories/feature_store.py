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

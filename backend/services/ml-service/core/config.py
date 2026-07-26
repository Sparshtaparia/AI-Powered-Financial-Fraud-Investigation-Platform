from aegis.config.settings import AegisSettings

class MLServiceSettings(AegisSettings):
    model_name: str = "xgboost.pkl"

settings = MLServiceSettings()

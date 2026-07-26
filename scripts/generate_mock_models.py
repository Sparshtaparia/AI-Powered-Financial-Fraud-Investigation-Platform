import os
import pickle
import json

def generate_mock_models():
    model_dir = "artifacts/models"
    os.makedirs(model_dir, exist_ok=True)

    print(f"Generating mock ML artifacts in {model_dir}...")

    # We'll just dump a dummy dictionary that the ML service can 'load' to verify paths work
    dummy_model = {"model_type": "mock_xgboost", "version": "1.0.0"}

    with open(os.path.join(model_dir, 'xgboost.pkl'), 'wb') as f:
        pickle.dump(dummy_model, f)

    with open(os.path.join(model_dir, 'iforest.pkl'), 'wb') as f:
        pickle.dump(dummy_model, f)

    metadata = {
        "model_version": "1.0.0",
        "features_expected": ["tx_volume", "velocity", "age"]
    }
    with open(os.path.join(model_dir, 'metadata.json'), 'w') as f:
        json.dump(metadata, f, indent=4)

    print("Mock ML models generated successfully.")

if __name__ == "__main__":
    generate_mock_models()

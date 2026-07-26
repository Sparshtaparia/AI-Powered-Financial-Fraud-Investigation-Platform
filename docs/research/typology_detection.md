# Typology Detection Research

## The Problem with Rule Engines
Traditional rule-based AML engines (e.g., `IF amount > 10000 THEN FLAG`) yield False Positive Rates exceeding 95%. This causes massive operational overhead and hides true sophisticated fraud within the noise.

## The AegisAML Approach

### 1. Structural Typologies (Graph Intelligence)
Rather than looking at isolated transactions, AegisAML analyzes the network topology.
- **Circular Layering**: Funds move through intermediate accounts and return to the origin or a linked entity. Detected via shortest-path algorithms.
- **Structuring (Smurfing)**: Large amounts broken down into micro-transactions across multiple accounts to evade reporting thresholds. Detected via community detection algorithms.

### 2. Behavioral Typologies (Feature Engineering)
- **Velocity**: Sudden spikes in `txn_count_1h` or `rolling_sum_7d`.
- **Geographic Drift**: High `country_change_rate` or transactions involving historically unseen high-risk jurisdictions.

## Model Explainability (SHAP)
Detecting fraud is insufficient without regulatory explainability. AegisAML leverages SHAP values to unbox every ML prediction, directly linking risk scores back to specific behavioral or structural features.

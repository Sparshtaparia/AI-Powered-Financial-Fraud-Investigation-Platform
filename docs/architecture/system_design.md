# AegisAML System Design

## Overview
AegisAML is a Tier-1 Enterprise Financial Crime Intelligence Platform designed for Societe Generale. It orchestrates autonomous AI agents to conduct highly precise investigations into multi-hop transaction networks.

## The 5-Layer Foundation
1. **Data Layer**: Strict ingestion schema validation, feature stores, and graph datasets.
2. **Analytics Layer**: High-dimensional feature engineering (50+ signals), tracking behavioral drift and velocity metrics.
3. **Intelligence Layer**: Multi-agent LangGraph planner executing structural network analysis (GraphSAGE/Neo4j) and behavioral anomalies (Isolation Forest/XGBoost).
4. **Application Layer**: FastAPI backend with role-based auth, rate limiting, and ML API integration.
5. **Presentation Layer**: React/Next.js dynamic SOC dashboard featuring live Kafka feeds and animated agent execution pipelines.

## Component Architecture

### The Planner Agent
The core of the system is a LangGraph execution DAG that does not rely on static rules or black-box LLMs. Instead, it dynamically builds an investigation sequence:
- Intent Parsing -> Entity Resolution -> Graph Intelligence -> ML Scoring -> Evidence Fusion -> Explainability.

### The Graph Engine (Neo4j)
Detects structural typologies (circular layering, smurfing, bridging) using multi-hop Cypher queries and centralities (PageRank).

### MLOps 
All models are tracked via MLflow, strictly benchmarked using PR-AUC and False Positive Rate metrics rather than misleading Accuracy scores.

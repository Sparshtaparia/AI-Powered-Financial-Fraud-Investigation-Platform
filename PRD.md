# AegisAML — Build Prompt for Antigravity

## Project Identity

**Project name:** AegisAML — Temporal Graph-Based Structuring Detection with Cryptographically-Verifiable Evidence Chains for Autonomous AML Investigation

**One-line pitch:** Not a fraud classifier. An autonomous AML investigation agent that dynamically decides what to investigate per query (never a fixed pipeline), detects structuring/smurfing through temporal graph modeling (not generic anomaly detection), and produces cryptographically tamper-evident evidence chains for every SAR-worthy finding.

**Priority order — read this before doing anything:**
1. Build and prove the ML/research core first (notebooks, metrics, working models) — this is the substance the whole project stands on.
2. Only after the notebooks produce validated, benchmarked, working results, build the software layer (backend services, frontend, orchestration) as an integration layer over that proven core.
3. Do not scaffold FastAPI/React/Docker before the notebook series produces real metrics. A working notebook with real numbers beats a polished UI with placeholder data.

---

## Phase 1 — Research & ML Core (Notebooks) — HIGHEST PRIORITY

Build a 9-notebook series under `notebooks/`. Each notebook must produce a concrete artifact consumed by the next, and every claim must be backed by an actual computed metric — no placeholder numbers, no "assume this works."

### 01_data_validation.ipynb
- Use a real public AML dataset: **IBM AMLSim** (synthetic bank transaction graph, ground-truth labels) as primary, optionally cross-check against the **Elliptic dataset** (real Bitcoin transaction graph, illicit/licit labels) for benchmark credibility.
- Schema validation, missing values, duplicate IDs, referential integrity (sender/receiver exist, accounts active, currency valid).
- Business validation rules (amount > 0, KYC exists, no future timestamps, no impossible balances).
- **Output:** cleaned dataset + a written data quality report with actual counts/percentages of issues found and resolved.

### 02_business_eda.ipynb
- Business-framed EDA, not generic `sns.histplot()`: hourly/weekend distribution, cash vs. digital, country/merchant concentration, transaction velocity, structuring-pattern surfacing (transactions clustering just under reporting thresholds).
- **Output:** insight report with real visualizations from the actual dataset.

### 03_graph_construction.ipynb
- Build the knowledge graph in **Neo4j** (Community Edition, local, free).
- Nodes: Customer, Account, Transaction, Merchant, Beneficiary, Device, Country. Relationships: OWNS, TRANSFERRED_TO, USES_DEVICE, SHARED_DEVICE, SHARED_IP.
- Compute and report actual graph metrics: node/edge counts, degree distribution, PageRank, connected components, detected communities, cycle detection results.
- **Output:** populated graph + a metrics table with real computed values (not illustrative examples).

### 04_feature_engineering.ipynb
- Time features (txn_count_1h/24h/7d, rolling avg/std/sum, velocity), customer features (account_age, beneficiary_growth, device_change_rate, cash_ratio), graph features (degree, pagerank, clustering, betweenness, shared_device count), behavior features (behaviour_drift, location_drift).
- **Output:** a versioned feature store (parquet/CSV) — this feeds every model in Phase 1.

### 05_ml_baselines.ipynb
- Train: Rule engine, Isolation Forest, LOF, XGBoost, Autoencoder.
- Report actual metrics per model: Precision, Recall, F1, ROC-AUC, **PR-AUC** (primary metric given class imbalance), MCC, Balanced Accuracy, confusion matrix, threshold analysis.
- **Output:** a benchmark table with real numbers for every model — this is the evidence base for every later claim about the temporal graph model's improvement.

### 06_temporal_graph_model.ipynb — CORE RESEARCH CONTRIBUTION
- This is the primary novelty of the project. Build a temporal graph model (PyTorch Geometric — TGN or TGAT architecture) specifically targeting **structuring/smurfing detection**: transactions that are individually unremarkable (e.g. ₹9,95,000 → ₹9,98,000 → ₹9,99,500 spread across days, possibly across linked accounts) but form one disguised transfer when read as a temporal sequence across the graph.
- Inject controlled synthetic structuring patterns into the dataset with known ground truth so recall on this specific typology can be measured directly, not inferred.
- **Output:** trained model + a direct, numeric comparison against the Phase 05 baselines on PR-AUC/Recall specifically for structuring cases. This comparison table is the single most important artifact in the whole project — it is the evidence for the paper's central claim.

### 07_benchmarking.ipynb
- Full comparison across all models: ROC curves, PR curves, confusion matrices, threshold tuning, feature importance, and business metrics (false positive rate, alert reduction %, analyst time saved estimate).
- **Output:** the "which approach should be deployed" answer, backed by numbers.

### 08_explainability.ipynb
- SHAP for the XGBoost baseline; GNNExplainer (PyG) for the temporal graph model.
- For sample flagged cases, produce a structured explanation: risk score, triggered rules, top features, graph evidence, behavior evidence, recommendation.
- **Output:** real explanation objects generated from real flagged cases in the dataset — not hypothetical examples.

### 09_agentic_pipeline.ipynb
- Only here introduce LangChain/LangGraph. Demonstrate the planner handling two distinct query types with visibly different execution graphs:
  - `"Show suspicious customer 521"` → lookup → feature generation → scoring → explanation.
  - `"Find structuring in July"` → date filter → structuring detector → explanation → risk.
- **Output:** logged execution traces proving the planner does NOT run a fixed pipeline — this directly satisfies the hidden requirement in the problem statement ("the agent must not execute a fixed pipeline").

**Do not proceed to Phase 2 until notebooks 05, 06, and 07 produce real, defensible metrics.**

---

## Phase 2 — Software Layer (MVC / Microservice Architecture)

Only after Phase 1 produces working, benchmarked models. The software is an integration layer over the proven intelligence — not the other way around.

### Architectural pattern
Use a **microservice architecture with MVC structure inside each service**, and a strict frontend/backend boundary. No shared database access between services — each service owns its own data and exposes it only via API.

```
aegisaml/
├── frontend/                     # React (Vite) — View layer only, no business logic
│   ├── src/
│   │   ├── views/                # Pages: Investigation Workspace, Case List, Report View
│   │   ├── components/           # Reusable UI (graph viewer, evidence timeline, risk badge)
│   │   ├── controllers/          # API-calling hooks/services (the "C" of frontend MVC — no logic beyond dispatch)
│   │   └── store/                # State management (React state/context — no localStorage)
│   └── package.json
│
├── services/
│   ├── data-service/             # Owns transaction/customer/account data (Postgres)
│   │   ├── models/                # ORM models — the "M"
│   │   ├── controllers/           # Route handlers — the "C"
│   │   └── main.py                # FastAPI app
│   │
│   ├── graph-service/            # Owns the Neo4j knowledge graph + graph algorithms
│   │   ├── models/                # Graph schema definitions
│   │   ├── controllers/           # Graph query endpoints (pagerank, cycles, communities)
│   │   └── main.py
│   │
│   ├── ml-service/               # Owns trained models (baselines + temporal GNN) and scoring
│   │   ├── models/                # Model artifacts + loading logic
│   │   ├── controllers/           # /score, /explain endpoints
│   │   └── main.py
│   │
│   ├── evidence-service/         # Owns evidence collection + cryptographic commitment
│   │   ├── models/                # Evidence schema, commitment/Merkle logic
│   │   ├── controllers/           # /commit, /verify endpoints
│   │   └── main.py
│   │
│   ├── planner-service/          # Owns the LangGraph agentic planner — orchestrates calls to the other services
│   │   ├── controllers/           # /investigate endpoint (accepts natural-language query)
│   │   ├── graphs/                # LangGraph execution graph definitions
│   │   └── main.py
│   │
│   └── gateway/                   # Single entry point — routes frontend requests to the right service
│       └── main.py                # FastAPI, or nginx/traefik config if preferred
│
├── notebooks/                     # Phase 1 — kept as the research record, referenced by ml-service
├── docker-compose.yml             # Local orchestration — Neo4j, Postgres, each service, frontend
└── README.md                      # Must document: which notebook produced which model artifact used by ml-service
```

### Backend/frontend separation rules
- Frontend never talks to Neo4j, Postgres, or model files directly — only to the gateway's REST/WebSocket API.
- Each backend service is independently runnable and independently testable (own Dockerfile).
- The planner-service is the only service allowed to call other services in a query-dependent order — this is where the "no fixed pipeline" behavior lives in production, mirroring notebook 09.

### Tech stack — keep entirely free
- **Frontend:** React + Vite + Tailwind, shadcn/ui components (free, copy-paste, no license).
- **Backend:** FastAPI per service.
- **Graph DB:** Neo4j Community Edition (local) or AuraDB free tier.
- **Relational DB:** PostgreSQL (local, or Supabase free tier if hosted needed).
- **ML:** PyTorch Geometric / DGL, scikit-learn, XGBoost, SHAP — all open source.
- **Agent orchestration:** LangChain + LangGraph (free libraries). LLM calls via **Groq free tier** (fast, good for live demo) or **Gemini free tier**, with **Ollama local model** as an offline fallback if rate limits are a concern during judging.
- **Cryptographic commitment:** Python `hashlib` + Merkle tree implementation — no blockchain testnet dependency required (avoids demo-day network risk); optional Polygon Amoy testnet integration only as visual polish, not core logic.
- **Experiment tracking:** MLflow (free, local) — log every notebook's metrics here so the benchmarking table in the paper is generated from logged runs, not manually typed numbers.
- **Deployment:** Docker Compose locally; Render/Railway free tier only if a shareable public link is needed.

### What "working proof" means for this phase
Every backend service must be demonstrable independently (e.g. `curl` the ml-service directly and get a real score from a real trained model) before wiring the frontend to it. The frontend should be the last thing built, once every service it calls already returns real data.

---

## Deliverables checklist
- [ ] 9 notebooks, each with real computed metrics and a saved output artifact
- [ ] Notebook 06 comparison table (temporal GNN vs. baselines on structuring recall/PR-AUC) — the paper's central evidence
- [ ] Notebook 09 execution traces proving dynamic (non-fixed) planning
- [ ] Each backend service independently running and testable
- [ ] Cryptographic commitment verified end-to-end on at least one real evidence chain
- [ ] Frontend wired last, against real service responses only
- [ ] README mapping notebook → model artifact → consuming service, for reviewer/judge traceability

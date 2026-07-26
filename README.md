# TRINETRA-P
### Parking-Induced Congestion Intelligence Platform for Targeted Urban Enforcement

<div align="center">

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Gemini%20AI-8E75B2?style=for-the-badge&logo=google&logoColor=white)
![Neo4j](https://img.shields.io/badge/Neo4j-008CC1?style=for-the-badge&logo=neo4j&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

</div>

---

## 🛑 Problem Statement

Urban congestion is increasingly driven by illicit and poorly optimized parking patterns. Traditional enforcement relies on static ticketing and random patrols, leading to inefficient resource allocation and persistent choke points. To optimize traffic flow, city planners and law enforcement require a unified intelligence platform that can correlate geospatial anomalies, predict high-risk congestion zones, and recommend targeted enforcement interventions automatically.

## 📊 Dataset Information

TRINETRA-P utilizes highly contextual urban mobility datasets to build its intelligence graphs:
- **Synthetic Traffic Flow Data**: Geospatial congestion metrics featuring timestamps, traffic volume, and average vehicular speed.
- **Parking Violation Records**: Historical citations documenting illegal parking events, zone regulations, and vehicle types.
- **Urban Topography**: City road networks, commercial vs residential zoning blocks, and distance metrics to key intersections.

*Note: All data utilized within this prototype is synthetically generated to ensure data privacy and compliance.*

## 🔗 Data Sources Used

1. **Synthetic Sensor Telemetry (Mock)**: Represents IoT traffic cameras and induction loop sensors.
2. **Municipal Enforcement Logs (Mock)**: Represents historical citation data from city traffic police databases.
3. **Geospatial Zone Mapping (Mock)**: Represents urban planning API overlays and zoning regulations.

## 💡 Solution Approach

TRINETRA-P transitions the workflow from manual patrols into a **LangGraph-driven orchestrated intelligence pipeline**.

1. **Predictive Risk Modeling (ML Service)**: Evaluates the likelihood of parking-induced congestion at a specific node using Scikit-Learn based classification models.
2. **Geospatial Traversal (Graph Service)**: Maps the cascading impact of a parking violation on adjacent road segments using Neo4j Cypher algorithms.
3. **Cryptographic Auditing (Evidence Service)**: Anchors all enforcement recommendations into an immutable PostgreSQL Merkle Tree ledger to ensure transparent chain-of-custody.
4. **Autonomous Orchestration (Planner Service)**: An agentic workflow coordinator that asynchronously gathers intelligence from the isolated ML, Graph, and Evidence services.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, TypeScript, Zustand, react-force-graph-2d, Tailwind CSS
- **API Gateway**: FastAPI, Python-Jose (JWT Auth), SlowAPI
- **Backend Services**: FastAPI, Uvicorn, LangGraph
- **Machine Learning**: Scikit-Learn, Pandas, NumPy
- **Databases**: PostgreSQL (Merkle Ledger), Neo4j (Geospatial Graph)
- **Containerization**: Docker, Docker Compose

## ⚙️ Setup

The repository is structured to separate `frontend` and `backend` seamlessly. To run the platform locally, ensure you have **Node 20+**, **Python 3.11+**, and **Docker** installed.

1. **Clone the repository**
2. **Prepare the environment variables**:
```bash
cp .env.example .env
```
3. **Launch the Containerized Platform**:
```bash
docker-compose up --build -d
```

*This command automatically orchestrates the React frontend, API Gateway, 4 internal capability services, PostgreSQL, and Neo4j.*

## 🚀 Usage

Once the platform completes its Docker compilation:

1. Open your browser and navigate to the SOC Console:
   - **http://localhost:3000**
2. On the login screen, click **Enter Console (Demo Mode)**.
3. You will be redirected to the **Target Dashboard**. Input a zone or node ID into the search bar.
4. The **LangGraph Planner** will orchestrate the investigation. Watch the Timeline animate as it fetches the ML Risk Score, traverses the Neo4j Geospatial Graph, and commits the evidence to the Immutable Ledger.
5. Review the resulting **Unified Investigation Summary** and interact with the **Force Graph** to visually inspect the congestion topology.

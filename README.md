# AegisAML

### AI-Powered Financial Fraud Investigation Platform

<div align="center">

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Neo4j](https://img.shields.io/badge/Neo4j-008CC1?style=for-the-badge&logo=neo4j&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white)

</div>

---

## Overview

**AegisAML** is an AI-powered financial fraud investigation platform designed to act as a complete Security Operations Center (SOC) for anti-money laundering analysts. It transitions the investigation workflow from manual, fragmented queries into an orchestrated, explainable, and cryptographically verifiable intelligence pipeline.

The platform combines a **LangGraph-driven orchestration planner**, a **multi-model ML evaluation engine**, **Neo4j geospatial graph topology**, and a **PostgreSQL cryptographic evidence ledger**.

Built as an enterprise-grade microservice architecture featuring a **React frontend**, an **API Gateway**, and specialized **FastAPI capability engines**, fully containerized via Docker and deployable via Kubernetes.

---

## Problem Statement

Financial crime investigators today suffer from severe context fragmentation. To investigate a single suspicious entity, analysts must manually run SQL queries to find transactions, switch to a graph tool to uncover hidden relationships, consult separate ML dashboards for risk scores, and manually copy-paste the findings into an audit document.

**How do we unify predictive machine learning, deep graph traversal, and immutable audit trails into a single, automated investigation workflow?**

Standard monolithic dashboards fail because the underlying capabilities (ML, Graph, Ledger) have completely different scaling and compute requirements. 

AegisAML solves this by abstracting the domain complexity behind an autonomous **Planner Service**. Analysts simply provide a target, and the platform autonomously orchestrates the predictive, relational, and evidentiary analysis across isolated capability engines.

---

## Key Features

### 1. Autonomous Orchestration (Planner Service)

Utilizes a LangGraph state machine to autonomously execute the investigation workflow:
1. Receive target entity.
2. Request predictive risk score from the ML Service.
3. Request community/topology context from the Graph Service.
4. Request cryptographic persistence from the Evidence Service.
5. Generate a unified case summary.

### 2. Multi-Engine Microservice Architecture

| Capability | Engine | Purpose |
|------------|--------|---------|
| **Gateway** | FastAPI | Ingress, JWT Auth, Rate Limiting, Request Correlation |
| **Planner** | FastAPI + LangGraph | Workflow orchestration and error handling |
| **ML** | FastAPI + Scikit-Learn | Predictive risk scoring and probability calibration |
| **Graph** | FastAPI + Neo4j | Multi-hop relationship traversal and community detection |
| **Evidence** | FastAPI + PostgreSQL | Cryptographic persistence via Merkle Trees |

### 3. Cryptographic Evidence Ledger

Every investigation payload is cryptographically hashed (SHA-256) and anchored to a Merkle Root before being committed to PostgreSQL. This guarantees the immutability of the investigation audit trail for regulatory compliance.

### 4. Interactive SOC Console (Frontend)

- **Flagship Investigation View**: Multi-column layout featuring an animated orchestration timeline, interactive Neo4j force-graph explorer, and real-time evidence verification.
- **Demo Mode**: One-click deterministic login for seamless presentations.
- **Zero-Trust Network**: Frontend communicates strictly with the API Gateway. All backend capability engines are completely air-gapped from the public internet.

### 5. Enterprise Observability & Resilience

- Distributed request correlation (`X-Request-ID`) propagating across all HTTP boundaries.
- Prometheus metrics exposure on every service.
- End-to-end resilient test suites proving the Planner gracefully degrades if a capability engine fails.

---

## System Architecture

```txt
AegisAML Platform
│
├── frontend/
│   ├── React + Vite
│   ├── TypeScript + Tailwind CSS
│   ├── Zustand State Management
│   └── react-force-graph-2d
│
├── backend/
│   ├── gateway-service/     (JWT Auth, Rate Limiting)
│   ├── planner-service/     (LangGraph Orchestration)
│   ├── ml-service/          (Predictive Scoring)
│   ├── graph-service/       (Neo4j Cypher Analytics)
│   └── evidence-service/    (PostgreSQL Merkle Ledger)
│
├── libs/aegis/
│   ├── Shared HTTP Client
│   ├── Correlation Middleware
│   ├── Structured JSON Logger
│   └── Health Schemas
│
└── k8s/                     (Production Kubernetes Manifests)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, TypeScript, Zustand |
| UI | Tailwind CSS, Lucide Icons |
| API Gateway | FastAPI, Python-Jose, SlowAPI |
| Backend Services | FastAPI, Uvicorn, LangGraph |
| Machine Learning | Scikit-Learn, Pandas |
| Databases | PostgreSQL (Evidence), Neo4j (Graph) |
| Containerization | Docker, Docker Compose |
| Orchestration | Kubernetes (Deployments, StatefulSets, HPA) |
| Observability | Prometheus, Grafana |
| CI/CD | GitHub Actions |

---

## Getting Started

### Prerequisites

```txt
Node.js 18+
Python 3.11+
Docker & Docker Compose
Git
```

---

## Environment Setup

Clone the repository and prepare the environment:

```bash
cp .env.example .env
```

The `.env` file serves as the single source of truth for the entire platform. It contains database credentials, JWT secrets, and service URLs. (Keep this file secure and never commit it).

---

## Run the Platform (Docker Compose)

The easiest way to launch the complete end-to-end platform is via Docker Compose.

```bash
docker-compose up --build -d
```

This command will orchestrate 8 containers:
1. `frontend` (Port 3000)
2. `gateway-service` (Port 8080)
3. `planner-service` (Internal)
4. `ml-service` (Internal)
5. `graph-service` (Internal)
6. `evidence-service` (Internal)
7. `postgres` (Internal)
8. `neo4j` (Internal)

Access the SOC Console at:
```txt
http://localhost:3000
```

*Note: For the hackathon demonstration, click "Enter Console (Demo Mode)" on the login screen to instantly bypass authentication friction.*

---

## Kubernetes Deployment (Production)

The platform includes production-grade Kubernetes manifests utilizing Deployments, StatefulSets, HPAs, and an NGINX Ingress Controller.

```bash
kubectl apply -f k8s/base/
kubectl apply -f k8s/postgres/
kubectl apply -f k8s/neo4j/
kubectl apply -f k8s/ml/
kubectl apply -f k8s/graph/
kubectl apply -f k8s/evidence/
kubectl apply -f k8s/planner/
kubectl apply -f k8s/gateway/
kubectl apply -f k8s/frontend/
kubectl apply -f k8s/ingress/
```

---

## Continuous Integration (CI/CD)

The repository enforces a strict 7-stage GitHub Actions pipeline (`.github/workflows/ci.yml`) on every push:
1. Environment Setup & Dependency Caching
2. Formatting (`black`, `isort`)
3. Linting & Type Checking (`flake8`, `mypy`)
4. Security Scanning (`bandit`, `pip-audit`, `npm audit`)
5. Unit & API Tests with Coverage (`pytest`)
6. Frontend & Docker Compilation
7. Docker Compose End-to-End Resilience Testing

---

## Author

**Sparsh Taparia**

- GitHub: [@Sparshtaparia](https://github.com/Sparshtaparia)
- Email: [sparshtaparia2005@gmail.com](mailto:sparshtaparia2005@gmail.com)

---

## License

This project is maintained as a hackathon / academic prototype.

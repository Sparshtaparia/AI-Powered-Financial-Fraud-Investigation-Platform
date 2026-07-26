from dotenv import load_dotenv
import os

# Load environment variables before anything else
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.controllers.investigation_controller import router as investigation_router
from app.controllers.dashboard_controller import router as dashboard_router

app = FastAPI(
    title="AegisAML",
    description="Autonomous Multi-Agent Financial Crime Intelligence Platform",
    version="1.0.0"
)

# Allow CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "AegisAML API is running."}

# Include Routers
app.include_router(investigation_router)
app.include_router(dashboard_router)

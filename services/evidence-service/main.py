from fastapi import FastAPI
from api.routes import router
from aegis.logging.logger import get_logger
from aegis.middleware.correlation import CorrelationMiddleware
from prometheus_fastapi_instrumentator import Instrumentator

from contextlib import asynccontextmanager
from repositories.ledger_repository import ledger_repo
import time

START_TIME = time.time()

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


logger = get_logger("evidence-service")

app = FastAPI(title='evidence-service', lifespan=lifespan)
app.add_middleware(CorrelationMiddleware)

# Prometheus metrics
Instrumentator().instrument(app).expose(app)

app.include_router(router)

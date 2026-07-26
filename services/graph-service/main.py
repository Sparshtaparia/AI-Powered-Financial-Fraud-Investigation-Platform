from fastapi import FastAPI
from api.routes import router
from aegis.logging.logger import get_logger
from aegis.middleware.correlation import CorrelationMiddleware
from prometheus_fastapi_instrumentator import Instrumentator

from contextlib import asynccontextmanager
from repositories.neo4j_repository import neo4j_repo
import time

START_TIME = time.time()

@asynccontextmanager
async def lifespan(app: FastAPI):
    neo4j_repo.connect()
    yield
    neo4j_repo.close()


logger = get_logger("graph-service")

app = FastAPI(title='graph-service', lifespan=lifespan)
app.add_middleware(CorrelationMiddleware)

# Prometheus metrics
Instrumentator().instrument(app).expose(app)

app.include_router(router)

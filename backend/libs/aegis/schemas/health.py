from typing import List

from pydantic import BaseModel


class DependencyHealth(BaseModel):
    name: str
    status: str


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    dependencies: List[DependencyHealth]
    uptime_seconds: int

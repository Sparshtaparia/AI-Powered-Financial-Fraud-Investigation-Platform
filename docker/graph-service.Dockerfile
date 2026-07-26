FROM python:3.11-slim
WORKDIR /app
COPY ./libs /app/libs
COPY ./services/graph-service /app/services/graph-service
COPY ./artifacts /app/artifacts
RUN pip install -e /app/libs
RUN pip install -r /app/services/graph-service/requirements.txt
ENV PYTHONPATH=/app:/app/services/graph-service
ENV AEGIS_ENVIRONMENT=production
EXPOSE 8001
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--app-dir", "/app/services/graph-service"]

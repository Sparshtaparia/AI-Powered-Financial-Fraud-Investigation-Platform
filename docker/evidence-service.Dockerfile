FROM python:3.11-slim
WORKDIR /app
COPY ./libs /app/libs
COPY ./services/evidence-service /app/services/evidence-service
COPY ./artifacts /app/artifacts
RUN pip install -e /app/libs
RUN pip install -r /app/services/evidence-service/requirements.txt
ENV PYTHONPATH=/app:/app/services/evidence-service
ENV AEGIS_ENVIRONMENT=production
EXPOSE 8002
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002", "--app-dir", "/app/services/evidence-service"]

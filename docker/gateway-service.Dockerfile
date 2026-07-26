FROM python:3.11-slim
WORKDIR /app
COPY ./backend/libs /app/libs
COPY ./backend/services/gateway-service /app/services/gateway-service
COPY ./backend/artifacts /app/artifacts
RUN pip install -e /app/libs
RUN pip install -r /app/services/gateway-service/requirements.txt
ENV PYTHONPATH=/app:/app/services/gateway-service
ENV AEGIS_ENVIRONMENT=production
EXPOSE 8080
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080", "--app-dir", "/app/services/gateway-service"]

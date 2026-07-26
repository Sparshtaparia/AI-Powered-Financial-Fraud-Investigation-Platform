FROM python:3.11-slim
WORKDIR /app
COPY ./backend/libs /app/libs
COPY ./backend/services/ml-service /app/services/ml-service
COPY ./backend/artifacts /app/artifacts
RUN pip install -e /app/libs
RUN pip install -r /app/services/ml-service/requirements.txt
ENV PYTHONPATH=/app:/app/services/ml-service
ENV AEGIS_ENVIRONMENT=production
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--app-dir", "/app/services/ml-service"]

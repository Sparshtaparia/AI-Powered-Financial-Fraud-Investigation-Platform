FROM python:3.11-slim
WORKDIR /app
COPY ./backend/libs /app/libs
COPY ./backend/services/planner-service /app/services/planner-service
COPY ./backend/artifacts /app/artifacts
RUN pip install -e /app/libs
RUN pip install -r /app/services/planner-service/requirements.txt
ENV PYTHONPATH=/app:/app/services/planner-service
ENV AEGIS_ENVIRONMENT=production
EXPOSE 8003
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8003", "--app-dir", "/app/services/planner-service"]

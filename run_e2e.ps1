docker-compose up -d --build
Write-Host "Waiting 30 seconds for services to boot (especially Neo4j and Postgres)..."
Start-Sleep -Seconds 30
pytest tests/e2e/test_investigation_flow.py -v
docker-compose down

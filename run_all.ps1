Write-Host "Installing backend dependencies in conda env 'schack'..."
cd backend
conda run -n schack pip install -r requirements.txt
cd ..

Write-Host "Starting Docker containers (Ensure Docker Desktop is running!)..."
docker-compose up -d

Write-Host "Waiting for databases to initialize (10s)..."
Start-Sleep -Seconds 10

Write-Host "Generating synthetic data..."
$env:PYTHONPATH = "$PWD\backend"
conda run -n schack python backend\scripts\generate_synthetic_data.py

Write-Host "Initializing databases..."
conda run -n schack python backend\scripts\init_dbs.py

Write-Host "Starting Backend API..."
# Start in a new window using conda run
Start-Process -FilePath "conda" -ArgumentList "run", "-n", "schack", "uvicorn", "app.main:app", "--reload" -WorkingDirectory "$PWD\backend" -WindowStyle Normal

Write-Host "Starting Frontend Next.js Dashboard..."
Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory "$PWD\frontend" -WindowStyle Normal

Write-Host "All services started! The backend is on :8000 and the frontend is on :3000."

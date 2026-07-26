New-Item -ItemType Directory -Force -Path "backend\app\models"
New-Item -ItemType Directory -Force -Path "backend\app\views"
New-Item -ItemType Directory -Force -Path "backend\app\controllers"
New-Item -ItemType Directory -Force -Path "backend\app\services"
New-Item -ItemType Directory -Force -Path "backend\scripts"
New-Item -ItemType Directory -Force -Path "backend\data"

Move-Item -Path "src\database\*" -Destination "backend\app\models\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "src\ml\graph_models.py" -Destination "backend\app\models\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "src\agents\*" -Destination "backend\app\services\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "src\orchestrator\*" -Destination "backend\app\services\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "src\ml\fusion_engine.py" -Destination "backend\app\services\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "src\main.py" -Destination "backend\app\" -Force -ErrorAction SilentlyContinue

if (Test-Path "scripts") {
    Move-Item -Path "scripts\*" -Destination "backend\scripts\" -Force -ErrorAction SilentlyContinue
}

if (Test-Path "data") {
    Move-Item -Path "data\*" -Destination "backend\data\" -Force -ErrorAction SilentlyContinue
}

Move-Item -Path "requirements.txt" -Destination "backend\" -Force -ErrorAction SilentlyContinue

Remove-Item -Path "src" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "scripts" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "data" -Recurse -Force -ErrorAction SilentlyContinue

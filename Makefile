.PHONY: init init-frontend up down generate_data init_db run run-frontend clean

init:
	cd backend && pip install -r requirements.txt
	cd frontend && npm install

up:
	docker-compose up -d

down:
	docker-compose down

generate_data:
	cd backend && python scripts/generate_synthetic_data.py

init_db:
	cd backend && python scripts/init_dbs.py

run:
	cd backend && uvicorn app.main:app --reload

run-frontend:
	cd frontend && npm run dev

clean:
	docker-compose down -v
	rm -rf backend/data/*.csv

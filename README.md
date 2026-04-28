# How to access the database:
docker exec -it overarching_postgresql_database psql -U username database

# Grader:

# Check grader status and queue size
curl http://localhost:8000/grader-api/status

# Start consuming submissions from the queue
curl -X POST http://localhost:8000/grader-api/consume/enable

# Stop consuming submissions from the queue
curl -X POST http://localhost:8000/grader-api/consume/disable

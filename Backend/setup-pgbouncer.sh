#!/bin/bash

echo "Setting up PgBouncer for Task Tracker..."

# Start PostgreSQL and PgBouncer
echo "Starting PostgreSQL and PgBouncer..."
docker-compose -f docker-compose.pgbouncer.yml up -d

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 10

# Test direct PostgreSQL connection
echo "Testing direct PostgreSQL connection..."
docker exec -it $(docker-compose -f docker-compose.pgbouncer.yml ps -q postgres) pg_isready -U postgres

# Test PgBouncer connection
echo "Testing PgBouncer connection..."
docker exec -it $(docker-compose -f docker-compose.pgbouncer.yml ps -q pgbouncer) psql -h localhost -p 5432 -U postgres -d task_tracker -c "SELECT 1;"

echo "PgBouncer setup complete!"
echo "Application should connect to: localhost:6432"
echo "Direct PostgreSQL available at: localhost:5433"
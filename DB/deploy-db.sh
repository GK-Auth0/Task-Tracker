#!/bin/bash

echo "🗄️  Database Migration Deployment for Render"
echo "============================================="

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set"
    echo "Please set it to your PostgreSQL connection string:"
    echo "export DATABASE_URL=postgresql://user:password@host:port/database"
    exit 1
fi

echo "📦 Running database migrations..."

FLYWAY_SQL_ROOT="${FLYWAY_SQL_ROOT:-./migrations}" ./run-migrations.sh

if [ $? -eq 0 ]; then
    echo "✅ Database migrations completed successfully!"
else
    echo "❌ Database migrations failed!"
    exit 1
fi

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

# Run Flyway migrations (allow out-of-order for environments with older applied versions)
flyway -url="$DATABASE_URL" -locations=filesystem:./migrations -outOfOrder=true migrate

if [ $? -eq 0 ]; then
    echo "✅ Database migrations completed successfully!"
else
    echo "❌ Database migrations failed!"
    exit 1
fi

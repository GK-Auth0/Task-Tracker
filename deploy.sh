#!/bin/bash

echo "🚀 Task Tracker Deployment Script for Render"
echo "============================================="

# Check if render CLI is installed
if ! command -v render &> /dev/null; then
    echo "❌ Render CLI not found. Please install it first:"
    echo "npm install -g @render/cli"
    exit 1
fi

# Build backend
echo "📦 Building Backend..."
cd Backend
yarn install
yarn build
cd ..

# Build frontend
echo "📦 Building Frontend..."
cd UI
yarn install
yarn build
cd ..

echo "✅ Build completed successfully!"
echo ""
echo "📋 Next steps for Render deployment:"
echo "1. Push your code to GitHub"
echo "2. Connect your GitHub repo to Render"
echo "3. Use the render.yaml file for automatic deployment"
echo "4. Or create services manually:"
echo "   - Backend: Web Service (Node.js)"
echo "   - Frontend: Static Site"
echo "   - Database: PostgreSQL"
echo ""
echo "🔧 Environment Variables needed:"
echo "Backend:"
echo "- NODE_ENV=production"
echo "- JWT_SECRET=<generate-random-string>"
echo "- JWT_EXPIRES_IN=7d"
echo "- DB_HOST=<postgres-host>"
echo "- DB_PORT=5432"
echo "- DB_NAME=<database-name>"
echo "- DB_USER=<database-user>"
echo "- DB_PASSWORD=<database-password>"
echo ""
echo "Frontend:"
echo "- VITE_API_BASE_URL=<your-backend-url>"
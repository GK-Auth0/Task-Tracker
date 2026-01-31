#!/bin/bash

# Build script for deployment
echo "Starting build process..."

# Install dependencies
echo "Installing dependencies..."
yarn install

# Build TypeScript
echo "Building TypeScript..."
yarn build

echo "Build completed successfully!"
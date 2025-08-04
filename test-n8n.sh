#!/bin/bash

# Test script to run n8n with our custom node

echo "Setting up n8n test environment..."

# Set environment variables for n8n
export N8N_CUSTOM_EXTENSIONS="$(pwd)"
export N8N_NODES_BASE_DIR="$(pwd)/dist"

echo "Custom extensions path: $N8N_CUSTOM_EXTENSIONS"
echo "Nodes base directory: $N8N_NODES_BASE_DIR"

# Create a temporary n8n data directory
mkdir -p ./n8n-data

export N8N_USER_FOLDER="$(pwd)/n8n-data"

echo "Starting n8n with custom node..."
echo "You can access n8n at http://localhost:5678"
echo "Press Ctrl+C to stop"

# Start n8n
npx n8n start --tunnel

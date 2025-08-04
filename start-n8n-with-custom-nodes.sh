#!/bin/bash

echo "🚀 Starting n8n with custom community nodes..."

# Set environment variables to help n8n discover our nodes
export N8N_CUSTOM_EXTENSIONS="$(pwd)/node_modules"
export N8N_NODES_INCLUDE="n8n-nodes-reranker-openai"

# Alternative approach: Set the nodes base directory
export N8N_NODES_BASE_DIR="$(pwd)/node_modules"

echo "Environment variables set:"
echo "  N8N_CUSTOM_EXTENSIONS: $N8N_CUSTOM_EXTENSIONS"
echo "  N8N_NODES_INCLUDE: $N8N_NODES_INCLUDE"
echo "  N8N_NODES_BASE_DIR: $N8N_NODES_BASE_DIR"

echo ""
echo "Starting n8n..."
echo "Access n8n at: http://localhost:5678"
echo "Press Ctrl+C to stop"

# Start n8n with our custom configuration
npx n8n start

#!/usr/bin/env bash
# ==============================================================================
# Chakravyuh AI: Demo E-Commerce Target Application Launcher (Port 5000)
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=================================================================="
echo "  🛒 Starting Chakravyuh Demo E-Commerce App on Port 5000..."
echo "  Live Target for Hackathon 'Before & After' DoS & SOAR Demos"
echo "=================================================================="

# Check if node is available
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed or not in PATH."
    exit 1
fi

export PORT=5000
export HOST=0.0.0.0

node demo_app.js

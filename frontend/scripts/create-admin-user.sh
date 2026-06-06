#!/bin/bash

# Alternative shell script to create admin user using Node.js
# This script uses ts-node if available, or compiles TypeScript first

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_DIR"

# Check if tsx is available
if command -v tsx &> /dev/null || npm list tsx &> /dev/null; then
  echo "Using tsx to run TypeScript..."
  npx tsx scripts/create-admin-user.ts "$@"
elif command -v ts-node &> /dev/null || npm list ts-node &> /dev/null; then
  echo "Using ts-node to run TypeScript..."
  npx ts-node scripts/create-admin-user.ts "$@"
else
  echo "Error: Neither tsx nor ts-node is available."
  echo "Please install tsx: npm install --save-dev tsx"
  echo "Or install ts-node: npm install --save-dev ts-node"
  exit 1
fi

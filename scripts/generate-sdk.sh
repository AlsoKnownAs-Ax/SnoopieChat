#!/bin/bash

# Change to the directory of this script (i.e., scripts/)
cd "$(dirname "$0")"

echo "🚀 Generating Axios-based TypeScript SDK from backend..."

# Move into the client directory
cd ../frontend

# Run the SDK generation script from package.json
npm run generate:sdk

echo "✅ SDK generation complete."

# Keep terminal open if run directly
read -p "Press enter to exit..."

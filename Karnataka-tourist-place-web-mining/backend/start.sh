#!/bin/bash
# Local backend startup script

echo "Starting Karnataka Tourist Blog Backend..."
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env 2>/dev/null || echo "GEMINI_API_KEY=your_key_here" > .env
fi

# Install dependencies
echo "Installing backend dependencies..."
npm install

# Start the server
echo "Starting server on http://localhost:3001"
echo ""
node src/index.js

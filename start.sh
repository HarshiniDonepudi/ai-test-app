#!/bin/bash

echo "🏥 Starting Wound Analysis System..."
echo ""

# Check if .env exists and has API key
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please copy .env.example to .env and add your OpenAI API key"
    exit 1
fi

if grep -q "your_openai_api_key_here" .env; then
    echo "⚠️  Warning: Please add your OpenAI API key to the .env file"
    echo "Edit .env and replace 'your_openai_api_key_here' with your actual API key"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ] || [ ! -d "client/node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm run install-all
fi

echo ""
echo "✅ Starting development servers..."
echo "   - Backend API: http://localhost:5000"
echo "   - Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the servers"
echo ""

npm run dev

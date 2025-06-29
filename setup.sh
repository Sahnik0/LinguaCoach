#!/bin/bash

# Setup script for Language Coach App
echo "🚀 Setting up Language Coach App..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "📋 Creating .env.local from template..."
    cp .env.example .env.local
    echo "✅ .env.local created! Please edit it with your actual API keys."
    echo ""
    echo "📝 Required API keys:"
    echo "   - GROQ_API_KEY (from https://console.groq.com)"
    echo "   - Firebase credentials (from Firebase Console)"
    echo "   - OMNIDIMENSION_API_KEY (from Omnidimension)"
    echo ""
    echo "⚠️  Don't forget to update .env.local with your actual API keys!"
else
    echo "✅ .env.local already exists"
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    if command -v pnpm &> /dev/null; then
        pnpm install
    elif command -v npm &> /dev/null; then
        npm install
    else
        echo "❌ No package manager found. Please install npm or pnpm."
        exit 1
    fi
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

echo ""
echo "🎉 Setup complete!"
echo "📖 Next steps:"
echo "   1. Edit .env.local with your actual API keys"
echo "   2. Run 'npm run dev' or 'pnpm dev' to start the development server"
echo "   3. Open http://localhost:3000 in your browser"

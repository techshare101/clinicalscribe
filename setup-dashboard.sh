#!/bin/bash
# ClinicalScribe Dashboard Setup Script

echo "🔹 Starting ClinicalScribe Dashboard Setup"

# Check for Node.js and npm
echo "🔹 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js before continuing."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm before continuing."
    exit 1
fi

# Set environment variables for development
echo "🔹 Setting up development environment..."
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found. Please create one based on .env.example."
    exit 1
fi

# Check if NEXT_PUBLIC_SHOW_DASHBOARD_ALWAYS is set
if ! grep -q "NEXT_PUBLIC_SHOW_DASHBOARD_ALWAYS=true" .env.local; then
    echo "🔹 Adding NEXT_PUBLIC_SHOW_DASHBOARD_ALWAYS=true to .env.local"
    echo "" >> .env.local
    echo "# Development override to always show dashboard" >> .env.local
    echo "NEXT_PUBLIC_SHOW_DASHBOARD_ALWAYS=true" >> .env.local
fi

# Install dependencies
echo "🔹 Installing dependencies..."
npm install

# Seed Firestore with dashboard data
echo "🔹 Seeding Firestore with dashboard data..."
echo "NOTE: This step requires Firebase credentials to be set in .env.local"
node -r dotenv/config --import tsx scripts/seedDashboard.ts

# Start the development server
echo "🔹 Starting development server..."
echo "🔹 Open http://localhost:3000/dashboard in your browser"
npm run dev
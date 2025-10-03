# ClinicalScribe Dashboard Setup Script (PowerShell)

Write-Host "🔹 Starting ClinicalScribe Dashboard Setup" -ForegroundColor Cyan

# Check for Node.js and npm
Write-Host "🔹 Checking prerequisites..." -ForegroundColor Cyan
try {
    $nodeVersion = node -v
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js before continuing." -ForegroundColor Red
    exit 1
}

try {
    $npmVersion = npm -v
    Write-Host "✅ npm found: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not installed. Please install npm before continuing." -ForegroundColor Red
    exit 1
}

# Set environment variables for development
Write-Host "🔹 Setting up development environment..." -ForegroundColor Cyan
if (-not (Test-Path ".env.local")) {
    Write-Host "❌ .env.local file not found. Please create one based on .env.example." -ForegroundColor Red
    exit 1
}

# Check if NEXT_PUBLIC_SHOW_DASHBOARD_ALWAYS is set
$envContent = Get-Content ".env.local" -Raw
if (-not ($envContent -match "NEXT_PUBLIC_SHOW_DASHBOARD_ALWAYS=true")) {
    Write-Host "🔹 Adding NEXT_PUBLIC_SHOW_DASHBOARD_ALWAYS=true to .env.local" -ForegroundColor Cyan
    Add-Content ".env.local" "`n# Development override to always show dashboard"
    Add-Content ".env.local" "NEXT_PUBLIC_SHOW_DASHBOARD_ALWAYS=true"
}

# Install dependencies
Write-Host "🔹 Installing dependencies..." -ForegroundColor Cyan
npm install

# Seed Firestore with dashboard data
Write-Host "🔹 Seeding Firestore with dashboard data..." -ForegroundColor Cyan
Write-Host "NOTE: This step requires Firebase credentials to be set in .env.local" -ForegroundColor Yellow
node -r dotenv/config --import tsx scripts/seedDashboard.ts

# Start the development server
Write-Host "🔹 Starting development server..." -ForegroundColor Cyan
Write-Host "🔹 Open http://localhost:3000/dashboard in your browser" -ForegroundColor Green
npm run dev
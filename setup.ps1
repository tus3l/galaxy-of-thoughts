# Galaxy of Thoughts - Quick Start Script
# Run this file with: .\setup.ps1

Write-Host "🌌 Galaxy of Thoughts - Setup Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Check if npm is installed
Write-Host "Checking npm installation..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✓ npm is installed: v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ npm is not installed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Gray
Write-Host ""

npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Dependencies installed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host "🚀 Setup Complete!" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "To start the development server, run:" -ForegroundColor Yellow
    Write-Host "  npm run dev" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Then open your browser to:" -ForegroundColor Yellow
    Write-Host "  http://localhost:3000" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📚 Check README.md for more information" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "✗ Installation failed!" -ForegroundColor Red
    Write-Host "Please check the error messages above." -ForegroundColor Red
    Write-Host ""
    exit 1
}

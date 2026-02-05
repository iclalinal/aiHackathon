# Start Road Damage AI - Development Servers
# This script starts all three servers: AI, Backend, and Frontend

Write-Host "🚀 Starting Road Damage AI Development Servers..." -ForegroundColor Cyan
Write-Host ""

$rootPath = Split-Path -Parent $MyInvocation.MyCommand.Path

# Start AI Service (Python)
Write-Host "🤖 Starting AI Service (http://localhost:8000)..." -ForegroundColor Yellow
$aiPath = Join-Path $rootPath "ai"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$aiPath'; python api/main.py" -WindowStyle Normal

# Wait for AI service to start
Start-Sleep -Seconds 3

# Start Backend
Write-Host "📦 Starting Backend Server (http://localhost:3001)..." -ForegroundColor Yellow
$backendPath = Join-Path $rootPath "backend-node"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; npm run dev" -WindowStyle Normal

# Wait a moment for backend to start
Start-Sleep -Seconds 2

# Start Frontend
Write-Host "🎨 Starting Frontend Server (http://localhost:3000)..." -ForegroundColor Yellow
$frontendPath = Join-Path $rootPath "frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "✅ All servers are starting!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 AI Service: http://localhost:8000" -ForegroundColor White
Write-Host "📍 Backend:    http://localhost:3001" -ForegroundColor White
Write-Host "📍 Frontend:   http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "📍 Admin Panel: http://localhost:3000/admin/login" -ForegroundColor White
Write-Host "🔑 Admin Login: admin / admin123" -ForegroundColor Magenta
Write-Host ""
Write-Host "Press any key to exit this window..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

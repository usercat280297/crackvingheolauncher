#!/usr/bin/env pwsh
# 🎮 SETUP SCRIPT - Tự động tạo folder & config

Write-Host "🚀 Setting up Launcher..." -ForegroundColor Cyan

# 1. Tạo folder
Write-Host "`n📁 Creating folders..." -ForegroundColor Yellow

$folders = @(
    "C:\Games",
    "C:\Games\Torrents",
    "C:\Games\Installed",
    "C:\Games\Torrents_DB"
)

foreach ($folder in $folders) {
    if (Test-Path $folder) {
        Write-Host "✅ $folder (exists)" -ForegroundColor Green
    } else {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
        Write-Host "✅ Created: $folder" -ForegroundColor Green
    }
}

# 2. Tạo games.json
Write-Host "`n📝 Creating games.json..." -ForegroundColor Yellow

$gamesJson = @{
    games = @(
        @{
            id = 1091500
            appId = 1091500
            name = "Cyberpunk 2077"
            torrentFile = "C:\Games\Torrents_DB\cyberpunk_2077.torrent"
            installPath = "C:\Games\Installed\Cyberpunk 2077"
            hasDenuvo = $true
            size = "55 GB"
            isActive = $true
        },
        @{
            id = 847370
            appId = 847370
            name = "Elden Ring"
            torrentFile = "C:\Games\Torrents_DB\elden_ring.torrent"
            installPath = "C:\Games\Installed\Elden Ring"
            hasDenuvo = $true
            size = "60 GB"
            isActive = $true
        },
        @{
            id = 1391110
            appId = 1391110
            name = "Resident Evil Village"
            torrentFile = "C:\Games\Torrents_DB\resident_evil_village.torrent"
            installPath = "C:\Games\Installed\Resident Evil Village"
            hasDenuvo = $true
            size = "35 GB"
            isActive = $true
        }
    )
} | ConvertTo-Json -Depth 10

$gamesJsonPath = "C:\Games\Torrents_DB\games.json"
Set-Content -Path $gamesJsonPath -Value $gamesJson
Write-Host "✅ Created: $gamesJsonPath" -ForegroundColor Green

# 3. Check .env
Write-Host "`n🔧 Checking .env..." -ForegroundColor Yellow

$envPath = "$PSScriptRoot\.env"
if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
    
    $requiredVars = @(
        "GAMES_PATH=C:\Games"
        "TORRENT_DOWNLOAD_PATH=C:\Games\Torrents"
        "TORRENT_INSTALLED_PATH=C:\Games\Installed"
        "TORRENT_DB_PATH=C:\Games\Torrents_DB"
    )
    
    $needsUpdate = $false
    foreach ($var in $requiredVars) {
        if ($envContent -notmatch $var.Split('=')[0]) {
            $needsUpdate = $true
            Write-Host "⚠️  Missing: $var" -ForegroundColor Yellow
        }
    }
    
    if ($needsUpdate) {
        Write-Host "`n📝 Add these to .env:" -ForegroundColor Cyan
        foreach ($var in $requiredVars) {
            Write-Host "   $var" -ForegroundColor Cyan
        }
    } else {
        Write-Host "✅ .env configured" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  .env not found. Create it with:" -ForegroundColor Yellow
    Write-Host "   GAMES_PATH=C:\Games" -ForegroundColor Cyan
    Write-Host "   TORRENT_DOWNLOAD_PATH=C:\Games\Torrents" -ForegroundColor Cyan
    Write-Host "   TORRENT_DB_PATH=C:\Games\Torrents_DB" -ForegroundColor Cyan
}

# 4. Check dependencies
Write-Host "`n📦 Checking dependencies..." -ForegroundColor Yellow

$needsInstall = $false
$packages = @("extract-zip", "webtorrent")

foreach ($pkg in $packages) {
    if (Test-Path "$PSScriptRoot\node_modules\$pkg") {
        Write-Host "✅ $pkg" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Missing: $pkg" -ForegroundColor Yellow
        $needsInstall = $true
    }
}

if ($needsInstall) {
    Write-Host "`n⚡ Run: npm install" -ForegroundColor Cyan
}

# 5. Summary
Write-Host "`n" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan

Write-Host "`n📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Copy .torrent files to: C:\Games\Torrents_DB\" -ForegroundColor White
Write-Host "2. Update .env if needed" -ForegroundColor White
Write-Host "3. Run: npm install" -ForegroundColor White
Write-Host "4. Run: npm run dev" -ForegroundColor White
Write-Host "5. Test API: curl http://localhost:3000/api/most-popular" -ForegroundColor White

Write-Host "`n📚 Documentation:" -ForegroundColor Yellow
Write-Host "- QUICKSTART_NEW_FEATURES.md - Quick start" -ForegroundColor Cyan
Write-Host "- TORRENT_SETUP_GUIDE.md - Setup details" -ForegroundColor Cyan
Write-Host "- INTEGRATION_GUIDE.md - Frontend integration" -ForegroundColor Cyan
Write-Host "- IMPLEMENTATION_COMPLETE.md - Full overview" -ForegroundColor Cyan

Write-Host "`n🎮 Happy Gaming!" -ForegroundColor Green

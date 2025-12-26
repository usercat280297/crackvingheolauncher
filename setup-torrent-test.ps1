# 🎮 Setup Torrent Test Environment
# Run: .\setup-torrent-test.ps1

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║           TORRENT TEST ENVIRONMENT SETUP                  ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Color functions
function Write-Success { Write-Host "[OK] $args" -ForegroundColor Green }
function Write-Warning { Write-Host "[WARN] $args" -ForegroundColor Yellow }
function Write-Error { Write-Host "[ERROR] $args" -ForegroundColor Red }
function Write-Info { Write-Host "[INFO] $args" -ForegroundColor Cyan }

# Step 1: Create folder structure
Write-Host "`n[STEP 1] Creating folder structure..." -ForegroundColor Yellow

$folders = @(
  "C:\Games",
  "C:\Games\Torrents",
  "C:\Games\Installed",
  "C:\Games\Torrents_DB"
)

foreach ($folder in $folders) {
  if (Test-Path $folder) {
    Write-Success "Folder exists: $folder"
  } else {
    try {
      New-Item -ItemType Directory -Path $folder -Force | Out-Null
      Write-Success "Created: $folder"
    } catch {
      Write-Error "Failed to create $folder : $_"
    }
  }
}

# Step 2: Create games.json if not exists
Write-Host "`n[STEP 2] Setting up games.json..." -ForegroundColor Yellow

$gamesJsonPath = "C:\Games\Torrents_DB\games.json"

if (Test-Path $gamesJsonPath) {
  Write-Success "games.json already exists"
  
  # Try to add our test game
  $gamesDb = Get-Content $gamesJsonPath | ConvertFrom-Json
  $hasNFS = $gamesDb | Where-Object { $_.appId -eq 1398620 }
  
  if ($hasNFS) {
    Write-Info "Need for Speed Heat already in database"
  } else {
    Write-Info "Need for Speed Heat not in database (will add via API)"
  }
} else {
  # Create empty games.json
  $template = @{
    version = "1.0"
    lastUpdated = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    games = @()
  } | ConvertTo-Json
  
  $template | Set-Content $gamesJsonPath -Encoding UTF8
  Write-Success "Created: $gamesJsonPath"
}

# Step 3: Check .env file
Write-Host "`n[STEP 3] Checking .env configuration..." -ForegroundColor Yellow

$envFile = Get-Item "e:\Tạo app backend nè\Tạo app backend\.env" -ErrorAction SilentlyContinue

if ($envFile) {
  Write-Success ".env file exists"
  
  $envContent = Get-Content $envFile.FullName
  $hasGamesPath = $envContent | Select-String "GAMES_PATH"
  $hasTorrentPath = $envContent | Select-String "TORRENT_DB_PATH"
  
  if (!$hasGamesPath) {
    Write-Warning "GAMES_PATH not set in .env"
    Write-Host "Add this line to .env:" -ForegroundColor Yellow
    Write-Host '  GAMES_PATH=C:\Games' -ForegroundColor Cyan
  } else {
    Write-Success "GAMES_PATH configured"
  }
  
  if (!$hasTorrentPath) {
    Write-Warning "TORRENT_DB_PATH not set in .env"
    Write-Host "Add this line to .env:" -ForegroundColor Yellow
    Write-Host '  TORRENT_DB_PATH=C:\Games\Torrents_DB' -ForegroundColor Cyan
  } else {
    Write-Success "TORRENT_DB_PATH configured"
  }
} else {
  Write-Warning ".env file not found at e:\Tạo app backend nè\Tạo app backend\.env"
}

# Step 4: Check torrent file
Write-Host "`n[STEP 4] Checking torrent file..." -ForegroundColor Yellow

$torrentPath = "e:\Tạo app backend nè\Tạo app backend\torrent file game\Need for Speed Heat.torrent"

if (Test-Path $torrentPath) {
  $fileSize = (Get-Item $torrentPath).Length
  $fileSizeMB = [math]::Round($fileSize / 1MB, 2)
  Write-Success "Found: Need for Speed Heat.torrent ($fileSizeMB MB)"
} else {
  Write-Error "Not found: $torrentPath"
  Write-Info "Please ensure the .torrent file exists in the specified path"
}

# Step 5: Check Node dependencies
Write-Host "`n[STEP 5] Checking Node dependencies..." -ForegroundColor Yellow

$packageJsonPath = "e:\Tạo app backend nè\Tạo app backend\package.json"
$packageContent = Get-Content $packageJsonPath | ConvertFrom-Json

$requiredDeps = @("webtorrent", "extract-zip", "axios")

foreach ($dep in $requiredDeps) {
  if ($packageContent.dependencies.$dep) {
    Write-Success "$dep installed"
  } else {
    Write-Warning "$dep not in package.json"
    Write-Info "Run: npm install $dep"
  }
}

# Step 6: Display next steps
Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                    SETUP COMPLETE                        ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "Next steps to test torrent download:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1. Update .env with:" -ForegroundColor White
Write-Host "     GAMES_PATH=C:\Games" -ForegroundColor Cyan
Write-Host "     TORRENT_DB_PATH=C:\Games\Torrents_DB" -ForegroundColor Cyan
Write-Host ""
Write-Host "  2. Start backend:" -ForegroundColor White
Write-Host "     npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "  3. In new terminal, run test:" -ForegroundColor White
Write-Host "     node test-torrent-flow.js" -ForegroundColor Cyan
Write-Host ""
Write-Host "  4. Or follow manual test:" -ForegroundColor White
Write-Host "     Read: TEST_END_TO_END.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "Folder locations:" -ForegroundColor Yellow
Write-Host "  Torrents: C:\Games\Torrents" -ForegroundColor Cyan
Write-Host "  Games DB: C:\Games\Torrents_DB\games.json" -ForegroundColor Cyan
Write-Host "  Source:   e:\Tạo app backend nè\Tạo app backend\torrent file game\" -ForegroundColor Cyan
Write-Host ""

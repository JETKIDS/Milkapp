#Requires -Version 7.0
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Section([string]$title) {
  Write-Host "`n=== $title ==="
}

function Stop-PortListeners([int]$port) {
  $lines = netstat -ano | Select-String ":$port"
  if (-not $lines) { return }
  $pidList = @()
  foreach ($ln in $lines) {
    $last = ($ln.Line -split "\s+")[-1]
    if ($last -match '^\d+$' -and $last -ne '0') { $pidList += $last }
  }
  $pidList = $pidList | Sort-Object -Unique
  foreach ($procId in $pidList) {
    try { Stop-Process -Id $procId -Force -ErrorAction Stop; Write-Host "killed PID $procId (:$port)" }
    catch { try { taskkill /PID $procId /F | Out-Null; Write-Host "taskkilled PID $procId (:$port)" } catch {} }
  }
}

function Wait-HttpOk([string]$url, [int]$timeoutSec = 15) {
  $start = Get-Date
  while ((Get-Date) - $start -lt [TimeSpan]::FromSeconds($timeoutSec)) {
    try {
      $code = (Invoke-WebRequest -UseBasicParsing $url -TimeoutSec 3).StatusCode
      if ($code -ge 200 -and $code -lt 400) { return $true }
    } catch {}
    Start-Sleep -Milliseconds 700
  }
  return $false
}

Write-Section "Kill listeners on 3001/5173"
Stop-PortListeners 3001
Stop-PortListeners 5173

# HMR 安定化（OneDrive 配下対策）
$env:CHOKIDAR_USEPOLLING = '1'
$env:CHOKIDAR_INTERVAL   = '300'

Write-Section "Prisma generate"
npm -w backend run prisma:generate | Out-Host

Write-Section "Start backend (dev)"
$backend = Start-Process -FilePath "npm.cmd" -ArgumentList "-w","backend","run","dev" -PassThru
if (-not (Wait-HttpOk "http://127.0.0.1:3001/health" 20)) {
  Write-Host "backend failed to respond on /health within timeout" -ForegroundColor Yellow
} else {
  Write-Host "backend is healthy on http://127.0.0.1:3001/health"
}

Write-Section "Start frontend (vite :5173 strict)"
$frontend = Start-Process -FilePath "npm.cmd" -ArgumentList "-w","frontend","run","dev","--","--host","127.0.0.1","--port","5173","--strictPort" -PassThru
Start-Sleep -Seconds 3

Write-Section "Ports"
netstat -ano | Select-String ":3001|:5173" | ForEach-Object { $_.Line }

Write-Section "HTTP checks"
try { $code1=(Invoke-WebRequest -UseBasicParsing http://127.0.0.1:3001/health -TimeoutSec 5).StatusCode; Write-Host "backend /health -> $code1" } catch { Write-Host "backend /health -> ERROR" }
try { $code2=(Invoke-WebRequest -UseBasicParsing http://127.0.0.1:5173 -TimeoutSec 5).StatusCode; Write-Host "frontend / -> $code2" } catch { Write-Host "frontend / -> ERROR" }

Write-Section "Done"
Write-Host "backend PID: $($backend.Id)  frontend PID: $($frontend.Id)"
Write-Host "Open http://localhost:5173/"



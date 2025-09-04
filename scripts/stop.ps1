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

Write-Section "Kill listeners on 3001/5173"
Stop-PortListeners 3001
Stop-PortListeners 5173

Write-Section "Ports after"
netstat -ano | Select-String ":3001|:5173" | ForEach-Object { $_.Line }




# Run every milestone suite in order. Exit 0 only if all of them are green.
#   .\tools\test.ps1            all suites
#   .\tools\test.ps1 -Only m2   just one
param([string]$Only = "")

$root  = Split-Path $PSScriptRoot -Parent
$suites = @("m1","m2","m3","m4","m5","m6","m7","m8","m9","m10","m11","m12","m13","m14","m15","m16","m17","m18","m19","m20","m21","m22","m23","m24","m25","m26","m27","m28","m29","m30","m31","m32","m33","m34","m35","m36")
if ($Only) { $suites = @($Only) }

$failed = @()
foreach ($s in $suites) {
  Write-Host ""
  Write-Host "=== $s ===" -ForegroundColor Cyan
  & "$root\tools\smoketest.ps1" -Tests "tools\$s-tests.js"
  if ($LASTEXITCODE -ne 0) { $failed += $s }
}

Write-Host ""
if ($failed.Count -eq 0) {
  Write-Host "ALL SUITES GREEN ($($suites -join ', '))" -ForegroundColor Green
  exit 0
} else {
  Write-Host "FAILING SUITES: $($failed -join ', ')" -ForegroundColor Red
  exit 1
}





















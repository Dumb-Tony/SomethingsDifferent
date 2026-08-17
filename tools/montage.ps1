# Render the M3 verification artefact: every prop kind x N variants, each labelled
# with its computed similarity to the original and the axis that changed most.
#
#   .\tools\montage.ps1                       -> %TEMP%\sd-montage.png
#   .\tools\montage.ps1 -PerKind 5 -Size 160 -Out C:\path\shot.png
#
param(
  [int]$PerKind = 4,
  [int]$Size    = 128,
  [int]$Seed    = 99,
  [string]$Out  = "",
  [int]$Port    = 8397
)
$ErrorActionPreference = "Stop"
$root   = Split-Path $PSScriptRoot -Parent
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
if (-not $Out) { $Out = Join-Path $env:TEMP "sd-montage.png" }

# canvas size must match propMontage()'s layout maths: pad 8, label 18, footer 15.
# The row count comes from the FILE, not a literal: it was hard-coded to 8 back when
# there were 8 kinds, so the artefact whose whole job is to show you every kind has
# been quietly cropping to the first eight ever since a ninth was added.
$kindCount = (Select-String -Path (Join-Path $root "somethingsdifferent.html") `
                            -Pattern "alienName:" -Encoding UTF8).Count
if ($kindCount -lt 1) { $kindCount = 8 }
$w = $PerKind * ($Size + 8) + 8
$h = $kindCount * ($Size + 8 + 18 + 15) + 8

$inject = @"
<script>
(function(){
  var SD=window.__SD; if(!SD) return;
  SD.stopLoop();
  var c=SD.propMontage($PerKind,$Size,$Seed);
  document.body.style.margin='0';
  document.body.style.background='#0b0a12';
  c.style.cssText='position:absolute;left:0;top:0;z-index:999';
  document.body.appendChild(c);
  document.title='MONTAGE '+c.width+'x'+c.height;
})();
</script>
</body>
"@

$html = Get-Content (Join-Path $root "somethingsdifferent.html") -Raw -Encoding UTF8
$html = $html -replace '</body>', $inject
$scratch = Join-Path $root "_montage.html"
Set-Content -Path $scratch -Value $html -Encoding utf8

$server = Start-Process powershell `
  -ArgumentList "-NoProfile","-ExecutionPolicy","Bypass","-File","$root\tools\serve.ps1","-NoBrowser","-Port","$Port" `
  -WindowStyle Hidden -PassThru
Start-Sleep -Seconds 2

$profileDir = Join-Path $env:TEMP ("sd-mont-" + [System.Guid]::NewGuid().ToString("N").Substring(0,8))
Start-Process $chrome -ArgumentList `
  "--headless=new","--disable-gpu","--no-first-run","--no-default-browser-check",
  "--user-data-dir=$profileDir","--hide-scrollbars","--window-size=$w,$h",
  "--virtual-time-budget=30000","--screenshot=$Out","http://localhost:$Port/_montage.html" `
  -NoNewWindow -Wait | Out-Null

if ($server -and -not $server.HasExited) { Stop-Process -Id $server.Id -Force }
try { Remove-Item -Recurse -Force -LiteralPath $profileDir -ErrorAction Stop } catch {}
try { Remove-Item -LiteralPath $scratch -Force -ErrorAction Stop } catch {}

if (Test-Path $Out) {
  Write-Host "MONTAGE $w x $h  ->  $Out  ($((Get-Item $Out).Length) bytes)" -ForegroundColor Green
  exit 0
} else {
  Write-Host "No montage produced." -ForegroundColor Red
  exit 1
}

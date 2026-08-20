# Something's Different - headless smoke test (GDD 16).
#
# There is no Node.js on this machine, so the harness IS a browser: it builds a
# scratch copy of the game with a test script injected, serves it over http (the
# game refuses to run on file://), drives it in headless Chrome, and greps the
# dumped DOM for the result block.
#
# Headless Chrome DOES render WebGL here - with --disable-gpu it falls back to
# ANGLE/D3D11 WARP, so the tests can assert on real pixels via readPixels.
#
#   .\tools\smoketest.ps1                     run the milestone-1 tests
#   .\tools\smoketest.ps1 -Tests tools\m2-tests.js -Keep
#
param(
  [string]$Tests = "tools\m1-tests.js",
  [string]$Game  = "somethingsdifferent.html",
  [int]$Port     = 8399,
  [switch]$Keep
)
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent

$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
if (-not (Test-Path $chrome)) { Write-Host "Chrome not found at $chrome" -ForegroundColor Red; exit 2 }

$gamePath = Join-Path $root $Game
$testPath = Join-Path $root $Tests
if (-not (Test-Path $gamePath)) { Write-Host "Game not found: $gamePath" -ForegroundColor Red; exit 2 }
if (-not (Test-Path $testPath)) { Write-Host "Tests not found: $testPath" -ForegroundColor Red; exit 2 }

# build the scratch copy: game + injected tests, in the served root so the
# relative asset paths still resolve
$scratchName = "_smoketest.html"
$scratch = Join-Path $root $scratchName
# -Encoding UTF8 is REQUIRED: PS 5.1's Get-Content defaults to ANSI, so a UTF-8
# game file round-trips into double-encoded mojibake and the test runs against a
# corrupted copy.
$html = Get-Content $gamePath -Raw -Encoding UTF8
$inject = "<script src=""$($Tests -replace '\\','/')""></script>`r`n</body>"
if ($html -notmatch '</body>') { Write-Host "No </body> in the game file." -ForegroundColor Red; exit 2 }
$html = $html -replace '</body>', $inject
Set-Content -Path $scratch -Value $html -Encoding utf8

# start the server (no browser tab)
$server = Start-Process powershell `
  -ArgumentList "-NoProfile","-ExecutionPolicy","Bypass","-File","$root\tools\serve.ps1","-NoBrowser","-Port","$Port" `
  -WindowStyle Hidden -PassThru

$url = "http://localhost:$Port/$scratchName"
$tries = 0
$up = $false
while ($tries -lt 40 -and -not $up) {
  try {
    $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2
    if ($r.StatusCode -eq 200) { $up = $true }
  } catch { Start-Sleep -Milliseconds 250; $tries++ }
}
if (-not $up) {
  Write-Host "Server never came up on port $Port." -ForegroundColor Red
  if ($server -and -not $server.HasExited) { Stop-Process -Id $server.Id -Force }
  exit 2
}

# Drive it in headless Chrome.
# NOTE: chrome.exe is a GUI-subsystem binary, so `$x = & chrome --dump-dom` captures
# NOTHING under PowerShell - the DOM has to be redirected to a file. This silently
# cost an hour; do not "simplify" it back to a direct capture.
$profileDir = Join-Path $env:TEMP ("sd-smoke-" + [System.Guid]::NewGuid().ToString("N").Substring(0,8))
$domFile    = Join-Path $env:TEMP ("sd-dom-"   + [System.Guid]::NewGuid().ToString("N").Substring(0,8) + ".html")
# --autoplay-policy: without it an AudioContext stays 'suspended' forever here, since
# a headless run has no real user gesture to grant it. The m9 suite still asserts on
# graph structure rather than on ctx.state, so it passes either way - but with the
# flag the audio graph actually runs, which is the state the game ships in.
$proc = Start-Process $chrome -ArgumentList `
  "--headless=new","--disable-gpu","--no-first-run","--no-default-browser-check",
  "--user-data-dir=$profileDir","--window-size=1280,720",
  "--autoplay-policy=no-user-gesture-required",
  "--virtual-time-budget=200000","--dump-dom",$url `
  -RedirectStandardOutput $domFile -NoNewWindow -Wait -PassThru

# tidy up
if ($server -and -not $server.HasExited) { Stop-Process -Id $server.Id -Force }
try { Remove-Item -Recurse -Force $profileDir -ErrorAction Stop } catch {}
if (-not $Keep) { try { Remove-Item $scratch -Force -ErrorAction Stop } catch {} }

# report
$text = ""
if (Test-Path $domFile) { $text = Get-Content $domFile -Raw -Encoding UTF8 }
try { Remove-Item $domFile -Force -ErrorAction Stop } catch {}
if (-not $text) { $text = "" }
$m = [regex]::Match($text, '==SDTEST-BEGIN==(.*?)==SDTEST-END==', 'Singleline')
if (-not $m.Success) {
  Write-Host "No test output found - the page probably crashed before the harness ran." -ForegroundColor Red
  $eb = [regex]::Match($text, 'id="err-banner"[^>]*>(.*?)</div>', 'Singleline')
  if ($eb.Success) { Write-Host ("Error banner: " + $eb.Groups[1].Value.Trim()) -ForegroundColor Red }
  exit 1
}

$body = $m.Groups[1].Value.Trim() -replace '&lt;','<' -replace '&gt;','>' -replace '&amp;','&'
foreach ($line in ($body -split "`n")) {
  $t = $line.Trim()
  if ($t -like 'FAIL*')          { Write-Host $t -ForegroundColor Red }
  elseif ($t -like 'PASS*')      { Write-Host $t -ForegroundColor DarkGray }
  elseif ($t -like '*ALL-PASS*') { Write-Host $t -ForegroundColor Green }
  elseif ($t -like '*FAILURES*') { Write-Host $t -ForegroundColor Red }
  else                           { Write-Host $t }
}
if ($body -match 'ALL-PASS') { exit 0 } else { exit 1 }


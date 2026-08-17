# Something's Different dev server - started by play.bat (double-click friendly).
# Serves the game folder over http (browsers block local module/texture loads on file://).
# Uses ports 8341-8350 so it can run alongside the Chameleon server (8321-8330).
#   -NoBrowser   don't launch a browser tab (used by tools\smoketest.ps1)
#   -Port <n>    try this exact port instead of scanning 8341-8350
param([switch]$NoBrowser, [int]$Port = 0)
$root = Split-Path $PSScriptRoot -Parent
$mime = @{ ".html"="text/html"; ".js"="text/javascript"; ".css"="text/css"; ".png"="image/png"; ".jpg"="image/jpeg"; ".svg"="image/svg+xml"; ".glb"="model/gltf-binary"; ".m4a"="audio/mp4"; ".mp3"="audio/mpeg"; ".json"="application/json"; ".ico"="image/x-icon" }

# find a free port (8341 first; skip ahead if another server already has it)
$listener = $null
$ports = if ($Port -gt 0) { @($Port) } else { 8341..8350 }
foreach ($port in $ports) {
  try {
    $l = New-Object System.Net.HttpListener
    $l.Prefixes.Add("http://localhost:$port/")
    $l.Start()
    $listener = $l
    break
  } catch { }
}
if (-not $listener) {
  Write-Host "Could not find a free port ($($ports -join ', '))."
  if (-not $NoBrowser) { Read-Host "Press Enter to close" }
  exit 1
}

$url = $listener.Prefixes | Select-Object -First 1
Write-Host ""
Write-Host "  SOMETHING'S DIFFERENT is running at $url" -ForegroundColor Green
Write-Host "  Keep this window open while you play. Close it to stop." -ForegroundColor DarkGray
Write-Host ""
if (-not $NoBrowser) { Start-Process $url }

while ($listener.IsListening) {
  try {
    $ctx = $listener.GetContext()
    $path = [System.Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
    if ($path -eq '') { $path = 'somethingsdifferent.html' }
    $file = Join-Path $root $path
    if ((Test-Path $file -PathType Leaf) -and ((Resolve-Path $file).Path.StartsWith($root))) {
      $bytes = [System.IO.File]::ReadAllBytes($file)
      $ext = [System.IO.Path]::GetExtension($file).ToLower()
      $ctx.Response.ContentType = if ($mime[$ext]) { $mime[$ext] } else { "application/octet-stream" }
      $ctx.Response.ContentLength64 = $bytes.Length
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $ctx.Response.StatusCode = 404
    }
    $ctx.Response.Close()
  } catch { }
}

# Build a single self-contained page for sharing (Artifact / any static host).
#
# The game is already fully offline - procedural geometry, canvas textures, no fetches -
# so the ONLY external reference is the vendored three.min.js. Inline that and the page
# stands alone anywhere, including file://.
#
# Produces THREE files, all the same game:
#   share.html         NO doctype/html/head/body wrapper - the Artifact host supplies
#                      that skeleton itself, and a second one would nest documents.
#   dist\index.html    a COMPLETE document for any ordinary static host
#                      (GitHub Pages, itch.io, a USB stick). Named index.html so it
#                      serves at the bare URL with no path.
#   _share-test.html   identical bytes to dist\index.html, kept at the project root
#                      so the suites can run against exactly what ships.
#
# NOTE: keep this file ASCII-only. PS 5.1 reads .ps1 as ANSI and mangles anything else.
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent

$game  = Get-Content (Join-Path $root "somethingsdifferent.html") -Raw -Encoding UTF8
$three = Get-Content (Join-Path $root "assets\lib\r128\three.min.js") -Raw -Encoding UTF8

# a minified bundle containing the literal "</script" would close the tag early
if ($three -match '</script') {
  Write-Host "three.min.js contains a literal end-script tag - needs escaping." -ForegroundColor Red
  exit 2
}

$style = [regex]::Match($game,'<style>.*?</style>','Singleline').Value
$body  = [regex]::Match($game,'<body>(.*)</body>','Singleline').Groups[1].Value
if (-not $style -or -not $body) { Write-Host "Could not split the game file." -ForegroundColor Red; exit 2 }

$tag = '<script src="assets/lib/r128/three.min.js"></script>'
if ($body.IndexOf($tag) -lt 0) { Write-Host "Three.js script tag not found." -ForegroundColor Red; exit 2 }
$body = $body.Replace($tag, "<script>`n$three`n</script>")

$dash  = [char]0x2014
$title = "<title>Something" + [char]0x2019 + "s Different " + $dash + " playtest build</title>"
$content = $title + "`n" + $style + "`n" + $body

$share = Join-Path $root "share.html"
Set-Content -Path $share -Value $content -Encoding utf8

# the complete document, for ordinary static hosts
$wrapped = "<!DOCTYPE html>`n<html lang=""en"">`n<head>`n<meta charset=""UTF-8"">`n" +
           "<meta name=""viewport"" content=""width=device-width,initial-scale=1"">`n" +
           "<meta name=""color-scheme"" content=""dark"">`n" +
           "<meta name=""description"" content=""A suburban stealth game about swapping your neighbours' possessions for almost-identical ones."">`n" +
           "</head>`n<body>`n" + $content + "`n</body>`n</html>"

$dist = Join-Path $root "dist"
if (-not (Test-Path $dist)) { New-Item -ItemType Directory -Path $dist | Out-Null }
Set-Content -Path (Join-Path $dist "index.html") -Value $wrapped -Encoding utf8

# same bytes at the root so the suites can be pointed at them with -Game
Set-Content -Path (Join-Path $root "_share-test.html") -Value $wrapped -Encoding utf8

$kb  = [math]::Round((Get-Item $share).Length / 1024)
$kb2 = [math]::Round((Get-Item (Join-Path $dist "index.html")).Length / 1024)
Write-Host "share.html        $kb KB   (Artifact: no wrapper)" -ForegroundColor Green
Write-Host "dist\index.html   $kb2 KB   (any static host: complete document)" -ForegroundColor Green
Write-Host "_share-test.html  wrapped copy for the test suite" -ForegroundColor DarkGray

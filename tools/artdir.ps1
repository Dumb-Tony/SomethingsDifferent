# Render one SCENE under one ART DIRECTION, headless.
#   .\tools\artdir.ps1 -Scene street -Dir noir -Out docs\ad-street-noir.png
#
# Reuses shot.ps1's scene table, then layers a look on top of it. Nothing here
# touches the game file - the direction is injected into a scratch copy, so these
# are real frames from the real build without committing to anything.
param(
  [string]$Scene = "street",
  [string]$Dir   = "moonlit",
  [string]$Out   = "",
  [int]$W = 1280,
  [int]$H = 760,
  [int]$Port = 8397
)
$ErrorActionPreference = "Stop"
$root   = Split-Path $PSScriptRoot -Parent
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
if (-not $Out) { $Out = Join-Path $env:TEMP "ad-$Scene-$Dir.png" }
if (-not [System.IO.Path]::IsPathRooted($Out)) { $Out = Join-Path $root $Out }

# ---- the scene table, lifted from shot.ps1 so the framing matches -------------
$open = "SD.GAME.hasSpareKey=true; SD.useDoor(SD.frontDoor);"
$scenes = @{
  street = "SD.startHouse();
    SD.player.position.set(0.6,0,-7.4); SD.player.rotation.y=0;
    SD.S.yaw=Math.PI; SD.S.pitch=0.20; SD.S.dist=5.4; SD.S.camP=null; SD.S.camL=null;"
  lounge = "SD.startHouse(); $open
    SD.player.position.set(2.2,0,-1.0); SD.player.rotation.y=Math.PI;
    SD.S.yaw=0.9; SD.S.pitch=0.20; SD.S.dist=3.4; SD.S.camP=null; SD.S.camL=null;"
  bedroom = "SD.startHouse(); $open
    SD.player.position.set(2.6,0,1.5); SD.player.rotation.y=0;
    SD.S.yaw=Math.PI; SD.S.pitch=0.30; SD.S.dist=3.2; SD.S.camP=null; SD.S.camL=null;"
}

# ---- the directions ----------------------------------------------------------
# Each one re-grades the whole rig AFTER setLighting has run, so it overrides the
# night preset rather than fighting it. Practicals are scaled relative to whatever
# CONST.PRACTICAL_GAIN currently is, so these compare like for like.
$dirs = @{

  # A. MOONLIT — the current direction, executed. Cool key, warm practicals, deep
  #    shadow, muted surfaces. Nothing changed; this is the control.
  moonlit = "/* control: ships as-is */"

  # B. NOIR — hard contrast and one colour. Shadows go to true black, the practicals
  #    burn amber, the ambient is nearly gone. Shapes over detail; a house becomes a
  #    silhouette with a lit window in it.
  noir = "
    SD.scene.traverse(function(o){ if(o.isPointLight) o.intensity*=1.9; });
    var h=SD.scene.children.filter(function(c){return c.isHemisphereLight;})[0];
    if(h){ h.intensity=0.10; h.color.set('#101d3a'); h.groundColor.set('#000000'); }
    SD.scene.children.filter(function(c){return c.isDirectionalLight;}).forEach(function(d,i){
      d.intensity = i===0 ? 0.16 : 0.03; d.color.set('#7f9ad8');
    });
    SD.scene.fog = new THREE.FogExp2('#04060d', 0.055);
    SD.scene.background = new THREE.Color('#020307');
    SD.renderer.toneMappingExposure = 0.78;"

  # C. SODIUM — the warm one. A suburban street at 3am is lit by sodium streetlamps,
  #    not moonlight: everything outdoors goes amber-grey, interiors stay cool by
  #    contrast, and the colour tells you which side of a window you are on.
  sodium = "
    SD.scene.traverse(function(o){
      if(o.isPointLight){ o.intensity*=1.5; o.color.set('#ffb45e'); } });
    var h=SD.scene.children.filter(function(c){return c.isHemisphereLight;})[0];
    if(h){ h.intensity=0.42; h.color.set('#3b3020'); h.groundColor.set('#120c06'); }
    SD.scene.children.filter(function(c){return c.isDirectionalLight;}).forEach(function(d,i){
      d.intensity = i===0 ? 0.30 : 0.10; d.color.set('#c9b088');
    });
    SD.scene.fog = new THREE.FogExp2('#191106', 0.034);
    SD.scene.background = new THREE.Color('#0d0904');
    SD.renderer.toneMappingExposure = 0.86;"
}

if (-not $scenes.ContainsKey($Scene)) { Write-Host "unknown scene $Scene"; exit 2 }
if (-not $dirs.ContainsKey($Dir))     { Write-Host "unknown direction $Dir"; exit 2 }

# The look is applied a frame LATER, because setLighting runs inside startHouse and
# would otherwise overwrite it.
$inject = "<script>`n(function(){var SD=window.__SD; if(!SD) return;`n" +
          $scenes[$Scene] + "`nsetTimeout(function(){`n" + $dirs[$Dir] +
          "`n},350);`n})();`n</script>`n</body>"

$html = Get-Content (Join-Path $root "somethingsdifferent.html") -Raw -Encoding UTF8
$html = $html -replace '</body>', $inject
$scratch = Join-Path $root "_artdir.html"
Set-Content -Path $scratch -Value $html -Encoding utf8

$server = Start-Process powershell `
  -ArgumentList "-NoProfile","-ExecutionPolicy","Bypass","-File","$root\tools\serve.ps1","-NoBrowser","-Port","$Port" `
  -WindowStyle Hidden -PassThru
Start-Sleep -Seconds 2

$profileDir = Join-Path $env:TEMP ("sd-ad-" + [System.Guid]::NewGuid().ToString("N").Substring(0,8))
Start-Process $chrome -ArgumentList `
  "--headless=new","--disable-gpu","--no-first-run","--no-default-browser-check",
  "--user-data-dir=$profileDir","--hide-scrollbars","--window-size=$W,$H",
  "--virtual-time-budget=25000","--screenshot=$Out","http://localhost:$Port/_artdir.html" `
  -NoNewWindow -Wait | Out-Null

if ($server -and -not $server.HasExited) { Stop-Process -Id $server.Id -Force }
try { Remove-Item -Recurse -Force -LiteralPath $profileDir -ErrorAction Stop } catch {}
try { Remove-Item -LiteralPath $scratch -Force -ErrorAction Stop } catch {}

if (Test-Path $Out) {
  Write-Host "$Scene / $Dir -> $Out ($((Get-Item $Out).Length) bytes)" -ForegroundColor Green
  exit 0
} else { Write-Host "No screenshot produced." -ForegroundColor Red; exit 1 }

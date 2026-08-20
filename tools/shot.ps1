# Screenshot a named scene from the game, headless.
#   .\tools\shot.ps1 -Scene street -Out docs\m5-street.png
#
# NOTE: the render loop is deliberately left RUNNING. preserveDrawingBuffer is false,
# so a WebGL canvas that isn't actively rendering composites as pure black.
param(
  [string]$Scene = "street",
  [string]$Out   = "",
  [int]$W = 1280,
  [int]$H = 760,
  [int]$Port = 8396
)
$ErrorActionPreference = "Stop"
$root   = Split-Path $PSScriptRoot -Parent
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
if (-not $Out) { $Out = Join-Path $env:TEMP "sd-$Scene.png" }
if (-not [System.IO.Path]::IsPathRooted($Out)) { $Out = Join-Path $root $Out }

$open = "SD.GAME.hasSpareKey=true; SD.useDoor(SD.frontDoor);"
$setups = @{
  street = @"
  SD.startHouse();
  SD.player.position.set(0.6,0,-7.4); SD.player.rotation.y=0;
  SD.S.yaw=Math.PI; SD.S.pitch=0.20; SD.S.dist=5.4; SD.S.camP=null; SD.S.camL=null;
"@
  yard = @"
  SD.startHouse();
  SD.player.position.set(-1.4,0,-5.0); SD.player.rotation.y=0.6;
  SD.S.yaw=Math.PI*0.82; SD.S.pitch=0.16; SD.S.dist=4.0; SD.S.camP=null; SD.S.camL=null;
"@
  hall = @"
  SD.startHouse(); $open
  SD.player.position.set(-2.6,0,-2.5); SD.player.rotation.y=Math.PI*1.5;
  SD.S.yaw=Math.PI*0.5; SD.S.pitch=0.14; SD.S.dist=3.0; SD.S.camP=null; SD.S.camL=null;
"@
  bedroom = @"
  SD.startHouse(); $open
  SD.player.position.set(2.6,0,1.5); SD.player.rotation.y=0;
  SD.S.yaw=Math.PI; SD.S.pitch=0.30; SD.S.dist=3.2; SD.S.camP=null; SD.S.camL=null;
"@
  caught = @"
  SD.startHouse(); $open
  var w=SD.SLEEPERS[0];
  w.state='awake'; w.awake=99; w.look=Math.atan2(-1,0);
  w.group.userData.torso.rotation.x=-1.15;
  SD.player.position.set(w.x,0,w.z-1.3); SD.player.rotation.y=Math.PI;
  SD.S.yaw=0; SD.S.pitch=0.22; SD.S.dist=2.6; SD.S.camP=null; SD.S.camL=null;
  SD.NIGHT.running=false;
"@
  lounge = @"
  SD.startHouse(); $open
  SD.player.position.set(2.2,0,-1.0); SD.player.rotation.y=Math.PI;
  SD.S.yaw=0.9; SD.S.pitch=0.20; SD.S.dist=3.4; SD.S.camP=null; SD.S.camL=null;
"@
  focus = @"
  SD.startHouse(); $open
  var keys=SD.objects.filter(function(o){return o.kind==='keyring';})[0];
  SD.scanObject(keys); SD.requisition(keys);
  SD.player.position.set(-2.9,0,-2.6); SD.player.rotation.y=Math.PI/2;
  SD.S.yaw=Math.PI/2; SD.S.pitch=0.2; SD.S.dist=2.1; SD.S.camP=null; SD.S.camL=null;
  SD.enterFocus(keys);
"@
  day = @"
  SD.startHouse(); $open
  var keys=SD.objects.filter(function(o){return o.kind==='keyring';})[0];
  SD.scanObject(keys);
  SD.endNight('home','You are back before anyone stirs.');
  SD.startDay();
  SD.WIFE.susp=38; SD.GAME.hk=42;
  SD.DAY.block=3; SD.DAY.actions=2;
  SD.RESIDENTS.walt.beats=2; SD.RESIDENTS.june.beats=1;
  // M15: a run mid-flight, so the readout has something to say
  SD.RESIDENTS.walt.doubt=48; SD.RESIDENTS.june.doubt=31;
  SD.RESIDENTS.marisol.doubt=27; SD.RESIDENTS.aaron.doubt=12;
  SD.RESIDENTS.dev.doubt=19; SD.RESIDENTS.grace.doubt=8;
  SD.GAME.day=5; SD.GAME.sightings=1;
  SD.GAME.hardened=['lights','dogs'];
  SD.doAction('walk');
"@
  shop = @"
  SD.startHouse(); $open
  SD.GAME.bank=520; SD.GAME.cash=90; SD.GAME.hk=64;
  ['keyring','coffeeMug','cerealBox'].forEach(function(k){
    var o=SD.objects.filter(function(x){return x.kind===k;})[0];
    if(o) SD.scanObject(o);
  });
  SD.openShop();
"@
  intro = @"
  SD.GUIDE.setOn(true);
  SD.beginRun();
"@
  guide = @"
  SD.startHouse(); SD.GUIDE.setOn(true); SD.GUIDE.reset();
  SD.player.position.set(-9.0,0,-6.4); SD.player.rotation.y=Math.PI*0.5;
  SD.S.yaw=Math.PI*1.5; SD.S.pitch=0.18; SD.S.dist=4.6; SD.S.camP=null; SD.S.camL=null;
  SD.GUIDE.render();
"@
  watchman = @"
  SD.startHouse(); $open
  // everything the street can install, on at once, so it can all be SEEN (M19)
  SD.GAME.hardened=['lights','dogs','watch','cameras'];
  SD.nightReset();
  SD.NIGHT.running=true;
  // stand on your own path, looking up the street at him coming
  // walking AWAY: he cannot see behind himself (the ahead test), so this is a
  // safe place to stand and watch him go - and it shows the word on the jacket
  SD.WATCH.x=SD.houseById('hoyt').x-6; SD.WATCH.dir=-1;
  SD.player.position.set(SD.WATCH.x+3.4,0,SD.WATCH.z+2.4);
  SD.S.yaw=Math.atan2(3.4,2.4); SD.S.pitch=0.10; SD.S.dist=3.2;
  SD.S.camP=null; SD.S.camL=null;
  SD.run(40,1/60);
  // Freeze the clock. shot.ps1 leaves the render loop LIVE for several seconds (see
  // the note at the top), so a watchman patrolling at 2.3 m/s walks half the street
  // before the shutter opens - and catches you. The bodies stay rendered; nobody
  // moves and nobody sees.
  SD.NIGHT.running=false;
"@
  harden = @"
  SD.startHouse(); $open
  // just under the first fracture threshold (25), so the STREET card is the event
  ['walt','june','marisol','aaron','dev','grace'].forEach(function(k){
    SD.RESIDENTS[k].doubt=21; SD.RESIDENTS[k].fired={25:1};
  });
  var mug=SD.objects.filter(function(o){return o.kind==='coffeeMug'&&o.owner==='walt';})[0];
  SD.GAME.hk=99; SD.GAME.bank=9000;
  SD.scanObject(mug);
  var st=SD.shopStock(mug.id,'bulwark'), pick=0;
  for(var i=0;i<st.length;i++){ if(SD.predict(mug.id,st[i]).text==='DOUBT'){pick=i;break;} }
  SD.buyVariant(mug.id,pick,'bulwark');
  var mine=SD.invFor(mug.id); if(mine.length) SD.swapWith(mug,mine.length-1);
  SD.endNight('home','You are back on your own path before the sky changes.');
"@
  gossip = @"
  SD.startHouse(); $open
  SD.GAME.hk=99; SD.GAME.bank=200000;
  ['walt','june','marisol','aaron','dev','grace','ray'].forEach(function(k){
    SD.RESIDENTS[k].fired={25:1,50:1,75:1,100:1};   // keep fractures out of the frame
  });
  var o=SD.objects.filter(function(x){return x.owner==='marisol';})[0];
  SD.scanObject(o);
  var sh=SD.shopStock(o.id,'thrift'), worst=-1, wi=-1;
  sh.forEach(function(it,i){ var p=SD.predict(o.id,it);
    if(p&&p.text==='CERTAINTY'&&p.delta>worst){worst=p.delta;wi=i;} });
  if(wi>=0){ SD.buyVariant(o.id,wi,'thrift');
             var m=SD.invFor(o.id); if(m.length) SD.swapWith(o,m.length-1); }
  SD.endNight('home','You are back on your own path before the sky changes.');
"@
  thrift = @"
  SD.startHouse(); $open
  SD.GAME.bank=520; SD.GAME.cash=90; SD.GAME.hk=64;
  ['curtains','cerealBox','tableLamp'].forEach(function(k){
    var o=SD.objects.filter(function(x){return x.kind===k&&x.owner==='grace';})[0];
    if(o) SD.scanObject(o);
  });
  SD.openShop('thrift');
"@
  fence = @"
  SD.startHouse(); $open
  SD.GAME.bank=900; SD.GAME.cash=40; SD.GAME.hk=88;
  // take four things first, so the counter has a haul on it to sell (M18)
  ['wallClock','coffeeMug','pictureFrame','doormat'].forEach(function(k){
    var o=SD.objects.filter(function(x){return x.kind===k;})[0];
    if(!o) return;
    SD.scanObject(o);
    SD.buyVariant(o.id,0,'bulwark');
    var m=SD.invFor(o.id);
    if(m.length) SD.swapWith(o,m.length-1);
  });
  SD.openShop('antique');
"@
  antique = @"
  SD.startHouse(); $open
  SD.GAME.bank=900; SD.GAME.hk=64;
  ['pictureFrame','wallClock'].forEach(function(k){
    var o=SD.objects.filter(function(x){return x.kind===k;})[0];
    if(o) SD.scanObject(o);
  });
  SD.openShop('antique');
"@
  talk = @"
  SD.startHouse(); $open
  SD.GAME.hk=64; SD.WIFE.susp=44;
  SD.endNight('home','x'); SD.startDay(); SD.DAY.block=4; SD.DAY.actions=2;
  SD.openTalk();
"@
  court = @"
  SD.startHouse();
  SD.player.position.set(6,0,-8.2); SD.player.rotation.y=0;
  SD.S.yaw=Math.PI*0.86; SD.S.pitch=0.34; SD.S.dist=13.0; SD.S.camP=null; SD.S.camL=null;
"@
  ending = @"
  SD.startHouse();
  SD.GAME.hk=80; SD.GAME.bank=200000;
  for(var n=0;n<7&&!SD.GAME.over;n++){
    SD.GAME.bought={};
    SD.objects.forEach(function(o){
      if(SD.GAME.over) return;
      SD.scanObject(o);
      var st=SD.shopStock(o.id);
      for(var i=0;i<st.length;i++){
        if(SD.predict(o.id,st[i]).text==='DOUBT'){
          SD.buyVariant(o.id,i);
          var m=SD.invFor(o.id);
          if(m.length) SD.swapWith(o,m.length-1);
          break;
        }
      }
    });
    SD.doMorning(); SD.checkEnding();
  }
  SD.showEnding();
"@
  fracture = @"
  SD.startHouse(); $open
  SD.GAME.bank=9000; SD.GAME.hk=70;
  var keys=SD.objects.filter(function(o){return o.kind==='keyring';})[0];
  var mug =SD.objects.filter(function(o){return o.kind==='coffeeMug';})[0];
  SD.RESIDENTS.walt.doubt=19;
  SD.scanObject(keys); SD.scanObject(mug);
  var st=SD.shopStock(keys.id);
  SD.buyVariant(keys.id, st.length-2); SD.swapWith(keys,0);
  for(var i=0;i<7;i++) SD.nudgeObject(mug,0.03,0);
  SD.endNight('home','You are back on the path before the sky changes.');
"@
  sound = @"
  SD.SFX.set('mute',false);
  SD.SFX.set('music',0.70); SD.SFX.set('world',0.85); SD.SFX.set('foley',0.90);
  SD.openSound('s-title');
"@
  report = @"
  SD.startHouse(); $open
  var by=function(k){return SD.objects.filter(function(o){return o.kind===k;})[0];};
  var keys=by('keyring'), mug=by('coffeeMug'), cereal=by('cerealBox');
  SD.scanObject(keys);   SD.requisition(keys);   SD.swapWith(keys,2);
  SD.scanObject(cereal); SD.requisition(cereal); SD.swapWith(cereal,0);
  for(var i=0;i<7;i++) SD.nudgeObject(mug,0.03,0);
  SD.endNight('home','You are back before anyone stirs.');
"@
}
if (-not $setups.ContainsKey($Scene)) {
  Write-Host "Unknown scene '$Scene'. Try: $($setups.Keys -join ', ')" -ForegroundColor Red
  exit 2
}

$inject = "<script>`n(function(){var SD=window.__SD; if(!SD) return;`n" +
          $setups[$Scene] + "`n})();`n</script>`n</body>"

$html = Get-Content (Join-Path $root "somethingsdifferent.html") -Raw -Encoding UTF8
$html = $html -replace '</body>', $inject
$scratch = Join-Path $root "_shot.html"
Set-Content -Path $scratch -Value $html -Encoding utf8

$server = Start-Process powershell `
  -ArgumentList "-NoProfile","-ExecutionPolicy","Bypass","-File","$root\tools\serve.ps1","-NoBrowser","-Port","$Port" `
  -WindowStyle Hidden -PassThru
Start-Sleep -Seconds 2

$profileDir = Join-Path $env:TEMP ("sd-shot-" + [System.Guid]::NewGuid().ToString("N").Substring(0,8))
Start-Process $chrome -ArgumentList `
  "--headless=new","--disable-gpu","--no-first-run","--no-default-browser-check",
  "--user-data-dir=$profileDir","--hide-scrollbars","--window-size=$W,$H",
  "--virtual-time-budget=25000","--screenshot=$Out","http://localhost:$Port/_shot.html" `
  -NoNewWindow -Wait | Out-Null

if ($server -and -not $server.HasExited) { Stop-Process -Id $server.Id -Force }
try { Remove-Item -Recurse -Force -LiteralPath $profileDir -ErrorAction Stop } catch {}
try { Remove-Item -LiteralPath $scratch -Force -ErrorAction Stop } catch {}

if (Test-Path $Out) {
  Write-Host "$Scene -> $Out ($((Get-Item $Out).Length) bytes)" -ForegroundColor Green
  exit 0
} else { Write-Host "No screenshot produced." -ForegroundColor Red; exit 1 }







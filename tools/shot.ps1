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
  [int]$Port = 0,
  # M58: which build to photograph. Defaults to the real game; point it at a
  # variant copy to compare two looks from the identical camera pose.
  [string]$Game = "somethingsdifferent.html"
)
# M56 - ONE PORT AND ONE SCRATCH FILE PER RUN, for the same reason smoketest.ps1
# got them: both were fixed constants, so a run that timed out left a server
# holding 8396 and every later shot hung waiting for it. Two shots at once also
# overwrote each other's _shot.html and photographed the wrong scene.
if ($Port -le 0) { $Port = 9300 + ($PID % 600) }
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
  # ── M50. THE SAME POSE ON TWO LOTS, ONE OF EACH HAND. If the mirror works these
  #    two frames are left/right flips of one another: driveway, window, the lot
  #    the porch light falls on. If it does not, one of them has a wall in it.
  front12 = @"
  SD.startHouse();
  SD.player.position.set(0.0,0,-9.4); SD.player.rotation.y=0;
  SD.S.yaw=Math.PI; SD.S.pitch=0.13; SD.S.dist=6.4; SD.S.camP=null; SD.S.camL=null;
"@
  front14 = @"
  SD.startHouse();
  var ox=SD.houseById('vance').x;
  SD.player.position.set(ox,0,-9.4); SD.player.rotation.y=0;
  SD.S.yaw=Math.PI; SD.S.pitch=0.13; SD.S.dist=6.4; SD.S.camP=null; SD.S.camL=null;
"@
  # 16 Ardsley: UNMIRRORED, but twice as far from the world origin as 14. If the black
  # wedge follows the lot rather than the hand, it is not the mirror's doing.
  front16 = @"
  SD.startHouse();
  var ox=SD.houseById('okonkwo').x;
  SD.player.position.set(ox,0,-9.4); SD.player.rotation.y=0;
  SD.S.yaw=Math.PI; SD.S.pitch=0.13; SD.S.dist=6.4; SD.S.camP=null; SD.S.camL=null;
"@
  # M51 probes: same frame as front16, with one candidate hidden each time.
  noband = @"
  SD.startHouse();
  var ox=SD.houseById('okonkwo').x;
  SD.scene.traverse(function(o){
    if(o.isMesh&&o.geometry&&o.geometry.type==='CylinderGeometry'&&
       o.geometry.parameters&&o.geometry.parameters.radiusTop>=90)o.visible=false;
  });
  SD.player.position.set(ox,0,-9.4); SD.player.rotation.y=0;
  SD.S.yaw=Math.PI; SD.S.pitch=0.13; SD.S.dist=6.4; SD.S.camP=null; SD.S.camL=null;
"@
  nosky = @"
  SD.startHouse();
  var ox=SD.houseById('okonkwo').x;
  SD.scene.traverse(function(o){
    if(o.isMesh&&o.geometry&&o.geometry.type==='SphereGeometry'&&
       o.geometry.parameters&&o.geometry.parameters.radius===70)o.visible=false;
  });
  SD.player.position.set(ox,0,-9.4); SD.player.rotation.y=0;
  SD.S.yaw=Math.PI; SD.S.pitch=0.13; SD.S.dist=6.4; SD.S.camP=null; SD.S.camL=null;
"@
  hall12 = @"


  SD.startHouse(); SD.GAME.hasSpareKey=true;
  SD.useDoor(SD.houseById('hoyt')._door);
  SD.player.position.set(-2.2,0,-3.9); SD.player.rotation.y=Math.PI;
  SD.S.yaw=Math.PI*0.62; SD.S.pitch=0.12; SD.S.dist=3.2; SD.S.camP=null; SD.S.camL=null;
"@
  hall14 = @"
  SD.startHouse(); SD.GAME.hasSpareKey=true;
  SD.useDoor(SD.houseById('vance')._door);
  var ox=SD.houseById('vance').x;
  SD.player.position.set(ox+2.2,0,-3.9); SD.player.rotation.y=Math.PI;
  SD.S.yaw=Math.PI*1.38; SD.S.pitch=0.12; SD.S.dist=3.2; SD.S.camP=null; SD.S.camL=null;
"@
  # M53: the hall at 16 Ardsley, which is plan B - one doorway off the hall, into the
  # kitchen, where plan A has two. Same pose as hall12 so the two can be compared.
  hall16 = @"
  SD.startHouse(); SD.GAME.hasSpareKey=true;
  SD.useDoor(SD.houseById('okonkwo')._door);
  var ox=SD.houseById('okonkwo').x;
  SD.player.position.set(ox-2.2,0,-3.9); SD.player.rotation.y=Math.PI;
  SD.S.yaw=Math.PI*0.62; SD.S.pitch=0.12; SD.S.dist=3.2; SD.S.camP=null; SD.S.camL=null;
"@
  # M54: time held. Somebody is sitting up in the dark with a line of sight to you,
  # which is the exact moment the power is for - and the exact moment it costs most.
  freeze = @"
  SD.startHouse(); SD.beginNight();
  SD.GAME.hasSpareKey=true; SD.useDoor(SD.frontDoor);
  var w=SD.SLEEPERS[0];
  w.state='stirring'; w.stir=3; w.look=Math.atan2(-1,0);
  w.group.userData.torso.rotation.x=-0.42;
  SD.player.position.set(w.x+0.9,0,w.z-1.8); SD.player.rotation.y=Math.PI;
  SD.S.yaw=0.35; SD.S.pitch=0.20; SD.S.dist=3.0; SD.S.camP=null; SD.S.camL=null;
  SD.S.daytime=false; SD.S.evening=false; SD.S.freeze=0; SD.S.freezeCd=0;
  /* The real freeze is four seconds and the harness takes longer than that to
     settle and capture, so the first version of this shot photographed a world
     that had already started again. Hold it open for the photograph. */
  SD.CONST.FREEZE_T=45;
  SD.freezeTime();
"@
  # M57: the night HUD with a ledger behind it. The score used to be on the day screen
  # only, so a player watched NOISE 0% and SEEN 0/3 all night while the number the run
  # is scored on was somewhere they could not see until morning.
  ledger = @"
  SD.startHouse(); SD.beginNight();
  SD.GAME.hasSpareKey=true; SD.useDoor(SD.frontDoor);
  SD.GAME.bank=100000;
  var done=0;
  for(var i=0;i<SD.objects.length&&done<3;i++){
    var o=SD.objects[i];
    if(!SD.RESIDENTS[o.owner])continue;
    SD.scanObject(o);
    if(!SD.fabricate(o))continue;
    var bag=SD.invFor(o.id);
    if(!bag.length)continue;
    SD.swapWith(o,bag.length-1); done++;
  }
  var t=SD.objects.filter(function(x){return SD.RESIDENTS[x.owner];})[6];
  SD.player.position.set(t.spec._pos[0]+0.7,0,t.spec._pos[2]-1.5);
  SD.S.yaw=Math.PI*0.86; SD.S.pitch=0.16; SD.S.dist=3.0;
  SD.S.camP=null; SD.S.camL=null;
  SD.S.daytime=false; SD.S.evening=false;
"@
  # M58 check the pbr judge flagged: glass props carry envMapIntensity 1.10, the
  # highest in the table. In an UNLIT room a self-lit jar would give away an object
  # that should be invisible. Every practical is zeroed; only moon and hemi remain.
  glassdark = @"
  SD.startHouse(); SD.beginNight(); SD.GAME.hasSpareKey=true;
  SD.scene.traverse(function(l){ if(l.isPointLight||l.isSpotLight) l.intensity=0; });
  var g=SD.objects.filter(function(o){var k=SD.PROP_KINDS[o.kind];return k&&k.mtl==='glass'&&SD.RESIDENTS[o.owner];})[0]
       ||SD.objects.filter(function(o){return SD.RESIDENTS[o.owner];})[0];
  var h=SD.houseById(g.house||'hoyt'); if(h&&h._door)SD.useDoor(h._door);
  SD.player.position.set(g.spec._pos[0]+0.4,0,g.spec._pos[2]-1.3); SD.player.rotation.y=Math.PI;
  SD.S.yaw=Math.PI*0.9; SD.S.pitch=0.22; SD.S.dist=2.2; SD.S.camP=null; SD.S.camL=null;
  SD.S.daytime=false; SD.S.evening=false;
"@
  lounge = @"





  SD.startHouse(); $open
  SD.player.position.set(2.2,0,-1.0); SD.player.rotation.y=Math.PI;
  SD.S.yaw=0.9; SD.S.pitch=0.20; SD.S.dist=3.4; SD.S.camP=null; SD.S.camL=null;
"@
  focus = @"
  SD.startHouse(); $open
  var keys=SD.objects.filter(function(o){return o.kind==='keyring';})[0];
  SD.scanObject(keys); SD.fabricate(keys);
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
  evening = @"
  SD.startHouse();
  SD.WIFE.susp=72;                 // tier where she stops pretending to sit down
  SD.startEvening();
  var d=SD.DANA;
  // forward is (-sin yaw, -cos yaw): yaw 0 looks toward -z, which is where she is
  SD.player.position.set(d.position.x+0.6,0,d.position.z+2.6);
  SD.S.yaw=0; SD.S.pitch=0.12; SD.S.dist=3.6;
  SD.S.camP=null; SD.S.camL=null;
  SD.run(20,1/60);
"@
  daylight = @"
  SD.startHouse();
  SD.RESIDENTS.walt.beats=2; SD.RESIDENTS.june.beats=1; SD.RESIDENTS.marisol.beats=3;
  /* The walk is an AFTERNOON action, so in play the day pill always reads
     AFTERNOON. Calling startWalk() straight from here leaves DAY.block at 0 and
     the shot advertised "DAY 1 of 10 . MORNING" over a scene that can only
     happen at three. Put the day where the action actually lives. */
  SD.GAME.day=3; SD.DAY.block=3;
  SD.startWalk();
  SD.player.position.set(SD.houseById('hoyt').x-4.2,0,-10.2);
  SD.S.yaw=Math.PI*1.16; SD.S.pitch=0.13; SD.S.dist=5.6;
  SD.S.camP=null; SD.S.camL=null;
  SD.run(20,1/60);
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
  SD.scanObject(keys);   SD.fabricate(keys);   SD.swapWith(keys,0);
  SD.scanObject(cereal); SD.fabricate(cereal); SD.swapWith(cereal,0);
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

$gameFile = Join-Path $root $Game
if (-not (Test-Path $gameFile)) { Write-Host "Game not found: $gameFile" -ForegroundColor Red; exit 2 }
$html = Get-Content $gameFile -Raw -Encoding UTF8
$html = $html -replace '</body>', $inject
$scratchName = "_shot-$PID.html"
$scratch = Join-Path $root $scratchName
Set-Content -Path $scratch -Value $html -Encoding utf8

$server = Start-Process powershell `
  -ArgumentList "-NoProfile","-ExecutionPolicy","Bypass","-File","$root\tools\serve.ps1","-NoBrowser","-Port","$Port" `
  -WindowStyle Hidden -PassThru
Start-Sleep -Seconds 2

$profileDir = Join-Path $env:TEMP ("sd-shot-" + [System.Guid]::NewGuid().ToString("N").Substring(0,8))
Start-Process $chrome -ArgumentList `
  "--headless=new","--disable-gpu","--no-first-run","--no-default-browser-check",
  "--user-data-dir=$profileDir","--hide-scrollbars","--window-size=$W,$H",
  "--virtual-time-budget=25000","--screenshot=$Out","http://localhost:$Port/$scratchName" `
  -NoNewWindow -Wait | Out-Null

if ($server -and -not $server.HasExited) { Stop-Process -Id $server.Id -Force }
try { Remove-Item -Recurse -Force -LiteralPath $profileDir -ErrorAction Stop } catch {}
try { Remove-Item -LiteralPath $scratch -Force -ErrorAction Stop } catch {}

if (Test-Path $Out) {
  Write-Host "$Scene -> $Out ($((Get-Item $Out).Length) bytes)" -ForegroundColor Green
  exit 0
} else { Write-Host "No screenshot produced." -ForegroundColor Red; exit 1 }







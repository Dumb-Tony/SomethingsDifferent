/* M19 — THE THREATS HAVE BODIES.
   Four of the five things the street installs to stop you had no physical form at
   all. The worst was the neighbourhood watch: a man who patrols at 2.3 m/s and ENDS
   YOUR NIGHT from eleven metres, with no mesh, no torch and no footsteps — while the
   text announcing him said "a torch and no dog ... a jacket with a word on it". A
   stealth game whose threats are invisible is not difficult, it is unfair.

   And hardenNight() ran every night without tearing down the night before.
   MEASURED: 30 -> 34 -> 38 -> 42 -> 46 -> 50 light zones over six nights. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}

try{
var SD=window.__SD,C=SD.CONST;
SD.stopLoop();

/* Build the street ONCE. startHouse() rebuilds ~2000 meshes; calling it per section
   ran the harness out of virtual time and took the GPU process with it. Everything
   below only needs the night re-armed, which is what nightReset() is for. */
SD.startHouse();SD.S.menuOpen=false;
function allOn(){
  SD.GAME.hardened=['lights','dogs','watch','cameras'];
  SD.nightReset();
  SD.NIGHT.running=true;
  SD.S.menuOpen=false;
}

/* ── 1. THE LEAK ────────────────────────────────────────────────────────────
   hardenNight() is called from nightReset(), which runs EVERY night, and it
   pushed a fresh zone and a fresh PointLight per porch each time while only
   emptying the bookkeeping arrays. Nothing rebuilt the world between nights, so
   they stacked: by night ten every porch was lit ten times over. */
(function(){
  allOn();
  var zones=[],lights=[];
  for(var n=0;n<6;n++){
    SD.nightReset();
    zones.push(SD.LIGHTS.length);
    var L=0;SD.scene.traverse(function(o){if(o.isLight)L++;});
    lights.push(L);
  }
  info('light zones over six nights: '+zones.join(' -> '));
  info('THREE lights over six nights: '+lights.join(' -> '));
  ok('THE STREET NO LONGER LEAKS LIGHT ZONES EVERY NIGHT',
     zones[5]===zones[0],zones[0]+' -> '+zones[5]);
  ok('...nor real lights',lights[5]===lights[0],lights[0]+' -> '+lights[5]);
})();

/* ── 2. EVERY TIER YOU CAN BE CAUGHT BY HAS A BODY ──────────────────────────*/
(function(){
  allOn();
  ok('THE WATCHMAN EXISTS',!!(SD.WATCH&&SD.WATCH.group),
     SD.WATCH?'a body on the street':'still six numbers');
  var meshes=0;
  if(SD.WATCH&&SD.WATCH.group)
    SD.WATCH.group.traverse(function(o){if(o.isMesh)meshes++;});
  ok('...as an actual person, not a marker',meshes>=6,meshes+' meshes');
  ok('...carrying a torch that is a REAL light zone',
     !!SD.WATCH.zone&&SD.LIGHTS.indexOf(SD.WATCH.zone)>=0,
     'litAt() reads it, so the beam is the thing that catches you');
  ok('EVERY DOG HAS A DOG IN IT',
     SD.DOGS.length>0&&SD.DOGS.every(function(d){return !!d.group;}),
     SD.DOGS.length+' dogs');
  ok('...with a head that can go up',
     SD.DOGS.every(function(d){return !!(d.group&&d.group.userData.neck);}));
  var cams=SD.CAM_FX||[];
  ok('EVERY DOORBELL CAMERA HAS A LENS AND AN LED',
     cams.length>0&&cams.every(function(c){return !!c.led;}),cams.length+' units');
  ok('every porch light has something to come out of',
     SD.MOTION.length>0&&SD.MOTION.every(function(m){return !!m.lens;}),
     SD.MOTION.length+' fittings');
})();

/* ── 3. THE TORCH GOES WHERE HE GOES ────────────────────────────────────────*/
(function(){
  allOn();
  var w=SD.WATCH;
  w.x=0;w.dir=1;
  SD.player.position.set(0,0,40);          // far away: no sighting to interfere
  SD.run(30,1/60);
  var bodyX=w.group.position.x,zoneX=w.zone.x;
  ok('the body walks with the number',Math.abs(bodyX-w.x)<0.01,
     'body '+bodyX.toFixed(2)+' vs '+w.x.toFixed(2));
  ok('THE BEAM POINTS THE WAY HE IS WALKING',zoneX>w.x,
     'zone at '+zoneX.toFixed(2)+', he is at '+w.x.toFixed(2)+' walking +x');
  var x0=w.x;
  w.dir=-1;SD.run(30,1/60);
  ok('...and swaps when he turns round',w.zone.x<w.x,
     'zone at '+w.zone.x.toFixed(2)+', he is at '+w.x.toFixed(2)+' walking -x');
  ok('...and he is standing in his own light',
     SD.litAt(w.zone.x,w.zone.z)>=C.LIT_SEEN_MIN,
     SD.litAt(w.zone.x,w.zone.z).toFixed(2));
})();

/* ── 4. HE IS FAIR ──────────────────────────────────────────────────────────
   The rules that make an invisible instant-loss into a threat you can play
   around. All four were already in the code; none of them could be SEEN before,
   which is the only reason they read as unfair. */
(function(){
  function tryCatch(setup){
    allOn();
    var w=SD.WATCH;
    w.seen=false;
    setup(w);
    SD.run(4,1/60);
    return !SD.NIGHT.running;
  }
  var far=tryCatch(function(w){
    w.x=0;w.dir=1;SD.player.position.set(C.HARD_WATCH_R+6,0,w.z);
  });
  ok('HE CANNOT SEE PAST HIS OWN RANGE',!far,
     'stood '+(C.HARD_WATCH_R+6)+'m away, range is '+C.HARD_WATCH_R);
  var behind=tryCatch(function(w){
    w.x=0;w.dir=1;SD.player.position.set(-6,0,w.z);   // behind a man walking +x
  });
  ok('HE CANNOT SEE BEHIND HIMSELF',!behind,
     'stood 6m behind him, well inside range');
  var indoors=tryCatch(function(w){
    var h=SD.houseById('hoyt');
    w.x=h.x;w.dir=1;SD.player.position.set(h.x,0,0);  // inside the house
  });
  ok('HE DOES NOT WORK INDOORS',!indoors,
     'the yards are his, the rooms are not');
  // ...and he does catch you when he should, or none of the above means anything
  var caught=tryCatch(function(w){
    w.x=0;w.dir=1;SD.player.position.set(2.2,0,w.z);
  });
  ok('...BUT HE DOES CATCH YOU IN THE OPEN, TWO METRES IN FRONT OF HIM',caught,
     caught?'night over':'he saw nothing, which would make the rest of this vacuous');
  ok('...and the report knows who it was',
     !!(SD.S.lastSeenBy&&/jacket/.test(SD.S.lastSeenBy.who)),
     SD.S.lastSeenBy?SD.S.lastSeenBy.who:'nobody recorded');
})();

/* ── 5. THE DOG PUTS ITS HEAD UP ────────────────────────────────────────────*/
(function(){
  allOn();
  var d=SD.DOGS[0];
  var neck=d.group.userData.neck;
  neck.rotation.z=0;d.bark=0;d.cd=0;
  SD.player.position.set(d.x,0,d.z);        // stand in the yard with it
  SD.run(20,1/60);
  ok('STANDING IN THE YARD SETS IT OFF',d.cd>0,'cooldown '+d.cd.toFixed(1)+'s');
  SD.run(20,1/60);
  ok('...and it lifts its head to do it',neck.rotation.z<-0.05,
     'neck '+neck.rotation.z.toFixed(2)+' rad');
  // and it settles again
  d.bark=0;
  SD.run(120,1/60);
  ok('...then puts it down',neck.rotation.z>-0.05,neck.rotation.z.toFixed(2));
})();

/* ── 6. A SLEEPER WHO SEES YOU IS NAMED ─────────────────────────────────────*/
(function(){
  SD.nightReset();SD.S.menuOpen=false;
  SD.NIGHT.running=true;
  SD.S.lastSeenBy=null;
  var s=SD.SLEEPERS[0];
  SD.onSeen(s);
  ok('THE REPORT RECORDS WHO SAW YOU',
     !!SD.S.lastSeenBy&&SD.S.lastSeenBy.who===s.name,
     SD.S.lastSeenBy?SD.S.lastSeenBy.who:'nobody');
  ok('...and from where',
     SD.S.lastSeenBy&&typeof SD.S.lastSeenBy.x==='number',
     SD.S.lastSeenBy?(SD.S.lastSeenBy.x.toFixed(1)+', '+SD.S.lastSeenBy.z.toFixed(1)):'-');
})();

/* ── 7. AND NONE OF IT SURVIVES A REBUILD ───────────────────────────────────*/
(function(){
  allOn();
  var before=SD.LIGHTS.length;
  SD.GAME.hardened=[];
  SD.nightReset();
  ok('turning the street back off removes the bodies',
     SD.DOGS.length===0&&!SD.WATCH&&SD.MOTION.length===0);
  ok('...and their light with them',SD.LIGHTS.length<before,
     before+' -> '+SD.LIGHTS.length);
})();

var eb=document.getElementById('err-banner');
ok('no crash banner',!eb,eb?eb.textContent.slice(0,160):'');
}catch(e){
  fail++;out.push('FAIL  threw: '+(e&&e.message)+' @ '+
    String((e&&e.stack)||'').split('\n').slice(0,3).join(' | '));
}
var summary='SDTEST '+(fail===0?'ALL-PASS':'FAILURES')+' pass='+pass+' fail='+fail;
var pre=document.createElement('pre');pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\n'+summary+'\n'+out.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);document.title=summary;
})();


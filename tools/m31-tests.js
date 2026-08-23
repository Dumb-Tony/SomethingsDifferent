/* M31 — THE WORLD IS THE WORLD YOU LEFT.

   Four bugs that all have the same shape: state that outlives the thing that owned
   it. A light zone with no lamp. Hardening ids with no dogs. Last night's watchman
   standing in the road at three in the afternoon. An evening flag surviving into a
   brand-new run. None of them throw, none of them are visible in a screenshot of
   the frame they start in, and all four change where the player can be SEEN. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}

try{
var SD=window.__SD,C=SD.CONST;
SD.stopLoop();

/* ── 1. THE NIGHT CANNOT LEAVE A LIGHT BURNING ──────────────────────────────
   A 'light' event parks a zone of r=6.4 i=0.72 on a window. Only eventTick's expiry
   branch removed it, so ending the night early (curfew, seen, followed) welded it to
   the map for the rest of the run - one per night, cumulative, invisible. */
(function(){
  SD.startHouse();
  var base=SD.LIGHTS.length;
  info('a fresh street has '+base+' light zones');

  /* Fire one by hand and confirm it really does add a zone... */
  var ev=SD.EVENTS.filter(function(e){return e.kind==='light';})[0];
  ok('the night has a light event planned',!!ev,
     SD.EVENTS.map(function(e){return e.kind;}).join(','));
  SD.fireEvent(ev);
  var lit=SD.LIGHTS.length;
  ok('...and firing it lights a zone',lit===base+1,base+' -> '+lit);
  var zone=ev.zone;
  ok('...a bright one, over the seeing threshold',
     zone&&zone.i>C.LIT_SEEN_MIN,
     zone?('i='+zone.i+' vs LIT_SEEN_MIN '+C.LIT_SEEN_MIN):'no zone');

  /* ...then end the night the way a caught player does, mid-burn. */
  SD.endNight('seen','Somebody saw you.');
  ok('ENDING THE NIGHT MID-EVENT PUTS THE LIGHT OUT',SD.LIGHTS.length===base,
     base+' -> '+SD.LIGHTS.length+(SD.LIGHTS.length>base?' - a zone with no lamp':''));

  /* And the real proof: run several nights and check nothing accumulates. */
  SD.startHouse();
  var start=SD.LIGHTS.length,seen=[start];
  for(var n=0;n<6;n++){
    SD.nightReset();
    var e2=SD.EVENTS.filter(function(e){return e.kind==='light';})[0];
    if(e2)SD.fireEvent(e2);
    SD.endNight('curfew','The sky goes grey.');
    seen.push(SD.LIGHTS.length);
  }
  info('zones after each of six caught nights: '+seen.join(' '));
  ok('SIX NIGHTS CUT SHORT LEAVE NO ORPHANED LIGHT',
     seen.every(function(v){return v===start;}),
     'stayed at '+start);
})();

/* ── 2. LOADING A SAVE DOES NOT DISARM THE STREET ───────────────────────────
   loadGame() called startHouse() FIRST, which ran nightReset() against day 1 and an
   empty hardened list, and only then copied the saved GAME on top. The ids came
   back; the bodies never did. And fireHardening skips anything already listed, so
   they could never re-install either. */
(function(){
  SD.startHouse();
  /* Put a street together that has installed everything it can. */
  SD.GAME.day=8;
  SD.GAME.hardened=['lights','dogs','watch','cameras'];
  SD.nightReset();
  var live={dogs:SD.DOGS.length,watch:!!SD.WATCH,zones:SD.LIGHTS.length};
  info('a hardened street: '+live.dogs+' dogs, watchman='+live.watch+
       ', '+live.zones+' light zones');
  ok('the hardened street actually has bodies in it',
     live.dogs>0&&live.watch,JSON.stringify(live));

  SD.saveGame();
  SD.startHouse();                       // wipe back to a soft day-1 street
  ok('...and a new run is soft again',SD.DOGS.length===0&&!SD.WATCH,
     SD.DOGS.length+' dogs');

  var loaded=SD.loadGame();
  ok('the save loads',loaded===true);
  ok('...with the saved day',SD.GAME.day===8,'day '+SD.GAME.day);
  ok('...and the saved hardening list',SD.GAME.hardened.length===4,
     SD.GAME.hardened.join(','));
  ok('A LOADED SAVE STILL HAS ITS DOGS',SD.DOGS.length>0,
     SD.DOGS.length+' dogs (was '+live.dogs+')');
  ok('...AND ITS WATCHMAN',!!SD.WATCH);
  ok('...and its porch lights',SD.LIGHTS.length===live.zones,
     SD.LIGHTS.length+' vs '+live.zones);
  ok('...and tonight is seeded off the saved day, not day 1',
     SD.EVENTS.length>0,SD.EVENTS.length+' events planned');
})();

/* ── 3. THE AFTERNOON IS NOT LAST NIGHT WITH THE LIGHTS ON ──────────────────
   hardClear() had one caller: the top of hardenNight(), reached only from
   nightReset(). startWalk() and startEvening() never called it, and hardenTick()
   returns early when the night is not running - so the bodies froze in place. */
(function(){
  SD.startHouse();
  SD.GAME.day=8;SD.GAME.hardened=['lights','dogs','watch','cameras'];
  SD.nightReset();
  var nightDogs=SD.DOGS.length,nightZones=SD.LIGHTS.length;
  ok('the night before has dogs out',nightDogs>0,nightDogs+' dogs');

  SD.startWalk();
  ok('THE AFTERNOON HAS NO DOGS FROZEN IN IT',SD.DOGS.length===0,
     SD.DOGS.length+' dogs still standing at 15:00');
  ok('...and no watchman in the middle of the road',!SD.WATCH);
  ok('...and no porch lamps lit at three in the afternoon',
     SD.LIGHTS.length<nightZones,nightZones+' -> '+SD.LIGHTS.length);
  SD.endWalk();

  SD.startHouse();
  SD.GAME.day=8;SD.GAME.hardened=['lights','dogs','watch','cameras'];
  SD.nightReset();
  SD.startEvening();
  ok('THE EVENING IS NOT WATCHED BY LAST NIGHT',
     SD.DOGS.length===0&&!SD.WATCH,
     SD.DOGS.length+' dogs, watchman='+!!SD.WATCH);
  SD.endEvening();
})();

/* ── 4. RUN IT AGAIN REALLY STARTS AGAIN ────────────────────────────────────*/
(function(){
  SD.startHouse();
  SD.startEvening();
  ok('you are in the evening',SD.S.evening===true);
  SD.startHouse();                       // exactly what RUN IT AGAIN calls
  ok('STARTING OVER FROM THE EVENING DOES NOT LEAVE YOU IN IT',
     SD.S.evening===false,'S.evening='+SD.S.evening);
  ok('...and Dana is not still in the new lounge',!SD.DANA);

  SD.startHouse();
  SD.startWalk();
  SD.startHouse();
  ok('...same from the afternoon',SD.S.daytime===false&&SD.DAYFOLK.length===0,
     'daytime='+SD.S.daytime+' folk='+SD.DAYFOLK.length);

  SD.S.scanCd=9;SD.GAME.lastWindow='mug';
  SD.startHouse();
  ok('THE FIRST Q OF A NEW RUN IS NOT ON COOLDOWN',SD.S.scanCd===0,
     'scanCd='+SD.S.scanCd);
  ok('...and no shop window remembers the last street',!SD.GAME.lastWindow,
     String(SD.GAME.lastWindow));
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

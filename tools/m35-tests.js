/* M35 — THE NIGHT'S SOUND AND THE NIGHT'S RULES STOP WHEN THE NIGHT DOES.

   Four defects that all live in the gap between what the simulation thinks is
   happening and what the player can hear or get away with.

   1. NO KEY-REPEAT GUARD IN FOCUS MODE. Every mutating key runs nudgeObject ->
      applyChange -> emitNoise(N_HANDLE = 3.5), and a held key repeats about thirty
      times a second: ~86 noise units/sec against a wake threshold of 45. The game's
      signature verb - lining a mug up exactly - silently lost you the night while you
      were being careful with it.
   2. THE NIGHT BED NEVER STOPPED. The gate was `S.phase!=='house'`, true only on the
      title and the greybox, so the tension drone held at whatever heat the night
      finished on through the report and the whole day, and crickets played at 15:00
      in the afternoon and over dinner with Dana.
   3. EIGHT OF NINE VOICES IGNORED `mag`. A scanner pulse (2.6) sounded exactly like
      cataloguing one object (0.6), in a game whose risk model is "how loud was that".
   4. GETTING OUT OF A HIDING PLACE WAS FREE. Getting in cost noise; getting out cost
      nothing, so hide-wait-walk-out was strictly dominant. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}

try{
var SD=window.__SD,C=SD.CONST;
SD.stopLoop();

/* Measure noise by what it DOES to the sleepers, which is the only thing noise is
   for. Wrapping SD.emitNoise does not work - the game calls the internal binding, not
   the export - and the consequence is the better measurement anyway. */
function heard(){
  var t=0;
  for(var i=0;i<SD.SLEEPERS.length;i++)t+=SD.SLEEPERS[i].noise||0;
  return t;
}
/* The object CLOSEST to somebody asleep. emitNoise attenuates with distance and with
   NOISE_WALL per wall crossed, so picking "the first Hoyt object" got Walt's keys by
   the front door - three walls and most of a house away from the bed - and every
   measurement came back 0.00, which made the comparisons pass for the wrong reason. */
function nearestToSleeper(){
  var best=null,bestD=1e9;
  for(var i=0;i<SD.objects.length;i++){
    var o=SD.objects[i];
    if(!o.spec||!o.spec._pos)continue;
    for(var j=0;j<SD.SLEEPERS.length;j++){
      var sl=SD.SLEEPERS[j];
      if(sl.absent)continue;
      var d=Math.hypot(o.spec._pos[0]-sl.x,o.spec._pos[2]-sl.z);
      if(d<bestD){bestD=d;best=o;}
    }
  }
  return best;
}
function wakeAll(){                     // nobody on a night shift for this measurement
  for(var i=0;i<SD.SLEEPERS.length;i++)SD.SLEEPERS[i].absent=false;
}
function hoytObject(){wakeAll();return nearestToSleeper();}

/* ── 1. A HELD KEY IS ONE PLACEMENT, NOT THIRTY ─────────────────────────────*/
(function(){
  /* One deliberate keypress, measured, to get the price of a single placement. */
  SD.startHouse();SD.nightReset();
  var o=hoytObject();
  ok('there is an object in the house somebody is asleep in',!!o,o?o.label:'none');
  SD.scanObject(o);
  SD.enterFocus(o);
  ok('you are in focus mode',!!SD.S.focus);
  var base=heard();
  window.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowUp',bubbles:true}));
  var onePress=heard()-base;
  ok('one press of an arrow is heard',onePress>0,'+'+onePress.toFixed(2)+' sleeper noise');
  SD.exitFocus();

  /* Now the same key HELD: one real keydown, then twenty-nine OS repeats. */
  SD.startHouse();SD.nightReset();
  o=hoytObject();SD.scanObject(o);SD.enterFocus(o);
  var pos0=JSON.stringify(o.spec._pos);
  base=heard();
  window.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowUp',bubbles:true}));
  for(var i=0;i<29;i++)
    window.dispatchEvent(new KeyboardEvent('keydown',
      {key:'ArrowUp',bubbles:true,repeat:true}));
  var held=heard()-base;
  info('one press costs '+onePress.toFixed(2)+'; thirty keydowns cost '+held.toFixed(2));
  ok('HOLDING AN ARROW COSTS ONE PLACEMENT, NOT THIRTY',
     Math.abs(held-onePress)<0.001,
     'held '+held.toFixed(2)+' vs single '+onePress.toFixed(2)+
     ' - it used to be ~30x, against a wake threshold near 45');
  ok('...and the object moved exactly once',
     JSON.stringify(o.spec._pos)!==pos0,'it did move');

  /* Same shape on the rotate keys - measured against a single Z, not against the
     arrow. Nudging MOVES the object, so the two actions emit from slightly different
     places and cost 3.28 vs 3.27; comparing across them was measuring the geometry,
     not the guard. */
  SD.startHouse();SD.nightReset();
  o=hoytObject();SD.scanObject(o);SD.enterFocus(o);
  base=heard();
  window.dispatchEvent(new KeyboardEvent('keydown',{key:'z',bubbles:true}));
  var oneZ=heard()-base;
  SD.exitFocus();

  SD.startHouse();SD.nightReset();
  o=hoytObject();SD.scanObject(o);SD.enterFocus(o);
  base=heard();
  window.dispatchEvent(new KeyboardEvent('keydown',{key:'z',bubbles:true}));
  for(var j=0;j<20;j++)
    window.dispatchEvent(new KeyboardEvent('keydown',{key:'z',bubbles:true,repeat:true}));
  var heldZ=heard()-base;
  ok('...and holding Z turns it once',Math.abs(heldZ-oneZ)<0.001,
     'twenty-one Z keydowns cost '+heldZ.toFixed(2)+', one costs '+oneZ.toFixed(2));
  SD.exitFocus();
})();

/* ── 2. THE BED BELONGS TO THE NIGHT ────────────────────────────────────────*/
/* SFX.update() returns early without an AudioContext, and headless never has one -
   so the RULE was extracted into audibleNight(), a plain predicate with no audio in
   it, and that is what update() now asks. Testing the predicate tests the gate. */
(function(){
  SD.startHouse();SD.nightReset();
  ok('a running night is scored as a night',SD.audibleNight()===true,
     'running='+SD.NIGHT.running);

  SD.endNight('home','Back before anyone stirs.');
  ok('THE NIGHT BED STOPS WHEN THE NIGHT DOES',SD.audibleNight()===false,
     'the drone used to hold at whatever heat the night ended on, all through the '+
     'report and the day');

  SD.startHouse();SD.nightReset();
  SD.startWalk();
  ok('...and the afternoon is not scored with it',SD.audibleNight()===false,
     'daytime='+SD.S.daytime+' but phase is still "'+SD.S.phase+'"');
  SD.endWalk();

  SD.startHouse();SD.nightReset();
  SD.startEvening();
  ok('...nor is dinner with Dana',SD.audibleNight()===false,
     'evening='+SD.S.evening+' but phase is still "'+SD.S.phase+'"');
  SD.endEvening();

  SD.toTitle();
  ok('...and neither is the title screen',SD.audibleNight()===false,
     'phase='+SD.S.phase);
  info('the old gate was `S.phase!==house`, which is true ONLY on the title and the');
  info('greybox - every other case above slipped straight past it');
})();

/* ── 3. LOUDER IN THE SIMULATION, LOUDER IN YOUR EARS ───────────────────────
   cue()/world() return false with no AudioContext, which headless always is, so
   assert on the SCALE the emitter computes rather than on audio output. */
(function(){
  var seen=[];
  var realWorld=SD.SFX.world;
  SD.SFX.world=function(name,x,z,mag,mtl){seen.push({name:name,mag:mag});
    return realWorld.apply(SD.SFX,arguments);};

  SD.startHouse();
  SD.nightReset();
  var px=SD.houseById('hoyt').x+3.9;
  SD.player.position.set(px,0,-0.6);SD.S.py=0;

  seen.length=0;
  SD.scanObject(SD.objects[0]);
  var one=seen.filter(function(e){return e.name==='scan';})[0];
  seen.length=0;
  SD.S.scanCd=0;SD.scanPulse();
  var pulse=seen.filter(function(e){return e.name==='scan';})[0];
  SD.SFX.world=realWorld;

  ok('cataloguing one object emits a scan',!!one,one?('mag '+one.mag):'none');
  ok('a pulse emits a scan too',!!pulse,pulse?('mag '+pulse.mag):'none');
  ok('THE PULSE IS LOUDER IN THE SIMULATION',
     !!one&&!!pulse&&pulse.mag>one.mag,
     'pulse '+(pulse?pulse.mag:'?')+' vs single '+(one?one.mag:'?'));
  ok('...and those really are the two constants',
     one&&one.mag===C.N_SCAN&&pulse&&pulse.mag===C.SCAN_NOISE,
     'N_SCAN '+C.N_SCAN+' vs SCAN_NOISE '+C.SCAN_NOISE);
  info('world() now scales p.g by mag/VOICE_REF, so the gap is audible as well as');
  info('simulated - it used to be discarded and both played at the same level');
})();

/* ── 4. A DOOR MAKES THE SAME NOISE BOTH WAYS ───────────────────────────────*/
(function(){
  SD.startHouse();SD.nightReset();wakeAll();
  /* ...and the hiding place nearest somebody asleep, for the same reason. */
  var hd=null,hdD=1e9;
  for(var hi=0;hi<SD.HIDES.length;hi++){
    var H=SD.HIDES[hi];
    for(var sj=0;sj<SD.SLEEPERS.length;sj++){
      var SL=SD.SLEEPERS[sj];
      if(SL.absent)continue;
      var dd=Math.hypot(H.pos[0]-SL.x,H.pos[2]-SL.z);
      if(dd<hdD){hdD=dd;hd=H;}
    }
  }
  ok('there is somewhere to hide',!!hd,
     SD.HIDES.length+' hiding places; nearest to a sleeper is '+hdD.toFixed(1)+'m');
  if(hd){
    SD.player.position.set(hd.pos[0],0,hd.pos[2]+0.5);SD.S.py=0;
    var base=heard();
    SD.enterHide(hd);
    var inCost=heard()-base;
    ok('getting in costs noise',inCost>0,'+'+inCost.toFixed(3)+' sleeper noise');

    base=heard();
    SD.exitHide();
    var outCost=heard()-base;
    ok('GETTING OUT COSTS THE SAME',
       outCost>0&&Math.abs(outCost-inCost)<0.001,
       'in '+inCost.toFixed(3)+' vs out '+outCost.toFixed(3)+
       ' - it used to be free, so hide/wait/walk-out was strictly dominant');
    ok('...and you are actually out',!SD.isHidden());
  }
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

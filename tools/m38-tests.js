/* M38 — THE CUES THAT WERE NEVER THERE.

   The game spends a whole audio system on a creaking floorboard and then says nothing
   at all when the things that can actually end your run happen.

   DANA'S LADDER had exactly one sound on it, and it fires when the run is already
   lost. Her tier-2 (she wakes and checks the bed) and tier-4 (she comes out of the
   front door after you, on a FOLLOW_GRACE countdown) were text-only — an invisible
   timer counting down to a loss.

   THE 'light' EVENT drops a 6.4m zone at intensity 0.72 into LIGHTS — well over
   LIT_SEEN_MIN — and made no sound whatsoever. It is the one event in the game that
   changes where you can be seen, and it arrived in silence.

   THE FENCE paid with the SHOP'S till beep: the same bright two notes you hear buying
   a mug in Bulwark Mart, for selling somebody's possession two towns over.

   THE WORLD MIXER SLIDER previewed `CUES.ui`, which is on the FOLEY bus — directly
   underneath a comment saying each slider previews its own bus. No cue in the bank
   routed to `world` at all, so the slider gave no feedback about what it moves.

   And M20's afternoon, M25's familiarity payoff and M28's entire evening contained no
   SFX call of any kind. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}

try{
var SD=window.__SD,C=SD.CONST;
SD.stopLoop();

/* cue()/world() return false with no AudioContext, and headless never has one, so
   watch WHAT WAS ASKED FOR rather than what came out of the speakers. */
function listen(){
  var cues=[],worlds=[];
  var rc=SD.SFX.cue,rw=SD.SFX.world;
  SD.SFX.cue=function(n){cues.push(n);return rc.apply(SD.SFX,arguments);};
  SD.SFX.world=function(n,x,z,m,mt){worlds.push({n:n,x:x,z:z,mag:m});
    return rw.apply(SD.SFX,arguments);};
  return {cues:cues,worlds:worlds,stop:function(){SD.SFX.cue=rc;SD.SFX.world=rw;}};
}

/* ── 1. THE BANK HAS THE SOUNDS ─────────────────────────────────────────────*/
(function(){
  var cues=SD.SFX.cueNames(),voices=SD.SFX.voiceNames();
  info('cues:   '+cues.join(', '));
  info('voices: '+voices.join(', '));
  ['sell','street','danaUp','danaOut','win','lose'].forEach(function(n){
    ok('the bank has a "'+n+'" cue',cues.indexOf(n)>=0);
  });
  ok('...and a positioned "lightOn" VOICE, not a cue',
     voices.indexOf('lightOn')>=0&&cues.indexOf('lightOn')<0,
     'a window going on happens somewhere, so it gets quieter down the row');
})();

/* ── 2. DANA'S LADDER MAKES A SOUND BEFORE IT ENDS THE RUN ──────────────────*/
(function(){
  SD.startHouse();SD.nightReset();
  /* Put her check due now, and the player anywhere but home. */
  var away=SD.houseById('okonkwo');
  SD.player.position.set(away.x,0,-1.0);SD.S.py=0;
  SD.WIFE.check=0;SD.WIFE.follow=-1;SD.WIFE.following=false;
  var L=listen();
  SD.wifeNightTick(1/60);
  L.stop();
  ok('SHE WAKES AND CHECKS, AND YOU HEAR IT',L.cues.indexOf('danaUp')>=0,
     L.cues.join(',')||'silence');

  /* ...and the front door opening. */
  SD.startHouse();SD.nightReset();
  SD.player.position.set(away.x,0,-1.0);SD.S.py=0;
  SD.WIFE.check=-1;SD.WIFE.follow=0;SD.WIFE.following=false;
  L=listen();
  SD.wifeNightTick(1/60);
  L.stop();
  ok('SHE COMES OUT AFTER YOU, AND YOU HEAR THAT TOO',
     L.cues.indexOf('danaOut')>=0,L.cues.join(',')||'silence');
  ok('...and the follow really did start',SD.WIFE.following===true);
  info('FOLLOW_GRACE is '+C.FOLLOW_GRACE+' - it used to be an invisible countdown');

  /* Coming home safely is not the same event and must not fire the alarm. */
  SD.startHouse();SD.nightReset();
  SD.player.position.set(SD.HOME.x,0,SD.HOME.z);SD.S.py=0;
  SD.WIFE.check=0;SD.WIFE.follow=-1;
  L=listen();
  SD.wifeNightTick(1/60);
  L.stop();
  ok('...but being in bed when she checks does not sound the alarm',
     L.cues.indexOf('danaUp')<0,L.cues.join(',')||'silence, correctly');
})();

/* ── 3. A LIGHT GOING ON IS AUDIBLE, AND IT IS AUDIBLE FROM WHERE IT IS ─────*/
(function(){
  SD.startHouse();SD.nightReset();
  var ev=SD.EVENTS.filter(function(e){return e.kind==='light';})[0];
  ok('the night has a light event',!!ev);
  var L=listen();
  SD.fireEvent(ev);
  L.stop();
  var w=L.worlds.filter(function(e){return e.n==='lightOn';})[0];
  ok('A WINDOW GOING ON MAKES A SOUND',!!w,
     L.worlds.map(function(e){return e.n;}).join(',')||'silence');
  ok('...at the window, not at the listener',
     !!w&&!!ev.zone&&Math.abs(w.x-ev.zone.x)<0.01&&Math.abs(w.z-ev.zone.z)<0.01,
     w?('emitted at ('+w.x.toFixed(1)+','+w.z.toFixed(1)+'), zone at ('+
        ev.zone.x.toFixed(1)+','+ev.zone.z.toFixed(1)+')'):'no emission');
  ok('...and the zone it warns you about is a real one',
     ev.zone&&ev.zone.i>C.LIT_SEEN_MIN,
     ev.zone?('i='+ev.zone.i+' vs LIT_SEEN_MIN '+C.LIT_SEEN_MIN):'none');
})();

/* ── 4. THE FENCE DOES NOT SOUND LIKE A SHOP ────────────────────────────────*/
(function(){
  SD.startHouse();
  SD.GAME.bank=100000;SD.GAME.hk=99;
  var o=SD.objects[0];
  SD.scanObject(o);

  var L=listen();
  SD.buyVariant(o.id,0,'bulwark');
  L.stop();
  ok('buying makes the shop sound',L.cues.indexOf('buy')>=0,L.cues.join(','));

  var bag=SD.invFor(o.id);
  SD.swapWith(o,bag.length-1);
  L=listen();
  SD.sellItem(SD.HAUL.length-1,'thrift');
  L.stop();
  ok('SELLING MAKES ITS OWN SOUND',L.cues.indexOf('sell')>=0,L.cues.join(','));
  ok('...and it is not the shop till',L.cues.indexOf('buy')<0,
     'it used to replay the buy cue byte for byte');
})();

/* ── 5. EVERY SLIDER PREVIEWS ITS OWN BUS ───────────────────────────────────*/
(function(){
  var L=listen();
  var el=document.getElementById('mx-world');
  ok('the world slider exists',!!el);
  el.dispatchEvent(new Event('change',{bubbles:true}));
  L.stop();
  ok('THE WORLD SLIDER PREVIEWS A WORLD CUE',L.cues.indexOf('street')>=0,
     L.cues.join(',')+' - it used to preview "ui", which is on the foley bus');

  L=listen();
  document.getElementById('mx-foley').dispatchEvent(new Event('change',{bubbles:true}));
  document.getElementById('mx-music').dispatchEvent(new Event('change',{bubbles:true}));
  L.stop();
  ok('...and the other two still preview theirs',
     L.cues.indexOf('buy')>=0&&L.cues.indexOf('doubt')>=0,L.cues.join(','));
})();

/* ── 6. THE DAY LAYER IS NOT SILENT ─────────────────────────────────────────*/
(function(){
  SD.startHouse();
  var L=listen();
  SD.startWalk();
  L.stop();
  ok('THE AFTERNOON MAKES A SOUND',L.cues.length>0,
     L.cues.join(',')||'M20 shipped an entire afternoon with no audio');

  L=listen();
  SD.talkTo(SD.DAYFOLK[0]);
  L.stop();
  ok('...and so does standing next to somebody',L.cues.length>0,
     L.cues.join(',')||'M25 shipped familiarity with no audio');
  SD.endWalk();

  SD.startHouse();
  L=listen();
  SD.startEvening();
  L.stop();
  ok('...and so does the evening at home',L.cues.length>0,
     L.cues.join(',')||'M28 shipped a whole evening with no audio');
  SD.endEvening();
})();

/* ── 7. A REFUSED SCAN IS NOT A DROPPED KEYPRESS ────────────────────────────*/
(function(){
  SD.startHouse();SD.nightReset();
  SD.player.position.set(SD.houseById('hoyt').x+3.9,0,-0.6);SD.S.py=0;
  SD.S.scanCd=0;
  SD.scanPulse();
  ok('the scanner is now cycling',SD.S.scanCd>0,'cd '+SD.S.scanCd.toFixed(1));
  var L=listen();
  var r=SD.scanPulse();
  L.stop();
  ok('A REFUSED Q SAYS SO',r===null&&L.cues.indexOf('ui')>=0,
     L.cues.join(',')||'silence - indistinguishable from a dropped key');
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

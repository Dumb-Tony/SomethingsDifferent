/* M32 — THE ENDING SCREEN.

   The last thing you see in a ten-night run used to be six abstract meters, arriving
   in silence, under a headline that contradicted the panel printed directly beneath
   it, reached by pressing a button that still said CONTINUE.

   And the win was checked LAST, after every loss condition had already returned - so
   a run that crossed the collapse bar on the same morning Dana opened the folder was
   reported as a flat failure with a winning Collapse Index printed underneath the
   word INSUFFICIENT. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}

try{
var SD=window.__SD,C=SD.CONST;
SD.stopLoop();
function txt(){return document.getElementById('end-body').textContent;}
function title(){return document.getElementById('end-title').textContent;}
/* Force an ending by setting the state that causes it, never by writing GAME.over -
   the ordering inside checkEnding is the thing under test. */
function forceEnding(f){
  SD.startHouse();
  SD.GAME.over=null;
  /* M34: the win resolves at the DEADLINE (or when the player calls it in), so the
     endings are forced where they are actually decided. Losses fire on any morning,
     and still do here. */
  SD.GAME.day=C.SLICE_NIGHTS+1;
  f();
  return SD.checkEnding();
}
function allDoubt(v){
  SD.activeResidents().forEach(function(r){r.doubt=v;});
}

/* ── 1. THE RUN KEEPS ITS OWN LEDGER ────────────────────────────────────────*/
(function(){
  SD.startHouse();
  var s=SD.GAME.stats;
  ok('a new run starts with a blank ledger',
     s&&s.swapped===0&&s.scanned===0&&s.sold===0&&s.earned===0,
     JSON.stringify(s));

  SD.GAME.bank=100000;SD.GAME.hk=99;
  var o=SD.objects[0];
  SD.scanObject(o);
  ok('CATALOGUING IS COUNTED',SD.GAME.stats.scanned===1,
     'scanned='+SD.GAME.stats.scanned);
  SD.buyVariant(o.id,0,'bulwark');
  var bag=SD.invFor(o.id);
  SD.swapWith(o,bag.length-1);
  ok('SWAPPING IS COUNTED',SD.GAME.stats.swapped===1,
     'swapped='+SD.GAME.stats.swapped);
  var before=SD.GAME.stats.earned;
  SD.sellItem(SD.HAUL.length-1,'thrift');
  ok('SELLING IS COUNTED, AND SO IS THE MONEY',
     SD.GAME.stats.sold===1&&SD.GAME.stats.earned>before,
     'sold='+SD.GAME.stats.sold+' earned=$'+SD.GAME.stats.earned);

  SD.S.scanCd=0;
  SD.player.position.set(SD.houseById('hoyt').x+3.9,0,-0.6);SD.S.py=0;
  SD.scanPulse();
  ok('PULSES ARE COUNTED',SD.GAME.stats.pulses===1,'pulses='+SD.GAME.stats.pulses);

  SD.startHouse();
  ok('...and a new run wipes the ledger',
     SD.GAME.stats.swapped===0&&SD.GAME.stats.earned===0,
     JSON.stringify(SD.GAME.stats));
})();

/* ── 2. THE SCREEN REPORTS THE RUN YOU HAD ──────────────────────────────────*/
(function(){
  SD.startHouse();
  SD.GAME.stats={swapped:11,scanned:19,pulses:6,nightsOut:7,
                 sold:4,earned:317,hidden:2};
  allDoubt(90);
  SD.GAME.day=C.SLICE_NIGHTS+1;          // M34: the win lands at the deadline
  var e=SD.checkEnding();
  ok('a thoroughly fractured street wins',e&&e.kind==='win',e?e.kind:'no ending');
  SD.showEnding();
  var t=txt();
  ok('THE ENDING NAMES WHAT YOU DID, not only what it did to them',
     /WHAT YOU DID/.test(t)&&/THE MONEY/.test(t));
  ok('...the swaps',/Objects swapped\s*11/.test(t.replace(/\s+/g,' ')),'11 swaps');
  ok('...the catalogue',/Objects catalogued\s*19/.test(t.replace(/\s+/g,' ')));
  ok('...the pulses, the nights and the hiding',
     /Scanner pulses\s*6/.test(t.replace(/\s+/g,' '))&&
     /Nights out\s*7/.test(t.replace(/\s+/g,' '))&&
     /Times you hid\s*2/.test(t.replace(/\s+/g,' ')));
  ok('...AND THE MONEY THE FENCE MADE YOU',
     /Made from it\s*\$317/.test(t.replace(/\s+/g,' ')),'$317');
  ok('the six meters are still there too',
     /Collapse Index/.test(t)&&/Street suspicion/.test(t)&&/Sightings/.test(t));
})();

/* ── 3. THE WIN TEXT DOES NOT CONTRADICT THE PANEL UNDER IT ─────────────────
   It used to read "Nobody on Ardsley Court trusts what they remember" directly above
   "Fractured past 75: 0", because winBar() is a credibility-weighted MEAN of 40/100
   and a run can cross it with nobody past 75 at all. */
(function(){
  /* A win with NOBODY fractured: doubt spread evenly, just over the bar. */
  SD.startHouse();
  allDoubt(60);
  SD.GAME.day=C.SLICE_NIGHTS+1;          // M34
  var e=SD.checkEnding();
  ok('an even spread of doubt can win with nobody past 75',
     e&&e.kind==='win'&&SD.fracturedCount()===0,
     'ci='+e.ci.toFixed(1)+' bar='+(C.SLICE_WIN_COLLAPSE)+' fractured='+SD.fracturedCount());
  SD.showEnding();
  var t=txt();
  ok('THE WIN TEXT DOES NOT CLAIM NOBODY TRUSTS THEIR MEMORY',
     !/Nobody on Ardsley Court trusts/.test(t),
     'it says what actually happened instead');
  ok('...it describes the quiet version of the win',
     /agreed to stop mentioning/.test(t),'the whole street, quietly');

  /* ...and a win where people really did come apart says so, with the real count. */
  SD.startHouse();
  allDoubt(92);
  SD.GAME.day=C.SLICE_NIGHTS+1;          // M34
  SD.checkEnding();SD.showEnding();
  var t2=txt(),n=SD.fracturedCount();
  ok('a win with '+n+' people past 75 names that number',
     t2.indexOf(String(n))>=0&&/stopped trusting their own memory/.test(t2),
     n+' fractured');
})();

/* ── 4. WINNING AND LOSING ON THE SAME MORNING ──────────────────────────────*/
(function(){
  var e=forceEnding(function(){allDoubt(90);SD.WIFE.susp=100;});
  ok('CROSSING THE BAR ON THE MORNING SHE FINDS OUT IS NOT A FLAT LOSS',
     e&&e.kind==='pyrrhic',e?e.kind:'none');
  SD.showEnding();
  ok('...and the screen says both things',
     /method works/.test(txt())&&/Dana worked it out/.test(txt()));
  ok('...with its own headline',/FOUND OUT/.test(title()),title());

  e=forceEnding(function(){allDoubt(90);SD.GAME.sightings=C.SEEN_LIMIT;});
  ok('...same when the street settles on a burglar instead',
     e&&e.kind==='pyrrhic',e?e.kind:'none');

  /* A loss with no win is still a plain loss. */
  e=forceEnding(function(){SD.WIFE.susp=100;});
  ok('losing without winning is still just losing',e&&e.kind==='wife',e?e.kind:'none');
  /* ...and a win with no loss is still a plain win. */
  e=forceEnding(function(){allDoubt(90);});
  ok('winning without losing is still just winning',e&&e.kind==='win',e?e.kind:'none');
})();

/* ── 5. THE PROSE READS ITS NUMBERS OUT OF CONST ────────────────────────────*/
(function(){
  var e=forceEnding(function(){SD.GAME.sightings=C.SEEN_LIMIT;});
  ok('the sightings ending counts sightings, not people',
     e.text.indexOf(String(C.SEEN_LIMIT))>=0&&!/Three people have seen/.test(e.text),
     e.text.slice(0,60)+'...');
  e=forceEnding(function(){SD.GAME.day=C.SLICE_NIGHTS+1;});
  ok('the timeout reads the night count out of CONST',
     e&&e.kind==='timeout'&&e.text.indexOf(String(C.SLICE_NIGHTS))>=0,
     e?e.text.slice(0,40):'none');
})();

/* ── 6. IT MAKES A SOUND, AND IT HAS A WAY OUT ──────────────────────────────*/
(function(){
  var fired=[],realCue=SD.SFX.cue;
  SD.SFX.cue=function(n){fired.push(n);return realCue.apply(SD.SFX,arguments);};
  forceEnding(function(){allDoubt(90);});
  SD.showEnding();
  ok('WINNING MAKES A SOUND',fired.indexOf('win')>=0,fired.join(','));
  fired.length=0;
  forceEnding(function(){SD.WIFE.susp=100;});
  SD.showEnding();
  ok('...and so does losing',fired.indexOf('lose')>=0,fired.join(','));
  SD.SFX.cue=realCue;
  /* cue() returns false for an unknown name AND for a run with no AudioContext,
     which headless always is - so ask the bank what it holds instead. */
  var names=SD.SFX.cueNames();
  ok('both cues really exist in the bank, and are not typos',
     names.indexOf('win')>=0&&names.indexOf('lose')>=0,
     names.join(','));

  ok('THE ENDING CARD HAS A WAY BACK TO THE TITLE',
     !!document.getElementById('btn-end-title'),
     'RUN IT AGAIN used to be the only exit');
})();

/* ── 7. THE BUTTON SAYS WHAT IT DOES ────────────────────────────────────────*/
(function(){
  SD.startHouse();
  SD.showReport('home','Back before anyone stirs.');
  ok('an ordinary morning still says CONTINUE',
     document.getElementById('btn-report-ok').textContent==='CONTINUE',
     document.getElementById('btn-report-ok').textContent);

  SD.startHouse();
  allDoubt(90);
  SD.GAME.day=C.SLICE_NIGHTS+1;          // M34: the LAST morning, which is the claim
  SD.showReport('home','Back before anyone stirs.');
  ok('THE LAST MORNING SAYS WHAT THE BUTTON ACTUALLY DOES',
     document.getElementById('btn-report-ok').textContent!=='CONTINUE',
     document.getElementById('btn-report-ok').textContent);
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

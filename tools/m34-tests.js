/* M34 — THE LAST NIGHT.

   Three things about a run that has a deadline and never used it.

   1. CROSSING THE BAR ENDED THE RUN THAT MORNING. CONST's own measurement says the
      intended-strength player crosses on night 5 of 10, so playing WELL deleted half
      the game — nights 6-10, the late hardening tiers and the back half of the fence
      economy were content only a losing player ever saw. The assignment now runs its
      full length, and the player gets the decision instead: CALL IT IN.

   2. NOTHING MARKED THE LAST NIGHT. Night ten opened with the same one-line hint as
      night one.

   3. DANA'S NUMBER WAS NEVER SHOWN DURING A RUN. She has ended runs since M6 and the
      ending screen was the first time you ever saw the meter.

   And one thing that was NOT broken, which two audits agreed was: LOSE_STREET.
   Both concluded from a stale CONST note ("sloppy play peaks near 33", written when
   the street had 30 objects) that THEY COMPARED NOTES was unreachable dead content.
   tools/_street.js measured it against the real street and the real economy: four a
   night at the worst rung reaches 82.9 by night three. The note was stale; the
   number was right. This suite pins the measurement so it cannot rot again. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}

try{
var SD=window.__SD,C=SD.CONST;
SD.stopLoop();
function allDoubt(v){SD.activeResidents().forEach(function(r){r.doubt=v;});}

/* ── 1. A WINNING RUN GETS TO PLAY ALL TEN NIGHTS ───────────────────────────*/
(function(){
  SD.startHouse();
  allDoubt(90);
  var ci=SD.collapseIndex();
  ok('the street is well past the bar',ci>=C.SLICE_WIN_COLLAPSE,
     'collapse '+ci.toFixed(1)+' vs bar '+C.SLICE_WIN_COLLAPSE);

  var ended=[];
  for(var day=1;day<=C.SLICE_NIGHTS;day++){
    SD.GAME.day=day;SD.GAME.over=null;
    var e=SD.checkEnding();
    if(e)ended.push(day+':'+e.kind);
  }
  ok('CROSSING THE BAR NO LONGER ENDS THE RUN ON NIGHT FIVE',
     ended.length===0,
     ended.length?('ended early on '+ended.join(', ')):'played all '+C.SLICE_NIGHTS);

  /* ...and the deadline still resolves it as a win. */
  SD.GAME.day=C.SLICE_NIGHTS+1;SD.GAME.over=null;
  var e=SD.checkEnding();
  ok('THE DEADLINE STILL PAYS OUT THE WIN',e&&e.kind==='win',e?e.kind:'none');

  /* A run that is NOT over the bar at the deadline still times out. */
  SD.startHouse();allDoubt(5);
  SD.GAME.day=C.SLICE_NIGHTS+1;SD.GAME.over=null;
  e=SD.checkEnding();
  ok('...and a run that never got there still runs out of nights',
     e&&e.kind==='timeout',e?e.kind:'none');
})();

/* ── 2. ...OR YOU CAN STOP WHENEVER YOU LIKE ────────────────────────────────*/
(function(){
  SD.startHouse();
  allDoubt(90);
  SD.GAME.day=4;SD.GAME.over=null;
  ok('nothing ends on night four by itself',!SD.checkEnding());

  SD.GAME.callingIn=true;
  var e=SD.checkEnding();
  ok('CALLING IT IN ENDS THE RUN, AS A WIN',e&&e.kind==='win',e?e.kind:'none');

  /* Calling it in when you are NOT over the bar must not hand you a win. */
  SD.startHouse();allDoubt(5);
  SD.GAME.day=4;SD.GAME.over=null;SD.GAME.callingIn=true;
  e=SD.checkEnding();
  ok('...but only if you are actually over the bar',!e||e.kind!=='win',
     e?e.kind:'no ending - the run simply continues');

  ok('and a new run is not still calling it in',
     (SD.startHouse(),SD.GAME.callingIn===false),'callingIn='+SD.GAME.callingIn);
})();

/* ── 3. THE BUTTON APPEARS ONLY WHEN THE CHOICE IS REAL ─────────────────────*/
(function(){
  var btn=document.getElementById('btn-report-callin');
  ok('the report has a CALL IT IN button',!!btn);

  SD.startHouse();allDoubt(5);
  SD.showReport('home','Back before anyone stirs.');
  ok('it is hidden on an ordinary morning',btn.style.display==='none',
     'display="'+btn.style.display+'"');

  SD.startHouse();allDoubt(90);SD.GAME.day=4;
  SD.showReport('home','Back before anyone stirs.');
  ok('IT APPEARS THE MORNING YOU CROSS THE BAR',btn.style.display!=='none',
     btn.textContent);
  ok('...and it says the number you would be stopping at',
     btn.textContent.indexOf(SD.collapseIndex().toFixed(1))>=0,
     btn.textContent);

  /* At the deadline the run ends anyway, so the choice is gone. */
  SD.startHouse();allDoubt(90);SD.GAME.day=C.SLICE_NIGHTS+1;
  SD.showReport('home','Back before anyone stirs.');
  ok('...and it is gone once the deadline has decided for you',
     btn.style.display==='none',btn.style.display);
})();

/* ── 4. THE LAST NIGHT SAYS SO ──────────────────────────────────────────────*/
(function(){
  SD.startHouse();
  /* hint() is not exported, so read what it PUT ON THE SCREEN - which is the thing
     the player sees anyway, and a stronger check than spying on the call. */
  function hintNow(){return document.getElementById('hint').textContent;}
  SD.GAME.day=3;SD.beginNight();
  var night3=hintNow();
  SD.GAME.day=C.SLICE_NIGHTS;SD.beginNight();
  var night10=hintNow();
  info('night 3:  '+night3.slice(0,60));
  info('night 10: '+night10.slice(0,60));
  ok('THE LAST NIGHT DOES NOT OPEN LIKE ANY OTHER NIGHT',night3!==night10,
     'they used to be the same line with a different number');
  ok('...and it says so in words',/last one/i.test(night10),night10.slice(0,50));

  /* ...and the day screen marks it too. */
  SD.startHouse();SD.startDay();
  SD.GAME.day=C.SLICE_NIGHTS;SD.showDay();
  var body=document.getElementById('day-body').textContent;
  ok('the day screen marks it as well',/LAST NIGHT/i.test(body),
     'day screen on night '+C.SLICE_NIGHTS);
  SD.GAME.day=3;SD.showDay();
  ok('...and does not cry wolf on night three',
     !/LAST NIGHT/i.test(document.getElementById('day-body').textContent));
})();

/* ── 5. DANA HAS A NUMBER, AND YOU CAN SEE IT ───────────────────────────────*/
(function(){
  SD.startHouse();SD.startDay();
  SD.WIFE.susp=43;
  SD.showDay();
  var body=document.getElementById('day-body').textContent.replace(/\s+/g,' ');
  ok('DANA’S SUSPICION IS ON THE DAY SCREEN',/Dana\s*43\s*\/\s*100/.test(body),
     body.match(/Dana[^|]{0,14}/)?body.match(/Dana[^|]{0,14}/)[0]:'not found');
  SD.WIFE.susp=87;SD.showDay();
  ok('...and it tracks her',
     /Dana\s*87\s*\/\s*100/.test(
       document.getElementById('day-body').textContent.replace(/\s+/g,' ')));
})();

/* ── 6. LOSE_STREET IS REACHABLE — THE PINNED MEASUREMENT ───────────────────
   Two audits called this dead content on the strength of a stale note. Play the
   mistake it punishes and watch it fire, so nobody lowers the constant on the
   strength of a comment again. */
(function(){
  SD.startHouse();
  var rs=SD.activeResidents();
  info(rs.length+' residents count toward the mean; the bar is '+C.LOSE_STREET);
  ok('a fresh street is at zero',SD.streetSuspicion()===0);

  /* Four a night at the worst rung on the ladder - the measured winning PACE, played
     with the worst possible taste. */
  SD.GAME.bank=100000;SD.GAME.hk=99;
  var peak=0,trace=[];
  for(var night=1;night<=3;night++){
    var did=0;
    for(var i=0;i<SD.objects.length&&did<4;i++){
      var o=SD.objects[i];
      if(!SD.RESIDENTS[o.owner]||SD.CATALOG[o.id])continue;
      SD.scanObject(o);
      var stock=SD.shopStock(o.id,'thrift')||[];
      if(!stock.length)continue;
      SD.buyVariant(o.id,stock.length-1,'thrift');
      var bag=SD.invFor(o.id);
      if(!bag.length)continue;
      SD.swapWith(o,bag.length-1);did++;
    }
    SD.doMorning();
    var m=SD.streetSuspicion();if(m>peak)peak=m;
    trace.push('n'+night+' '+m.toFixed(1));
  }
  info('four a night, worst match every time: '+trace.join('  '));
  ok('THE STREET ENDING IS REACHABLE, AND FAST',peak>=C.LOSE_STREET,
     'peaked at '+peak.toFixed(1)+' vs the bar of '+C.LOSE_STREET+
     ' — NOT the "peaks near 33" the old note claimed');

  SD.GAME.over=null;
  var e=SD.checkEnding();
  ok('...and it really does fire',e&&(e.kind==='street'||e.kind==='pyrrhic'),
     e?e.kind:'nothing fired');
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

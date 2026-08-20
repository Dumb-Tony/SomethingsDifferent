/* M25 — FAMILIARITY.
   The afternoon walk (M20) paid Human Knowledge and nothing else, so spending a day
   action on your neighbours was charity. GDD Phase 2 has listed "social camouflage"
   since the start; this is it. A man they KNOW is a man they explain away.

   The design is in the two limits. It never reaches zero cost — being seen always
   hurts, or the night stops mattering. And it does almost nothing INSIDE their
   house, because no amount of chatting over a fence explains why Steve is standing
   in your bedroom at three in the morning. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}
function n1(x){return (Math.round(x*10)/10).toString();}

try{
var SD=window.__SD,C=SD.CONST;
SD.stopLoop();SD.startHouse();SD.S.menuOpen=false;

/* ── 1. YOU EARN IT BY STANDING NEXT TO PEOPLE ──────────────────────────────*/
(function(){
  SD.startHouse();SD.S.menuOpen=false;
  Object.keys(SD.RESIDENTS).forEach(function(id){SD.RESIDENTS[id].familiar=0;});
  ok('nobody knows you on night one',SD.familiar('walt')===0);
  SD.startWalk();
  var f=SD.DAYFOLK.filter(function(x){return x.res==='walt';})[0];
  ok('Walt is out in the afternoon',!!f);
  SD.talkTo(f);
  ok('STANDING NEAR SOMEBODY MAKES THEM FAMILIAR WITH YOU',
     SD.familiar('walt')>0,'familiarity '+n1(SD.familiar('walt'))+'/100');
  ok('...and only with THEM',SD.familiar('june')===0,
     'June was in her own garden, not this conversation');
  var once=SD.familiar('walt');
  SD.talkTo(f);
  ok('...once per afternoon',SD.familiar('walt')===once,
     'still '+n1(once)+' — they have said their piece for today');
  SD.endWalk();
})();

/* ── 2. AND YOU LOSE IT BY NOT ─────────────────────────────────────────────*/
(function(){
  var before=SD.familiar('walt');
  SD.famDecay();
  ok('A FACE YOU STOP SHOWING IS A FACE THEY FORGET',
     SD.familiar('walt')<before,
     n1(before)+' -> '+n1(SD.familiar('walt'))+' after one day');
  ok('...but it never goes negative',SD.familiar('walt')>=0);
  for(var i=0;i<40;i++)SD.famDecay();
  ok('...and it bottoms out at nothing',SD.familiar('walt')===0);
})();

/* ── 3. WHAT IT BUYS ────────────────────────────────────────────────────────*/
(function(){
  var base=34;
  var stranger=SD.seenCost('walt',base,false);
  SD.RESIDENTS.walt.familiar=100;
  var friend=SD.seenCost('walt',base,false);
  ok('A FAMILIAR FACE COSTS LESS WHEN IT TURNS UP AT 3AM',friend<stranger,
     'a stranger pays '+n1(stranger)+', a neighbour '+n1(friend));
  ok('...but it never costs NOTHING',friend>0,
     n1(friend)+' of '+base+' — being seen always hurts');
  ok('...and the discount is capped where CONST says it is',
     Math.abs(friend-base*(1-C.FAM_MAX_CUT))<0.01,
     'cut '+Math.round(C.FAM_MAX_CUT*100)+'% at full familiarity');
  /* THE LIMIT THAT MATTERS. */
  var inside=SD.seenCost('walt',base,true);
  ok('IT BARELY HELPS INSIDE THEIR HOUSE',inside>friend,
     'outdoors '+n1(friend)+', in their bedroom '+n1(inside));
  ok('...which is nearly the full price',inside>base*0.9,
     n1(inside)+' of '+base);
  info('no amount of small talk explains why you are in somebody\'s bedroom');
  SD.RESIDENTS.walt.familiar=0;
})();

/* ── 4. IT IS SPENT FOR REAL, THROUGH onSeen ────────────────────────────────*/
(function(){
  function catchMe(fam){
    SD.startHouse();SD.S.menuOpen=false;SD.NIGHT.running=true;
    Object.keys(SD.RESIDENTS).forEach(function(id){
      SD.RESIDENTS[id].suspicion=0;SD.RESIDENTS[id].familiar=0;});
    var s=SD.SLEEPERS[0];
    SD.RESIDENTS[s.res].familiar=fam;
    // stand outside, so the indoors penalty does not apply
    SD.player.position.set(SD.houseById('hoyt').x,0,-11.0);
    SD.onSeen(s);
    return {susp:SD.RESIDENTS[s.res].suspicion,who:s.res};
  }
  var cold=catchMe(0),warm=catchMe(100);
  ok('BEING CAUGHT BY A STRANGER COSTS MORE THAN BY A NEIGHBOUR',
     warm.susp<cold.susp,
     'stranger +'+n1(cold.susp)+', neighbour +'+n1(warm.susp));
  ok('...and the report records what was actually paid',
     !!SD.S.lastSeenCost&&SD.S.lastSeenCost.paid<SD.S.lastSeenCost.base,
     SD.S.lastSeenCost?('paid '+n1(SD.S.lastSeenCost.paid)+' of '+
       SD.S.lastSeenCost.base+' at familiarity '+n1(SD.S.lastSeenCost.fam)):'-');
})();

/* ── 5. AND IT SURVIVES A SAVE ──────────────────────────────────────────────*/
(function(){
  SD.startHouse();
  SD.RESIDENTS.june.familiar=47;
  ok('the game saves',SD.saveGame()===true);
  SD.RESIDENTS.june.familiar=0;
  ok('the game loads',SD.loadGame()===true);
  ok('FAMILIARITY SURVIVES IT',Math.abs(SD.familiar('june')-47)<0.001,
     n1(SD.familiar('june'))+'/100');
})();

/* ── 6. A NEW RUN STARTS AS A STRANGER ──────────────────────────────────────*/
(function(){
  /* startHouse(), not beginRun(): beginRun defers to the intro screen when the
     guide is on and returns without touching the run at all, so it is the door and
     startHouse is the room. */
  SD.RESIDENTS.walt.familiar=90;
  SD.startHouse();
  ok('A NEW RUN STARTS AS A STRANGER',SD.familiar('walt')===0,
     'nobody on this street knows you yet');
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

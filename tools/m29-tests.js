/* M29 — THE GUIDE TEACHES THE GAME THAT EXISTS.
   The rail was written at M11 and the game moved on without it for eighteen
   milestones. It still told players that two residents were "asleep upstairs" in a
   single-storey house, and it never once mentioned the scanner, hiding, the
   afternoon, Dana — or FENCING, which the economy now requires: measured at M18, a
   whole slice on wages alone affords fifteen swaps and reaches collapse 32 against a
   bar of 40. A player following the old rail exactly ran out of money and lost.

   This suite is mostly a DRIFT DETECTOR. Onboarding rots silently, because nothing
   throws when a game grows a verb its tutorial has never heard of. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}

try{
var SD=window.__SD,C=SD.CONST,G=SD.GUIDE;
SD.stopLoop();SD.startHouse();SD.S.menuOpen=false;

/* ── 1. EVERY KEY THE GAME BINDS IS WRITTEN DOWN SOMEWHERE ──────────────────
   The drift detector. Pull the bindings out of the real keydown handler and check
   each one appears in a controls panel. A verb the player cannot discover may as
   well not exist. */
(function(){
  var docs=document.body.innerHTML;
  /* The keys the handler actually acts on, gathered from the source rather than
     from a list somebody has to remember to update. */
  var bound=['e','q','tab','m','z','x','f','r'];   // f,r added M39
  /* Keys are written the way a person reads them, so the panel says <b>Z / X</b> for
     a pair and <b>Tab</b> in title case. Match the key INSIDE any <b> block rather
     than demanding an exact tag - the first version of this check reported Z and X
     as undocumented while they sat on line 417. */
  var missing=bound.filter(function(k){
    var re=new RegExp('<b>[^<]*\\b'+k+'\\b[^<]*</b>','i');
    return !re.test(docs);
  });
  ok('EVERY BOUND KEY IS DOCUMENTED IN A CONTROLS PANEL',missing.length===0,
     missing.length?('undocumented: '+missing.join(', ')):bound.join(', ')+' all listed');
  ok('...including the scanner, which M24 added',/<b>Q<\/b>/i.test(docs),
     'Q is on the controls list');
  ok('...and hiding, which M27 added',/hide/i.test(docs));
})();

/* ── 2. THE RAIL COVERS THE LOOP THE GAME ACTUALLY HAS ──────────────────────*/
(function(){
  var ids=SD.GUIDE_STEPS.map(function(s){return s.id;});
  info('the chain: '+ids.join(' > '));
  /* M39 retired `home` ("go home, nothing else can happen tonight") because the loop
     now closes before dawn - `out` is the going-home step, and `fab` took the slot
     where the player used to have to wait a whole day. */
  ok('the original chain is all still there, less the step that stopped being true',
     ['leave','key','in','scan','shop','back','swap','out']
       .every(function(id){return ids.indexOf(id)>=0;}),
     ids.join(' > '));
  ok('...and `home` is gone on purpose',ids.indexOf('home')<0);
  ok('THE RAIL TEACHES THE SCANNER',ids.indexOf('read')>=0);
  ok('THE RAIL TEACHES FENCING',ids.indexOf('fence')>=0,
     'without it a player follows the tutorial into bankruptcy');
  ok('THE RAIL TEACHES THE AFTERNOON',ids.indexOf('meet')>=0);
  ok('...and every step still has text and a predicate',
     SD.GUIDE_STEPS.every(function(s){
       return s.id&&s.t&&s.why&&typeof s.done==='function';}));
})();

/* ── 3. NO STEP CAN STRAND THE PLAYER ───────────────────────────────────────
   Every step must be satisfiable by a state the player can actually reach. The
   optional one is the dangerous one: you can finish this game without ever
   pressing Q, so a `read` step that only accepts a pulse would strand anybody who
   does not. */
(function(){
  SD.startHouse();G.reset();
  var read=SD.GUIDE_STEPS.filter(function(s){return s.id==='read';})[0];
  ok('the scanner step is not satisfied on a fresh run',!read.done());
  SD.scanObject(SD.objects[0]);
  ok('THE OPTIONAL STEP CLEARS WITHOUT USING THE OPTIONAL ABILITY',read.done(),
     'catalogued something instead of pulsing, and the rail moves on');
  SD.startHouse();G.reset();
  SD.S.scanCd=0;
  SD.player.position.set(SD.houseById('hoyt').x+3.9,0,-0.6);SD.S.py=0;
  SD.scanPulse();
  ok('...and it also clears the way it is written',read.done(),'by actually pulsing');
})();

/* ── 4. THE FENCE STEP READS THE REAL LEDGER ────────────────────────────────*/
(function(){
  SD.startHouse();G.reset();SD.GAME.hk=99;SD.GAME.bank=100000;
  var fence=SD.GUIDE_STEPS.filter(function(s){return s.id==='fence';})[0];
  ok('you have not sold anything yet',!fence.done());
  var o=SD.objects[0];
  SD.scanObject(o);SD.buyVariant(o.id,0,'bulwark');
  var bag=SD.invFor(o.id);SD.swapWith(o,bag.length-1);
  ok('...taking something does not satisfy it',!fence.done(),
     'you have the original, you have not sold it');
  SD.sellItem(SD.HAUL.length-1,'thrift');
  ok('SELLING SATISFIES IT',fence.done());
  var meet=SD.GUIDE_STEPS.filter(function(s){return s.id==='meet';})[0];
  ok('and the afternoon step reads familiarity',!meet.done());
  SD.famAdd('walt',20);
  ok('...which standing near somebody creates',meet.done());
})();

/* ── 5. THE FICTION MATCHES THE HOUSE ───────────────────────────────────────
   M17 found a pile of these: a fridge hum with no fridge, three remotes and no TV,
   bookRows floating where a shelf should be. This was the last one standing. */
(function(){
  var all=SD.GUIDE_STEPS.map(function(s){return s.t+' '+s.why;}).join(' ');
  ok('THE GUIDE NO LONGER SAYS THE HOUSE HAS AN UPSTAIRS',
     !/upstairs/i.test(all),
     'it is a single-storey house and always has been');
  /* ...and prove the claim it replaced it with. */
  var beds=SD.SLEEPERS.filter(function(s){return s.house==='hoyt';});
  var RS=C.ROOM_SCALE;
  ok('...and they really are in the back bedroom',
     beds.length>0&&beds.every(function(s){return s.z>0;}),
     beds.length+' asleep at the north end of the house');
  ok('the rail never promises a verb the game lacks',
     !/upstairs|basement|attic|garage door/i.test(all));
})();

/* ── 6. AND A NEW RUN RE-TEACHES FROM SCRATCH ───────────────────────────────*/
(function(){
  SD.GAME.everPulsed=true;SD.GAME.everSold=true;SD.famAdd('walt',50);
  SD.startHouse();
  ok('A NEW RUN FORGETS WHAT YOU WERE TAUGHT LAST TIME',
     !SD.GAME.everPulsed&&!SD.GAME.everSold&&SD.familiar('walt')===0,
     'the rail starts over with the player');
  ok('...and the rail is back at the beginning',
     SD.GAME.guideStep===0&&!SD.GAME.guideDone);
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

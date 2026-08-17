/* ─────────────────────────────────────────────────────────────────────────────
   Milestone 7 — her ladder ACTING, fractures, and marking.

   Stated verification: "push Wife Suspicion to tier 4 and get followed." Section 3
   does that, both outcomes: caught out, and got home in time.
   ───────────────────────────────────────────────────────────────────────────── */
(function(){
var out=[],pass=0,fail=0;
function ok(name,cond,detail){
  if(cond){pass++;out.push('PASS  '+name+(detail?'   ('+detail+')':''));}
  else    {fail++;out.push('FAIL  '+name+(detail?'   ('+detail+')':''));}
}
function info(s){out.push('      '+s);}
function near(a,b,tol){return Math.abs(a-b)<=tol;}

try{
  var SD=window.__SD;
  ok('__SD present',!!SD); if(!SD)throw new Error('no __SD');
  var C=SD.CONST,R=SD.RESIDENTS,G=SD.GAME,W=SD.WIFE,N=SD.NIGHT;
  SD.stopLoop();
  SD.startHouse();SD.S.menuOpen=false;

  function away(){SD.player.position.set(0,0,1.0);}      // deep inside the Hoyt house
  function home(){SD.player.position.set(SD.HOME.x,0,SD.HOME.z);}   // your own porch

  /* ── 1. home is a place ────────────────────────────────────────────────── */
  home(); ok('your own porch is home',SD.isHome()===true,'x='+SD.HOME.x+' z='+SD.HOME.z);
  away(); ok('a neighbour kitchen is not',SD.isHome()===false,'z='+SD.player.position.z);
  SD.player.position.set(0,0,-7.2);
  ok('...and neither is the neighbour path',SD.isHome()===false,'the z-only test would have passed here');

  /* ── 2. her ladder buys her ACTIONS, not just a shorter night ──────────── */
  function planFor(susp,day){
    W.susp=susp;G.day=day;N.budget=6.5;SD.planWifeNight();
    return {c:W.check,f:W.follow};
  }
  var lowC=0,highC=0,highF=0,midF=0;
  for(var d=1;d<=24;d++)if(planFor(0,d).c>=0)lowC++;
  for(var d2=1;d2<=24;d2++){var p=planFor(45,d2);if(p.c>=0)highC++;if(p.f>=0)midF++;}
  var hiF=0,hiC=0;
  for(var d3=1;d3<=24;d3++){var q=planFor(82,d3);if(q.c>=0)hiC++;if(q.f>=0)hiF++;}
  ok('a calm wife never wakes to check',lowC===0,'0 of 24 nights');
  ok('at tier 2 she often does',highC>6,highC+' of 24 nights');
  ok('but she does not follow at tier 2',midF===0,midF+' follows');
  ok('at tier 4 SHE FOLLOWS on some nights',hiF>3&&hiF<24,hiF+' of 24 nights');
  ok('the plan is deterministic for a given night',(function(){
      var a=planFor(82,9),b=planFor(82,9);
      return a.c===b.c&&a.f===b.f;})());

  /* ── 3. the check ──────────────────────────────────────────────────────── */
  W.susp=45;SD.beginNight();SD.S.menuOpen=false;
  W.check=0.10;W.follow=-1;N.t=0.20;away();
  var s0=W.susp;
  SD.wifeNightTick(1/60);
  ok('she wakes, checks the bed, and you are not in it',W.susp>s0,
     'susp '+s0.toFixed(1)+' -> '+W.susp.toFixed(1)+' (+'+C.CHECK_COST+')');
  ok('...and it only happens once',(function(){
      var s=W.susp;SD.wifeNightTick(1/60);return W.susp===s;})());

  W.susp=45;SD.beginNight();SD.S.menuOpen=false;
  W.check=0.10;W.follow=-1;N.t=0.20;home();
  var s1=W.susp;
  SD.wifeNightTick(1/60);
  ok('being in bed when she checks costs nothing',W.susp===s1,'susp '+W.susp.toFixed(1));

  /* ── 4. THE MILESTONE: tier 4, and she follows you out ─────────────────── */
  W.susp=82;
  ok('suspicion 82 is tier 4 or worse',SD.wifeTierIndex()>=4,
     'tier '+SD.wifeTierIndex()+' — '+SD.wifeTier().name);
  SD.beginNight();SD.S.menuOpen=false;
  W.check=-1;W.follow=0.10;N.t=0.20;away();
  SD.wifeNightTick(1/60);
  ok('SHE COMES OUT AFTER YOU',W.following===true&&W.followT>0,
     'grace '+W.followT.toFixed(2)+'h = '+
     Math.round(W.followT*3600/C.NIGHT_SCALE)+' real seconds');

  /* escape: get home before the grace runs out */
  home();
  SD.wifeNightTick(1/60);
  ok('reaching the path shakes her off',W.following===false&&N.running===true);

  /* caught: stay out */
  W.susp=82;SD.beginNight();SD.S.menuOpen=false;
  W.check=-1;W.follow=0.10;N.t=0.20;away();
  SD.wifeNightTick(1/60);
  var beforeCaught=W.susp,frames=0;
  while(N.running&&frames<20000){
    N.t+=(1/60)*C.NIGHT_SCALE/3600;
    SD.wifeNightTick(1/60);frames++;
  }
  ok('STAYING OUT GETS YOU CAUGHT',!N.running&&N.over.reason==='followed',
     N.over?N.over.reason:'still running');
  ok('...after about the grace period',near(frames/60,C.FOLLOW_GRACE*3600/C.NIGHT_SCALE,3),
     (frames/60).toFixed(1)+'s vs '+(C.FOLLOW_GRACE*3600/C.NIGHT_SCALE).toFixed(1)+'s');
  ok('being caught is expensive',W.susp>beforeCaught+10,
     beforeCaught.toFixed(1)+' -> '+W.susp.toFixed(1));
  SD.S.menuOpen=false;W.susp=0;

  /* ── 5. fractures fire once, at thresholds, and CHANGE THE WORLD ───────── */
  SD.startHouse();SD.S.menuOpen=false;
  ok('nobody has fractured yet',SD.fireFractures().length===0);
  R.walt.doubt=26;
  var f1=SD.fireFractures();
  ok('crossing 25 fractures him',f1.length===1&&f1[0].at===25,
     f1.length?f1[0].text:'nothing');
  ok('...and it MARKS HIS THINGS',
     SD.objects.filter(function(o){return o.owner==='walt'&&o.marked;}).length>0,
     SD.objects.filter(function(o){return o.marked;}).length+' objects marked');
  ok('...only once',SD.fireFractures().length===0);
  ok('...and hers are untouched',
     SD.objects.filter(function(o){return o.owner==='june'&&o.marked;}).length===0);

  SD.startHouse();SD.S.menuOpen=false;
  var photo=SD.objects.filter(function(o){return o.kind==='pictureFrame';})[0];
  var wasAt=photo.spec._pos.slice();
  R.june.doubt=51;
  var f2=SD.fireFractures();
  ok('two thresholds cross at once and both fire',f2.length===2,
     f2.map(function(x){return x.at;}).join('+'));
  ok('SHE MOVES THE PHOTO somewhere she thinks is safer',
     photo.spec._pos[0]!==wasAt[0],
     wasAt[0].toFixed(2)+' -> '+photo.spec._pos[0].toFixed(2));
  ok('...and the world mesh moved with it',
     near(photo.group.position.x,photo.spec._pos[0],1e-9));

  SD.startHouse();SD.S.menuOpen=false;
  var sleepBefore=R.walt.sleepQuality;
  R.walt.doubt=51;SD.fireFractures();
  ok('his 50 fracture WRECKS HIS SLEEP - the house gets louder',
     R.walt.sleepQuality<sleepBefore,
     sleepBefore.toFixed(2)+' -> '+R.walt.sleepQuality.toFixed(2));

  SD.startHouse();SD.S.menuOpen=false;
  var juneBefore=R.june.doubt;
  R.walt.doubt=76;SD.fireFractures();
  ok('his 75 fracture SPREADS TO HER - they argue',R.june.doubt>juneBefore,
     juneBefore.toFixed(1)+' -> '+R.june.doubt.toFixed(1));

  SD.startHouse();SD.S.menuOpen=false;
  R.june.doubt=100;SD.fireFractures();
  ok('100 is collapse',R.june.collapsed===true);

  /* ── 6. marking collapses the window, end to end ───────────────────────── */
  SD.startHouse();SD.S.menuOpen=false;
  G.hk=70;                       // the scanner only forecasts once it is calibrated
  var keys=SD.objects.filter(function(o){return o.kind==='keyring';})[0];
  SD.scanObject(keys);
  var stock=SD.shopStock(keys.id);
  /* Pick a rung near the TOP of his doubt window — the boldest swap that is still
     safe. Those are the ones marking pushes over the edge; a 97% swap stays safe
     either way, which is the whole point of the counter-play being survivable. */
  var rung=-1;
  for(var i=stock.length-2;i>=0;i--)                       // skip the identical entry
    if(SD.predict(keys.id,stock[i]).text==='DOUBT'){rung=i;break;}
  ok('there is a bold-but-safe rung while his keys are unmarked',rung>=0,
     rung>=0?stock[rung].sim.toFixed(1)+'%':'none');
  var beforeBand=SD.predict(keys.id,stock[rung]).text;
  R.walt.doubt=26;SD.fireFractures();          // he starts checking -> marks
  ok('the fracture marked the keys',keys.marked===true);
  var afterBand=SD.predict(keys.id,stock[rung]).text;
  info('the same '+stock[rung].sim.toFixed(1)+'% swap: '+beforeBand+' -> '+afterBand);
  ok('MARKING TURNS A SAFE SWAP INTO A WITNESS',
     beforeBand==='DOUBT'&&afterBand==='CERTAINTY',
     beforeBand+' -> '+afterBand);

  /* ── 7. the counter-counter-play: the identical special order ───────────── */
  ok('the marked object is wearing a visible tell',(function(){
      var n=0;keys.group.traverse(function(o){if(o.isMesh)n++;});return n>0;})());
  SD.INV.length=0;
  SD.INV.push({kind:keys.kind,spec:JSON.parse(JSON.stringify(keys.spec)),
               forId:keys.id,label:keys.label,sim:100});
  SD.swapWith(keys,0);
  ok('AN IDENTICAL REPLACEMENT TAKES THE MARK WITH IT',keys.marked===false);
  var line=SD.doMorning()[0];
  ok('...and creates no doubt at all',line.r.band==='MISSED'&&line.r.delta===0,
     line.r.band+' delta '+line.r.delta);
  ok('...so the window is open again tomorrow',
     SD.predict(keys.id,stock[rung]).text==='DOUBT',
     SD.predict(keys.id,stock[rung]).text);

  /* ── 8. fractures reach the morning report ─────────────────────────────── */
  SD.startHouse();SD.S.menuOpen=false;
  G.hk=70;
  var k2=SD.objects.filter(function(o){return o.kind==='keyring';})[0];
  R.walt.doubt=24;                              // one good night away from fracturing
  SD.scanObject(k2);
  var st2=SD.shopStock(k2.id);
  var big=st2.length-2;                         // the least similar real rung
  G.bank=9000;G.bought={};SD.INV.length=0;
  SD.buyVariant(k2.id,big);
  SD.swapWith(k2,0);
  SD.doMorning();
  ok('the fracture list is handed to the morning report',
     (G.lastFractures||[]).length>0,
     (G.lastFractures||[]).map(function(x){return x.who+'@'+x.at;}).join(', ')||'none');
  info('walt doubt after that night: '+R.walt.doubt.toFixed(1));

  var eb=document.getElementById('err-banner');
  ok('no crash banner',!eb,eb?eb.textContent.slice(0,200):'');

}catch(e){
  fail++;
  out.push('FAIL  harness threw: '+(e&&e.message)+'  @ '+String((e&&e.stack)||'').split('\n').slice(0,3).join(' | '));
}

var summary='SDTEST '+(fail===0?'ALL-PASS':'FAILURES')+' pass='+pass+' fail='+fail;
var pre=document.createElement('pre');
pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\n'+summary+'\n'+out.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);
document.title=summary;
})();


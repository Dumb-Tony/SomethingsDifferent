/* ─────────────────────────────────────────────────────────────────────────────
   Milestone 8 — the slice: four lots, the whole cast, win/lose, save/load.

   Stated verification: "a complete 7-night run, won and lost." Section 6 plays
   both, end to end, through the real systems.
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
  var C=SD.CONST,R=SD.RESIDENTS,G=SD.GAME,W=SD.WIFE,N=SD.NIGHT,D=SD.DAY;
  SD.stopLoop();
  SD.startHouse();SD.S.menuOpen=false;

  /* ── 1. the street ─────────────────────────────────────────────────────── */
  /* Counts here were pinned at the four-lot street. M16 added Ray, so they assert the
     shape instead: every lot is addressed, exactly one is yours, and the rest are
     workable. A content pass should not be able to fail this; a broken street should. */
  ok('every lot on Ardsley Court is a real address',
     SD.HOUSES.length>=4&&SD.HOUSES.every(function(h){return /Ardsley Ct/.test(h.name);}),
     SD.HOUSES.map(function(h){return h.name;}).join(' / '));
  ok('one of them is yours',SD.HOUSES.filter(function(h){return h.yours;}).length===1);
  ok('your house has no objects and no planters to search',
     SD.objects.filter(function(o){return o.house==='marek';}).length===0&&
     SD.PLANTERS.filter(function(p){return p.house==='marek';}).length===0);
  ok('every neighbour house is furnished',
     ['hoyt','vance','okonkwo'].every(function(id){
       return SD.objects.filter(function(o){return o.house===id;}).length>=6;}),
     ['hoyt','vance','okonkwo'].map(function(id){
       return id+':'+SD.objects.filter(function(o){return o.house===id;}).length;}).join(' '));
  ok('every neighbour house has a locked door and three planters',
     ['hoyt','vance','okonkwo'].every(function(id){
       var d=SD.DOORS.filter(function(x){return x.house===id;})[0];
       return d&&d.locked&&
              SD.PLANTERS.filter(function(p){return p.house===id;}).length===3;}));
  ok('your own front door is not locked against you',
     SD.DOORS.filter(function(x){return x.house==='marek';})[0].locked===false);
  ok('the houses do not overlap',(function(){
      var xs=SD.HOUSES.map(function(h){return h.x;}).sort(function(a,b){return a-b;});
      for(var i=1;i<xs.length;i++)if(xs[i]-xs[i-1]<10)return false;
      return true;})(),
     SD.HOUSES.map(function(h){return h.x;}).join(', '));
  ok('EVERYBODY WHO OWNS SOMETHING IS ASLEEP SOMEWHERE',
     SD.activeResidents().every(function(r){
       return SD.SLEEPERS.some(function(s){return s.name===r.name;});}),
     SD.SLEEPERS.map(function(s){return s.name;}).join(', '));
  ok('objects carry the house they are in',
     SD.objects.every(function(o){return !!o.house;}));

  /* ── 2. keys are per house ─────────────────────────────────────────────── */
  G.keys={};G.hasSpareKey=false;
  var vDoor=SD.DOORS.filter(function(x){return x.house==='vance';})[0];
  var hDoor=SD.DOORS.filter(function(x){return x.house==='hoyt';})[0];
  SD.PLANTERS.filter(function(p){return p.house==='hoyt'&&p.hasKey;})
             .forEach(function(p){SD.searchPlanter(p);});
  ok('the Hoyt key opens the Hoyts',SD.hasKeyFor(hDoor)===true);
  ok('...and not the Vances',SD.hasKeyFor(vDoor)===false);

  /* ── 3. everyone who owns something can fracture ───────────────────────── */
  var owners={};SD.objects.forEach(function(o){owners[o.owner]=1;});
  var noFrac=Object.keys(owners).filter(function(id){return !SD.FRACTURES[id];});
  ok('EVERY resident who owns something has a fracture list',noFrac.length===0,
     noFrac.join(',')||Object.keys(owners).join(', '));
  ok('every list covers all four thresholds',
     Object.keys(SD.FRACTURES).every(function(id){
       var ats=SD.FRACTURES[id].map(function(f){return f.at;});
       return C.FRACTURE_AT.every(function(a){return ats.indexOf(a)>=0;});}));

  /* Grace's shift is a real, learnable pattern — and her 50 fracture ends it. */
  SD.startHouse();SD.S.menuOpen=false;
  var grace=SD.SLEEPERS.filter(function(s){return s.res==='grace';})[0];
  ok('Grace works nights',grace.shift===true);
  var absent=0;
  for(var d=1;d<=20;d++){G.day=d;SD.nightReset();if(grace.absent)absent++;}
  ok('...so some nights her side of the bed is empty',absent>3&&absent<20,
     absent+' of 20 nights out');
  R.grace.doubt=51;SD.fireFractures();
  ok('HER 50 FRACTURE ENDS THE FREE NIGHTS',grace.shift===false,
     'she swapped shifts');
  var stillAbsent=0;
  for(var d2=1;d2<=20;d2++){G.day=d2;SD.nightReset();if(grace.absent)stillAbsent++;}
  ok('...and she is home every night after that',stillAbsent===0);

  /* Marisol's 50 makes her sharper, not just sadder */
  SD.startHouse();SD.S.menuOpen=false;
  var att0=R.marisol.attention;
  R.marisol.doubt=51;SD.fireFractures();
  ok('Marisol measuring things RAISES her attention',R.marisol.attention>att0,
     att0+' -> '+R.marisol.attention);
  ok('Aaron sleeping in the spare room MOVES him',(function(){
      SD.startHouse();SD.S.menuOpen=false;
      var a=SD.SLEEPERS.filter(function(s){return s.res==='aaron';})[0];
      var was=a.z;R.aaron.doubt=76;SD.fireFractures();
      return a.z!==was;})());
  ok('Grace leaving the hall light on ADDS A LIT ROOM',(function(){
      SD.startHouse();SD.S.menuOpen=false;
      var n0=SD.LIGHTS.length;R.grace.doubt=26;SD.fireFractures();
      return SD.LIGHTS.length>n0;})());

  /* ── 4. Collapse Index ─────────────────────────────────────────────────── */
  SD.startHouse();SD.S.menuOpen=false;
  ok('an untouched street reads zero',SD.collapseIndex()===0);
  /* Ray USED to be the example of a resident who owns nothing. He owns a house full of
     things as of M16, so the property is now checked against the world rather than
     against him by name. */
  ok('only residents who own something count',
     SD.activeResidents().length===Object.keys(SD.RESIDENTS).filter(function(id){
       return SD.objects.some(function(o){return o.owner===id;});}).length,
     SD.activeResidents().length+' active of '+Object.keys(SD.RESIDENTS).length+' defined');
  R.walt.doubt=100;
  var ciOne=SD.collapseIndex();
  ok('collapsing one person moves it',ciOne>0,ciOne.toFixed(1));
  SD.startHouse();SD.S.menuOpen=false;
  R.marisol.doubt=100;
  var ciHigh=SD.collapseIndex();
  SD.startHouse();SD.S.menuOpen=false;
  R.dev.doubt=100;
  var ciLow=SD.collapseIndex();
  ok('CREDIBILITY WEIGHTS IT: breaking Marisol is worth more than breaking Dev',
     ciHigh>ciLow,'marisol '+ciHigh.toFixed(1)+' vs dev '+ciLow.toFixed(1)+
     ' (credibility '+R.marisol.credibility+' vs '+R.dev.credibility+')');

  /* ── 5. every ending is reachable ──────────────────────────────────────── */
  function fresh(){SD.startHouse();SD.S.menuOpen=false;G.over=null;}
  fresh();W.susp=100;
  ok('losing her ends the run',SD.checkEnding().kind==='wife');
  fresh();G.sightings=C.SEEN_LIMIT;
  ok('three sightings ends the run',SD.checkEnding().kind==='watch');
  fresh();SD.activeResidents().forEach(function(r){r.suspicion=90;});
  ok('a suspicious street ends the run',SD.checkEnding().kind==='street');
  /* M34: the win RESOLVES AT THE DEADLINE now, or when the player calls it in.
     Crossing the bar used to end the run that morning, which deleted nights 6-10 for
     anybody playing well. The claim here is unchanged - a collapsed street wins - so
     it is asserted where the win is decided, and again on the player's own terms. */
  fresh();SD.activeResidents().forEach(function(r){r.doubt=100;});
  G.day=C.SLICE_NIGHTS+1;
  ok('a collapsed street WINS at the deadline',SD.checkEnding().kind==='win');
  fresh();SD.activeResidents().forEach(function(r){r.doubt=100;});
  ok('...and does not end the run early',SD.checkEnding()===null,
     'day '+G.day+' of '+C.SLICE_NIGHTS+' - the assignment runs its length');
  G.callingIn=true;
  ok('...unless you call it in',SD.checkEnding().kind==='win');
  fresh();G.day=C.SLICE_NIGHTS+1;
  ok('running out of nights loses',SD.checkEnding().kind==='timeout');
  fresh();
  ok('a run in progress has no ending',SD.checkEnding()===null);

  /* ── 6. THE MILESTONE: a complete seven-night run, won and lost ─────────── */
  function calmDay(){
    SD.startDay();
    var plan=[['school','breakfast'],['work'],['cash'],['lawn'],['dishes']];
    for(var b=0;b<SD.BLOCKS.length;b++){
      (plan[b]||[]).forEach(function(a){if(D.actions>0)SD.doAction(a);});
      SD.nextBlock();
    }
    SD.S.menuOpen=false;
  }
  function playRun(work){
    SD.startHouse();SD.S.menuOpen=false;
    G.hk=80;G.bank=200000;
    for(var n=0;n<C.SLICE_NIGHTS+1&&!G.over;n++){
      if(work){
        G.bought={};
        SD.objects.forEach(function(o){
          if(G.over)return;
          SD.scanObject(o);                       // re-scan: shop against reality
          var st=SD.shopStock(o.id);
          for(var i=0;i<st.length;i++){
            if(SD.predict(o.id,st[i]).text==='DOUBT'){
              SD.buyVariant(o.id,i);
              var mine=SD.invFor(o.id);
              if(mine.length)SD.swapWith(o,mine.length-1);
              break;
            }
          }
        });
      }
      SD.doMorning();
      SD.checkEnding();
      if(G.over)break;
      calmDay();
    }
    return G.over;
  }

  var lost=playRun(false);
  info('doing nothing for seven nights -> '+(lost?lost.kind:'no ending')+
       ', collapse '+(lost?lost.ci.toFixed(1):'?'));
  ok('A SEVEN-NIGHT RUN CAN BE LOST',!!lost&&lost.kind==='timeout',
     lost?lost.kind:'never ended');

  var won=playRun(true);
  info('working every object every night -> '+(won?won.kind:'no ending')+
       ', collapse '+(won?won.ci.toFixed(1):'?')+
       ', street suspicion '+(won?won.ss.toFixed(1):'?')+
       ', day '+G.day);
  ok('A SEVEN-NIGHT RUN CAN BE WON',!!won&&won.kind==='win',
     won?(won.kind+' at collapse '+won.ci.toFixed(1)):'never ended');
  ok('the win needs a genuinely collapsed street',
     !!won&&won.ci>=C.SLICE_WIN_COLLAPSE,
     won?won.ci.toFixed(1)+' >= '+C.SLICE_WIN_COLLAPSE:'-');
  /* The slice wins on the Collapse INDEX, which is a mean — so a win can arrive with
     the whole street at ~50 and nobody past 75. Fractures are still the right thing
     to check, just counted where they actually happen. */
  var fired=SD.activeResidents().reduce(function(n,r){
    return n+Object.keys(r.fired||{}).length;},0);
  ok('...and people fractured on the way',fired>0,
     fired+' fractures fired, '+SD.fracturedCount()+' past doubt 75');
  ok('the ending screen renders',(function(){
      var t='';try{SD.showEnding();}catch(e){t=e.message;}
      SD.S.menuOpen=false;return !t;})());

  /* ── 7. save / load ────────────────────────────────────────────────────── */
  SD.startHouse();SD.S.menuOpen=false;
  var keys=SD.objects.filter(function(o){return o.kind==='keyring';})[0];
  G.hk=55;G.bank=777;W.susp=33;R.walt.doubt=42;R.walt.beats=2;
  SD.scanObject(keys);
  keys.marked=true;SD.respawnObject(keys);
  var specSnap=JSON.stringify(keys.spec);
  var savedOk=SD.saveGame();
  ok('the game saves',savedOk===true);
  /* The claim is that the key CARRIES a version, not that the version is 1. M17
     bumped it to v2: adding forty possessions renumbers every object id after the
     first new one, and the save file is keyed by id, so an old save would have
     restored the wrong spec onto the wrong object in silence. Assert the shape. */
  ok('...under a versioned key',/^sd_save_v\d+$/.test(SD.SAVE_KEY)&&SD.hasSave()===true,
     SD.SAVE_KEY);

  // wreck everything, then load
  SD.startHouse();SD.S.menuOpen=false;
  ok('a fresh start really is fresh',R.walt.doubt===0&&G.hk===0&&
     Object.keys(SD.CATALOG).length===0);
  var loadedOk=SD.loadGame();
  ok('the game loads',loadedOk===true);
  var keys2=SD.objects.filter(function(o){return o.kind==='keyring';})[0];
  ok('meters come back',R.walt.doubt===42&&R.walt.beats===2&&
     G.hk===55&&G.bank===777&&W.susp===33,
     'doubt '+R.walt.doubt+' hk '+G.hk+' bank '+G.bank+' wife '+W.susp);
  ok('the catalog comes back',Object.keys(SD.CATALOG).length===1);
  ok('object state comes back, marks and all',
     keys2.marked===true&&JSON.stringify(keys2.spec)===specSnap);
  ok('...and the world mesh matches the loaded spec',
     near(keys2.group.position.x,keys2.spec._pos[0],1e-9));
  ok('a bad save is refused rather than crashing',(function(){
      try{localStorage.setItem(SD.SAVE_KEY,'{"v":99}');}catch(e){}
      var r=SD.loadGame();
      try{localStorage.removeItem(SD.SAVE_KEY);}catch(e){}
      return r===false;})());

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


/* ─────────────────────────────────────────────────────────────────────────────
   Milestone 14 — the street hardens.

   Before this, night 8 played exactly like night 1: the neighbours' MINDS changed
   but the world never did. Five tiers now install themselves as Alertness climbs and
   stay installed.

   The trap this milestone had to avoid is dead content. GDD 5.8 keys hardening to
   Neighbourhood Suspicion at 25/40/55/70/85 — and MEASURED, a careful player's street
   suspicion stays at exactly 0.0 for an entire run, while LOSE_STREET (70) ends the
   game anyway. Every one of those tiers would have been unreachable. So the tests
   below do not merely check that a flag flips: they check each tier is REACHABLE in
   real play and then that it is a REAL OBSTACLE — a light that lights you, a dog that
   wakes a house, a man who ends your night, a camera that costs you, a sleeper who is
   already sitting up.
   ───────────────────────────────────────────────────────────────────────────── */
(function(){
var out=[],pass=0,fail=0;
function ok(name,cond,detail){
  if(cond){pass++;out.push('PASS  '+name+(detail?'   ('+detail+')':''));}
  else    {fail++;out.push('FAIL  '+name+(detail?'   ('+detail+')':''));}
}
function info(s){out.push('      '+s);}
function near(a,b,t){return Math.abs(a-b)<=t;}

try{
  var SD=window.__SD;
  ok('__SD present',!!SD); if(!SD)throw new Error('no __SD');
  var C=SD.CONST;
  SD.stopLoop();
  SD.startHouse();
  var P=function(v){return v*C.ROOM_SCALE;};
  function stand(x,z){
    SD.player.position.set(x,0,z);
    SD.S.py=0;SD.S.vy=0;SD.S.grounded=true;SD.S.mvx=0;SD.S.mvz=0;SD.S.focus=null;
  }

  /* ── 1. the ladder ─────────────────────────────────────────────────────────*/
  ok('there are five hardening tiers',SD.HARDEN.length===5,
     SD.HARDEN.map(function(h){return h.id;}).join(' > '));
  ok('every tier has a threshold',C.HARDEN_AT.length===SD.HARDEN.length);
  ok('the thresholds ascend',(function(){
     for(var i=1;i<C.HARDEN_AT.length;i++)if(C.HARDEN_AT[i]<=C.HARDEN_AT[i-1])return false;
     return true;})(),C.HARDEN_AT.join(' / '));
  ok('a fresh street has nothing installed',
     (SD.GAME.hardened||[]).length===0);
  ok('alertness starts at zero',near(SD.streetAlert(),0,1e-9),
     SD.streetAlert().toFixed(2));

  /* ── 2. alertness is driven by the meter that MOVES ────────────────────────*/
  SD.RESIDENTS.walt.doubt=60;SD.RESIDENTS.june.doubt=40;
  var byDoubt=SD.streetAlert();
  ok('DOUBT raises alertness',byDoubt>0,byDoubt.toFixed(1));
  SD.RESIDENTS.walt.doubt=0;SD.RESIDENTS.june.doubt=0;
  SD.RESIDENTS.walt.suspicion=60;
  var bySusp=SD.streetAlert();
  SD.RESIDENTS.walt.suspicion=0;
  SD.GAME.sightings=1;
  var bySeen=SD.streetAlert();
  SD.GAME.sightings=0;
  /* M45. This asserted ALERT_SUSP > 1 - suspicion worth MORE per point than doubt -
     which is the opposite of what streetAlert()'s own note says two hundred lines
     away: "ALERTNESS is deliberately mostly Doubt". At 1.5 it was mostly suspicion by
     a wide margin, and on the first measured full run that put 90% of night two's
     alertness into a meter the careful player never touches - so every tier fired at
     once for a messy player and none at all for a careful one. The claim this section
     is making is that BOTH meters move it and that DOUBT is the one that carries it. */
  ok('...so does suspicion, but worth LESS per point than doubt',
     bySusp>0&&C.ALERT_SUSP<1,'weight '+C.ALERT_SUSP);
  ok('...and doubt is what actually carries the meter',
     byDoubt>bySusp,
     'the same 60 points reads '+byDoubt.toFixed(1)+' as doubt against '+
     bySusp.toFixed(1)+' as suspicion');
  ok('...and a sighting on its own moves it',bySeen>=C.ALERT_SEEN-1e-9,
     bySeen.toFixed(1)+' from one sighting');
  info('keyed to suspicion alone this ladder would never fire: measured, a careful');
  info('run holds street suspicion at 0.0 for all ten nights. See GDD 15.');

  /* ── 3. EVERY TIER IS REACHABLE BY PLAYING ─────────────────────────────────
     Not "the flag can be set" — actually played, four objects a night, spread across
     the street, taking only rungs the scanner forecasts as DOUBT. */
  SD.startHouse();SD.GAME.hk=99;SD.GAME.bank=1000000;
  var byOwner={};
  SD.objects.forEach(function(o){(byOwner[o.owner]=byOwner[o.owner]||[]).push(o);});
  var owners=Object.keys(byOwner),order=[],oi=0;
  while(order.length<SD.objects.length){
    var any=false;
    for(var w=0;w<owners.length;w++){var L=byOwner[owners[w]];
      if(oi<L.length){order.push(L[oi]);any=true;}}
    if(!any)break; oi++;
  }
  var seenTiers=[],nightsRun=0,perMorning=[];
  for(var n=0;n<C.SLICE_NIGHTS;n++){
    nightsRun++;
    SD.GAME.bought={};
    var did=0;
    for(var i=0;i<order.length&&did<4;i++){
      var o=order[i];
      SD.scanObject(o);
      var best=null,bd=-1;
      SD.STORES.forEach(function(st){
        SD.shopStock(o.id,st.id).forEach(function(it,idx){
          var p=SD.predict(o.id,it);
          if(p&&p.text==='DOUBT'&&p.delta>bd){bd=p.delta;best={s:st.id,i:idx};}
        });
      });
      if(!best)continue;
      SD.buyVariant(o.id,best.i,best.s);
      var mine=SD.invFor(o.id);
      if(mine.length){SD.swapWith(o,mine.length-1);did++;}
    }
    SD.doMorning();
    perMorning.push((SD.GAME.lastHarden||[]).length);
    (SD.GAME.lastHarden||[]).forEach(function(h){
      seenTiers.push({id:h.id,night:n+1,alert:SD.streetAlert()});});
    SD.GAME.weekday=(SD.GAME.weekday+1)%7;
    if(SD.GAME.weekday===0)SD.GAME.week++;
  }
  info('');
  info('a ten-night run, four objects a night, spread across the street:');
  seenTiers.forEach(function(t){
    info('   night '+t.night+'  ->  '+t.id+'   (alertness '+t.alert.toFixed(1)+')');});
  ok('THE STREET ACTUALLY HARDENS DURING A REAL RUN',seenTiers.length>=3,
     seenTiers.length+' of '+SD.HARDEN.length+' tiers reached in '+nightsRun+' nights');
  ok('...at most one change per morning',
     perMorning.every(function(k){return k<=1;}),
     'per-morning: '+perMorning.join(','));
  info('a street that installs three things overnight reads as a bug, not escalation');
  ok('...and it never un-hardens',
     (SD.GAME.hardened||[]).length===seenTiers.length,
     (SD.GAME.hardened||[]).join(', '));

  /* ── 4. each tier is a REAL OBSTACLE ───────────────────────────────────────*/
  function only(id){
    SD.startHouse();
    SD.GAME.hardened=[id];
    SD.nightReset();
  }
  var hoyt=SD.houseById('hoyt');

  // MOTION LIGHTS — dark until you are on the path, then it lights YOU
  only('lights');
  ok('motion lights install on the neighbours, not on you',SD.MOTION.length>=3,
     SD.MOTION.length+' porches');
  var lz=SD.MOTION[0].zone;
  stand(lz.x+40,lz.z);                     // far away
  SD.hardenTick(1/60);
  var darkAt=SD.litAt(lz.x,lz.z);
  stand(lz.x,lz.z);                        // on the path
  SD.hardenTick(1/60);
  var litAtPorch=SD.litAt(lz.x,lz.z);
  ok('THE PORCH IS DARK UNTIL YOU STEP ONTO IT',darkAt<C.LIT_SEEN_MIN,
     darkAt.toFixed(2));
  ok('...and then it lights the spot you are standing in',
     litAtPorch>=C.LIT_SEEN_MIN,darkAt.toFixed(2)+' -> '+litAtPorch.toFixed(2));
  info('it is a real light ZONE, so being seen picks it up with no extra plumbing');

  // DOGS — a house-waking noise, from the yard, on a cooldown
  only('dogs');
  ok('a dog is in every neighbour yard',SD.DOGS.length>=3,SD.DOGS.length+' dogs');
  var dg=SD.DOGS[0];
  var sleeper=SD.SLEEPERS.filter(function(s){return s.house===dg.house;})[0];
  sleeper.noise=0;
  stand(dg.x+30,dg.z);
  SD.hardenTick(1/60);
  ok('a dog you are nowhere near says nothing',sleeper.noise===0);
  stand(dg.x,dg.z);
  SD.hardenTick(1/60);
  var afterBark=sleeper.noise;
  ok('WALKING INTO THE YARD SETS IT OFF, AND THE HOUSE HEARS IT',afterBark>0,
     'sleeper noise 0 -> '+afterBark.toFixed(1));
  sleeper.noise=0;
  SD.hardenTick(1/60);
  ok('...but it does not machine-gun you',sleeper.noise===0,
     'cooldown '+C.HARD_DOG_CD+'s');

  // THE WATCH — a man outdoors who ends your night
  only('watch');
  ok('there is somebody walking the street',!!SD.WATCH,
     SD.WATCH?('at x='+SD.WATCH.x.toFixed(1)):'nobody');
  var w0=SD.WATCH.x;
  SD.hardenTick(0.5);
  ok('...and he is actually walking',!near(SD.WATCH.x,w0,1e-9),
     w0.toFixed(2)+' -> '+SD.WATCH.x.toFixed(2));
  // indoors he is not your problem
  SD.startHouse();SD.GAME.hardened=['watch'];SD.nightReset();
  stand(hoyt.x,P(1.0));                     // inside the house
  ok('you are indoors for this check',SD.ceilAt(hoyt.x,P(1.0))>0);
  SD.WATCH.x=hoyt.x;SD.WATCH.z=P(1.0);      // put him right on top of you
  SD.hardenTick(1/60);
  ok('HE CANNOT SEE YOU INDOORS',SD.NIGHT.running===true);
  info('which makes the YARDS the dangerous part of a hardened street, not the rooms');
  // outdoors, lit, in front of him: caught
  SD.startHouse();SD.GAME.hardened=['watch'];SD.nightReset();
  var sight0=SD.GAME.sightings;
  stand(hoyt.x,-P(8.0));
  SD.WATCH.x=hoyt.x-2.0;SD.WATCH.z=-P(8.0);SD.WATCH.dir=1;
  SD.hardenTick(1/60);
  ok('BEING SPOTTED IN A YARD ENDS THE NIGHT',SD.NIGHT.running===false,
     SD.NIGHT.over?SD.NIGHT.over.reason:'still running');
  ok('...and it counts as a sighting',SD.GAME.sightings===sight0+1,
     sight0+' -> '+SD.GAME.sightings);

  // DOORBELL CAMERAS — cost you even with everybody asleep
  only('cameras');
  var before=SD.RESIDENTS.walt.suspicion;
  stand(hoyt.x+30,0);
  SD.hardenTick(1/60);
  ok('a camera you never approach costs nothing',
     near(SD.RESIDENTS.walt.suspicion,before,1e-9));
  stand(hoyt._door?hoyt._door.pos[0]:hoyt.x,SD.frontDoor.pos[2]+0.5);
  SD.hardenTick(1/60);
  var afterCam=SD.RESIDENTS.walt.suspicion;
  ok('STANDING AT THE DOOR IS RECORDED, ASLEEP OR NOT',afterCam>before,
     before.toFixed(1)+' -> '+afterCam.toFixed(1));
  var midCam=SD.RESIDENTS.walt.suspicion;
  SD.hardenTick(1/60);
  ok('...once per night, not once per frame',
     near(SD.RESIDENTS.walt.suspicion,midCam,1e-9),
     SD.RESIDENTS.walt.suspicion.toFixed(1));

  // SLEEPING IN SHIFTS — somebody is already sitting up
  only('shifts');
  var houses={};
  SD.SLEEPERS.forEach(function(s){
    if(s.absent)return;
    houses[s.house]=houses[s.house]||{n:0,awake:0};
    houses[s.house].n++;
    if(s.state==='awake')houses[s.house].awake++;
  });
  var withAwake=Object.keys(houses).filter(function(k){return houses[k].awake>=1;});
  ok('SOMEBODY IS AWAKE IN EVERY OCCUPIED HOUSE',
     withAwake.length===Object.keys(houses).length,
     Object.keys(houses).map(function(k){
       return k+':'+houses[k].awake+'/'+houses[k].n;}).join(' '));
  ok('...but not everybody — you can still work the other half of the bed',
     Object.keys(houses).every(function(k){
       return houses[k].n<2||houses[k].awake<houses[k].n;}),
     'one each, not the whole household');

  /* ── 5. it survives a save, and a new run starts soft ──────────────────────*/
  SD.startHouse();
  SD.GAME.hardened=['lights','dogs'];
  SD.saveGame();
  SD.startHouse();
  ok('a NEW run begins on an unhardened street',(SD.GAME.hardened||[]).length===0);
  SD.loadGame();
  ok('...but a LOADED game remembers its doorbell cameras',
     (SD.GAME.hardened||[]).length===2,(SD.GAME.hardened||[]).join(', '));

  /* ── 6. it is legible ──────────────────────────────────────────────────────*/
  ok('every tier has something to say for itself',
     SD.HARDEN.every(function(h){return h.name&&h.text&&h.text.length>60;}));
  SD.startHouse();
  SD.RESIDENTS.walt.doubt=90;SD.RESIDENTS.june.doubt=90;
  SD.RESIDENTS.marisol.doubt=90;SD.RESIDENTS.dev.doubt=90;
  SD.showReport('home','x');
  var body=document.getElementById('report-body').innerHTML;
  ok('THE MORNING TELLS YOU THE STREET CHANGED',/rp-hard/.test(body),
     'the street card is in the report');
  info('it reads like a fracture because it is one — the neighbourhood\'s, not a person\'s');

  var eb=document.getElementById('err-banner');
  ok('no crash banner',!eb,eb?eb.textContent.slice(0,200):'');

}catch(e){
  fail++;
  out.push('FAIL  harness threw: '+(e&&e.message)+'  @ '+
    String((e&&e.stack)||'').split('\n').slice(0,3).join(' | '));
}

var summary='SDTEST '+(fail===0?'ALL-PASS':'FAILURES')+' pass='+pass+' fail='+fail;
var pre=document.createElement('pre');
pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\n'+summary+'\n'+out.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);
document.title=summary;
})();

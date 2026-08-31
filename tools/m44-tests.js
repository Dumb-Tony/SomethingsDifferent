/* M44 — THE OBJECTIVE HAS A PLACE.

   Playtest, in the user's own words: "didn't know what to do."

   The rail has twelve steps and every one of them is a PARAGRAPH. It tells you to
   search the planters by the porch while you are standing in a dark street looking at
   four identical dark shapes, and it never once points at one. Reading is not the
   same as knowing where to go.

   So the current step gets a place in the world: a slow amber beacon standing over
   whatever the rail is actually asking about. Sodium, because that is the language
   the street is already speaking (M43), and the only thing in the game that moves
   like that.

   And deliberately NOT on everything. One at a time, only while the guide is on, and
   only for the steps that HAVE a place - "read the room" is a key and "buy a better
   one" is a screen, and standing a beacon somewhere for those would be a lie. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}

try{
var SD=window.__SD,C=SD.CONST,G=SD.GUIDE;
SD.stopLoop();
function at(){return G.step()?G.step().id:'DONE';}
function goTo(id){
  /* Park the rail on a named step without playing the whole run. */
  var i=SD.GUIDE_STEPS.map(function(s){return s.id;}).indexOf(id);
  SD.GAME.guideStep=i;SD.GAME.guideDone=false;
  return i>=0;
}

/* ── 1. EVERY STEP THAT HAS A PLACE, POINTS AT IT ───────────────────────────*/
(function(){
  SD.startHouse();G.setOn(true);
  var placed=[],unplaced=[];
  SD.GUIDE_STEPS.forEach(function(s){
    goTo(s.id);
    var t=SD.beaconTarget();
    if(t)placed.push(s.id+' -> '+t.label);else unplaced.push(s.id);
  });
  info('points at: '+placed.join(' | '));
  info('no place:  '+unplaced.join(', '));
  ok('THE STEPS THAT HAPPEN SOMEWHERE HAVE A TARGET',placed.length>=5,
     placed.length+' of '+SD.GUIDE_STEPS.length+' steps point at something');
  ok('...including the one the player gets stuck on',
     (goTo('key'),!!SD.beaconTarget()),
     '"search the planters by the porch" now has a planter under it');
  ok('...and the break-in',(goTo('in'),!!SD.beaconTarget()));
  ok('...and finding something of theirs',(goTo('scan'),!!SD.beaconTarget()));
  ok('...and going home',(goTo('out'),!!SD.beaconTarget()));

  ok('THE STEPS THAT ARE A KEY OR A SCREEN DO NOT PRETEND TO',
     unplaced.indexOf('read')>=0&&unplaced.indexOf('shop')>=0,
     'no beacon for read/shop/back/fence/meet - pointing at a spot for a keypress '+
     'or a menu would be a lie');

  /* fab and swap DO have a place - they just need something recorded first, and the
     sweep above ran on a fresh street. Measuring them there said "no place", which
     is true of that moment and false of the game. */
  SD.startHouse();
  SD.scanObject(SD.objects.filter(function(o){return SD.RESIDENTS[o.owner];})[0]);
  goTo('fab');
  var fabT=SD.beaconTarget();
  ok('...but PRINTING points at the thing you recorded',!!fabT,
     fabT?fabT.label:'nothing');
  goTo('swap');
  var swapT=SD.beaconTarget();
  ok('...and so does swapping',!!swapT,swapT?swapT.label:'nothing');
  ok('...at the same object, because it is the same object',
     !!fabT&&!!swapT&&Math.abs(fabT.pos[0]-swapT.pos[0])<0.01,
     'both on '+(fabT?fabT.label:'?'));
})();

/* ── 2. IT POINTS AT THE RIGHT THING ────────────────────────────────────────*/
(function(){
  SD.startHouse();G.setOn(true);

  goTo('key');
  var t=SD.beaconTarget();
  var onAPlanter=SD.PLANTERS.some(function(p){
    return Math.abs(p.pos[0]-t.pos[0])<0.01&&Math.abs(p.pos[2]-t.pos[2])<0.01;});
  ok('the planter beacon is ON a planter',onAPlanter,
     'at ('+t.pos[0].toFixed(1)+','+t.pos[2].toFixed(1)+')');

  goTo('in');
  t=SD.beaconTarget();
  var onADoor=SD.DOORS.some(function(d){
    return Math.abs(d.pos[0]-t.pos[0])<0.01&&Math.abs(d.pos[2]-t.pos[2])<0.01;});
  ok('the door beacon is ON a door',onADoor,t.label);

  goTo('scan');
  t=SD.beaconTarget();
  var o=SD.objects.filter(function(x){
    return x.spec&&x.spec._pos&&Math.abs(x.spec._pos[0]-t.pos[0])<0.01;})[0];
  ok('the scan beacon is on something SOMEBODY OWNS',
     !!o&&!!SD.RESIDENTS[o.owner],o?o.label+' ('+o.owner+')':'nothing');
  ok('...and on something you have not recorded yet',
     !!o&&!SD.CATALOG[o.id],'uncatalogued');

  /* ...and it MOVES ON once you have done that one. */
  SD.scanObject(o);
  var t2=SD.beaconTarget();
  ok('IT MOVES TO THE NEXT ONE WHEN YOU RECORD THAT ONE',
     !t2||Math.abs(t2.pos[0]-t.pos[0])>0.01,
     t2?('now on '+t2.label):'nothing left to scan');
})();

/* ── 3. IT RESPECTS THE PLAYER WHO TURNED THE GUIDE OFF ─────────────────────*/
(function(){
  SD.startHouse();
  G.setOn(true);goTo('key');
  ok('with the guide on, there is a beacon',!!SD.beaconTarget());
  G.setOn(false);
  ok('WITH THE GUIDE OFF, THERE IS NOT',!SD.beaconTarget(),
     'the title screen offers GUIDE: OFF and it has to mean it');
  G.setOn(true);

  SD.GAME.guideDone=true;
  ok('...and none once the rail is finished',!SD.beaconTarget());
  SD.GAME.guideDone=false;
})();

/* ── 4. IT IS NOT IN THE DAYTIME, AND IT CLEANS UP ──────────────────────────*/
(function(){
  SD.startHouse();G.setOn(true);goTo('key');
  SD.beaconTick(0.1);
  ok('the beacon is built and visible at night',
     !!SD.BEACON.obj&&SD.BEACON.obj.visible);

  SD.startWalk();
  SD.beaconTick(0.1);
  ok('IT IS NOT THERE IN THE AFTERNOON',!SD.BEACON.obj.visible,
     'M20 is a different mode with a different job');
  SD.endWalk();

  SD.startEvening();
  SD.beaconTick(0.1);
  ok('...nor in the evening at home',!SD.BEACON.obj.visible);
  SD.endEvening();

  SD.beaconTick(0.1);
  ok('...and it comes back for the next night',SD.BEACON.obj.visible);

  /* it bobs - it must look like an indicator, not like a thing in the room */
  var ys=[];
  for(var i=0;i<40;i++){SD.beaconTick(1/30);ys.push(SD.BEACON.obj.position.y);}
  var span=Math.max.apply(null,ys)-Math.min.apply(null,ys);
  ok('...and it moves, so it reads as an indicator',span>0.05,
     'bobs '+span.toFixed(2)+'m');
})();

/* ── 5. IT IS THE STREET'S OWN COLOUR ───────────────────────────────────────*/
(function(){
  SD.startHouse();G.setOn(true);goTo('key');
  SD.beaconTick(0.1);
  var c=SD.BEACON.obj.material.color;
  var sodium=new (window.THREE.Color)(C.SODIUM);
  ok('THE BEACON IS SODIUM, like the lamps',
     Math.abs(c.r-sodium.r)<0.02&&Math.abs(c.b-sodium.b)<0.02,
     '#'+c.getHexString()+' vs '+C.SODIUM);
  info('the language of "look here" should be the language the world already speaks');
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

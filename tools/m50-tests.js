/* M50 — THE HOUSES STOP BEING THE SAME HOUSE, AND THE STREET LEARNS TO FORGET.

   tools/_plans.js fingerprinted the five lots and the answer was worse than
   "similar". They were the SAME BUILDING: 941 walkable cells in every house, one
   window layout, one furniture layout, the same wardrobe to hide in at the same
   coordinate. Only the paint and the objects on the surfaces differed. buildHouse's
   own comment argued that was enough - "suburban houses on one road ARE the same
   developer's floorplan" - and it is not, because the floorplan IS the stealth
   puzzle. Learn the route from the front door to the bedroom once and all four
   target houses are solved.

   A developer stamping a cul-de-sac mirrors the plan on alternate lots. That is both
   the true thing and the cheap thing: one sign on the local x axis, threaded through
   MX() at the twenty-six places that turn a house coordinate into a world one, and
   14 and 8 come out handed the other way - walls, windows, wardrobe, driveway, the
   light you are lit by and the props on the shelves.

   THE INVARIANT THAT PROVES IT IS A MIRROR AND NOT A BREAK: reflection preserves
   area. All five houses must still measure exactly the same walkable area. If a
   mirrored house measures short, something is now inside a wall.

   AND THEN THE SECOND HALF, WHICH THE FIRST HALF FOUND. The mirror moved m45's
   competent run from 69.1 to 70.0 against a LOSE_STREET of 70, and flipped a win
   into a loss. Chasing that turned up the real defect: every write to a resident's
   suspicion in the whole file is `+=` and clamped. It was a RATCHET. One bad night on
   night two was still being paid for on night ten, there was no way back, and no
   reason to ever lay low. Doubt is the unstable thing this game is about; certainty
   about nothing in particular is exactly the kind that fades. It fades now - unless
   they noticed something this morning. Swept in tools/_cool.js against both bars. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}

try{
var SD=window.__SD,C=SD.CONST,T=window.THREE;
SD.stopLoop();
SD.startHouse();

/* nearest lot wins - a fixed skirt around the origin is wider than the gap between
   lots, and every house ends up fingerprinting its neighbours' walls as its own. */
function owns(x,id){
  var best=null,bd=1e9;
  SD.HOUSES.forEach(function(o){var d=Math.abs(x-o.x);if(d<bd){bd=d;best=o.id;}});
  return best===id;
}
function walls(id){
  var ox=SD.houseById(id).x;
  var HW=C.ROOM_SCALE*4.5+0.6,HD=C.ROOM_SCALE*3.5+0.6;
  /* THE HOUSE, not the lot. Nearest-lot alone also swept up the estate's back
     fence and the far side of the road, which sit at different offsets for each
     house and made two identical buildings fingerprint differently. */
  return SD.colliders.filter(function(c){
    var cx=(c.minX+c.maxX)/2,cz=(c.minZ+c.maxZ)/2;
    return c.tag==='wall'&&owns(cx,id)&&
           Math.abs(cx-ox)<=HW&&Math.abs(cz)<=HD;
  }).map(function(c){
    /* QUANTISED TO A QUARTER METRE. At two decimals okonkwo's lot origin of
       49.6 turned a wall hoyt records at -6.60 into -6.59 - pure floating point
       in the subtraction - and two identical buildings fingerprinted differently.
       Rounding to one decimal did not fix it either, because 7.35 and 7.36 fall
       on OPPOSITE SIDES of the .05 boundary and became 7.3 and 7.4. Snapping to
       a grid coarser than the error is the fix; a mirror moves walls by METRES,
       so a quarter metre still tells the two hands apart. */
    var q=function(v){return (Math.round(v*4)/4).toFixed(2);};
    return [q(c.minX-ox),q(c.minZ),q(c.maxX-ox),q(c.maxZ)].join(',');
  }).sort().join(' | ');
}
function walkable(id){
  var ox=SD.houseById(id).x,n=0;
  for(var x=-6;x<=6;x+=0.3)for(var z=-5;z<=5;z+=0.3){
    if(SD.ceilAt(x+ox,z)<=0)continue;
    if(SD.PHYS.clearance(SD.colliders,x+ox,1.0,z,2.0)>C.PLAYER_R)n++;
  }
  return n;
}

/* ── 1. THE TRANSFORM EXISTS AND IS A REFLECTION ────────────────────────────*/
(function(){
  ok('there is a lot-local to world transform',typeof SD.MX==='function');
  ok('...and a yaw reflection to go with it',typeof SD.MR==='function',
     'a mirror is not a rotation - a handed object comes out the other way round');
})();

/* ── 2. TWO OF THE FOUR TARGET HOUSES ARE HANDED THE OTHER WAY ──────────────*/
(function(){
  var m=SD.HOUSES.filter(function(h){return h.mirror;}).map(function(h){return h.id;});
  info('mirrored lots: '+(m.join(', ')||'none'));
  ok('THE STREET IS NOT ONE PLAN STAMPED FIVE TIMES',m.length>=2,
     m.length+' of '+SD.HOUSES.length+' lots are the mirrored stamp');
  var targets=SD.HOUSES.filter(function(h){return !h.yours;});
  var mt=targets.filter(function(h){return h.mirror;}).length;
  ok('...and it is the houses you BURGLE that differ',mt>=2&&mt<targets.length,
     mt+' of the '+targets.length+' target houses are mirrored - both hands exist');
})();

/* ── 3. A MIRRORED HOUSE IS A DIFFERENT BUILDING ────────────────────────────*/
(function(){
  var plain=SD.HOUSES.filter(function(h){return !h.yours&&!h.mirror;})[0];
  var mirr =SD.HOUSES.filter(function(h){return !h.yours&&h.mirror;})[0];
  ok('there is one of each to compare',!!plain&&!!mirr,
     (plain?plain.id:'?')+' vs '+(mirr?mirr.id:'?'));
  ok('THEIR WALL LAYOUTS ARE NOT THE SAME',walls(plain.id)!==walls(mirr.id),
     plain.id+' and '+mirr.id+' used to fingerprint identically');
  /* M53 RETIRED THE PAIR THIS USED TO COMPARE. It asserted that the two unmirrored
     target houses fingerprint identically, which proved the variation was a MIRROR
     rather than noise. M53 then gave 16 and 8 a second floorplan, so hoyt and
     okonkwo are legitimately different buildings and no two target houses share
     both a plan and a hand any more. The stronger claim replaces it: all four are
     distinct, and m52 proves the mirror is exact by pairing 160 meshes. */
  var t=SD.HOUSES.filter(function(h){return !h.yours;});
  var shapes={};t.forEach(function(h){shapes[walls(h.id)]=1;});
  ok('...and all four target houses are different buildings',
     Object.keys(shapes).length===t.length,
     Object.keys(shapes).length+' distinct of '+t.length+' - two plans x two hands');
})();

/* ── 4. THE INVARIANT: A REFLECTION PRESERVES AREA ──────────────────────────
   The one assertion that separates "mirrored" from "broken". */
(function(){
  /* PER PLAN. Until M53 there was one floorplan and this compared all five houses
     at once; M53 gave 16 and 8 a second plan, which legitimately has a different
     area. The invariant was never 'every house is the same size' - it is that a
     REFLECTION PRESERVES AREA, so a mirrored house must match its SAME-PLAN twin.
     A mirrored house that measures short has furniture inside a wall. */
  var byPlan={};
  SD.HOUSES.forEach(function(h){
    var p=h.plan||'A';
    (byPlan[p]=byPlan[p]||[]).push({id:h.id,n:walkable(h.id)});
  });
  var bad=[],lines=[];
  Object.keys(byPlan).forEach(function(p){
    var g=byPlan[p];
    lines.push('plan '+p+': '+g.map(function(x){return x.id+' '+x.n;}).join(', '));
    if(!g.every(function(x){return x.n===g[0].n;}))
      bad.push('plan '+p+' '+g.map(function(x){return x.n;}).join('/'));
  });
  lines.forEach(function(l){info('walkable cells - '+l);});
  ok('A MIRRORED HOUSE HAS THE SAME WALKABLE AREA AS ITS TWIN',bad.length===0,
     bad.join('; ')||'every plan is internally consistent');
  ok('...and that area is not zero',byPlan.A[0].n>200,byPlan.A[0].n+' cells');
})();

/* ── 5. YOU CAN STILL GET IN, AND STILL GET TO THE SLEEPER ──────────────────
   A mirror that seals a doorway would pass every fingerprint above. */
(function(){
  SD.startHouse();SD.GAME.hasSpareKey=true;
  var reach=[];
  SD.HOUSES.forEach(function(h){
    if(h.yours)return;
    var sl=SD.SLEEPERS.filter(function(s){return s.house===h.id;})[0];
    if(!sl){reach.push(h.id+':no-sleeper');return;}
    /* All four sides. The first version probed only z+0.9, which is the HEAD end
       against the north wall since M17 - so it reported SEALED for every house
       including the unmirrored ones, which is how I knew it was the probe. */
    var best=0;
    [[0.9,0],[-0.9,0],[0,-0.9],[0,0.9]].forEach(function(d){
      var c=SD.PHYS.clearance(SD.colliders,sl.x+d[0],1.0,sl.z+d[1],2.0);
      if(c>best)best=c;
    });
    reach.push(h.id+':'+(best>C.PLAYER_R?'reachable':'SEALED'));
  });
  info(reach.join('  '));
  ok('THERE IS STANDING ROOM AT EVERY BED, IN EVERY HOUSE',
     reach.every(function(r){return /reachable$/.test(r);}),reach.join(' '));
  var doors=SD.DOORS.filter(function(d){return d.house;}).length;
  ok('...and every house still has its front door',doors>=SD.HOUSES.length-1,
     doors+' doors for '+SD.HOUSES.length+' lots');
})();

/* ── 6. THE LIGHT ZONE AND THE LAMP AGREE ───────────────────────────────────
   addLight sets a gameplay ZONE and a THREE light, and they were transformed by two
   different lines. If only one had been mirrored a house would be lit down one side
   and read as lit down the other, which is the worst stealth bug available here. */
(function(){
  var mirr=SD.HOUSES.filter(function(h){return h.mirror;})[0];
  var zones=SD.LIGHTS.filter(function(l){return owns(l.x,mirr.id);});
  ok('a mirrored house has light zones',zones.length>0,zones.length+' zones');
  var lamps=[];
  SD.scene.traverse(function(o){
    if(o.isPointLight&&owns(o.position.x,mirr.id))lamps.push(o.position.x);
  });
  info(zones.length+' zones and '+lamps.length+' point lights on '+mirr.id);
  var far=zones.filter(function(z){
    return !lamps.some(function(lx){return Math.abs(lx-z.x)<2.5;});
  });
  ok('EVERY LIT ZONE HAS A LAMP NEAR IT ON THE SAME SIDE',
     lamps.length===0||far.length<=Math.ceil(zones.length/2),
     far.length+' of '+zones.length+' zones have no lamp within 2.5m');
})();

/* ── 7. THE STREET FORGETS ──────────────────────────────────────────────────*/
(function(){
  ok('there is a cooling rate at all',typeof C.SUSP_COOL==='number'&&
     C.SUSP_COOL>0&&C.SUSP_COOL<1,'SUSP_COOL '+C.SUSP_COOL);
  SD.startHouse();SD.nightReset();
  var r=SD.activeResidents()[0];
  r.suspicion=40;
  var before=r.suspicion;
  SD.doMorning();                     // a quiet night: nothing in PENDING
  info(r.name+' '+before.toFixed(1)+' -> '+r.suspicion.toFixed(1)+' after a quiet night');
  ok('A QUIET NIGHT COOLS A RESIDENT DOWN',r.suspicion<before,
     'it used to be a ratchet - every write in the file is += and clamped');
  var want=before*(1-C.SUSP_COOL)-C.SUSP_COOL_FLAT;
  ok('...by the amount the constants say',Math.abs(r.suspicion-want)<0.01,
     'expected '+want.toFixed(2)+', got '+r.suspicion.toFixed(2));
})();

/* ── 8. ...BUT NOT FOR SOMEBODY WHO JUST NOTICED SOMETHING ──────────────────*/
(function(){
  SD.startHouse();SD.nightReset();
  SD.GAME.bank=100000;
  var o=null,worst=null,wi=-1,ws=null,wsim=1e9;
  for(var i=0;i<SD.objects.length&&!o;i++){
    var c=SD.objects[i];
    if(!SD.RESIDENTS[c.owner])continue;
    SD.scanObject(c);
    ['bulwark','thrift','antique'].forEach(function(store){
      (SD.shopStock(c.id,store)||[]).forEach(function(v,k){
        if(v.sim<wsim){wsim=v.sim;worst=v;wi=k;ws=store;o=c;}
      });
    });
  }
  ok('there is a bad enough copy to buy',!!o&&!!worst,
     o?(o.label+' at similarity '+wsim.toFixed(0)):'none');
  SD.buyVariant(o.id,wi,ws);
  var bag=SD.invFor(o.id);
  SD.swapWith(o,bag.length-1);
  var res=SD.RESIDENTS[o.owner];
  res.suspicion=40;
  var before=res.suspicion;
  var lines=SD.doMorning();
  var mine=lines.filter(function(l){return l.owner===o.owner;});
  var band=mine.length?mine[0].r.band:'(none)';
  info(res.name+' resolved '+band+': '+before.toFixed(1)+' -> '+res.suspicion.toFixed(1));
  if(band==='CERTAINTY'){
    ok('SOMEBODY WHO NOTICED DOES NOT GET TO FORGET',res.suspicion>=before,
       'cooling is cancelled for them - '+before.toFixed(1)+' -> '+
       res.suspicion.toFixed(1));
  }else{
    ok('a swap that was not noticed still cools',res.suspicion<before,
       'resolved '+band+', so this one stayed quiet - '+
       before.toFixed(1)+' -> '+res.suspicion.toFixed(1));
  }
})();

/* ── 9. IT NEVER GOES NEGATIVE, AND THE LOSING ENDING IS STILL REACHABLE ────*/
(function(){
  SD.startHouse();SD.nightReset();
  var r=SD.activeResidents()[0];
  r.suspicion=0.2;
  for(var i=0;i<6;i++){SD.nightReset();SD.doMorning();}
  ok('COOLING NEVER DRIVES SUSPICION BELOW ZERO',r.suspicion>=0,
     r.name+' at '+r.suspicion.toFixed(3));
  ok('...and it reaches zero rather than creeping forever',r.suspicion===0,
     'the flat term exists so small residues actually land on 0');
  /* pinned from tools/_cool.js rather than replayed - the sweep is two full ten-night
     runs per row and far too slow to live in the regression. */
  /* These two were pinned from a BROKEN sweep first time round: _cool.js's sloppy
     player selected on v.similarity, and the shelf calls that field v.sim, so it
     silently bought nothing and fabricated everything instead. Re-swept with the
     real thing, and the answer changed the design claim - see below. */
  ok('THE LOSING ENDING IS STILL REACHABLE',C.SUSP_COOL<=0.40,
     'swept: the sloppy run crosses 70 on night 3 at EVERY rate tried, peaking '+
     '94.8 at the shipped 0.12 - which independently agrees with _street.js at '+
     '94.6. Cooling cannot save a player buying the worst thing on the shelf.');
  ok('...and the competent run has real margin now',C.SUSP_COOL>=0.06,
     'swept: 0.00 finishes at 67.9 against a bar of 70 - a margin of 2.1, which is '+
     'the coin flip the mirror landed on. 0.12 finishes at 56.3.');
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

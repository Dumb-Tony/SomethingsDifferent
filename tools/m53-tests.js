/* M53 — TWO PLANS, NOT ONE.

   M50 gave the street two HANDS of a single floorplan. That doubled the variety and
   then stopped: 14 Ardsley is 12 Ardsley backwards, and once you have learned 12 you
   have learned both. A hand is not a plan.

   A plan changes WHICH WALLS HAVE GAPS IN THEM, and nothing else. Not one stick of
   furniture, not one prop, not one window - because the furniture is placed from the
   fixtures and the twenty objects in each house are authored in metres against those
   fixtures, so moving a room would strand every one of them. Moving a DOORWAY costs
   nothing and changes the only thing that matters, which is the route to the bed.

     PLAN A   TWO doors off the hall. hall -> lounge -> bedroom is the short way in:
              12.4m of walking, straight across the lounge past the television.
     PLAN B   ONE door off the hall, into the kitchen, and the kitchen opens into
              the lounge. hall -> kitchen -> lounge -> bedroom, 20.0m, past the
              fridge AND the television, with the hall itself a dead end behind you.

   (The first plan B put the bedroom off the KITCHEN, and the flood fill below
   caught that the bed then could not be reached at all. tools/_gap.js showed why:
   the wardrobe stands hard against that divider from z 1.0 to 3.5. The divider is
   clear at its south end instead, so that is where the doorway went.)

   With M50's two hands that gives the four houses you burgle four different problems.

   THE ASSERTION THAT MATTERS IS REACHABILITY, and it has to be a real flood fill from
   the front door. A clearance probe beside the bed proves there is standing room; it
   says nothing about whether you can GET there. If plan B's new doorway were blocked
   by so much as a bedside table, two of the four houses would be unfinishable and
   every other measurement in this file would still be green. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}

try{
var SD=window.__SD,C=SD.CONST,T=window.THREE;
SD.stopLoop();
SD.startHouse();
SD.GAME.hasSpareKey=true;
SD.HOUSES.forEach(function(h){if(h._door)SD.useDoor(h._door);});   // doors open

var RS=C.ROOM_SCALE, HW=RS*4.5, HD=RS*3.5, STEP=0.2;

/* Legal standing spot. The colliders are ALREADY inflated by PLAYER_R (that is the
   house rule in this file), so a point outside every box is a legal player centre -
   the test is clearance > 0, not clearance > PLAYER_R. Using the stricter one shrinks
   every doorway by another 32cm and reports doors that work as sealed. */
function walkable(wx,z){
  if(SD.ceilAt(wx,z)<=0)return false;
  return SD.PHYS.clearance(SD.colliders,wx,1.0,z,C.CAM_OCC_MIN_TOP)>0;
}
/* Flood the interior from just inside the front door. Returns a Set of "ix,iz". */
function flood(id){
  var ox=SD.houseById(id).x;
  var seen={},q=[],n=0;
  function key(ix,iz){return ix+','+iz;}
  var sx=0, sz=Math.round((-HD+0.55)/STEP);
  /* nudge the start until it is legal - the threshold sits right at the door jamb */
  var start=null;
  for(var t=0;t<10&&!start;t++){
    var z=(sz+t)*STEP;
    if(walkable(ox,z))start=[0,sz+t];
  }
  if(!start)return {set:seen,n:0,ox:ox,failed:'no legal cell inside the front door'};
  /* BFS, not DFS: the depth of a cell is how many steps from the front door it
     is, which is what lets this suite say the two plans are different LENGTHS
     and not merely different shapes. */
  seen[key(start[0],start[1])]=0;q.push(start);
  var head=0;
  while(head<q.length){
    var c=q[head++];n++;
    var dirs=[[1,0],[-1,0],[0,1],[0,-1]];
    for(var i=0;i<4;i++){
      var ix=c[0]+dirs[i][0], iz=c[1]+dirs[i][1];
      if(Math.abs(ix*STEP)>HW||Math.abs(iz*STEP)>HD)continue;
      var k=key(ix,iz);
      if(seen[k]!==undefined)continue;
      if(!walkable(ox+ix*STEP,iz*STEP))continue;
      seen[k]=seen[key(c[0],c[1])]+1;q.push([ix,iz]);
    }
  }
  return {set:seen,n:n,ox:ox};
}
/* the nearest flooded cell to a point, and how many steps from the door it is */
function reach(f,lx,z){
  var ix=Math.round(lx/STEP), iz=Math.round(z/STEP), best=null;
  for(var a=-2;a<=2;a++)for(var b=-2;b<=2;b++){
    var d=f.set[(ix+a)+','+(iz+b)];
    if(d!==undefined&&(best===null||d<best))best=d;
  }
  return best;
}
function reached(f,lx,z){return reach(f,lx,z)!==null;}

/* ── 1. THE STREET HAS TWO PLANS AND TWO HANDS ──────────────────────────────*/
(function(){
  var t=SD.HOUSES.filter(function(h){return !h.yours;});
  var combos={};
  t.forEach(function(h){combos[(h.plan||'A')+(h.mirror?'-mirrored':'-plain')]=h.id;});
  info('the houses you burgle: '+t.map(function(h){
    return h.id+'='+(h.plan||'A')+(h.mirror?'/mirrored':'/plain');}).join('  '));
  ok('THERE ARE TWO FLOORPLANS ON THIS STREET',
     t.some(function(h){return (h.plan||'A')==='B';}),
     Object.keys(combos).join(', '));
  ok('...and all four combinations of plan and hand are built',
     Object.keys(combos).length===4,
     Object.keys(combos).length+' distinct: '+Object.keys(combos).join(', '));
})();

/* ── 2. FOUR DIFFERENT BUILDINGS ────────────────────────────────────────────*/
(function(){
  function q(v){return (Math.round(v*4)/4).toFixed(2);}   // quarter metre, per M50
  function walls(id){
    var ox=SD.houseById(id).x;
    return SD.colliders.filter(function(c){
      var cx=(c.minX+c.maxX)/2,cz=(c.minZ+c.maxZ)/2;
      return c.tag==='wall'&&Math.abs(cx-ox)<=HW+0.6&&Math.abs(cz)<=HD+0.6;
    }).map(function(c){
      return [q(c.minX-ox),q(c.minZ),q(c.maxX-ox),q(c.maxZ)].join(',');
    }).sort().join(' | ');
  }
  var t=SD.HOUSES.filter(function(h){return !h.yours;});
  var seen={};t.forEach(function(h){seen[walls(h.id)]=1;});
  info(Object.keys(seen).length+' distinct wall layouts across '+t.length+' target houses');
  ok('EVERY HOUSE YOU BURGLE IS A DIFFERENT BUILDING',
     Object.keys(seen).length===t.length,
     Object.keys(seen).length+' of '+t.length+' - it was 1 before M50 and 2 after');
})();

/* ── 3. YOU CAN STILL WALK FROM THE FRONT DOOR TO THE BED ───────────────────*/
(function(){
  var rows=[],bad=[];
  SD.HOUSES.forEach(function(h){
    if(h.yours)return;
    var f=flood(h.id);
    if(f.failed){bad.push(h.id+': '+f.failed);return;}
    var sl=SD.SLEEPERS.filter(function(s){return s.house===h.id;})[0];
    if(!sl){bad.push(h.id+': no sleeper');return;}
    var got=reached(f,sl.x-f.ox,sl.z);
    var steps=reach(f,sl.x-f.ox,sl.z);
    rows.push(h.id+'('+(h.plan||'A')+') '+f.n+' cells, bed '+
      (steps===null?'UNREACHABLE':((steps*STEP).toFixed(1)+'m away'))+
      (got?'':'   <-- CANNOT REACH'));
    if(!got)bad.push(h.id+' cannot reach its sleeper');
  });
  rows.forEach(function(r){info('   '+r);});
  ok('THE BED IS REACHABLE ON FOOT IN EVERY HOUSE',bad.length===0,
     bad.join('; ')||'all four');
})();

/* ── 4. AND TO THE KITCHEN AND THE LOUNGE ───────────────────────────────────
   A plan that seals a room is worse than one plan, not better. */
(function(){
  var bad=[];
  SD.HOUSES.forEach(function(h){
    if(h.yours)return;
    var f=flood(h.id),m=h.mirror?-1:1;
    /* kitchen: west half in plan coordinates; lounge: east, south of the bedroom */
    if(!reached(f,m*-RS*2.4,RS*1.6))bad.push(h.id+' kitchen');
    if(!reached(f,m*RS*2.6,-RS*0.4))bad.push(h.id+' lounge');
  });
  ok('EVERY ROOM IS STILL REACHABLE IN EVERY HOUSE',bad.length===0,
     bad.join(', ')||'kitchen and lounge reachable in all four');
})();

/* -- 5. THE TWO PLANS ARE GENUINELY DIFFERENT PROBLEMS ---------------------
   The first version of this asserted that plan B's lounge is a dead end. That was
   true of the plan B I first wrote and NOT of the one that shipped. Opening the
   divider at its north end would have put the bedroom off the kitchen, and the flood
   fill above caught that the bed then became unreachable - tools/_gap.js showed why,
   the wardrobe stands hard against that divider from z 1.0 to 3.5 and there is no
   doorway to be had there without moving a hiding place. The plan that works opens
   the divider at its SOUTH end and closes the hall's second doorway instead, so what
   separates the two plans is how many ways there are OUT OF THE HALL. */
(function(){
  function openAlong(id,zLine,x0,x1){
    var h=SD.houseById(id),ox=h.x,m=h.mirror?-1:1,open=0;
    for(var lx=x0;lx<=x1;lx+=0.15)
      if(SD.PHYS.clearance(SD.colliders,ox+m*lx,1.0,zLine,C.CAM_OCC_MIN_TOP)>0)open++;
    return open;
  }
  function openDown(id,xLine,z0,z1){
    var h=SD.houseById(id),ox=h.x,m=h.mirror?-1:1,open=0;
    for(var z=z0;z<=z1;z+=0.15)
      if(SD.PHYS.clearance(SD.colliders,ox+m*xLine,1.0,z,C.CAM_OCC_MIN_TOP)>0)open++;
    return open;
  }
  var A=SD.HOUSES.filter(function(h){return !h.yours&&(h.plan||'A')==='A';});
  var B=SD.HOUSES.filter(function(h){return !h.yours&&h.plan==='B';});
  ok('there is one of each plan to compare',A.length>0&&B.length>0,
     A.length+' plan A, '+B.length+' plan B');

  var hz=-RS*1.6;
  var aHall=A.map(function(h){return openAlong(h.id,hz,1.0,RS*4.0);});
  var bHall=B.map(function(h){return openAlong(h.id,hz,1.0,RS*4.0);});
  info('open samples in the hall wall east of centre: A '+aHall.join(',')+
       '   B '+bHall.join(','));
  ok('IN PLAN A THE LOUNGE OPENS OFF THE HALL',aHall.every(function(v){return v>0;}),
     aHall.join(','));
  ok('...AND IN PLAN B IT DOES NOT - ONE DOOR OFF THE HALL',
     bHall.every(function(v){return v===0;}),bHall.join(','));

  var aDiv=A.map(function(h){return openDown(h.id,0,-RS*1.5,0);});
  var bDiv=B.map(function(h){return openDown(h.id,0,-RS*1.5,0);});
  info('open samples down the kitchen divider: A '+aDiv.join(',')+'   B '+bDiv.join(','));
  ok('IN PLAN B THE KITCHEN OPENS INTO THE LOUNGE',
     bDiv.every(function(v){return v>0;}),bDiv.join(','));
  ok('...and in plan A that divider is solid',aDiv.every(function(v){return v===0;}),
     aDiv.join(','));
})();

/* -- 5b. AND THE WAY IN IS ACTUALLY LONGER ---------------------------------
   The point of a second plan is not that the walls differ, it is that the PROBLEM
   differs. Plan B routes you through the kitchen and then the lounge to reach the
   bed, so the walk should be measurably further - and that is a number, not a claim. */
(function(){
  function walk(h){
    var f=flood(h.id);
    var sl=SD.SLEEPERS.filter(function(s){return s.house===h.id;})[0];
    if(!sl)return null;
    var d=reach(f,sl.x-f.ox,sl.z);
    return d===null?null:d*STEP;
  }
  var rows=[];
  SD.HOUSES.forEach(function(h){
    if(h.yours)return;
    var w=walk(h);
    rows.push(h.id+'('+(h.plan||'A')+') '+(w===null?'-':w.toFixed(1)+'m'));
  });
  info('front door to the bed: '+rows.join('   '));
  var a=SD.HOUSES.filter(function(h){return !h.yours&&(h.plan||'A')==='A';}).map(walk);
  var b=SD.HOUSES.filter(function(h){return !h.yours&&h.plan==='B';}).map(walk);
  var am=Math.min.apply(null,a), bm=Math.min.apply(null,b);
  ok('PLAN B IS A LONGER WAY IN',bm>am,
     bm.toFixed(1)+'m against '+am.toFixed(1)+'m - through the kitchen and the '+
     'lounge rather than straight across the lounge');
})();

/* ── 6. AND THE WARDROBE IS STILL SOMEWHERE YOU CAN REACH ───────────────────*/
(function(){
  var bad=[];
  SD.HOUSES.forEach(function(h){
    if(h.yours)return;
    var f=flood(h.id);
    var mine=SD.HIDES.filter(function(x){return Math.abs(x.pos[0]-f.ox)<=HW&&
                                                Math.abs(x.pos[2])<=HD;});
    if(!mine.length){bad.push(h.id+': no hiding place indoors');return;}
    var got=mine.filter(function(x){return reached(f,x.pos[0]-f.ox,x.pos[2]);});
    if(!got.length)bad.push(h.id+': '+mine.length+' hides, none reachable');
  });
  ok('THERE IS A REACHABLE PLACE TO HIDE INSIDE EVERY HOUSE',bad.length===0,
     bad.join('; ')||'all four');
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

/* M17 — THE INHABITED STREET.
   The playtest note was "the world is still mostly empty feeling ... there is still
   nothing interactable". This suite defends the four things that answers:

     1. the street is a PLACE (ground everywhere, a road between kerbs rather than
        through the gardens, a bounded estate, a horizon)
     2. you can WALK it — the gate the older suites never used, because every one of
        them teleports the player into the house it wants to test
     3. it is FULL of things that can be observed and replaced, not decorated
     4. nothing in it is dead to look at, and the scenery never steals E from a
        possession

   Plus the two bugs found by arithmetic on the way: the sleeper who sat up INTO the
   mattress, and the gate that was a picture. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}
function near(a,b,e){return Math.abs(a-b)<=(e===undefined?1e-6:e);}

try{
var SD=window.__SD,C=SD.CONST;
SD.stopLoop();SD.startHouse();SD.S.menuOpen=false;

/* ── 1. THE CROSS-SECTION ───────────────────────────────────────────────────
   The road used to be drawn at z=-10.4 in RAW METRES while the yards were laid
   out in LAYOUT units scaled by 1.55 — so the carriageway ran through every front
   garden, inside the picket fence, and the front path was painted across it. */
(function(){
  var yardFence=-9.0*C.ROOM_SCALE;                 // YARD.minZ in buildHouse
  ok('THE ROAD IS NO LONGER IN THE FRONT GARDENS',
     C.ST_KERB_N<yardFence,
     'north kerb '+C.ST_KERB_N.toFixed(2)+' is south of the fence line '+yardFence.toFixed(2));
  ok('...with a carriageway wide enough for the car that drives down it',
     C.ST_KERB_N-C.ST_KERB_S>=5.5,
     (C.ST_KERB_N-C.ST_KERB_S).toFixed(1)+'m between kerbs');
  ok('...and a pavement on both sides',C.ST_PAVE_W>=1.2,C.ST_PAVE_W+'m');
  ok('the far side of the street exists at all',
     C.ST_FAR_Z<C.ST_KERB_S,
     'houses opposite at z='+C.ST_FAR_Z+', south kerb '+C.ST_KERB_S);
  ok('the dead end is WEST of Ray, who the fiction puts at the dead end',
     C.CDS_X<SD.houseById('pittman').x,
     'turning circle at x='+C.CDS_X+', Ray at '+SD.houseById('pittman').x);
})();

/* ── 2. THE ESTATE IS BOUNDED ───────────────────────────────────────────────
   movePlayer() had no clamp of any kind and groundHeightAt() returns 0
   everywhere, so you could walk off the end of the street forever on an
   invisible plane while the camera stayed pinned at ROOM. */
(function(){
  var P=SD.PLAY,R=SD.ROOM;
  ok('THE PLAYER HAS A BOUND',!!P,P?('x '+P.minX.toFixed(0)+'..'+P.maxX.toFixed(0)+
     '  z '+P.minZ.toFixed(0)+'..'+P.maxZ.toFixed(0)):'none');
  ok('...strictly inside the camera clamp, so the camera never hits its wall first',
     P&&R&&P.minX>R.minX&&P.maxX<R.maxX&&P.minZ>R.minZ&&P.maxZ<R.maxZ);
  // drive into each edge for real and check we stopped
  ['a','d','w','s'].forEach(function(k){
    SD.startHouse();SD.S.menuOpen=false;
    SD.hold([k],1800,1/30);                         // ~60 game-seconds of holding it
    var p=SD.player.position;
    var insideX=p.x>=P.minX-0.01&&p.x<=P.maxX+0.01;
    var insideZ=p.z>=P.minZ-0.01&&p.z<=P.maxZ+0.01;
    ok('holding '+k.toUpperCase()+' for a minute does not leave the estate',
       insideX&&insideZ,'ended at '+p.x.toFixed(1)+', '+p.z.toFixed(1));
  });
})();

/* ── 3. YOU CAN WALK IT ─────────────────────────────────────────────────────
   THE GATE THIS PROJECT NEVER HAD. Every other suite calls startHouse() and then
   teleports the player to whatever it wants to test, so no test has ever asked
   whether a person could WALK from their own front door to a neighbour's. M13
   learned this lesson indoors (a 1cm collider gap sealed two rooms); M17 makes
   the street solid on purpose, so it has to be asked outdoors too.

   Flood-fills the world at 0.25m using the real collider set, WALKING ONLY —
   anything taller than STEP_UP is a wall. No jumping: a suburban street you have
   to vault to cross is a bug, not a mechanic. */
(function(){
  SD.startHouse();SD.S.menuOpen=false;
  var STEP=0.25,P=SD.PLAY;
  var solid=SD.colliders.filter(function(c){return (c.top||0)>C.STEP_UP+0.02;});
  var nx=Math.ceil((P.maxX-P.minX)/STEP),nz=Math.ceil((P.maxZ-P.minZ)/STEP);
  function blocked(x,z){
    for(var i=0;i<solid.length;i++){
      var c=solid[i];
      if(x>=c.minX&&x<=c.maxX&&z>=c.minZ&&z<=c.maxZ)return true;
    }
    return false;
  }
  var grid=new Uint8Array(nx*nz);
  function idx(i,j){return i*nz+j;}
  function X(i){return P.minX+i*STEP;}
  function Z(j){return P.minZ+j*STEP;}
  for(var i=0;i<nx;i++)for(var j=0;j<nz;j++)grid[idx(i,j)]=blocked(X(i),Z(j))?1:0;
  // seed on your own doorstep
  var home=SD.HOME;
  var si=Math.round((home.x-P.minX)/STEP),sj=Math.round((home.z-P.minZ)/STEP);
  var reach=0;
  if(grid[idx(si,sj)]===0){
    var st=[[si,sj]];grid[idx(si,sj)]=2;
    while(st.length){
      var p=st.pop();reach++;
      var di=[1,-1,0,0],dj=[0,0,1,-1];
      for(var d=0;d<4;d++){
        var a=p[0]+di[d],b=p[1]+dj[d];
        if(a<0||b<0||a>=nx||b>=nz)continue;
        if(grid[idx(a,b)]!==0)continue;
        grid[idx(a,b)]=2;st.push([a,b]);
      }
    }
  }
  ok('you can leave your own doorstep on foot',reach>50,reach+' cells reachable');
  info('walkable outdoors: '+(reach*STEP*STEP).toFixed(0)+' m2 from HOME, walking only');

  function reachedNear(x,z,r){
    var ri=Math.round(r/STEP);
    var ci=Math.round((x-P.minX)/STEP),cj=Math.round((z-P.minZ)/STEP);
    for(var a=-ri;a<=ri;a++)for(var b=-ri;b<=ri;b++){
      var u=ci+a,v=cj+b;
      if(u<0||v<0||u>=nx||v>=nz)continue;
      if(grid[idx(u,v)]===2)return true;
    }
    return false;
  }
  var unreachable=[];
  SD.DOORS.forEach(function(d){
    if(!reachedNear(d.pos[0],d.pos[2],1.2))unreachable.push(d.house);
  });
  ok('EVERY FRONT DOOR ON THE STREET CAN BE WALKED TO, NO JUMPING',
     unreachable.length===0,
     unreachable.length?('cannot reach: '+unreachable.join(', ')):
                         'all '+SD.DOORS.length+' doors');
  // the planters hold the spare keys; if you cannot stand at one you cannot get in
  var pFar=SD.PLANTERS.filter(function(p){return !reachedNear(p.pos[0],p.pos[2],1.0);});
  ok('...and every spare-key planter can be stood over',pFar.length===0,
     pFar.length?(pFar.length+' unreachable'):'all '+SD.PLANTERS.length+' planters');
  // the far side of the road, and the dead end, are places you can actually go
  ok('the far pavement is reachable',reachedNear((C.CDS_X+C.ST_EAST_X)/2,
     C.ST_KERB_S-C.ST_PAVE_W*0.5,1.5));
  ok('the turning circle is reachable',reachedNear(C.CDS_X+C.CDS_R*0.5,
     (C.ST_KERB_N+C.ST_KERB_S)/2,1.5));
})();

/* ── 4. IT IS FULL OF THINGS YOU CAN TAKE A COPY OF ─────────────────────────
   The note was "there is still nothing interactable ... should be observable and
   replaceable items, per the game design". Not decoration: OBJECTS. */
(function(){
  SD.startHouse();
  var n=SD.objects.length;
  ok('THE STREET CARRIES AT LEAST 75 OBSERVABLE, REPLACEABLE THINGS',n>=75,n+' objects');
  var byHouse={};
  SD.objects.forEach(function(o){byHouse[o.house]=(byHouse[o.house]||0)+1;});
  var stocked=Object.keys(byHouse);
  ok('...spread over every house that has anybody in it',stocked.length>=4,
     stocked.map(function(h){return h+' '+byHouse[h];}).join('  '));
  var thin=stocked.filter(function(h){return byHouse[h]<15;});
  ok('...and no working house is thin',thin.length===0,
     thin.length?thin.join(', '):'every house has 15+');
  // the seven finished kinds that had never been placed anywhere
  var used={};SD.objects.forEach(function(o){used[o.kind]=1;});
  var orphans=['saltShaker','dishSoap','throwPillow','lampShade','vase','blanket',
               'hairbrush'].filter(function(k){return !used[k];});
  ok('THE SEVEN FINISHED-BUT-UNPLACED KINDS ARE IN THE WORLD',orphans.length===0,
     orphans.length?('still unused: '+orphans.join(', ')):'all seven placed');
  info(Object.keys(used).length+' of '+Object.keys(SD.PROP_KINDS).length+' kinds are on the street');
  /* Everything must be standing ON something. Measured against MESH bounding
     boxes, not against colliders: a shelf board and a benchtop are decor
     (collide:false), so a collider-only check reports the books on the shelf as
     floating in mid-air — which is how this check was wrong on its first run. */
  var surfaces=[];
  var bb=new THREE.Box3();
  SD.envMeshes.forEach(function(m){
    if(!m||!m.isMesh)return;
    bb.setFromObject(m);
    if(!isFinite(bb.min.x))return;
    var w=bb.max.x-bb.min.x,d=bb.max.z-bb.min.z;
    if(w>14||d>14)return;                                // the ground, not a surface
    surfaces.push({minX:bb.min.x,maxX:bb.max.x,minZ:bb.min.z,maxZ:bb.max.z,top:bb.max.y});
  });
  var floating=[];
  SD.objects.forEach(function(o){
    // wall-mounted things (clocks, posters, curtains, magnets) rest on nothing
    if(['wallClock','posterPrint','curtains','fridgeMagnet','houseNumber'].indexOf(o.kind)>=0)return;
    var y=o.spec._pos[1];
    if(y<=0.02)return;                                   // on the floor is fine
    var x=o.spec._pos[0],z=o.spec._pos[2],best=-1;
    for(var i=0;i<surfaces.length;i++){
      var s=surfaces[i];
      if(s.top>y+0.06)continue;                          // cannot be resting on it
      if(x<s.minX-0.10||x>s.maxX+0.10)continue;
      if(z<s.minZ-0.10||z>s.maxZ+0.10)continue;
      if(s.top>best)best=s.top;
    }
    if(best<0||y-best>0.12)floating.push(o.label+' y='+y.toFixed(2)+
      (best<0?' (nothing under it)':' vs surface '+best.toFixed(2)));
  });
  ok('NOTHING IS FLOATING IN MID-AIR',floating.length===0,
     floating.length?floating.slice(0,4).join(' | '):'every object rests on a real surface');
})();

/* ── 5. NOTHING IS DEAD TO LOOK AT — AND SCENERY NEVER STEALS E ─────────────*/
(function(){
  SD.startHouse();
  ok('the house answers to E in more places than it has possessions',
     SD.SCENERY.length>=20,SD.SCENERY.length+' scenery points');
  var noLine=SD.SCENERY.filter(function(s){return !s.line||!s.label;});
  ok('...and every one of them says something',noLine.length===0);
  /* The affordance rule: a fixture must never outbid a swappable thing for the
     prompt. Stand on top of every object in turn and check what E offers. */
  /* Stand 0.55m to the +z side of each object and LOOK AT IT. findTarget's forward
     is (-sin yaw, -cos yaw), so yaw=0 points at -z — toward the object. (First
     version used yaw=PI, which faced the player away from the thing it was
     supposed to be examining and made every result meaningless.) */
  var stolen=[];
  SD.objects.forEach(function(o){
    var p=o.spec._pos;
    SD.player.position.set(p[0],0,p[2]+0.55);
    SD.S.py=Math.max(0,p[1]-1.15);                       // eye level with it
    SD.S.yaw=0;
    var t=SD.findTarget();
    if(t&&t.t==='scenery')stolen.push(o.label+' -> '+t.s.label);
  });
  ok('SCENERY NEVER STEALS THE PROMPT FROM A POSSESSION',stolen.length===0,
     stolen.length?stolen.slice(0,3).join(' | '):'checked all '+SD.objects.length);
})();

/* ── 6. THE HOUSES ARE NOT ONE ASSET STAMPED FIVE TIMES ─────────────────────*/
(function(){
  var pals=SD.HOUSES.map(function(h){return h.pal&&h.pal.wallHue;});
  var uniq={};pals.forEach(function(p){uniq[p]=1;});
  ok('EVERY LOT HAS ITS OWN PALETTE',Object.keys(uniq).length===SD.HOUSES.length,
     pals.join(', '));
  var keepers=SD.HOUSES.filter(function(h){return h.keeper;}).length;
  ok('...and a named keeper whose habits dress it',keepers>=4,keepers+' of '+SD.HOUSES.length);
  /* Readable, not decorative: the tidy branch keys on noticeFloor, so a house kept
     by somebody who registers small changes looks like it. */
  var tidyHouses=SD.HOUSES.filter(function(h){
    var r=SD.RESIDENTS[h.keeper];return r&&r.noticeFloor<=16;});
  ok('the street contains both kinds of household',
     tidyHouses.length>0&&tidyHouses.length<SD.HOUSES.length,
     tidyHouses.length+' squared-off, '+(SD.HOUSES.length-tidyHouses.length)+' lived-in');
})();

/* ── 7. THE SLEEPER SITS UP, NOT DOWN ───────────────────────────────────────
   Found by arithmetic, not by looking: the torso is driven to NEGATIVE
   rotation.x, and with the head at -z, y' = y·cosθ - z·sinθ is NEGATIVE — the
   head swung down through the mattress and out of the floor. Head at +z makes the
   same angles raise it, and puts it against the new headboard. */
(function(){
  SD.startHouse();
  var s=SD.SLEEPERS[0];
  ok('there is somebody in the bed',!!s&&!!s.group);
  var head=s.group.userData.head;
  var v=new THREE.Vector3();
  head.getWorldPosition(v);var asleepY=v.y,asleepZ=v.z;
  s.group.userData.torso.rotation.x=-1.15;               // the awake pose
  s.group.updateMatrixWorld(true);
  head.getWorldPosition(v);
  ok('SITTING UP RAISES THE HEAD',v.y>asleepY+0.15,
     'asleep y='+asleepY.toFixed(2)+' -> awake y='+v.y.toFixed(2));
  ok('...and it stays above the mattress',v.y>0.54,v.y.toFixed(2)+'m vs mattress top 0.54');
  s.group.userData.torso.rotation.x=0;
  // the head is at the headboard end, which is what the nightstand objects claim
  var night=SD.objects.filter(function(o){
    return o.house==='hoyt'&&/family photo/.test(o.label);})[0];
  ok('"on the nightstand beside her head" is now true',
     !!night&&Math.abs(night.spec._pos[2]-asleepZ)<1.0,
     night?('photo z='+night.spec._pos[2].toFixed(2)+', her head z='+asleepZ.toFixed(2)):'no photo');
})();

/* ── 8. THE ONE THING THAT MOVES ────────────────────────────────────────────*/
(function(){
  SD.startHouse();SD.S.menuOpen=false;
  ok('a car is scheduled, not left to chance',SD.CAR.t>0&&SD.CAR.t<=C.CAR_EVERY[1],
     'first pass in '+SD.CAR.t.toFixed(0)+'s');
  var before=SD.LIGHTS.length;
  SD.CAR.t=0.01;SD.run(4,1/30);
  ok('IT ARRIVES',!!SD.CAR.active,'launched');
  ok('...and its headlights are a REAL light zone, not a decoration',
     SD.LIGHTS.length===before+1&&!!SD.CAR.zone,
     'litAt() and every seeing check read it');
  var x0=SD.CAR.active.position.x;
  SD.run(30,1/30);
  ok('...and it actually drives',Math.abs(SD.CAR.active.position.x-x0)>2,
     'moved '+Math.abs(SD.CAR.active.position.x-x0).toFixed(1)+'m');
  ok('...taking its light with it',
     near(SD.CAR.zone.x,SD.CAR.active.position.x+SD.CAR.dir*3.2,0.01));
  // and it must leave, taking the zone with it
  for(var g=0;g<400&&SD.CAR.active;g++)SD.run(10,1/30);
  ok('IT LEAVES, AND TAKES ITS LIGHT ZONE WITH IT',
     !SD.CAR.active&&SD.LIGHTS.length===before,
     'lights back to '+SD.LIGHTS.length);
})();

/* ── 9. THE NIGHT VISIBLY ENDS ──────────────────────────────────────────────
   05:29 used to look exactly like 23:00; the clock was the only thing that knew
   curfew was coming. */
(function(){
  SD.startHouse();SD.S.menuOpen=false;
  var exp0=SD.renderer.toneMappingExposure;
  SD.NIGHT.t=SD.NIGHT.budget-0.05;                       // three minutes to curfew
  SD.run(2,1/30);
  var exp1=SD.renderer.toneMappingExposure;
  ok('DAWN COMES UP BEFORE CURFEW DOES',exp1>exp0+0.05,
     'exposure '+exp0.toFixed(2)+' -> '+exp1.toFixed(2));
  SD.endNight('home','x');
  ok('...and the rig is put back, so night two does not start grey',
     near(SD.renderer.toneMappingExposure,0.52,0.001),
     SD.renderer.toneMappingExposure.toFixed(2));
})();

/* ── 10. THE BUDGET IT ALL HAS TO FIT IN ────────────────────────────────────
   Draw calls are 1:1 with meshes on r128 here — no instancing, no merging — so
   the two things that ARE free to share had to be shared before the content pass.
   renderer.info was read nowhere in the file before M17. */
(function(){
  SD.startHouse();
  var meshes=0,geos={},mats={};
  SD.scene.traverse(function(o){
    if(!o.isMesh)return;
    meshes++;
    if(o.geometry)geos[o.geometry.uuid]=1;
    var m=o.material;(Array.isArray(m)?m:[m]).forEach(function(x){if(x)mats[x.uuid]=1;});
  });
  var ng=Object.keys(geos).length,nm=Object.keys(mats).length;
  info(meshes+' meshes, '+ng+' geometries, '+nm+' materials');
  ok('MESH COUNT GREW BY MORE THAN 2x',meshes>1400,meshes+' (was 694)');
  ok('...without geometries growing with it',ng<meshes*0.45,
     ng+' geometries for '+meshes+' meshes — one shared unit box does the work');
  ok('...or materials',nm<meshes*0.45,nm+' materials for '+meshes+' meshes');
  SD.renderer.info.reset&&SD.renderer.info.reset();
  SD.renderer.render(SD.scene,SD.camera);
  info('draw calls in this view: '+SD.renderer.info.render.calls+
       ', triangles '+SD.renderer.info.render.triangles);
  ok('the simulation is still not the bottleneck',SD.colliders.length<2200,
     SD.colliders.length+' colliders');
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

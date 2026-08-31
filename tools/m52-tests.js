/* M52 — A MIRRORED HOUSE MUST BE THE EXACT MIRROR OF ITS TWIN.

   M50 mirrored the street by threading one sign through MX(). m50 asserted the things
   I thought to check: wall layouts differ, walkable area is preserved, light zones and
   lamps agree. All true, all green, and all of it blind to three real bugs that only
   turned up when I LOOKED at the frames:

     * THE FRONT DOOR OPENED THE WRONG WAY. setDoor wrote a fixed +0.48pi for every
       door in the game. M50 moved the hinge to the other jamb on a mirrored lot, so
       the door swung backwards through its own doorway and into the hall, where it
       filled the camera. Invisible to every assertion, because a CLOSED door is
       symmetric and every test looked at closed doors.

     * THE GUARD DOG STOOD IN THE DRIVEWAY. Hardening fires long after buildHouse has
       returned, so the global MIR is back to 1; the dog and its kennel were placed at
       a hardcoded +2.6 from the lot centre and never learned about the mirror.

   Both are the same mistake: a quantity with a HANDEDNESS that did not ask which hand
   this house is. Enumerating them one at a time is how the first two got missed, so
   this suite asserts the general property instead - build the street, take every mesh
   on an unmirrored lot and every mesh on a mirrored one, flip the local x of the
   mirrored set, and require the two to match. A handedness bug anywhere fails here
   whether or not I thought of it.

   WITH THE DOORS OPEN AS WELL AS SHUT, because closed doors are symmetric and that is
   exactly why the swing survived. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}

try{
var SD=window.__SD,C=SD.CONST,T=window.THREE;
SD.stopLoop();

var HW=C.ROOM_SCALE*4.5+1.2, HD=C.ROOM_SCALE*3.5+1.2;
function q(v){return (Math.round(v*4)/4).toFixed(2);}   // quarter metre, per m50
function ang(a){                                        // yaw to the nearest 5 degrees
  var d=a*180/Math.PI;d=((d%360)+360)%360;
  return (Math.round(d/5)*5%360).toFixed(0);
}

/* Every mesh belonging to one lot, keyed by what it is and where it is in LOCAL
   coordinates. `flip` negates local x and the yaw, which is what a reflection does. */
/* The props are NOT part of the structure. Every house authors its own twenty
   objects - Walt's keyring against Marisol's whatever - so comparing them across
   two lots compares two different set-dressings and can never pair up. The claim
   here is about the BUILDING: what buildHouse stamps down, which is the same
   builder run with one sign flipped. */
function propMeshes(){
  var set=new Set();
  SD.objects.forEach(function(o){
    if(o.group)o.group.traverse(function(m){set.add(m);});
  });
  /* Scan marks spin on a clock (MARKS[i].rotation.y=t+i), and the SLEEPERS are
     actors - they stir, sit up and turn their heads while the clock runs. Two
     houses hold two different people in two different states, so after 200 ticks
     a sleeper's nose points somewhere the other one's does not. That is life in
     the house, not a handedness bug, and the claim here is about the BUILDING. */
  (SD.MARKS||[]).forEach(function(m){if(m&&m.traverse)m.traverse(function(x){set.add(x);});});
  (SD.SLEEPERS||[]).forEach(function(s){
    if(s.group&&s.group.traverse)s.group.traverse(function(x){set.add(x);});
  });
  (SD.DOGS||[]).forEach(function(d){
    if(d.group&&d.group.traverse)d.group.traverse(function(x){set.add(x);});
  });
  return set;
}

/* Everything buildHouse stamped on one lot, in LOCAL coordinates. `flip` negates the
   local x and the yaw, which is what a reflection does to both. */
function census(id,flip){
  var h=SD.houseById(id),ox=h.x,list=[],skip=propMeshes();
  SD.scene.updateMatrixWorld(true);
  var wp=new T.Vector3(),ws=new T.Vector3(),wq=new T.Quaternion(),e=new T.Euler();
  SD.scene.traverse(function(o){
    if(!o.isMesh||!o.visible||!o.geometry)return;
    if(skip.has(o))return;
    var pr=o.geometry.parameters||{};
    /* The sky dome and the horizon band ride the PLAYER, not a lot, so whichever
       footprint the player is standing in claims them. A cylinder has no `radius`,
       which is how the band slipped past the first version of this filter. */
    if((pr.radius||0)>=60||(pr.radiusTop||0)>=60)return;
    o.getWorldPosition(wp);
    var lx=wp.x-ox;
    if(Math.abs(lx)>HW||Math.abs(wp.z)>HD)return;
    o.getWorldScale(ws);o.getWorldQuaternion(wq);
    e.setFromQuaternion(wq,'YXZ');
    /* NO COLOUR. Keying on it took the mismatch count from 7 to 29, because every
       house has had its own palette since M17 - wall, floor, ceiling, tile, roof and
       cabinets all differ per lot. The claim is that the two houses are the same
       SHAPE reflected, not that they are painted alike. */
    list.push({
      shape:o.geometry.type+':'+q(pr.width||pr.radius||pr.radiusTop||0)+
            'x'+q(pr.height||0)+'x'+q(pr.depth||0)+
            '|'+q(ws.x)+','+q(ws.y)+','+q(ws.z),
      x:(flip?-lx:lx), y:wp.y, z:wp.z,
      yaw:(flip?-e.y:e.y)
    });
  });
  return list;
}

/* MATCHED BY TOLERANCE, NOT BY A HASH OF THE COORDINATES. Quantising a position into
   a key looks tidy and is wrong: two meshes 3mm apart straddle a rounding boundary
   and hash to different buckets, so the first version of this reported five phantom
   mismatches that were all pairs 0.25 apart. M50 hit exactly the same trap comparing
   wall fingerprints. Snap-to-grid cannot express "close enough"; a tolerance can. */
var TOL=0.08, YAW_TOL=6*Math.PI/180;
function pair(a,b){
  var used=new Array(b.length),lonely=[];
  for(var i=0;i<a.length;i++){
    var m=a[i],best=-1,bd=1e9;
    for(var k=0;k<b.length;k++){
      if(used[k]||b[k].shape!==m.shape)continue;
      var d=Math.abs(b[k].x-m.x)+Math.abs(b[k].y-m.y)+Math.abs(b[k].z-m.z);
      if(d<bd){bd=d;best=k;}
    }
    if(best<0||bd>TOL*3){lonely.push('plain  '+m.shape+' @ '+
      m.x.toFixed(2)+','+m.y.toFixed(2)+','+m.z.toFixed(2));continue;}
    var dy=Math.abs(((b[best].yaw-m.yaw)+Math.PI*3)%(Math.PI*2)-Math.PI);
    if(dy>YAW_TOL)lonely.push('yaw    '+m.shape+' @ '+m.x.toFixed(2)+','+
      m.z.toFixed(2)+'  '+(m.yaw*180/Math.PI).toFixed(0)+' vs '+
      (b[best].yaw*180/Math.PI).toFixed(0)+' degrees');
    used[best]=1;
  }
  for(var k2=0;k2<b.length;k2++)if(!used[k2])
    lonely.push('mirror '+b[k2].shape+' @ '+b[k2].x.toFixed(2)+','+
      b[k2].y.toFixed(2)+','+b[k2].z.toFixed(2));
  return lonely;
}
/* THE PAIR MUST SHARE A PLAN. M53 gave 16 and 8 a second floorplan, so picking
   "first unmirrored" and "first mirrored" off the list would compare a plan A
   house with a plan B one and report every partition as a handedness bug. It
   happened to still pick two plan A houses by array order, which is luck, not a
   test. Reflection is only claimed between two houses of the SAME plan. */
function compare(label){
  var plan='A';
  var plain=SD.HOUSES.filter(function(h){
    return !h.yours&&!h.mirror&&(h.plan||'A')===plan;})[0];
  var mirr =SD.HOUSES.filter(function(h){
    return !h.yours&&h.mirror&&(h.plan||'A')===plan;})[0];
  var a=census(plain.id,false),b=census(mirr.id,true);
  var d=pair(a,b);
  info(label+': '+plain.id+' has '+a.length+' meshes, '+mirr.id+' has '+b.length+
       ', '+d.length+' that do not pair up');
  d.slice(0,8).forEach(function(x){info('   unpaired  '+x);});
  return {d:d,na:a.length,nb:b.length};
}

/* ── 1. WITH THE DOORS SHUT ─────────────────────────────────────────────────*/
(function(){
  SD.startHouse();
  var r=compare('doors shut');
  ok('the two lots hold a comparable number of meshes',r.na>50&&r.nb>50,
     r.na+' and '+r.nb);
  ok('A MIRRORED HOUSE IS THE MIRROR OF ITS TWIN, DOORS SHUT',r.d.length===0,
     r.d.length+' unpaired');
})();

/* ── 2. AND WITH THEM OPEN ──────────────────────────────────────────────────
   The state the door-swing bug lived in. A closed door is symmetric; that is why
   nothing caught it for a whole milestone. */
(function(){
  SD.startHouse();SD.GAME.hasSpareKey=true;
  SD.HOUSES.forEach(function(h){ if(h._door)SD.useDoor(h._door); });
  /* let the hinges finish swinging */
  for(var i=0;i<200;i++)SD.tick(1/60);
  var open=SD.DOORS.filter(function(d){return d.open;}).length;
  ok('every front door is standing open',open>=SD.HOUSES.length-1,
     open+' of '+SD.DOORS.length+' open');
  var r=compare('doors open');
  ok('...AND THE MIRROR STILL HOLDS WITH THEM OPEN',r.d.length===0,
     r.d.length+' unpaired');
})();

/* ── 3. THE SWING IS A PROPERTY OF THE DOOR, NOT A CONSTANT ─────────────────*/
(function(){
  SD.startHouse();
  var signs={};
  SD.DOORS.forEach(function(d){
    var h=SD.HOUSES.filter(function(x){return x.id===d.house;})[0];
    if(!h)return;
    signs[h.mirror?'mirrored':'plain']=d.swing;
  });
  info('swing on a plain lot '+signs.plain+', on a mirrored lot '+signs.mirrored);
  ok('EVERY DOOR CARRIES ITS OWN SWING',
     signs.plain!==undefined&&signs.mirrored!==undefined,
     JSON.stringify(signs));
  ok('...and the two hands open opposite ways',signs.plain===-signs.mirrored,
     signs.plain+' vs '+signs.mirrored+' - it used to be a fixed +0.48pi for all of them');
})();

/* ── 4. THE GUARD DOG IS ON THE RIGHT SIDE OF THE RIGHT HOUSE ───────────────*/
(function(){
  SD.startHouse();
  /* fireHardening() only ADDS A TIER to GAME.hardened when the alert level earns
     it; the bodies are built by hardenNight(). Calling the wrong one gave zero
     dogs and an assertion that passed because it had nothing to look at. */
  SD.GAME.hardened=['dogs'];
  SD.hardenNight();
  var rows=[],wrong=[];
  SD.DOGS.forEach(function(d){
    var h=SD.HOUSES.filter(function(x){return x.id===d.house;})[0];
    if(!h)return;
    var lx=d.x-h.x, want=(h.mirror?-1:1)*C.ROOM_SCALE*2.6;
    rows.push(d.house+' '+(h.mirror?'(mirrored) ':'')+lx.toFixed(1));
    if(Math.abs(lx-want)>0.05)wrong.push(d.house+' at '+lx.toFixed(1)+' want '+want.toFixed(1));
  });
  info('dog offset from each lot centre: '+rows.join('  '));
  ok('there are dogs to check',SD.DOGS.length>0,SD.DOGS.length+' dogs');
  ok('EVERY GUARD DOG IS ON ITS HOUSE’S SIDE GATE',wrong.length===0,
     wrong.join('; ')||'all on the correct side');
  var mirrored=SD.DOGS.filter(function(d){
    var h=SD.HOUSES.filter(function(x){return x.id===d.house;})[0];
    return h&&h.mirror;});
  ok('...and at least one of them is on a mirrored lot',mirrored.length>0,
     mirrored.length+' - otherwise this asserts nothing');
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

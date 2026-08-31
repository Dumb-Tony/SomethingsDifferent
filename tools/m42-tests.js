/* M42 — THE FRAME IS PART OF THE CONTRACT.

   Forty-one milestones and 1,373 assertions, and not one of them had ever looked at
   a pixel. Then the user said "I need to see some real progress", I finally rendered
   the thing, and the screenshots said what no state assertion could: every night
   scene lived entirely in the bottom two fifths of the histogram. street
   64/36/0/0/0, bedroom 48/51/0/0/0, kitchen 43/56/0/0/0. Not one pixel anywhere in
   the top three fifths. 13-25% of every frame pure black.

   This suite exists so that can never be true again without something going red.

   It measures two things off the real framebuffer and the real collider set:
     LUMINANCE  - mean, black share, and the five-bucket histogram
     OCCLUSION  - what share of the frame is geometry within a metre of the camera

   And it asserts one thing that is NOT visual but is easy to break while chasing
   the visual: brightening a lamp must not change where you can be seen. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}

try{
var SD=window.__SD,C=SD.CONST,T=window.THREE;
SD.stopLoop();

var SCENES={
  street:function(){SD.startHouse();
    SD.player.position.set(0.6,0,-7.4);SD.S.yaw=Math.PI;SD.S.pitch=0.20;SD.S.dist=5.4;},
  hall:function(){SD.startHouse();SD.GAME.hasSpareKey=true;SD.useDoor(SD.frontDoor);
    SD.player.position.set(-2.6,0,-2.5);SD.S.yaw=Math.PI*0.5;SD.S.pitch=0.14;SD.S.dist=3.0;},
  lounge:function(){SD.startHouse();SD.GAME.hasSpareKey=true;SD.useDoor(SD.frontDoor);
    SD.player.position.set(2.2,0,-1.0);SD.S.yaw=0.9;SD.S.pitch=0.20;SD.S.dist=3.4;},
  bedroom:function(){SD.startHouse();SD.GAME.hasSpareKey=true;SD.useDoor(SD.frontDoor);
    SD.player.position.set(2.6,0,1.5);SD.S.yaw=Math.PI;SD.S.pitch=0.30;SD.S.dist=3.2;},
  kitchen:function(){SD.startHouse();SD.GAME.hasSpareKey=true;SD.useDoor(SD.frontDoor);
    SD.player.position.set(-2.2,0,1.2);SD.S.yaw=Math.PI*1.2;SD.S.pitch=0.18;SD.S.dist=3.2;}
};
function pose(name){
  SCENES[name]();
  SD.S.camP=null;SD.S.camL=null;SD.S.py=0;
  for(var i=0;i<12;i++)SD.tick(1/60);
}
function lum(){
  var gl=SD.renderer.getContext();
  var w=gl.drawingBufferWidth,h=gl.drawingBufferHeight;
  SD.renderer.render(SD.scene,SD.camera);
  var px=new Uint8Array(w*h*4);
  gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,px);
  var sum=0,black=0,n=w*h,hist=[0,0,0,0,0];
  for(var i=0;i<n;i++){
    var o=i*4,Y=(0.2126*px[o]+0.7152*px[o+1]+0.0722*px[o+2])/255;
    sum+=Y;if(Y<0.04)black++;hist[Math.min(4,Math.floor(Y*5))]++;
  }
  return {mean:sum/n,black:100*black/n,
          hist:hist.map(function(v){return 100*v/n;})};
}
var _rc=new T.Raycaster();
function nearShare(){
  var solids=SD.envMeshes.filter(function(m){return m&&m.visible;});
  var near=0,tot=0;
  for(var gy=-0.8;gy<=0.8;gy+=0.2)for(var gx=-0.9;gx<=0.9;gx+=0.15){
    _rc.setFromCamera({x:gx,y:gy},SD.camera);
    var h=_rc.intersectObjects(solids,true);
    tot++;if(h.length&&h[0].distance<1.0)near++;
  }
  return 100*near/tot;
}

/* ── 1. THE NIGHT HAS A TOP END ─────────────────────────────────────────────*/
(function(){
  var names=Object.keys(SCENES),rows=[];
  names.forEach(function(n){pose(n);rows.push({n:n,l:lum()});});
  rows.forEach(function(r){
    info(r.n.padEnd(8)+' Y '+r.l.mean.toFixed(3)+'  black '+r.l.black.toFixed(0)+
         '%  '+r.l.hist.map(function(v){return Math.round(v);}).join('/'));
  });

  /* The headline: SOMETHING must live above the bottom two fifths. Before M42 the
     third bucket was 0% in three of five scenes and 1% in a fourth. */
  var lit=rows.filter(function(r){return r.l.hist[2]+r.l.hist[3]+r.l.hist[4]>=5;});
  ok('EVERY INTERIOR HAS A REAL MIDTONE, not just shadow',
     lit.length>=4,lit.length+' of '+rows.length+' scenes have >=5% above the '+
     'bottom two fifths');

  rows.forEach(function(r){
    if(r.n==='street')return;      // the facades are unlit by design; see below
    ok('  '+r.n+' is not a black void',r.l.hist[2]+r.l.hist[3]+r.l.hist[4]>=5,
       r.l.hist.map(function(v){return Math.round(v);}).join('/'));
  });

  /* ...and it is still NIGHT. Brightening must not mean flattening. */
  ok('...and it is still a night, not a flat grey',
     rows.every(function(r){return r.l.mean<0.55;}),
     'brightest scene mean '+
     Math.max.apply(null,rows.map(function(r){return r.l.mean;})).toFixed(3));
  ok('...with real shadow left in it',
     rows.some(function(r){return r.l.black>=8;}),
     'deepest scene is '+
     Math.max.apply(null,rows.map(function(r){return r.l.black;})).toFixed(0)+'% black');
})();

/* ── 2. BRIGHTNESS IS NOT DIFFICULTY ────────────────────────────────────────
   The practicals are THREE PointLights; being seen is litAt(), which reads the
   LIGHTS[] zones. They are separate structures and must stay that way, or the next
   person who tunes the look will silently retune the stealth. */
(function(){
  SD.startHouse();SD.nightReset();
  /* Probe INSIDE a real light zone - 0.000 before and 0.000 after would prove
     nothing at all. */
  var zone=SD.LIGHTS.filter(function(z){return z.i>0.2;})[0];
  var probe=zone?[zone.x+zone.r*0.3,zone.z]:[SD.HOME.x+2,-6.0];
  var before=SD.litAt(probe[0],probe[1]);
  var zonesBefore=SD.LIGHTS.length;
  ok('the probe is standing somewhere genuinely lit',before>0.05,
     'litAt reads '+before.toFixed(3)+' there');

  var touched=0;
  SD.scene.traverse(function(o){if(o.isPointLight){o.intensity*=4;touched++;}});
  var after=SD.litAt(probe[0],probe[1]);

  ok('there are practicals to brighten',touched>0,touched+' point lights');
  ok('QUADRUPLING EVERY LAMP DOES NOT CHANGE WHERE YOU CAN BE SEEN',
     after===before,'litAt '+before.toFixed(3)+' -> '+after.toFixed(3));
  ok('...and adds no seeing-zones',SD.LIGHTS.length===zonesBefore,
     zonesBefore+' -> '+SD.LIGHTS.length);
  info('CONST.PRACTICAL_GAIN is a LOOK control. litAt reads LIGHTS[]; the two never');
  info('meet, and this assertion is what keeps it that way.');
  SD.startHouse();
})();

/* ── 3. THE CAMERA'S PULL-BACK IS A DISTANCE, NOT A PERCENTAGE ──────────────*/
(function(){
  ok('CAM_OCC_PULL is in metres',C.CAM_OCC_PULL>=0.2,
     C.CAM_OCC_PULL+'m - it was 0.06, a FRACTION of the camera distance, which put '+
     'the camera 20cm off a wall at dist 3.4');
  /* The unit change is the point: pulling back by a fraction means the closer the
     camera was asked to sit, the LESS it backs off, which is exactly backwards. */
  var cols=[{minX:-1,maxX:1,minZ:-1,maxZ:1,base:0,top:3}];
  /* occlude writes through to.set(), so these are Vector3s, not plain objects. */
  var from=new T.Vector3(0,1,-4),to=new T.Vector3(0,1,0.5);
  var hit=SD.PHYS.occlude(cols,from,to,0.5,C.CAM_OCC_PULL);
  ok('...and it really does stop short of the surface',
     hit&&to.z<-1.0,'stopped at z='+to.z.toFixed(2)+', the wall face is at z=-1');
})();

/* ── 4. HOW MUCH OF THE FRAME IS THE CAMERA STANDING IN ─────────────────────
   NOT YET FIXED, and pinned here so it cannot quietly get worse. Measured: the
   lounge camera goes cleanly through a doorway, ends up 3.8m away in the next room
   with its nose 0.74m from a partition, and a third of the frame is that wall.
   occlude() passes it because the LINE was never blocked.

   An attempt to fix it by walking the camera in toward the player until it had
   clearance made it WORSE - lounge 34% to 64%, and the hall went from 9% black to
   49% - because pulling in just presses the camera against nearer things. Reverted.
   PHYS.clearance survives as the query that measures it. */
(function(){
  var names=Object.keys(SCENES),bad=[];
  names.forEach(function(n){
    pose(n);
    var s=nearShare();
    info(n.padEnd(8)+' '+s.toFixed(0)+'% of frame within 1m of camera');
    if(s>15)bad.push(n+' '+s.toFixed(0)+'%');
  });
  ok('four of the five scenes are not standing in geometry',
     bad.length<=1,bad.length?('crowded: '+bad.join(', ')):'none crowded');
  ok('...and the known bad one has not got worse',
     (pose('lounge'),nearShare())<=40,
     'lounge '+nearShare().toFixed(0)+'% - it was 34% when this was written, and 64% '+
     'after the fix that did not work');
  ok('PHYS.clearance answers the question occlude cannot',
     typeof SD.PHYS.clearance==='function'&&
     SD.PHYS.clearance([{minX:-1,maxX:1,minZ:-1,maxZ:1,base:0,top:3}],3,1,0,0.5)===2,
     'a point 3m out from a face 1m wide reads 2m of clearance');
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

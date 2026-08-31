/* M51 — THE CAMERA WAS STANDING INSIDE A TREE.

   M50's evidence shots came back with a third of the sky covered by a hard-edged dark
   wedge at 14 and 16 Ardsley. My first guess was the mirror, and it was wrong: 16 is
   an UNMIRRORED house and had the same wedge, so it tracked distance from the world
   origin rather than the hand of the plan.

   The second guess was a shadow on the sky, and that was wrong too - the sky is a
   MeshBasicMaterial and cannot receive one. So was the third: raycasting through the
   wedge reported the sky sphere at 28.9m when the sphere has radius 70, which is
   impossible, because the harness stops the render loop and matrixWorld is stale
   while .position already reads the new value. Raycasts lie in a stopped world.

   Positions do not. Everything near the camera and above head height, at the gate of
   each of the five houses, nearest canopy:

       10 Ardsley  9.0m      12 Ardsley  7.4m      8 Ardsley  5.3m
       14 Ardsley  2.0m      16 Ardsley  1.6m   <-- inside the tree

   The verge trees step on a fixed 11.6m grid down a 146m street while the lots sit on
   a 24.8m pitch. The two rhythms drift in and out of phase, and at two lots in five a
   street tree landed on the front path. Standing at your own gate is the single most
   common thing the player does.

   NUDGED, NOT SKIPPED. Dropping a tree changes how many times that loop draws from
   the street's shared generator, and this file has a standing warning that one extra
   draw silently repaints everything after it. Moving a tree costs no randomness. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}

try{
var SD=window.__SD,C=SD.CONST,T=window.THREE;
SD.stopLoop();
SD.startHouse();

/* Stand at a lot's front gate, the way the player does on the way in. */
function atGate(id){
  var ox=SD.houseById(id).x;
  SD.player.position.set(ox,0,-9.4);SD.player.rotation.y=0;
  SD.S.yaw=Math.PI;SD.S.pitch=0.13;SD.S.dist=6.4;SD.S.camP=null;SD.S.camL=null;
  for(var i=0;i<30;i++)SD.tick(1/60);
  SD.scene.updateMatrixWorld(true);
  return SD.camera.position.clone();
}
/* Nearest big thing overhead - by POSITION, because a raycast in a stopped world
   reads a stale matrix and gives an answer that is not merely wrong but impossible. */
function nearestCanopy(cam){
  var best=1e9,at=null;
  SD.scene.traverse(function(o){
    if(!o.isMesh||!o.visible||!o.geometry||!o.geometry.parameters)return;
    if(o.geometry.type!=='SphereGeometry')return;
    var wp=new T.Vector3();o.getWorldPosition(wp);
    if(wp.y<2.4)return;
    var sc=new T.Vector3();o.getWorldScale(sc);
    var r=(o.geometry.parameters.radius||0)*Math.max(sc.x,sc.y,sc.z);
    if(r<1.0||r>20)return;              // canopies, not the 70m sky sphere
    var d=wp.distanceTo(cam);
    if(d<best){best=d;at=wp;}
  });
  return {d:best,at:at};
}

/* ── 1. THERE IS A CLEARANCE, AND IT IS A REAL DISTANCE ─────────────────────*/
(function(){
  ok('there is a verge clearance at all',typeof C.VERGE_CLEAR==='number'&&
     C.VERGE_CLEAR>0,'VERGE_CLEAR '+C.VERGE_CLEAR);
  ok('...and it is wider than a canopy plus its offset',C.VERGE_CLEAR>=4.5,
     C.VERGE_CLEAR+'m of trunk clearance against canopies that run 1.1-1.8m and '+
     'sit offset around the trunk');
})();

/* ── 2. NO STREET TREE STANDS ON A FRONT PATH ───────────────────────────────*/
(function(){
  var onPath=[];
  SD.scene.traverse(function(o){
    if(!o.isMesh||!o.geometry||o.geometry.type!=='SphereGeometry')return;
    var wp=new T.Vector3();o.getWorldPosition(wp);
    if(wp.y<2.4)return;
    var sc=new T.Vector3();o.getWorldScale(sc);
    var r=(o.geometry.parameters.radius||0)*Math.max(sc.x,sc.y,sc.z);
    if(r<1.0||r>20)return;
    /* only the VERGE line - the trees in the gardens are placed from the house and
       are supposed to be near it */
    if(wp.z<-16.5||wp.z>-13.0)return;
    /* FOUR METRES OF FOLIAGE, not C.VERGE_CLEAR. That constant positions the
       TRUNK, and a tree is several canopy blobs offset around it - at a trunk
       clearance of 4.0 a blob still sat 3.7m off vance's path, which is the
       measurement that moved the constant to 4.5. Asserting against the constant
       would have been circular: it would pass at any value. */
    SD.HOUSES.forEach(function(h){
      if(Math.abs(wp.x-h.x)<4.0)
        onPath.push(h.id+' +'+(wp.x-h.x).toFixed(1)+'m');
    });
  });
  info(onPath.length?('on a path: '+onPath.join(', ')):'the verge line is clear of every path');
  ok('NO STREET TREE IS PLANTED ACROSS A FRONT PATH',onPath.length===0,
     onPath.join(', ')||'none');
})();

/* ── 3. THE CAMERA IS NOT INSIDE A TREE AT ANY GATE ─────────────────────────*/
(function(){
  var rows=[],worst=1e9,worstId='';
  SD.HOUSES.forEach(function(h){
    var cam=atGate(h.id);
    var n=nearestCanopy(cam);
    rows.push(h.id+' '+n.d.toFixed(1)+'m');
    if(n.d<worst){worst=n.d;worstId=h.id;}
  });
  info('nearest canopy at each gate: '+rows.join('  '));
  ok('THE CAMERA STANDS CLEAR OF THE TREES AT EVERY GATE',worst>=3.5,
     'worst is '+worstId+' at '+worst.toFixed(1)+'m - it was 1.6m at 16 Ardsley '+
     'and 2.0m at 14');
})();

/* ── 4. AND THE FRAME IS ACTUALLY CLEAR ─────────────────────────────────────
   The assertion that measures the SYMPTOM rather than the cause. A tree moved just
   out of the way still ruins the shot if the canopy hangs over the lens. */
(function(){
  var rc=new T.Raycaster();
  function blockedShare(){
    var solids=SD.envMeshes.filter(function(m){return m&&m.visible;});
    var near=0,tot=0;
    for(var gy=-0.2;gy<=0.9;gy+=0.22)for(var gx=-0.9;gx<=0.9;gx+=0.3){
      rc.setFromCamera({x:gx,y:gy},SD.camera);
      var h=rc.intersectObjects(solids,true);
      tot++;if(h.length&&h[0].distance<3.0)near++;
    }
    return 100*near/tot;
  }
  var rows=[],worst=0,worstId='';
  SD.HOUSES.forEach(function(h){
    atGate(h.id);
    var b=blockedShare();
    rows.push(h.id+' '+b.toFixed(0)+'%');
    if(b>worst){worst=b;worstId=h.id;}
  });
  info('upper frame within 3m of something, at each gate: '+rows.join('  '));
  ok('NO GATE HAS THE TOP OF THE FRAME FILLED BY SOMETHING IN YOUR FACE',
     worst<=25,'worst is '+worstId+' at '+worst.toFixed(0)+'%');
})();

/* ── 5. THE STREET IS STILL THE STREET ──────────────────────────────────────
   Nudging must not have changed what got built - that is the whole reason it nudges
   instead of skipping. Two builds of the same seed must agree exactly. */
(function(){
  function census(){
    var n=0,sx=0;
    SD.scene.traverse(function(o){
      if(!o.isMesh||!o.geometry||o.geometry.type!=='SphereGeometry')return;
      var wp=new T.Vector3();o.getWorldPosition(wp);
      if(wp.y<2.4)return;
      var sc=new T.Vector3();o.getWorldScale(sc);
      var r=(o.geometry.parameters.radius||0)*Math.max(sc.x,sc.y,sc.z);
      if(r<1.0||r>20)return;
      n++;sx+=Math.round(wp.x*4)/4;
    });
    return n+'@'+sx.toFixed(2);
  }
  SD.startHouse();SD.scene.updateMatrixWorld(true);
  var a=census();
  SD.startHouse();SD.scene.updateMatrixWorld(true);
  var b=census();
  info('two builds of the same street: '+a+' and '+b);
  ok('REBUILDING THE STREET GIVES THE SAME TREES',a===b,a+' vs '+b);
  ok('...and there are still trees on the verge',parseInt(a,10)>4,
     a.split('@')[0]+' canopies - nudging must not have deleted any');
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

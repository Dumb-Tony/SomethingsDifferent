/* ─────────────────────────────────────────────────────────────────────────────
   Milestone 1 smoke tests — injected into a scratch copy of the game by
   tools/smoketest.ps1 and run in headless Chrome.

   Two kinds of test live here, deliberately:
     1. PURE unit tests of PHYS (plain objects, no GL, no scene) — these are the
        pattern milestone 2's Doubt Curve histogram will follow.
     2. DRIVEN integration tests — the loop is detached and the sim is stepped at
        a fixed dt via __SD.run/hold, so results are deterministic.

   Verify NUMBERS, not vibes (GDD 16): every assertion carries its measured value.
   ───────────────────────────────────────────────────────────────────────────── */
(function(){
var out=[],pass=0,fail=0;
function ok(name,cond,detail){
  if(cond){pass++;out.push('PASS  '+name+(detail?'   ('+detail+')':''));}
  else    {fail++;out.push('FAIL  '+name+(detail?'   ('+detail+')':''));}
}
function near(a,b,tol){return Math.abs(a-b)<=tol;}

try{
  var SD=window.__SD;
  ok('__SD test hook present',!!SD);
  if(!SD)throw new Error('no __SD — the game script did not finish evaluating');
  var C=SD.CONST,P=SD.PHYS;

  // THREE.REVISION is a STRING ('128'), not a number — === 128 is always false
  ok('Three.js is r128',String(THREE.REVISION)==='128','rev='+THREE.REVISION);
  var eb0=document.getElementById('err-banner');
  ok('no crash banner at boot',!eb0,eb0?eb0.textContent.slice(0,140):'');

  SD.stopLoop();   // take over time from requestAnimationFrame

  /* ── 1. PURE PHYS ──────────────────────────────────────────────────────── */
  var cols=[
    {minX:-1,maxX: 1,minZ:-1,maxZ:1,top:0.75,tag:'table'},
    {minX: 2,maxX: 4,minZ:-1,maxZ:1,top:0.20,tag:'lip'},
    {minX:-5,maxX:-3,minZ:-1,maxZ:1,top:2.60,tag:'wall'}
  ];
  ok('ground: a table you are UNDER does not support you',
     P.groundHeightAt(cols,0,0,0)===0,'g='+P.groundHeightAt(cols,0,0,0));
  ok('ground: a table you are ON does',
     P.groundHeightAt(cols,0,0,0.75)===0.75);
  ok('ground: a low lip is steppable from the floor',
     P.groundHeightAt(cols,3,0,0)===0.20);
  ok('ground: open floor is 0',P.groundHeightAt(cols,10,10,0)===0);

  var p1={x:0,z:0}; var h1=P.collideXZ(cols,p1,0,C.CH_H);
  ok('collide: table blocks you from the floor',!!h1&&p1.x===-1,'x='+p1.x);
  var p2={x:3,z:0}; var h2=P.collideXZ(cols,p2,0,C.CH_H);
  ok('collide: a lip within STEP_UP does NOT block',h2===null&&p2.x===3,'x='+p2.x);
  var p3={x:0,z:0}; P.collideXZ(cols,p3,0.75,C.CH_H);
  ok('collide: standing ON the table you are free',p3.x===0&&p3.z===0);

  var shelf=[{minX:-1,maxX:1,minZ:-1,maxZ:1,base:1.9,top:2.3}];
  var p4={x:0,z:0};
  ok('collide: whole body clears a high shelf -> walk under',
     P.collideXZ(shelf,p4,0,C.CH_H)===null);
  var p5={x:0,z:0};
  ok('collide: once climbed up, the same shelf blocks',
     P.collideXZ(shelf,p5,1.0,C.CH_H)!==null);

  var apex=P.apex(C.JUMP_V,C.GRAV);
  ok('apex maths (JUMP_V^2/2g)',near(apex,0.5878,0.001),apex.toFixed(4)+' m');

  var oFrom=new THREE.Vector3(0,1,0),oTo=new THREE.Vector3(0,1,5);
  var blockers=[{minX:-1,maxX:1,minZ:2,maxZ:2.5,top:2.6}];
  var occHit=P.occlude(blockers,oFrom,oTo,C.CAM_OCC_MIN_TOP,C.CAM_OCC_PULL);
  ok('occlude: camera is pulled in front of a wall',occHit&&oTo.z<2.0,'z='+oTo.z.toFixed(3));
  var oFrom2=new THREE.Vector3(0,1,0),oTo2=new THREE.Vector3(0,1,1.5);
  ok('occlude: clear line of sight is untouched',
     P.occlude(blockers,oFrom2,oTo2,C.CAM_OCC_MIN_TOP,C.CAM_OCC_PULL)===false&&oTo2.z===1.5);

  var sp={x:0,z:0};P.resolveSpot(cols,sp);
  ok('resolveSpot pushes a point out of furniture',!(sp.x>-1&&sp.x<1&&sp.z>-1&&sp.z<1),
     'x='+sp.x+' z='+sp.z);

  /* ── 2. WORLD ──────────────────────────────────────────────────────────── */
  SD.startGreybox();
  ok('phase is greybox',SD.S.phase==='greybox');
  ok('player built',!!SD.player);
  ok('colliders built',SD.colliders.length>=12,'n='+SD.colliders.length);

  var bb=new THREE.Box3().setFromObject(SD.player);
  var bh=bb.max.y-bb.min.y;
  ok('body normalized to CH_H',near(bh,C.CH_H,0.02),bh.toFixed(3)+' vs '+C.CH_H);
  ok('body feet sit at y=0',near(bb.min.y,0,0.02),bb.min.y.toFixed(4));

  var counter=SD.colliders.filter(function(c){return c.tag==='counter';})[0];
  ok('colliders are PRE-INFLATED by PLAYER_R',
     !!counter&&near(counter.minX,3.1-1.2-C.PLAYER_R,1e-6),
     counter?('minX='+counter.minX.toFixed(3)+' expected '+(3.1-1.2-C.PLAYER_R).toFixed(3)):'missing');
  ok('decor is rendered but NOT solid',
     SD.colliders.filter(function(c){return c.tag==='decor';}).length===0);
  ok('debug helpers are not in envMeshes (they must never taint a blend probe)',
     SD.envMeshes.every(function(m){return m.type!=='GridHelper';}));

  /* ── 3. DRIVEN MOVEMENT ────────────────────────────────────────────────── */
  function place(x,z,yaw){
    SD.player.position.set(x,0,z);
    SD.S.py=0;SD.S.vy=0;SD.S.grounded=true;
    SD.S.mvx=0;SD.S.mvz=0;SD.S.speedNorm=0;SD.S.wallHit=null;
    SD.S.yaw=(yaw===undefined?0:yaw);SD.S.pitch=C.CAM_PITCH0;SD.S.dist=C.CAM_DIST;
    SD.S.camP=null;SD.S.camL=null;
  }
  var OPEN_X=-1.0,OPEN_Z=-1.0;   // verified clear of every greybox collider
  function speedAfter(keys){
    place(OPEN_X,OPEN_Z,0);SD.hold(keys,40);
    return Math.hypot(SD.S.mvx,SD.S.mvz);
  }
  var vWalk=speedAfter(['w']),vRun=speedAfter(['w','shift']),vSneak=speedAfter(['w','control']);
  ok('walk speed',near(vWalk,C.WALK_SPEED,0.05),vWalk.toFixed(3)+' vs '+C.WALK_SPEED);
  ok('run speed (Shift)',near(vRun,C.RUN_SPEED,0.10),vRun.toFixed(3)+' vs '+C.RUN_SPEED);
  ok('sneak speed (Ctrl)',near(vSneak,C.SNEAK_SPEED,0.03),vSneak.toFixed(3)+' vs '+C.SNEAK_SPEED);
  ok('the three tiers are actually distinct',vSneak<vWalk&&vWalk<vRun);

  place(OPEN_X,OPEN_Z,0);SD.hold(['w'],20);
  ok('W at yaw 0 moves -Z',SD.player.position.z<OPEN_Z-0.05&&near(SD.player.position.x,OPEN_X,0.02),
     'x='+SD.player.position.x.toFixed(3)+' z='+SD.player.position.z.toFixed(3));
  place(OPEN_X,OPEN_Z,0);SD.hold(['d'],20);
  ok('D at yaw 0 strafes +X',SD.player.position.x>OPEN_X+0.05&&near(SD.player.position.z,OPEN_Z,0.02),
     'x='+SD.player.position.x.toFixed(3)+' z='+SD.player.position.z.toFixed(3));

  place(OPEN_X,OPEN_Z,0);SD.hold(['w'],60);
  var want=Math.PI,got=SD.player.rotation.y;
  var derr=Math.abs(((want-got+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI);
  ok('OTS: body faces camera-forward while moving',derr<0.05,'err='+derr.toFixed(5)+' rad');
  var rotIdle=SD.player.rotation.y;
  SD.S.yaw=1.5;SD.run(30);
  ok('OTS: idle drag orbits WITHOUT turning the body',
     Math.abs(SD.player.rotation.y-rotIdle)<1e-9,
     'delta='+Math.abs(SD.player.rotation.y-rotIdle).toExponential(2));

  /* ── 4. JUMP + THE FURNITURE HEIGHT LADDER ─────────────────────────────── */
  place(OPEN_X,OPEN_Z,0);
  SD.S.vy=C.JUMP_V;SD.S.grounded=false;
  var maxPy=0;
  for(var i=0;i<240;i++){SD.tick(1/60);if(SD.S.py>maxPy)maxPy=SD.S.py;if(SD.S.grounded&&i>4)break;}
  ok('jump reaches its analytic apex',near(maxPy,apex,0.06),maxPy.toFixed(4)+' vs '+apex.toFixed(4));
  ok('jump lands back on the floor',SD.S.grounded&&near(SD.S.py,0,1e-9),'py='+SD.S.py);

  place(-3.4,-1.2,0);SD.hold(['w'],40);
  ok('0.28 lip: walked onto, no jump needed',near(SD.S.py,0.28,0.005),
     'py='+SD.S.py.toFixed(3)+' z='+SD.player.position.z.toFixed(2));

  // Stool sits at (-3.4, 0.4); spawn NORTH of it and walk -Z (yaw 0) into it.
  // Asserted as "was ever STOOD ON" rather than "is standing on it at step N" —
  // the player walks across the top and off the far side, so a fixed sample time
  // makes the test a stopwatch instead of a physics check.
  place(-3.4,1.6,0);SD.S.vy=C.JUMP_V;SD.S.grounded=false;
  SD.S.keys['w']=true;
  var stoodOnStool=false;
  for(var j=0;j<70;j++){SD.tick(1/60);if(SD.S.grounded&&near(SD.S.py,0.45,0.005))stoodOnStool=true;}
  SD.S.keys['w']=false;
  ok('0.45 stool: mountable with a jump',stoodOnStool,
     'ended py='+SD.S.py.toFixed(3)+' z='+SD.player.position.z.toFixed(2));

  place(3.1,-1.6,0);SD.S.vy=C.JUMP_V;SD.S.grounded=false;SD.hold(['w'],60);
  ok('0.92 counter: refuses the jump (top > apex+STEP_UP)',
     SD.S.py<0.02&&SD.player.position.z>-2.30,
     'py='+SD.S.py.toFixed(3)+' z='+SD.player.position.z.toFixed(3));

  /* ── 5. WALLS AND THE DOORWAY ──────────────────────────────────────────── */
  place(3.0,0.5,-Math.PI/2);SD.hold(['w'],90);
  ok('east wall blocks at the inflated face',near(SD.player.position.x,4.12,0.02),
     'x='+SD.player.position.x.toFixed(3)+' expected 4.12');

  place(0.2,0,-Math.PI/2);SD.hold(['w'],80);
  ok('walks THROUGH the 1.0m doorway gap',SD.player.position.x>2.0,
     'x='+SD.player.position.x.toFixed(3));

  place(0.2,1.5,-Math.PI/2);SD.hold(['w'],80);
  ok('partition blocks away from the doorway',near(SD.player.position.x,0.82,0.02),
     'x='+SD.player.position.x.toFixed(3)+' expected 0.82');

  /* ── 6. CAMERA ─────────────────────────────────────────────────────────── */
  place(OPEN_X,OPEN_Z,0.6);SD.run(60);
  var cp=SD.camera.position;
  ok('camera position is finite',isFinite(cp.x)&&isFinite(cp.y)&&isFinite(cp.z),
     cp.x.toFixed(2)+','+cp.y.toFixed(2)+','+cp.z.toFixed(2));
  ok('camera stays inside the shell',Math.abs(cp.x)<=4.5&&Math.abs(cp.z)<=3.5,
     'x='+cp.x.toFixed(2)+' z='+cp.z.toFixed(2));
  SD.S.pitch=C.CAM_PITCH_MAX;SD.run(90);
  ok('camera stays under the 2.6m ceiling even at max pitch',
     SD.camera.position.y<=C.WALL_H-C.CAM_CEIL_PAD+0.001,
     'y='+SD.camera.position.y.toFixed(3)+' limit '+(C.WALL_H-C.CAM_CEIL_PAD));
  SD.S.pitch=C.CAM_PITCH_MIN;SD.run(90);
  ok('camera stays above the floor at min pitch',
     SD.camera.position.y>=C.CAM_MIN_Y-0.001,'y='+SD.camera.position.y.toFixed(3));

  /* ── 7. IT ACTUALLY RENDERS (real pixels, not a proxy) ──────────────────── */
  SD.S.pitch=C.CAM_PITCH0;place(OPEN_X,OPEN_Z,0.6);SD.run(30);
  SD.renderer.render(SD.scene,SD.camera);
  var gl=SD.renderer.getContext();
  var cw=SD.renderer.domElement.width,chh=SD.renderer.domElement.height;
  ok('drawing buffer has size',cw>0&&chh>0,cw+'x'+chh);
  var seen={},samples=[[0.5,0.5],[0.2,0.75],[0.8,0.35],[0.5,0.12]];
  for(var s=0;s<samples.length;s++){
    var buf=new Uint8Array(4);
    gl.readPixels(Math.floor(cw*samples[s][0]),Math.floor(chh*samples[s][1]),1,1,gl.RGBA,gl.UNSIGNED_BYTE,buf);
    seen[buf[0]+','+buf[1]+','+buf[2]]=1;
  }
  var distinct=Object.keys(seen);
  ok('scene renders distinct geometry',distinct.length>=3,distinct.join(' | '));

  var eb1=document.getElementById('err-banner');
  ok('no crash banner after the whole run',!eb1,eb1?eb1.textContent.slice(0,200):'');

}catch(e){
  fail++;
  out.push('FAIL  harness threw: '+(e&&e.message)+'  @ '+String((e&&e.stack)||'').split('\n').slice(0,3).join(' | '));
}

var summary='SDTEST '+(fail===0?'ALL-PASS':'FAILURES')+' pass='+pass+' fail='+fail;
var pre=document.createElement('pre');
pre.id='test-out';
/* Sentinels deliberately contain NO angle brackets: the runner greps the
   SERIALIZED DOM, where any '<' in textContent comes back as '&lt;'. */
pre.textContent='==SDTEST-BEGIN==\n'+summary+'\n'+out.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);
document.title=summary;
})();

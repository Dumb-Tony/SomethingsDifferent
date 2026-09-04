/* Promoted from the M58 surface direction (zl-D-gpu.js): an OFFSCREEN min-of-40 harness.
   Both judges found tools/_gpu.js worthless while other Chrome processes ran, because its
   headline includes the WARP swapchain present. This one does not. Prefer it for pricing. */
/* LOW-VARIANCE PRICING, adapted from tools/_gpu.js.

   _gpu.js times R.render(scene, camera) straight to the canvas, and on this machine
   that reading swings 16ms -> 48ms on the SAME build between consecutive runs: in
   WARP the swapchain present is at the mercy of whatever else the OS is doing, and
   it is a bigger term than the raster. Three passes over three builds could not
   separate a 40% regression from noise.

   So: render OFFSCREEN (no present at all), take 40 samples, and report the MEDIAN
   and the interquartile range rather than a mean. The median throws away the
   scheduling hiccups; the IQR says whether the number can be believed. */
(function(){
var L=[];function p(s){L.push(s);}
try{
var SD=window.__SD,T=window.THREE,R=SD.renderer;
SD.startHouse();SD.beginNight();
SD.GAME.hasSpareKey=true;SD.useDoor(SD.frontDoor);
var o=SD.objects.filter(function(x){return SD.RESIDENTS[x.owner];})[0];
SD.player.position.set(o.spec._pos[0],0,o.spec._pos[2]-1.6);
SD.S.yaw=Math.PI;SD.S.pitch=0.14;SD.S.camP=null;SD.S.camL=null;
for(var i=0;i<20;i++)SD.tick(1/60);
SD.scene.updateMatrixWorld(true);

var W=R.domElement.width,H=R.domElement.height;
var rt=new T.WebGLRenderTarget(W,H,
  {minFilter:T.LinearFilter,magFilter:T.LinearFilter,format:T.RGBAFormat});

function bench(label,fn,n){
  n=n||40;
  for(var k=0;k<6;k++)fn();                       // warm: compile, upload, settle
  var s=[];
  for(k=0;k<n;k++){var t=performance.now();fn();s.push(performance.now()-t);}
  s.sort(function(a,b){return a-b;});
  var med=s[Math.floor(n/2)],q1=s[Math.floor(n*0.25)],q3=s[Math.floor(n*0.75)];
  p('  '+label.padEnd(40)+med.toFixed(2)+' ms   (iqr '+q1.toFixed(2)+'-'+
    q3.toFixed(2)+', min '+s[0].toFixed(2)+')');
  return med;
}
function offscreen(){R.setRenderTarget(rt);R.render(SD.scene,SD.camera);
                     R.setRenderTarget(null);}

p('=== OFFSCREEN RASTER COST, MEDIAN OF 40 ===');
p('  target '+W+'x'+H+'   pixelRatio '+R.getPixelRatio());
p('');
var full=bench('scene -> offscreen target',offscreen);
p('');
p('  draw calls '+R.info.render.calls+'   triangles '+R.info.render.triangles+
  '   programs '+R.info.programs.length);
p('  meshes '+SD.envMeshes.length);
p('');
var was=R.shadowMap.enabled;
R.shadowMap.enabled=false;
var noSh=bench('...with shadows off',offscreen);
R.shadowMap.enabled=was;R.shadowMap.needsUpdate=true;
p('     shadows are '+(full-noSh).toFixed(2)+' ms of that');
p('');
p('=== HEADLINE ===');
p('  MEDIAN OFFSCREEN FRAME: '+full.toFixed(2)+' ms');
R.setRenderTarget(null);rt.dispose();
}catch(e){p('THREW: '+(e&&e.message)+' @ '+String((e&&e.stack)||'').split('\n').slice(0,3).join(' | '));}
var pre=document.createElement('pre');pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\nSDTEST ALL-PASS pass=0 fail=0\n'+L.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);document.title='SDTEST ALL-PASS pass=0 fail=0';
})();

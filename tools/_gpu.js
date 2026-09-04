/* DIAGNOSTIC — how much rendering headroom is there, on the machine the tests run on?

   M21 tried a 2048 shadow map and made all twenty suites time out at once, because the
   harness renders in software (ANGLE/D3D11 WARP) where fill rate is the scarce thing,
   not triangles. Any visual pass has to be budgeted against that, not against a guess.

   This measures what a frame currently costs and what the expensive parts of it are, so
   a post-processing pass can be priced BEFORE it is written rather than discovered to be
   unaffordable after fifty-seven suites start timing out. */
(function(){
var L=[];function p(s){L.push(s);}
try{
var SD=window.__SD,C=SD.CONST,T=window.THREE;
var R=SD.renderer;
SD.startHouse();SD.beginNight();
SD.GAME.hasSpareKey=true;SD.useDoor(SD.frontDoor);
/* settle the camera somewhere representative: inside a house, looking across it */
var o=SD.objects.filter(function(x){return SD.RESIDENTS[x.owner];})[0];
SD.player.position.set(o.spec._pos[0],0,o.spec._pos[2]-1.6);
SD.S.yaw=Math.PI;SD.S.pitch=0.14;SD.S.camP=null;SD.S.camL=null;
for(var i=0;i<20;i++)SD.tick(1/60);
SD.scene.updateMatrixWorld(true);

function timeIt(label,fn,n){
  fn();fn();                                  // warm
  var t0=performance.now();
  for(var i=0;i<n;i++)fn();
  var ms=(performance.now()-t0)/n;
  p('  '+label.padEnd(42)+ms.toFixed(2)+' ms');
  return ms;
}

p('=== WHAT A FRAME COSTS IN SOFTWARE (WARP) ===');
p('  canvas '+R.domElement.width+'x'+R.domElement.height+
  '   pixelRatio '+R.getPixelRatio());
p('');
var full=timeIt('render the scene as it ships',function(){
  R.render(SD.scene,SD.camera);
},12);
p('');
p('  draw calls '+R.info.render.calls+'   triangles '+R.info.render.triangles+
  '   programs '+R.info.programs.length);
p('  meshes in scene '+SD.envMeshes.length+'   colliders '+SD.colliders.length);
p('');

/* what shadows cost */
p('=== WHERE THE TIME GOES ===');
var wasShadow=R.shadowMap.enabled;
R.shadowMap.enabled=false;
var noShadow=timeIt('...with shadows off',function(){R.render(SD.scene,SD.camera);},12);
R.shadowMap.enabled=wasShadow;R.shadowMap.needsUpdate=true;
p('     shadows cost about '+(full-noShadow).toFixed(2)+' ms of that');
p('');

/* what a single extra full-screen pass costs - the price of ANY post-processing */
var rt=new T.WebGLRenderTarget(R.domElement.width,R.domElement.height,
  {minFilter:T.LinearFilter,magFilter:T.LinearFilter,format:T.RGBAFormat});
var quadScene=new T.Scene();
var quadCam=new T.OrthographicCamera(-1,1,1,-1,0,1);
var quadMat=new T.ShaderMaterial({
  uniforms:{tDiffuse:{value:rt.texture}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
  fragmentShader:
    'uniform sampler2D tDiffuse;varying vec2 vUv;'+
    'void main(){vec4 c=texture2D(tDiffuse,vUv);'+
    /* a representative grade: vignette + tint + grain, the cheap end of the range */
    'float v=1.0-0.55*pow(length(vUv-0.5)*1.42,2.2);'+
    'c.rgb*=v;'+
    'c.rgb=mix(c.rgb,c.rgb*vec3(1.04,0.99,0.94),0.6);'+
    'float g=fract(sin(dot(vUv,vec2(12.9898,78.233)))*43758.5453);'+
    'c.rgb+=(g-0.5)*0.020;'+
    'gl_FragColor=c;}'
});
quadScene.add(new T.Mesh(new T.PlaneGeometry(2,2),quadMat));
var post=timeIt('scene -> target, then one composite pass',function(){
  R.setRenderTarget(rt);R.render(SD.scene,SD.camera);
  R.setRenderTarget(null);R.render(quadScene,quadCam);
},12);
p('     one post pass costs about '+(post-full).toFixed(2)+' ms on top');
p('');

/* and what a blur (the expensive half of any bloom) costs */
var half=new T.WebGLRenderTarget(Math.floor(R.domElement.width/2),
                                 Math.floor(R.domElement.height/2),
  {minFilter:T.LinearFilter,magFilter:T.LinearFilter,format:T.RGBAFormat});
var blurMat=new T.ShaderMaterial({
  uniforms:{tDiffuse:{value:rt.texture},dir:{value:new T.Vector2(1/R.domElement.width,0)}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
  fragmentShader:
    'uniform sampler2D tDiffuse;uniform vec2 dir;varying vec2 vUv;'+
    'void main(){vec4 s=texture2D(tDiffuse,vUv)*0.227;'+
    's+=texture2D(tDiffuse,vUv+dir*1.38)*0.316;'+
    's+=texture2D(tDiffuse,vUv-dir*1.38)*0.316;'+
    's+=texture2D(tDiffuse,vUv+dir*3.23)*0.070;'+
    's+=texture2D(tDiffuse,vUv-dir*3.23)*0.070;'+
    'gl_FragColor=s;}'
});
var blurScene=new T.Scene();
blurScene.add(new T.Mesh(new T.PlaneGeometry(2,2),blurMat));
var bloom=timeIt('...plus a half-res two-tap blur (bloom)',function(){
  R.setRenderTarget(rt);R.render(SD.scene,SD.camera);
  R.setRenderTarget(half);R.render(blurScene,quadCam);
  R.setRenderTarget(null);R.render(quadScene,quadCam);
},10);
p('     a bloom chain costs about '+(bloom-full).toFixed(2)+' ms on top');
p('');
p('=== THE BUDGET ===');
p('  a frame is '+full.toFixed(1)+' ms today, i.e. '+(1000/full).toFixed(0)+' fps in WARP.');
p('  A real GPU is many times faster; WARP is the constraint because the 57 suites');
p('  and every screenshot run through it. M21 lost twenty suites to a shadow map.');
R.setRenderTarget(null);
rt.dispose();half.dispose();
}catch(e){p('THREW: '+(e&&e.message)+' @ '+String((e&&e.stack)||'').split('\n').slice(0,3).join(' | '));}
var pre=document.createElement('pre');pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\nSDTEST ALL-PASS pass=0 fail=0\n'+L.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);document.title='SDTEST ALL-PASS pass=0 fail=0';
})();

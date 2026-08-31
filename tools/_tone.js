/* DIAGNOSTIC — the night has no top end.

   Measured: every scene lives entirely in the bottom two fifths of the histogram.
   street 64/36/0/0/0, bedroom 48/51/0/0/0, kitchen 43/56/0/0/0. Not one pixel
   anywhere in the top three fifths, and 13-25% of every frame is pure black.

   The night rig's own comment says the plan is "a low exposure crushes the ambient
   toward black while letting the practicals hold their highlights - light is where
   you can be seen, so light has to be where your eye goes". The practicals are not
   holding any highlights. Nothing is.

   Sweep exposure and practical intensity together and find a pair that gives the
   frame a TOP END without flattening the dark. What we want is not a brighter
   picture - it is a picture with range: deep shadow, a solid midtone mass, and a
   genuine highlight your eye lands on. */
(function(){
var L=[];function p(s){L.push(s);}
try{
var SD=window.__SD,C=SD.CONST,T=window.THREE;
SD.stopLoop();

function lum(){
  var gl=SD.renderer.getContext();
  var w=gl.drawingBufferWidth,h=gl.drawingBufferHeight;
  SD.renderer.render(SD.scene,SD.camera);
  var px=new Uint8Array(w*h*4);
  gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,px);
  var sum=0,black=0,hi=0,n=w*h,hist=[0,0,0,0,0];
  for(var i=0;i<n;i++){
    var o=i*4,Y=(0.2126*px[o]+0.7152*px[o+1]+0.0722*px[o+2])/255;
    sum+=Y;if(Y<0.04)black++;if(Y>0.60)hi++;
    hist[Math.min(4,Math.floor(Y*5))]++;
  }
  return {mean:sum/n,black:100*black/n,hi:100*hi/n,
          hist:hist.map(function(v){return Math.round(100*v/n);})};
}
function scene(which){
  SD.startHouse();
  if(which!=='street'){SD.GAME.hasSpareKey=true;SD.useDoor(SD.frontDoor);}
  if(which==='street'){
    SD.player.position.set(0.6,0,-7.4);SD.S.yaw=Math.PI;SD.S.pitch=0.20;SD.S.dist=5.4;
  }else if(which==='lounge'){
    SD.player.position.set(2.2,0,-1.0);SD.S.yaw=0.9;SD.S.pitch=0.20;SD.S.dist=3.4;
  }else{
    SD.player.position.set(2.6,0,1.5);SD.S.yaw=Math.PI;SD.S.pitch=0.30;SD.S.dist=3.2;
  }
  SD.S.camP=null;SD.S.camL=null;SD.S.py=0;
  for(var i=0;i<12;i++)SD.tick(1/60);
}

/* Scale every practical in the scene by k, leaving the ambient rig alone. */
function boost(k){
  var n=0;
  SD.scene.traverse(function(o){
    if(o.isPointLight){
      if(o.userData._base===undefined)o.userData._base=o.intensity;
      o.intensity=o.userData._base*k;n++;
    }
  });
  return n;
}

p('=== WHAT THE NIGHT LOOKS LIKE NOW ===');
['street','lounge','bedroom'].forEach(function(s){
  scene(s);var l=lum();
  p('  '+s.padEnd(8)+' Y '+l.mean.toFixed(3)+'  black '+l.black.toFixed(0)+
    '%  highlight '+l.hi.toFixed(1)+'%   '+l.hist.join('/'));
});

p('');
p('=== EXPOSURE SWEEP (practicals unchanged) ===');
p('  exp  | scene   |  Y    | black | hi    | histogram');
[0.52,0.70,0.90,1.10,1.35].forEach(function(e){
  ['street','bedroom'].forEach(function(s){
    scene(s);
    SD.renderer.toneMappingExposure=e;
    var l=lum();
    p('  '+e.toFixed(2)+' | '+s.padEnd(8)+'| '+l.mean.toFixed(3)+' | '+
      l.black.toFixed(0).padStart(4)+'% | '+l.hi.toFixed(1).padStart(4)+'% | '+l.hist.join('/'));
  });
});

p('');
p('=== PRACTICALS SWEEP (exposure back to 0.52) ===');
p('  x    | scene   |  Y    | black | hi    | histogram');
[1,2,3,5,8].forEach(function(k){
  ['street','lounge','bedroom'].forEach(function(s){
    scene(s);
    SD.renderer.toneMappingExposure=0.52;
    var n=boost(k);
    var l=lum();
    p('  '+String(k).padEnd(4)+' | '+s.padEnd(8)+'| '+l.mean.toFixed(3)+' | '+
      l.black.toFixed(0).padStart(4)+'% | '+l.hi.toFixed(1).padStart(4)+'% | '+
      l.hist.join('/')+'   ('+n+' lights)');
  });
});

p('');
p('=== BOTH TOGETHER ===');
p('  exp/x | scene   |  Y    | black | hi    | histogram');
[[0.70,3],[0.85,3],[0.70,5],[0.85,5],[1.00,4]].forEach(function(pair){
  ['street','lounge','bedroom'].forEach(function(s){
    scene(s);
    SD.renderer.toneMappingExposure=pair[0];
    boost(pair[1]);
    var l=lum();
    p('  '+pair[0].toFixed(2)+'/'+pair[1]+' | '+s.padEnd(8)+'| '+l.mean.toFixed(3)+' | '+
      l.black.toFixed(0).padStart(4)+'% | '+l.hi.toFixed(1).padStart(4)+'% | '+l.hist.join('/'));
  });
});
p('');
p('WANTED: deep shadow kept (black 10-20%), a solid midtone mass, and a real');
p('highlight (hi > 1%) so the eye has somewhere to land. Not a brighter picture -');
p('a picture with RANGE.');
}catch(e){
  p('THREW: '+(e&&e.message)+' @ '+String((e&&e.stack)||'').split('\n').slice(0,4).join(' | '));
}
var pre=document.createElement('pre');pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\nSDTEST ALL-PASS pass=0 fail=0\n'+L.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);document.title='SDTEST ALL-PASS pass=0 fail=0';
})();

/* DIAGNOSTIC — CAN YOU SEE THE GAME?

   Forty-one milestones and 1,373 assertions, none of which has ever looked at a
   pixel. The screenshots say the camera spends its life inside walls and the street
   is a black slab. This measures both, per scene, so Phase 1 has before-numbers.

   Two measures, neither of which needs a human eye:

   OCCLUSION — cast a grid of rays out through the camera frustum and record how far
   each one travels before it hits something. A camera standing in open space in a
   room mostly hits things 2-6m away. A camera buried in a wall hits things at 30cm
   across most of the frame. "Percentage of the frame closer than 1 metre" is the
   number that says "you are inside the geometry".

   LUMINANCE — read the actual framebuffer. Mean brightness, and the share of the
   frame that is essentially black. A night scene should be dark; it should not be
   80% pure black, because then there is nothing on the screen to read. */
(function(){
var L=[];function p(s){L.push(s);}
try{
var SD=window.__SD,C=SD.CONST,T=window.THREE;
SD.stopLoop();

/* ── the scenes shot.ps1 authors, so the numbers line up with the images ────*/
var SCENES={
  street:function(){
    SD.startHouse();
    SD.player.position.set(0.6,0,-7.4);SD.player.rotation.y=0;
    SD.S.yaw=Math.PI;SD.S.pitch=0.20;SD.S.dist=5.4;SD.S.camP=null;SD.S.camL=null;},
  hall:function(){
    SD.startHouse();SD.GAME.hasSpareKey=true;SD.useDoor(SD.frontDoor);
    SD.player.position.set(-2.6,0,-2.5);SD.player.rotation.y=Math.PI*1.5;
    SD.S.yaw=Math.PI*0.5;SD.S.pitch=0.14;SD.S.dist=3.0;SD.S.camP=null;SD.S.camL=null;},
  lounge:function(){
    SD.startHouse();SD.GAME.hasSpareKey=true;SD.useDoor(SD.frontDoor);
    SD.player.position.set(2.2,0,-1.0);SD.player.rotation.y=Math.PI;
    SD.S.yaw=0.9;SD.S.pitch=0.20;SD.S.dist=3.4;SD.S.camP=null;SD.S.camL=null;},
  bedroom:function(){
    SD.startHouse();SD.GAME.hasSpareKey=true;SD.useDoor(SD.frontDoor);
    SD.player.position.set(2.6,0,1.5);SD.player.rotation.y=0;
    SD.S.yaw=Math.PI;SD.S.pitch=0.30;SD.S.dist=3.2;SD.S.camP=null;SD.S.camL=null;},
  kitchen:function(){
    SD.startHouse();SD.GAME.hasSpareKey=true;SD.useDoor(SD.frontDoor);
    SD.player.position.set(-2.2,0,1.2);SD.player.rotation.y=Math.PI;
    SD.S.yaw=Math.PI*1.2;SD.S.pitch=0.18;SD.S.dist=3.2;SD.S.camP=null;SD.S.camL=null;}
};

/* Drive one real frame so the camera rig actually solves for this pose. */
function settle(){
  for(var i=0;i<12;i++)SD.tick(1/60);
}

/* ── OCCLUSION ─────────────────────────────────────────────────────────────*/
var _rc=new T.Raycaster();
function occlusion(){
  var cam=SD.camera;
  var near=0,mid=0,far=0,tot=0,sum=0;
  var solids=SD.envMeshes.filter(function(m){return m&&m.visible;});
  for(var gy=-0.8;gy<=0.8;gy+=0.2){
    for(var gx=-0.9;gx<=0.9;gx+=0.15){
      _rc.setFromCamera({x:gx,y:gy},cam);
      var hits=_rc.intersectObjects(solids,true);
      tot++;
      if(!hits.length){far++;sum+=30;continue;}
      var d=hits[0].distance;sum+=Math.min(30,d);
      if(d<1.0)near++;else if(d<6)mid++;else far++;
    }
  }
  return {near:100*near/tot,mid:100*mid/tot,far:100*far/tot,
          meanDist:sum/tot,rays:tot};
}

/* ── LUMINANCE, from the real framebuffer ──────────────────────────────────*/
function luminance(){
  var gl=SD.renderer.getContext();
  var w=gl.drawingBufferWidth,h=gl.drawingBufferHeight;
  SD.renderer.render(SD.scene,SD.camera);      // preserveDrawingBuffer is false
  var px=new Uint8Array(w*h*4);
  gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,px);
  var sum=0,black=0,n=w*h,hist=[0,0,0,0,0];
  for(var i=0;i<n;i++){
    var o=i*4;
    var Y=(0.2126*px[o]+0.7152*px[o+1]+0.0722*px[o+2])/255;
    sum+=Y;
    if(Y<0.04)black++;
    hist[Math.min(4,Math.floor(Y*5))]++;
  }
  return {mean:sum/n,blackPct:100*black/n,
          hist:hist.map(function(v){return Math.round(100*v/n);}),
          w:w,h:h};
}

p('=== CAN YOU SEE THE GAME? ===');
p('');
p('scene    | <1m   | 1-6m  | >6m   | mean d | frame Y | pure black | histogram');
p('---------+-------+-------+-------+--------+---------+------------+------------');
var rows=[];
Object.keys(SCENES).forEach(function(name){
  SCENES[name]();
  settle();
  var o=occlusion(),l=luminance();
  rows.push({name:name,o:o,l:l});
  p(name.padEnd(9)+'| '+o.near.toFixed(0).padStart(4)+'% | '+
    o.mid.toFixed(0).padStart(4)+'% | '+o.far.toFixed(0).padStart(4)+'% | '+
    o.meanDist.toFixed(1).padStart(6)+' | '+l.mean.toFixed(3).padStart(7)+' | '+
    l.blackPct.toFixed(0).padStart(9)+'% | '+l.hist.join('/'));
});
p('');
p('<1m  = share of the frame that is geometry within a metre of the camera.');
p('       This is the "the camera is inside a wall" number.');
p('frame Y = mean luminance, 0..1. histogram is the % of pixels in each fifth.');

/* ── AND IS THE THING YOU ARE PROMPTED ABOUT EVEN ON SCREEN? ────────────────*/
p('');
p('=== IS THE PROMPTED OBJECT ON SCREEN? ===');
SD.startHouse();SD.GAME.hasSpareKey=true;SD.useDoor(SD.frontDoor);
var checked=0,onScreen=0,worst=[];
SD.objects.forEach(function(o){
  if(!o.spec||!o.spec._pos)return;
  /* stand where the player would be to get the prompt: just south of it, facing it */
  SD.player.position.set(o.spec._pos[0],0,o.spec._pos[2]-1.1);
  SD.S.py=0;SD.S.yaw=Math.PI;SD.S.camP=null;SD.S.camL=null;
  settle();
  var t=SD.findTarget();
  if(!t||t.t!=='prop'||t.o.id!==o.id)return;      // no prompt here; not our case
  checked++;
  var v=new T.Vector3(o.spec._pos[0],o.spec._pos[1],o.spec._pos[2]).project(SD.camera);
  var vis=Math.abs(v.x)<=1&&Math.abs(v.y)<=1&&v.z<1;
  if(vis)onScreen++;else if(worst.length<6)worst.push(o.label+
    ' (ndc '+v.x.toFixed(2)+','+v.y.toFixed(2)+')');
});
p('objects that produced a prompt: '+checked);
p('...of which actually on screen: '+onScreen+
  '  ('+(checked?Math.round(100*onScreen/checked):0)+'%)');
if(worst.length)p('off-screen examples: '+worst.join('; '));
p('');
p('A prompt that names something you cannot see is a prompt about nothing.');
}catch(e){
  p('THREW: '+(e&&e.message)+' @ '+String((e&&e.stack)||'').split('\n').slice(0,4).join(' | '));
}
var pre=document.createElement('pre');pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\nSDTEST ALL-PASS pass=0 fail=0\n'+L.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);document.title='SDTEST ALL-PASS pass=0 fail=0';
})();

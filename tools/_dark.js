/* DIAGNOSTIC - what is actually bright in a room with every practical off? The first probe assumed a
   room with practicals off reads 5-20 and never measured it; and glass read 214
   at emi 1.10 AND at 0.60, so envMapIntensity is not the lever. Find the mesh. */
(function(){
var L=[];function p(s){L.push(s);}
try{
var SD=window.__SD,T=window.THREE,R=SD.renderer,gl=R.getContext();
SD.startHouse();SD.beginNight();SD.GAME.hasSpareKey=true;
SD.scene.traverse(function(l){if(l.isPointLight||l.isSpotLight)l.intensity=0;});
var W=R.domElement.width,H=R.domElement.height,buf=new Uint8Array(W*H*4);
function shoot(){R.render(SD.scene,SD.camera);gl.readPixels(0,0,W,H,gl.RGBA,gl.UNSIGNED_BYTE,buf);}
function lum(x,y){var i=(y*W+x)*4;return 0.2126*buf[i]+0.7152*buf[i+1]+0.0722*buf[i+2];}
function brightest(x0,y0,x1,y1){var m=0,at=null;for(var y=y0;y<y1;y++)for(var x=x0;x<x1;x++){var l=lum(x,y);if(l>m){m=l;at=[x,y];}}return {l:m,at:at};}
/* the CONTROL: the same framing, aimed at a bare wall in the same room */
var o=SD.objects.filter(function(x){return x.kind==='pictureFrame'&&SD.RESIDENTS[x.owner];})[0];
SD.player.position.set(o.spec._pos[0]+0.3,0,o.spec._pos[2]-1.1);SD.S.py=0;
SD.S.yaw=Math.PI*0.92;SD.S.pitch=0.25;SD.S.dist=1.6;SD.S.camP=null;SD.S.camL=null;
for(var i=0;i<24;i++)SD.tick(1/60);
o.group.visible=false;shoot();
var ctl=brightest(W*0.3|0,H*0.3|0,W*0.7|0,H*0.7|0);
p('CONTROL, prop hidden, same frame: brightest '+ctl.l.toFixed(0)+'/255');
o.group.visible=true;shoot();
var withProp=brightest(W*0.3|0,H*0.3|0,W*0.7|0,H*0.7|0);
p('WITH the photo frame:            brightest '+withProp.l.toFixed(0)+'/255 at px '+withProp.at);
p('');p('the photo frame is built from:');
o.group.traverse(function(m){if(!m.isMesh)return;var mt=m.material;
  p('  '+mt.type.padEnd(22)+' color #'+(mt.color?mt.color.getHexString():'------')+
    (mt.map?'  [mapped]':'')+(mt.emissive?'  emissive #'+mt.emissive.getHexString():'')+
    (mt.envMapIntensity!==undefined?'  emi '+mt.envMapIntensity:'')+(mt.toneMapped===false?'  toneMapped:false':''));});
/* and a mug, for the ceramic reading, the same way */
var mug=SD.objects.filter(function(x){return x.kind==='coffeeMug'&&SD.RESIDENTS[x.owner];})[0];
if(mug){p('');p('the mug is built from:');mug.group.traverse(function(m){if(!m.isMesh)return;var mt=m.material;
  p('  '+mt.type.padEnd(22)+(mt.map?'  [mapped]':'')+(mt.envMapIntensity!==undefined?'  emi '+mt.envMapIntensity:''));});}
p('');p('moon '+SD.scene.children.filter(function(c){return c.isDirectionalLight;}).map(function(c){return c.intensity.toFixed(2);}).join('/')+'   hemi '+SD.scene.children.filter(function(c){return c.isHemisphereLight;}).map(function(c){return c.intensity.toFixed(2);}).join('/'));
}catch(e){p('THREW: '+(e&&e.message)+' @ '+String((e&&e.stack)||'').split('\n').slice(0,2).join(' | '));}
var pre=document.createElement('pre');pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\nSDTEST ALL-PASS pass=0 fail=0\n'+L.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);document.title='SDTEST ALL-PASS pass=0 fail=0';
})();

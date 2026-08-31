(function(){var L=[];function p(s){L.push(s);}
try{var SD=window.__SD;SD.stopLoop();
function lum(){var gl=SD.renderer.getContext();var w=gl.drawingBufferWidth,h=gl.drawingBufferHeight;
SD.renderer.render(SD.scene,SD.camera);var px=new Uint8Array(w*h*4);
gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,px);var s=0,n=w*h;
for(var i=0;i<n;i++){var o=i*4;s+=(0.2126*px[o]+0.7152*px[o+1]+0.0722*px[o+2])/255;}
return s/n;}
SD.startHouse();
SD.player.position.set(0.6,0,-7.4);SD.S.yaw=Math.PI;SD.S.pitch=0.20;SD.S.dist=5.4;
SD.S.camP=null;SD.S.camL=null;SD.S.py=0;
SD.setLighting('night');for(var i=0;i<12;i++)SD.tick(1/60);
var n=lum(),ne=SD.renderer.toneMappingExposure;
SD.setLighting('day');for(i=0;i<12;i++)SD.tick(1/60);
var d=lum(),de=SD.renderer.toneMappingExposure;
p('same camera, same street:');
p('  night  frame Y '+n.toFixed(3)+'   exposure '+ne.toFixed(2));
p('  day    frame Y '+d.toFixed(3)+'   exposure '+de.toFixed(2));
p('  day is '+(d/n).toFixed(2)+'x brighter on the FRAME, at '+(de/ne).toFixed(2)+'x the exposure');
SD.setLighting('night');
}catch(e){p('THREW: '+e.message);}
var pre=document.createElement('pre');pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\nSDTEST ALL-PASS pass=0 fail=0\n'+L.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);document.title='SDTEST ALL-PASS pass=0 fail=0';})();

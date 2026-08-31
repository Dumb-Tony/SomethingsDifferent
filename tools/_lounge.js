(function(){var L=[];function p(s){L.push(s);}
try{var SD=window.__SD,C=SD.CONST,T=window.THREE;SD.stopLoop();
SD.startHouse();SD.GAME.hasSpareKey=true;SD.useDoor(SD.frontDoor);
SD.player.position.set(2.2,0,-1.0);SD.player.rotation.y=Math.PI;
SD.S.yaw=0.9;SD.S.pitch=0.20;SD.S.dist=3.4;SD.S.camP=null;SD.S.camL=null;SD.S.py=0;
for(var i=0;i<12;i++)SD.tick(1/60);
var cam=SD.camera,pl=SD.player.position;
p('player at ('+pl.x.toFixed(2)+','+pl.z.toFixed(2)+')');
p('camera at ('+cam.position.x.toFixed(2)+','+cam.position.y.toFixed(2)+','+cam.position.z.toFixed(2)+')');
p('camera is '+cam.position.distanceTo(pl).toFixed(2)+'m from the player (asked for '+SD.S.dist+')');
var rc=new T.Raycaster();
var tally={};
var solids=SD.envMeshes.filter(function(m){return m&&m.visible;});
p('envMeshes considered: '+solids.length);
for(var gy=-0.8;gy<=0.8;gy+=0.4){
  for(var gx=-0.9;gx<=0.9;gx+=0.3){
    rc.setFromCamera({x:gx,y:gy},cam);
    var h=rc.intersectObjects(solids,true);
    if(!h.length)continue;
    if(h[0].distance>=1.0)continue;
    var o=h[0].object;
    var nm=(o.userData&&o.userData.tag)||o.name||
           (o.parent&&o.parent.userData&&o.parent.userData.tag)||'(untagged)';
    var key=nm+' @'+h[0].point.x.toFixed(1)+','+h[0].point.y.toFixed(1)+','+h[0].point.z.toFixed(1);
    tally[key]=(tally[key]||0)+1;
  }
}
p('');p('what the near rays hit:');
Object.keys(tally).sort(function(a,b){return tally[b]-tally[a];}).slice(0,10)
 .forEach(function(k){p('  '+String(tally[k]).padStart(3)+' x  '+k);});
}catch(e){p('THREW: '+e.message+' | '+String(e.stack||'').split('\n')[1]);}
var pre=document.createElement('pre');pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\nSDTEST ALL-PASS pass=0 fail=0\n'+L.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);document.title='SDTEST ALL-PASS pass=0 fail=0';})();

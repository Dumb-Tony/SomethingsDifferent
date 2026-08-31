/* DIAGNOSTIC — is the camera good ACROSS A HOUSE, or only at one authored pose?

   I have now tuned the indoor camera twice against a single scene ("lounge") and got
   opposite answers: capping distance to clearance made it 0% blocked, a flat 2.4m cap
   made it 73%. Both are true of that one spot and neither says anything about the
   game, because that pose points into a corner.

   So: stand the player on a grid across the whole interior, spin them through eight
   headings at each spot, solve the real camera each time, and report the DISTRIBUTION
   of how much of the frame is geometry within a metre. A camera is good if it is
   rarely bad, not if it is perfect in one doorway. */
(function(){
var L=[];function p(s){L.push(s);}
try{
var SD=window.__SD,C=SD.CONST,T=window.THREE;
SD.stopLoop();
SD.startHouse();SD.GAME.hasSpareKey=true;SD.useDoor(SD.frontDoor);

var _rc=new T.Raycaster();
function nearShare(){
  var solids=SD.envMeshes.filter(function(m){return m&&m.visible;});
  var near=0,tot=0;
  for(var gy=-0.7;gy<=0.7;gy+=0.35)for(var gx=-0.85;gx<=0.85;gx+=0.28){
    _rc.setFromCamera({x:gx,y:gy},SD.camera);
    var h=_rc.intersectObjects(solids,true);
    tot++;if(h.length&&h[0].distance<1.0)near++;
  }
  return 100*near/tot;
}
function walkable(x,z){
  /* inside the house, not inside anything solid */
  if(SD.ceilAt(x,z)<=0)return false;
  return SD.PHYS.clearance(SD.colliders,x,1.0,z,C.CAM_OCC_MIN_TOP)>C.PLAYER_R;
}

var h=SD.houseById('hoyt');
function sweepAt(cap){
  C.CAM_INDOOR_DIST=cap;
  var s=[],bad=0,w=-1;
  for(var x=h.x-5.5;x<=h.x+5.5;x+=1.1){
    for(var z=-4.0;z<=5.0;z+=1.1){
      if(!walkable(x,z))continue;
      for(var a=0;a<8;a++){
        SD.player.position.set(x,0,z);
        SD.S.py=0;SD.S.yaw=a*Math.PI/4;SD.S.pitch=0.20;SD.S.dist=C.CAM_DIST;
        SD.S.camP=null;SD.S.camL=null;
        for(var t=0;t<8;t++)SD.tick(1/60);
        var v=nearShare();s.push(v);if(v>25)bad++;if(v>w)w=v;
      }
    }
  }
  s.sort(function(a,b){return a-b;});
  return {n:s.length,med:s[Math.floor(s.length*0.5)],
          p90:s[Math.floor(s.length*0.9)],worst:w,
          bad:100*bad/s.length};
}
p('=== SWEEPING THE INDOOR CAMERA CAP ===');
p('  cap  | poses | median | 90th | worst | % badly blocked');
[99,3.6,3.0,2.6,2.4,2.1,1.8,1.5].forEach(function(cap){
  var r=sweepAt(cap);
  p('  '+(cap===99?' none':cap.toFixed(1)).padStart(5)+' | '+String(r.n).padStart(5)+
    ' | '+r.med.toFixed(0).padStart(6)+' | '+r.p90.toFixed(0).padStart(4)+
    ' | '+r.worst.toFixed(0).padStart(5)+' | '+r.bad.toFixed(0).padStart(3)+'%');
});
C.CAM_INDOOR_DIST=2.4;
p('');
var samples=[],blocked=[],worst={v:-1};
for(var x=h.x-5.5;x<=h.x+5.5;x+=1.1){
  for(var z=-4.0;z<=5.0;z+=1.1){
    if(!walkable(x,z))continue;
    for(var a=0;a<8;a++){
      SD.player.position.set(x,0,z);
      SD.S.py=0;SD.S.yaw=a*Math.PI/4;SD.S.pitch=0.20;SD.S.dist=C.CAM_DIST;
      SD.S.camP=null;SD.S.camL=null;
      for(var t=0;t<8;t++)SD.tick(1/60);
      var v=nearShare();
      samples.push(v);
      if(v>25)blocked.push({x:x,z:z,yaw:a});
      if(v>worst.v)worst={v:v,x:x,z:z,yaw:a};
    }
  }
}
samples.sort(function(a,b){return a-b;});
function pct(q){return samples[Math.min(samples.length-1,Math.floor(samples.length*q))];}
p('=== THE CAMERA, ACROSS ONE WHOLE HOUSE ===');
p('  '+samples.length+' poses sampled (a grid of standing spots x 8 headings)');
p('');
p('  share of frame within 1m of the camera:');
p('    median   '+pct(0.50).toFixed(0)+'%');
p('    75th     '+pct(0.75).toFixed(0)+'%');
p('    90th     '+pct(0.90).toFixed(0)+'%');
p('    worst    '+worst.v.toFixed(0)+'%  at ('+worst.x.toFixed(1)+','+worst.z.toFixed(1)+
  ') facing '+(worst.yaw*45)+' deg');
p('');
p('  poses where more than a quarter of the frame is a near wall: '+
  blocked.length+' of '+samples.length+
  '  ('+Math.round(100*blocked.length/samples.length)+'%)');
p('');
p('  CAM_DIST '+C.CAM_DIST+'   CAM_INDOOR_DIST '+
  (C.CAM_INDOOR_DIST===undefined?'(none)':C.CAM_INDOOR_DIST));
p('');
p('A camera is good if it is RARELY bad. One pose proves nothing either way.');
}catch(e){
  p('THREW: '+(e&&e.message)+' @ '+String((e&&e.stack)||'').split('\n').slice(0,4).join(' | '));
}
var pre=document.createElement('pre');pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\nSDTEST ALL-PASS pass=0 fail=0\n'+L.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);document.title='SDTEST ALL-PASS pass=0 fail=0';
})();

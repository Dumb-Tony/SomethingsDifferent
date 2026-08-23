/* Where can Grace actually sleep?

   Her 100-doubt fracture says "Grace has started sleeping in the front room, facing
   the door" and implements it as moveSleeper('grace',0,-0.8) - dx=0, which is the
   CENTRE of the house, which is where the partition wall runs. Measured: she lands
   inside a collider 0.76m wide and 8.66m deep.

   Scan the front room for somewhere she fits. A WALL is thin in one axis and long in
   the other; a bed is roughly square, and lying on one is the point. */
(function(){
var L=[];function p(s){L.push(s);}
try{
var SD=window.__SD,C=SD.CONST;
SD.stopLoop();SD.startHouse();

function wallsAt(x,z){
  var hits=[];
  for(var i=0;i<SD.colliders.length;i++){
    var c=SD.colliders[i];
    if(c.top!==undefined&&c.top<0.5)continue;
    var w=c.maxX-c.minX,d=c.maxZ-c.minZ;
    var isWall=(w<1.0&&d>2.0)||(d<1.0&&w>2.0);
    if(!isWall)continue;                       // a bed is not a wall
    if(x>c.minX&&x<c.maxX&&z>c.minZ&&z<c.maxZ)hits.push(c);
  }
  return hits;
}
function anySolid(x,z){
  var n=0;
  for(var i=0;i<SD.colliders.length;i++){
    var c=SD.colliders[i];
    if(c.top!==undefined&&c.top<0.5)continue;
    if(x>c.minX&&x<c.maxX&&z>c.minZ&&z<c.maxZ)n++;
  }
  return n;
}

var h=SD.houseById('okonkwo');
p('okonkwo house centre x = '+h.x.toFixed(2));
p('grace sleeps at dx=0, dz=-0.8  ->  ('+(h.x).toFixed(2)+', -0.80)');
p('  walls there: '+wallsAt(h.x,-0.8).length+'   any solid: '+anySolid(h.x,-0.8));
p('');
p('scanning the front room for a clear spot:');
p('   dx  |  dz  |  x abs  | walls | solids');
var best=null;
for(var dz=-2.2;dz<=-0.2;dz+=0.4){
  var row='';
  for(var dx=-3.0;dx<=3.0;dx+=0.5){
    var X=h.x+dx;
    var w=wallsAt(X,dz).length,s=anySolid(X,dz);
    row+=(w===0&&s===0)?'.':(w>0?'W':'o');
    if(w===0&&s===0&&!best)best={dx:dx,dz:dz};
  }
  p('  dz='+dz.toFixed(1).padStart(5)+'  '+row+'      (dx -3.0 .. +3.0, . = clear)');
}
p('');
if(best){
  p('FIRST CLEAR SPOT: dx='+best.dx.toFixed(2)+'  dz='+best.dz.toFixed(2));
  p('  which is ('+(h.x+best.dx).toFixed(2)+', '+best.dz.toFixed(2)+')');
  /* Check it against the OTHER houses too - moveSleeper offsets by the sleeper's own
     house, so a dx that works for one lot should work for all of them. */
  p('');
  p('  the same dx/dz in every house:');
  SD.HOUSES.forEach(function(H){
    var X=H.x+best.dx;
    p('    '+H.name.padEnd(16)+' walls '+wallsAt(X,best.dz).length+
      '  solids '+anySolid(X,best.dz));
  });
}else{
  p('NO CLEAR SPOT FOUND in the scanned band.');
}

/* And where is the door, so "facing the door" is true? */
p('');
var door=SD.DOORS.filter(function(d){return d.house==='okonkwo';})[0];
if(door)p('okonkwo front door at ('+(door.x!==undefined?door.x.toFixed(2):'?')+
          ', '+(door.z!==undefined?door.z.toFixed(2):'?')+')');
else p('(no door record found for okonkwo)');
}catch(e){
  p('THREW: '+(e&&e.message)+' @ '+String((e&&e.stack)||'').split('\n').slice(0,3).join(' | '));
}
var pre=document.createElement('pre');pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\nSDTEST ALL-PASS pass=0 fail=0\n'+L.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);document.title='SDTEST ALL-PASS pass=0 fail=0';
})();

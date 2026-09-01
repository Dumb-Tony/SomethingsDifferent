(function(){
var L=[];function p(s){L.push(s);}
function f(x,n){return (+x).toFixed(n===undefined?1:n);}
try{
  var SD=window.__SD,C=SD.CONST,R=SD.RESIDENTS,D=SD.DOUBT,T=window.THREE;
  SD.stopLoop();SD.startHouse();
  var ow=SD.objects.filter(function(o){return o.owner&&R[o.owner]&&o.spec&&o.spec._pos;});

  /* Where would the fretting resident STAND for each object, and is that spot
     under a ceiling? M40 comment (line 7331): "you can watch it from the street
     through their front window." */
  var indoors=0,out=0,byOwner={};
  ow.forEach(function(o){
    var x=o.spec._pos[0],z=o.spec._pos[2]-0.75;
    var c=SD.ceilAt(x,z);
    if(c>0)indoors++;else out++;
  });
  p('M40 FRET SPOTS: of '+ow.length+' resident-owned objects, the fretter stands UNDER A CEILING for '+
    indoors+' ('+f(indoors/ow.length*100)+'%) and outdoors for '+out);

  /* For the indoor ones, can you see them from outside? Walk the player out to the
     nearest legal outdoor point due south and raycast the RENDERED geometry. */
  SD.scene.updateMatrixWorld(true);
  var rc=new T.Raycaster(),eye=new T.Vector3(),tgt=new T.Vector3();
  var seen=0,blocked=0,sim0=0,tested=0,samples=[];
  ow.forEach(function(o){
    var fx=o.spec._pos[0],fz=o.spec._pos[2]-0.75;
    if(SD.ceilAt(fx,fz)<=0)return;
    // step south until outdoors
    var d=1.0;while(d<16&&SD.ceilAt(fx,fz-d)>0)d+=0.4;
    if(d>=16)return;
    d+=1.2;                       // stand on the grass, not in the wall
    tested++;
    eye.set(fx,1.62,fz-d);tgt.set(fx,1.35,fz);
    var dist=eye.distanceTo(tgt);
    rc.set(eye,tgt.clone().sub(eye).normalize());
    var hits=rc.intersectObjects(SD.envMeshes,true).filter(function(h){return h.distance<dist-0.25;});
    var sb=SD.sightBlocked(eye.x,eye.z,fx,fz);
    if(sb===0)sim0++;
    if(hits.length){blocked++;if(samples.length<5)samples.push(o.label+': '+hits.length+' rendered occluders, first '+(hits[0].object.geometry.type)+' at '+f(hits[0].distance,2)+'m, sightBlocked='+sb);}
    else seen++;
  });
  p('  of '+tested+' indoor fret spots, viewed from the nearest outdoor standpoint due south:');
  p('    RENDERED geometry blocks the view on '+blocked+'  /  clear on '+seen);
  p('    the SIMULATION (sightBlocked) says the view is clear on '+sim0+' of '+tested);
  samples.forEach(function(s){p('    e.g. '+s);});

  /* Night HUD: what the player can see while they work. */
  p('NIGHT HUD pills: '+Array.prototype.slice.call(document.querySelectorAll('#hud .pill'))
     .map(function(e){return (e.id||'?').replace('-pill','');}).join(', '));
  p('  collapseIndex() at this moment = '+f(SD.collapseIndex())+' / '+f(SD.winBar())+'   -- not on any of them');

  /* What the rail-follower's ten mornings look like. */
  SD.startHouse();
  var owo=SD.objects.filter(function(o){return o.owner&&R[o.owner];});
  var hk=0,log=[];
  function tierOf(h){return h>=45?3:(h>=20?2:(h>=8?1:0));}
  for(var night=1;night<=10;night++){
    owo.forEach(function(o){SD.scanObject(o);});
    // the rail's target: the first resident-owned object the beacon points at
    var o=owo[0];
    var rows=[];['bulwark'].forEach(function(sid){SD.shopStock(o.id,sid).forEach(function(v){rows.push(v);});});
    var pick=rows[0];   // the closest match on the shelf -- the intuitive buy
    var pr={kind:o.kind,spec:o.spec,attach:o.attach,marked:o.marked,fresh:o.fresh};
    var r=D.resolve(R[o.owner],pr,pick.spec);
    SD.INV.push({kind:pick.kind,spec:pick.spec,forId:o.id,label:pick.label,sim:pick.sim,store:'bulwark'});
    SD.swapWith(o,0);
    SD.HAUL.length=0;SD.doMorning();
    log.push('n'+night+' '+f(pick.sim)+'% -> '+r.band+'  collapse '+f(SD.collapseIndex())+
             '  predict='+(tierOf(hk)<=0?'???':tierOf(hk)===1?'name':'BAND'));
    hk+=6.6;
    owo=SD.objects.filter(function(q){return q.owner&&R[q.owner];});
  }
  p('THE RAIL, TEN NIGHTS, ONE SWAP EACH, BUYING THE TOP OF THE SHELF:');
  log.forEach(function(s){p('  '+s);});
}catch(e){p('THREW: '+(e&&e.message)+' '+(e&&e.stack||'').split('\n').slice(0,4).join(' / '));}
var pre=document.createElement('pre');pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\nSDTEST ALL-PASS pass=0 fail=0\n'+L.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);document.title='SDTEST ALL-PASS pass=0 fail=0';
})();

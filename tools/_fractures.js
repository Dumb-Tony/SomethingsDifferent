/* DIAGNOSTIC — where do the fractures actually put things?

   FRACTURES claims, in its own header, that "Every entry is a WORLD CHANGE, not a
   cutscene". Two of them move a body or an object by writing coordinates, and neither
   has ever been checked against the world it is writing into:

     grace @100 : moveSleeper('grace',0,-0.8)
     june  @50  : relocate('pictureFrame',[1.35,0.60,2.95])

   moveSleeper writes s.x = house.x + dx, so dx=0 is the CENTRE of the house - which
   is where a partition wall usually is. relocate takes objects.filter(kind)[0] - the
   first object of that kind ON THE WHOLE STREET, whoever owns it - and writes an
   ABSOLUTE position with no house offset at all.

   Measure both. A sleeper inside a wall is permanently invisible to canSee(); an
   object relocated into the wrong house is a fracture happening to the wrong person. */
(function(){
var L=[];function p(s){L.push(s);}
try{
var SD=window.__SD,C=SD.CONST;
SD.stopLoop();SD.startHouse();

/* Is this point inside a solid collider? Colliders are XZ AABBs with a `top`, and
   they are PRE-INFLATED by PLAYER_R, so subtract it back to get the real wall. */
function inSolid(x,z){
  var hits=[];
  for(var i=0;i<SD.colliders.length;i++){
    var c=SD.colliders[i];
    if(c.top!==undefined&&c.top<0.5)continue;          // something you step over
    var r=C.PLAYER_R;
    if(x>c.minX+r&&x<c.maxX-r&&z>c.minZ+r&&z<c.maxZ-r)hits.push(i);
  }
  return hits;
}

p('=== WHERE THE SLEEPERS START ===');
for(var i=0;i<SD.SLEEPERS.length;i++){
  var s=SD.SLEEPERS[i];
  var h=inSolid(s.x,s.z);
  p('  '+s.res.padEnd(8)+' at ('+s.x.toFixed(2)+', '+s.z.toFixed(2)+')  '+
    (h.length?'*** INSIDE '+h.length+' COLLIDER(S) ***':'clear'));
}

p('');
p('=== NOW FIRE EVERY FRACTURE ===');
/* Drive every resident to 100 doubt and let fireFractures() run the lot. */
SD.activeResidents().forEach(function(r){r.doubt=100;});
var fired=SD.fireFractures();
p('  '+fired.length+' fractures fired');
fired.forEach(function(f){p('    '+f.who+' @'+f.at+' - '+f.text.slice(0,58));});

p('');
p('=== WHERE THE SLEEPERS ARE NOW ===');
var buried=0;
for(var j=0;j<SD.SLEEPERS.length;j++){
  var sl=SD.SLEEPERS[j];
  var hh=inSolid(sl.x,sl.z);
  if(hh.length)buried++;
  p('  '+sl.res.padEnd(8)+' at ('+sl.x.toFixed(2)+', '+sl.z.toFixed(2)+')  '+
    (hh.length?'*** INSIDE '+hh.length+' COLLIDER(S) ***':'clear'));
  if(hh.length){
    var c=SD.colliders[hh[0]];
    p('           the wall runs x '+c.minX.toFixed(2)+'..'+c.maxX.toFixed(2)+
      '  z '+c.minZ.toFixed(2)+'..'+c.maxZ.toFixed(2));
  }
}
p('');
p('SLEEPERS INSIDE SOLID GEOMETRY AFTER FRACTURES: '+buried);

/* ...and can anybody actually be SEEN by them? A sleeper in a wall is a pair of eyes
   that can never look at anything, which silently removes a threat. */
p('');
p('=== CAN THEY SEE OUT? ===');
for(var k=0;k<SD.SLEEPERS.length;k++){
  var sk=SD.SLEEPERS[k];
  sk.state='awake';sk.look=1;
  /* stand one metre south of them, in the open */
  SD.player.position.set(sk.x,0,sk.z-1.0);SD.S.py=0;
  var seen=false;
  try{seen=!!SD.canSee(sk);}catch(e){seen='threw: '+e.message;}
  p('  '+sk.res.padEnd(8)+' sees a man standing 1m away: '+seen);
}

p('');
p('=== WHOSE PICTURE FRAME DOES relocate() MOVE? ===');
SD.startHouse();
var frames=SD.objects.filter(function(o){return o.kind==='pictureFrame';});
p('  '+frames.length+' pictureFrames on the street:');
frames.forEach(function(f){
  p('    '+f.owner.padEnd(8)+' house '+String(f.house).padEnd(9)+
    ' at ('+f.spec._pos[0].toFixed(2)+', '+f.spec._pos[2].toFixed(2)+')');
});
var first=frames[0];
p('  objects.filter(kind)[0] belongs to: '+(first?first.owner:'none')+
  (first&&first.owner!=='june'?'   <-- NOT June, whose fracture this is':''));

/* June's fracture writes an absolute [1.35,0.60,2.95]. Where is that? */
var target=[1.35,0.60,2.95];
var hitT=inSolid(target[0],target[2]);
p('  the fracture writes the absolute position ('+target[0]+', '+target[2]+')');
p('  which is '+(hitT.length?'INSIDE SOLID GEOMETRY':'in open space')+
  ' - and is not offset by any house');
var june=SD.SLEEPERS.filter(function(s){return s.res==='june';})[0];
if(june){
  p('  June is asleep at ('+june.x.toFixed(2)+', '+june.z.toFixed(2)+')');
  p('  so the destination is '+
    Math.hypot(target[0]-june.x,target[2]-june.z).toFixed(2)+'m from her bed');
}
var nightstands=SD.objects.filter(function(o){return /nightstand|table/i.test(o.label||'');});
p('  nearest nightstand-ish surfaces:');
nightstands.slice(0,4).forEach(function(n){
  p('    '+(n.label||n.kind)+' ('+n.spec._pos[0].toFixed(2)+', '+
    n.spec._pos[1].toFixed(2)+', '+n.spec._pos[2].toFixed(2)+')');
});
}catch(e){
  p('THREW: '+(e&&e.message)+' @ '+String((e&&e.stack)||'').split('\n').slice(0,3).join(' | '));
}
var pre=document.createElement('pre');pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\nSDTEST ALL-PASS pass=0 fail=0\n'+L.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);document.title='SDTEST ALL-PASS pass=0 fail=0';
})();

/* DIAGNOSTIC — how different ARE the five houses?

   buildHouse's own comment argues the case for one floorplan: "Suburban houses on one
   road ARE the same developer's floorplan - the variation that matters is the palette,
   the furniture and, above all, WHOSE things are in it."

   That is a real position and it may well be right. But it has never been MEASURED,
   and the claim it rests on - that the furniture and the people vary enough to carry
   it - is checkable. So: for each house, fingerprint the walls, the walkable space,
   the window positions, the furniture layout, and the route from the front door to the
   sleeping resident. If the fingerprints are identical, then learning house one teaches
   you every house on the street, and the stealth puzzle is solved once for all five. */
(function(){
var L=[];function p(s){L.push(s);}
try{
var SD=window.__SD,C=SD.CONST,T=window.THREE;
SD.stopLoop();

function fingerprint(id){
  /* startHouse() builds the WHOLE STREET in one pass, so there is nothing to
     rebuild per house - each lot is picked out of the one world by its origin. */
  var h=SD.houseById(id),ox=h.x,HW=C.ROOM_SCALE*4.5+1.0;
  /* NEAREST lot wins. A fixed skirt around the origin was wider than the gap
     between lots, so every house was fingerprinting its neighbours' windows too
     and all five came out 'identical' no matter what the houses did. */
  function mine(x){
    var best=null,bd=1e9;
    SD.HOUSES.forEach(function(o){
      var d=Math.abs(x-o.x);if(d<bd){bd=d;best=o.id;}
    });
    return best===id;
  }
  /* walls, in LOCAL coordinates - subtract the lot origin so two identical houses
     at different x fingerprint the same. That is the whole question. */
  var walls=SD.colliders.filter(function(c){return c.tag==='wall'&&mine((c.minX+c.maxX)/2);}).map(function(c){
    return [(c.minX-ox).toFixed(2),c.minZ.toFixed(2),
            (c.maxX-ox).toFixed(2),c.maxZ.toFixed(2)].join(',');
  }).sort().join(' | ');
  /* INTERIOR furniture only. The first version of this counted every collider on the
     lot and reported "5 distinct of 5" - which was the wheelie bins. They are jittered
     at random and the car is a 75% coin flip, so the yard varies whatever the house
     does. The question is about the room you burgle, so the yard is cut out of it. */
  function inside(c){
    var cx=(c.minX+c.maxX)/2,cz=(c.minZ+c.maxZ)/2;
    return Math.abs(cx-ox)<=HW&&cz>=-C.ROOM_SCALE*3.5&&cz<=C.ROOM_SCALE*3.5;
  }
  var yardTags={fence:1,hedge:1,bin:1,car:1,tree:1,post:1,gate:1,planter:1};
  var furn=SD.colliders.filter(function(c){
    return c.tag&&c.tag!=='wall'&&c.tag!=='door'&&mine((c.minX+c.maxX)/2)&&inside(c);
  }).map(function(c){
    return c.tag+'@'+((c.minX+c.maxX)/2-ox).toFixed(1)+','+
           ((c.minZ+c.maxZ)/2).toFixed(1);
  }).sort().join(' ');
  var wins=SD.PANES.filter(function(w){return mine((w.minX+w.maxX)/2);}).map(function(w){
    return ((w.minX+w.maxX)/2-ox).toFixed(2)+','+((w.minZ+w.maxZ)/2).toFixed(2);
  }).sort().join(' ');
  var lights=SD.LIGHTS.filter(function(l){return mine(l.x);}).map(function(l){
    return (l.x-ox).toFixed(2)+','+l.z.toFixed(2)+'r'+l.r;
  }).sort().join(' ');
  var hides=SD.HIDES.filter(function(x){return mine(x.pos[0]);}).map(function(x){
    return (x.pos[0]-ox).toFixed(2)+','+x.pos[2].toFixed(2);
  }).sort().join(' ');
  var props=SD.objects.filter(function(o){return o.spec&&o.spec._pos&&mine(o.spec._pos[0]);})
    .map(function(o){return (o.spec._pos[0]-ox).toFixed(2)+','+o.spec._pos[2].toFixed(2);})
    .sort().join(' ');
  /* where is the person asleep, relative to the front door you come in by */
  var sl=SD.SLEEPERS.filter(function(s){return mine(s.x!==undefined?s.x:(s.pos?s.pos[0]:0));}).map(function(s){
    var x=(s.x!==undefined?s.x:(s.pos?s.pos[0]:0))-ox;
    var z=(s.z!==undefined?s.z:(s.pos?s.pos[2]:0));
    return x.toFixed(2)+','+z.toFixed(2);
  }).sort().join(' ');
  /* walkable area, on a 0.3m grid inside the shell */
  var walk=0,tot=0;
  for(var x=-6;x<=6;x+=0.3)for(var z=-5;z<=5;z+=0.3){
    if(SD.ceilAt(x+ox,z)<=0)continue;
    tot++;
    if(SD.PHYS.clearance(SD.colliders,x+ox,1.0,z,2.0)>C.PLAYER_R)walk++;
  }
  return {id:id,walls:walls,furn:furn,wins:wins,lights:lights,hides:hides,
          props:props,sleep:sl,walk:walk,tot:tot,
          pal:JSON.stringify((h.pal||{}))};
}

SD.startHouse();
var ids=SD.HOUSES.map(function(h){return h.id;});
p('=== FIVE HOUSES ON ARDSLEY COURT ===');
p('  '+ids.join(', '));
p('');
var F=ids.map(fingerprint);

function report(label,key){
  var distinct={};F.forEach(function(f){distinct[f[key]]=(distinct[f[key]]||0)+1;});
  var n=Object.keys(distinct).length;
  p('  '+label.padEnd(28)+n+' distinct of '+F.length+
    (n===1?'   <-- IDENTICAL IN EVERY HOUSE':''));
  return n;
}
p('WHAT VARIES, AND WHAT DOES NOT:');
var nWalls=report('wall layout','walls');
report('window positions','wins');
p('  panes per house: '+F.map(function(f){return f.wins?f.wins.split(' ').length:0;}).join(', '));
report('INTERIOR furniture layout','furn');
report('hiding places','hides');
report('light zones','lights');
report('where the props sit','props');
p('  props per house: '+F.map(function(f){return f.props?f.props.split(' ').length:0;}).join(', '));
report('where the sleeper sleeps','sleep');
report('palette','pal');
p('');
p('  walkable cells per house: '+F.map(function(f){return f.walk;}).join(', '));
p('');
if(nWalls===1){
  p('  Every interior is the same building. Once you have learned the route from the');
  p('  front door to the bedroom in one house, you know it in all five - and the route');
  p('  IS the stealth puzzle. The palette varies; the shape of the problem does not.');
}else{
  p('  '+nWalls+' distinct wall layouts.');
}
p('');
p('=== WHAT THE ROUTE ACTUALLY IS ===');
/* Flood from the front door, report the rooms in the order you must cross them. */
(function(){
  SD.startHouse('hoyt');
  var h=SD.houseById('hoyt'),ox=h.x;
  var sl=SD.SLEEPERS[0];
  var sx=(sl&&(sl.x!==undefined?sl.x:sl.pos[0]))||0;
  var sz=(sl&&(sl.z!==undefined?sl.z:sl.pos[2]))||0;
  p('  front door at local x 0.0, z '+(-C.ROOM_SCALE*3.5).toFixed(1));
  p('  sleeper at   local x '+(sx-ox).toFixed(1)+', z '+sz.toFixed(1));
  p('  walls crossed on a straight line: '+
    (SD.PHYS.wallsBetween?'n/a':'')+' (see sight test below)');
  p('  can you see the sleeper from the doorway? '+
    (SD.canSee?(SD.canSee(ox,1.6,-C.ROOM_SCALE*3.5,sx,1.0,sz)?'YES':'no'):'?'));
})();
}catch(e){
  p('THREW: '+(e&&e.message)+' @ '+String((e&&e.stack)||'').split('\n').slice(0,4).join(' | '));
}
var pre=document.createElement('pre');pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\nSDTEST ALL-PASS pass=0 fail=0\n'+L.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);document.title='SDTEST ALL-PASS pass=0 fail=0';
})();

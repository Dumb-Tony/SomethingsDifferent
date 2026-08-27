/* DIAGNOSTIC — where does a night actually GO?

   Measured on the live build: the street is 99m wide, lots are 24.8m apart, sneaking
   across takes 83 seconds, and a night is 780. So how much of a night is walking, how
   much is doing, and how much room is there actually between the houses? */
(function(){
var L=[];function p(s){L.push(s);}
try{
var SD=window.__SD,C=SD.CONST;
SD.stopLoop();SD.startHouse();

/* ── the footprints ────────────────────────────────────────────────────────*/
p('=== THE STREET ===');
var row=SD.HOUSES.slice().sort(function(a,b){return a.x-b.x;});
p('lot pitch: '+(row[1].x-row[0].x).toFixed(1)+'m   street span: '+
  (row[row.length-1].x-row[0].x).toFixed(1)+'m');

/* A house footprint = the extent of its wall colliders. */
function footprint(h){
  var minX=1e9,maxX=-1e9,minZ=1e9,maxZ=-1e9,n=0;
  for(var i=0;i<SD.colliders.length;i++){
    var c=SD.colliders[i];
    if(c.top!==undefined&&c.top<0.5)continue;
    var cx=(c.minX+c.maxX)/2;
    if(Math.abs(cx-h.x)>11)continue;          // belongs to another lot
    minX=Math.min(minX,c.minX);maxX=Math.max(maxX,c.maxX);
    minZ=Math.min(minZ,c.minZ);maxZ=Math.max(maxZ,c.maxZ);n++;
  }
  return {minX:minX,maxX:maxX,minZ:minZ,maxZ:maxZ,n:n,
          w:maxX-minX,d:maxZ-minZ};
}
var fps=row.map(footprint);
row.forEach(function(h,i){
  var f=fps[i];
  p('  '+h.name.padEnd(16)+' centre x='+h.x.toFixed(1).padStart(7)+
    '  footprint '+f.w.toFixed(1)+'m x '+f.d.toFixed(1)+'m  ('+f.n+' colliders)');
});
p('');
p('gaps between neighbouring footprints:');
for(var i=1;i<fps.length;i++){
  var gap=fps[i].minX-fps[i-1].maxX;
  p('  '+row[i-1].name+' -> '+row[i].name+': '+gap.toFixed(1)+'m');
}

/* ── how long does getting anywhere take? ──────────────────────────────────*/
p('');
p('=== TRAVEL, IN REAL SECONDS ===');
var pitch=row[1].x-row[0].x;
[['sneak',C.SNEAK_SPEED],['walk',C.WALK_SPEED],['run',C.RUN_SPEED]].forEach(function(m){
  p('  '+m[0].padEnd(6)+' one lot: '+(pitch/m[1]).toFixed(0)+'s'+
    '   whole street: '+((row[row.length-1].x-row[0].x)/m[1]).toFixed(0)+'s'+
    '   home to the far house: '+
    (Math.abs(row[row.length-1].x-SD.HOME.x)/m[1]).toFixed(0)+'s');
});
var night=SD.NIGHT_HOURS*3600/C.NIGHT_SCALE;
p('  a night is '+night.toFixed(0)+'s, so one sneaked round trip to the far house');
p('  is '+(2*Math.abs(row[row.length-1].x-SD.HOME.x)/C.SNEAK_SPEED/night*100).toFixed(0)+
  '% of the whole night, before you touch anything.');

/* ── how much HAPPENS? ─────────────────────────────────────────────────────*/
p('');
p('=== WHAT HAPPENS ON NIGHT ONE ===');
SD.startHouse();SD.nightReset();
p('  events planned: '+SD.EVENTS.length+
  '  ['+SD.EVENTS.map(function(e){return e.kind+'@'+e.at.toFixed(2)+'h';}).join(' ')+']');
p('  hardening installed: '+(SD.GAME.hardened.length?SD.GAME.hardened.join(','):'none'));
p('  dogs '+SD.DOGS.length+'   watchman '+(!!SD.WATCH)+'   light zones '+SD.LIGHTS.length);
p('  sleepers: '+SD.SLEEPERS.length+'  absent tonight: '+
  SD.SLEEPERS.filter(function(s){return s.absent;}).length);
/* how many events land in the budget at all? */
var budget=SD.NIGHT.budget||SD.NIGHT_HOURS;
p('  night budget '+budget.toFixed(2)+'h; events inside it: '+
  SD.EVENTS.filter(function(e){return e.at<budget;}).length);
var gaps=[];var last=0;
SD.EVENTS.slice().sort(function(a,b){return a.at-b.at;}).forEach(function(e){
  gaps.push(((e.at-last)*3600/C.NIGHT_SCALE).toFixed(0));last=e.at;});
gaps.push(((budget-last)*3600/C.NIGHT_SCALE).toFixed(0));
p('  real seconds between things happening: '+gaps.join('s, ')+'s');

/* ── and across ten nights? ────────────────────────────────────────────────*/
p('');
p('=== WHEN DOES THE STREET GET DANGEROUS? ===');
SD.startHouse();
for(var d=1;d<=C.SLICE_NIGHTS;d++){
  SD.GAME.day=d;
  SD.nightReset();
  p('  night '+String(d).padStart(2)+': hardened ['+
    (SD.GAME.hardened.join(',')||'-')+']  dogs '+SD.DOGS.length+
    '  watch '+(SD.WATCH?'yes':'no ')+'  events '+SD.EVENTS.length);
  /* let the street react the way a real run would */
  SD.activeResidents().forEach(function(r){r.doubt=Math.min(100,r.doubt+9);});
  SD.fireHardening();
}
}catch(e){
  p('THREW: '+(e&&e.message)+' @ '+String((e&&e.stack)||'').split('\n').slice(0,3).join(' | '));
}
var pre=document.createElement('pre');pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\nSDTEST ALL-PASS pass=0 fail=0\n'+L.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);document.title='SDTEST ALL-PASS pass=0 fail=0';
})();

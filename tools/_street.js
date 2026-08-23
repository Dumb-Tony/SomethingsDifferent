/* DIAGNOSTIC — how high can street suspicion actually go?

   CONST says `LOSE_STREET : 70` and its own comment says sloppy play peaks near 33.
   If that is true the THEY COMPARED NOTES ending can never fire, and the day screen
   has been showing a meter reading "street 0/70" for ten nights that is mechanically
   incapable of moving. Before touching the constant, measure the ceiling - the
   project's own rule is that a bar gets set from a measurement, never from a guess.

   This plays the WORST possible run on purpose: maximally wrong swaps on every
   object of every resident, every night, plus the full sightings budget and the
   camera and fence penalties. Whatever number comes out is the real ceiling. */
(function(){
var L=[];function p(s){L.push(s);}
try{
var SD=window.__SD,C=SD.CONST;
SD.stopLoop();

function ss(){return SD.streetSuspicion();}
function perRes(){
  return SD.activeResidents().map(function(r){
    return r.name+' '+(r.suspicion||0).toFixed(0);}).join('  ');
}

/* ── 1. THE CEILING FROM SWAPS ALONE ────────────────────────────────────────
   A CERTAINTY band is the losing currency: r.suspicion += K_SUSPICION*(D-ceiling)*
   (2-plaus). Drive every object of every resident to the most wrong swap the shop
   can sell, every night, and see where the mean settles. */
/* The first version of this gave the run a million dollars and swapped all eighty
   objects on the street every night. Everybody hit 100 on night one, which measures
   nothing a player can do: it is bounded by MONEY and by how much of a night one
   person can spend indoors. Re-run against the real economy - the real starting
   bank, the real prices, the fence for income - at the measured pace. */
p('LOSE_STREET = '+C.LOSE_STREET+'   (the bar the day screen advertises)');
p('residents who count: '+SD.activeResidents().length);

function sloppyRun(perNight,label){
  SD.startHouse();
  var peak=0,broke=0,done=0;
  p('');
  p('--- '+label+' ('+perNight+' objects a night, worst match the shop sells) ---');
  p('night |  mean  | worst | $ left | swaps | per-resident');
  for(var night=1;night<=C.SLICE_NIGHTS;night++){
    var did=0;
    for(var i=0;i<SD.objects.length&&did<perNight;i++){
      var o=SD.objects[i+((night*7)%13)>=SD.objects.length?i:i+((night*7)%13)];
      if(!o||!SD.RESIDENTS[o.owner])continue;
      SD.scanObject(o);
      var stock=SD.shopStock(o.id,'thrift')||[];
      if(!stock.length)continue;
      var worstRung=stock.length-1;
      if(stock[worstRung].price>SD.money()){broke++;continue;}
      SD.buyVariant(o.id,worstRung,'thrift');
      var bag=SD.invFor(o.id);
      if(!bag.length)continue;
      SD.swapWith(o,bag.length-1);
      did++;done++;
      /* fence the original - the run is not affordable otherwise (M18) */
      if(SD.HAUL.length)SD.sellItem(SD.HAUL.length-1,'thrift');
    }
    /* wages land on Friday, the way the day loop pays them */
    if(night%7===5)SD.GAME.bank+=C.WAGE-C.BILLS;
    SD.doMorning();
    var m=ss();if(m>peak)peak=m;
    var worst=Math.max.apply(null,SD.activeResidents().map(function(r){return r.suspicion||0;}));
    p(' '+String(night).padStart(4)+' | '+m.toFixed(1).padStart(6)+' | '+
      worst.toFixed(0).padStart(5)+' | '+SD.money().toFixed(0).padStart(6)+' | '+
      String(did).padStart(5)+' | '+perRes());
  }
  p('peak mean: '+peak.toFixed(1)+'   swaps made: '+done+
    '   times too poor to buy: '+broke);
  return peak;
}
var peak4=sloppyRun(4,'the measured winning pace, played badly');
var peak8=sloppyRun(8,'a much sloppier player');
var peak=Math.max(peak4,peak8);
p('');
p('PEAK MEAN FROM REALISTIC SWAPS: '+peak.toFixed(1));

/* ── 2. ...PLUS EVERY OTHER SOURCE THE GAME HAS ─────────────────────────────*/
p('');
p('now add every other suspicion source in the game, on top of that run:');
var before=ss();
/* sightings: onSeen adds to ONE resident and ends the night; SEEN_LIMIT of them
   is the most a run can survive before the `watch` ending fires instead. */
var rs=SD.activeResidents();
for(var s=0;s<C.SEEN_LIMIT;s++){
  var r=rs[s%rs.length];
  r.suspicion=Math.min(100,(r.suspicion||0)+34);
}
p('  + '+C.SEEN_LIMIT+' sightings at 34 each:      mean '+ss().toFixed(1));
/* doorbell cameras */
rs.forEach(function(r){r.suspicion=Math.min(100,(r.suspicion||0)+C.HARD_CAM_S);});
p('  + a camera hit on everybody:      mean '+ss().toFixed(1));
/* the fence window */
rs.forEach(function(r){r.suspicion=Math.min(100,(r.suspicion||0)+C.FENCE_REC_SUSP);});
p('  + a recognised item in the window: mean '+ss().toFixed(1));
var everything=ss();
p('');
p('CEILING WITH LITERALLY EVERYTHING STACKED: '+everything.toFixed(1));

/* ── 3. AND THE ABSOLUTE ALGEBRAIC MAXIMUM ──────────────────────────────────*/
rs.forEach(function(r){r.suspicion=100;});
p('every resident pinned at 100:      mean '+ss().toFixed(1)+
  '   (the arithmetic maximum - unreachable by playing)');

/* ── 4. THE VERDICT ─────────────────────────────────────────────────────────*/
p('');
p('===================================================================');
p('reachable peak from a deliberately terrible run: '+peak.toFixed(1));
p('reachable peak with every source stacked:        '+everything.toFixed(1));
p('the bar that ends the run:                       '+C.LOSE_STREET);
p(everything>=C.LOSE_STREET
  ? 'VERDICT: the street ending IS reachable. Leave the constant alone.'
  : 'VERDICT: the street ending is DEAD CONTENT at '+C.LOSE_STREET+'. It cannot fire.');
if(everything<C.LOSE_STREET){
  p('  a bar set just under the stacked ceiling would need '+
    (everything*0.9).toFixed(0)+'-'+everything.toFixed(0)+',');
  p('  but the SWAP-ONLY peak is '+peak.toFixed(1)+' - so a bar in that range fires only');
  p('  when the player has also been seen three times, which is the `watch` ending.');
}
}catch(e){
  p('THREW: '+(e&&e.message)+' @ '+String((e&&e.stack)||'').split('\n').slice(0,3).join(' | '));
}
var pre=document.createElement('pre');pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\nSDTEST ALL-PASS pass=0 fail=0\n'+L.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);document.title='SDTEST ALL-PASS pass=0 fail=0';
})();

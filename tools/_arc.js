/* DIAGNOSTIC — WHAT DOES A WHOLE RUN FEEL LIKE?

   Forty-four milestones and nobody has ever played this game from night one to the
   end. Every measurement so far has been of a moment: one night, one swap, one frame.
   A run is ten nights, and a ten-night game either has a SHAPE - early nights teach,
   late nights bite - or it is the same night ten times.

   This plays a competent run and reports the arc. The player it simulates:
     - works four objects a night, spread across houses (the measured winning pace)
     - buys the rung the forecast calls DOUBT when it can afford one
     - prints with the fabricator when it cannot
     - fences the originals, because the run is not affordable otherwise
     - takes the day actions that keep Dana calm

   What I want to see: collapse climbing toward the bar, the street hardening as it
   goes, money staying tight but survivable, and NOT running out of things to do. */
(function(){
var L=[];function p(s){L.push(s);}
try{
var SD=window.__SD,C=SD.CONST;
SD.stopLoop();
SD.startHouse();
SD.GUIDE.setOn(false);         // the rail is not the subject here

function money(){return SD.money();}
function bands(lines){
  var b={MISSED:0,DOUBT:0,CERTAINTY:0};
  lines.forEach(function(l){b[l.r.band]=(b[l.r.band]||0)+1;});
  return b;
}

/* Pick the best available way to change one object, cheapest-first:
   a shop rung the scanner forecasts as DOUBT, else a print. */
function workOne(o){
  if(!SD.RESIDENTS[o.owner])return null;
  if(!SD.CATALOG[o.id])SD.scanObject(o);
  var best=null,bestIdx=-1,bestStore=null;
  ['bulwark','thrift','antique'].forEach(function(store){
    var stock=SD.shopStock(o.id,store)||[];
    stock.forEach(function(v,i){
      if(v.price>money())return;
      var pr=SD.predict(o.id,v);
      if(!pr||pr.text!=='DOUBT')return;
      if(!best||v.price<best.price){best=v;bestIdx=i;bestStore=store;}
    });
  });
  var how='none';
  if(best){SD.buyVariant(o.id,bestIdx,bestStore);how='bought '+best.sim.toFixed(0)+'%';}
  else{
    var m=SD.fabricate(o);
    if(!m)return null;
    how='printed '+m.sim.toFixed(0)+'%';
  }
  var bag=SD.invFor(o.id);
  if(!bag.length)return null;
  SD.swapWith(o,bag.length-1);
  return how;
}

p('=== A TEN-NIGHT RUN ===');
p('');
p('night | swaps | bought/printed | MISS/DBT/CERT | collapse | street | alert | Dana | 0 hardened');
p('------+-------+----------------+---------------+----------+--------+------+------+---------');

var perNight=4,ranOut=null,howTally={bought:0,printed:0,none:0};
for(var night=1;night<=C.SLICE_NIGHTS;night++){
  SD.nightReset();
  var did=0,bought=0,printed=0;
  /* spread across houses: walk the object list from a different offset each night */
  var start=(night*13)%SD.objects.length;
  for(var k=0;k<SD.objects.length&&did<perNight;k++){
    var o=SD.objects[(start+k)%SD.objects.length];
    if(!o||!SD.RESIDENTS[o.owner])continue;
    if(SD.PENDING.some(function(q){return q.objId===o.id;}))continue;
    var how=workOne(o);
    if(!how)continue;
    if(/bought/.test(how))bought++;else printed++;
    did++;
    /* fence the original - measured at M18, the run is not affordable otherwise */
    if(SD.HAUL.length)SD.sellItem(SD.HAUL.length-1,'thrift');
  }
  if(did===0&&!ranOut)ranOut=night;
  howTally.bought+=bought;howTally.printed+=printed;

  var lines=SD.doMorning();
  var b=bands(lines);
  /* THE DAY. The first version of this skipped the afternoon entirely, so Human
     Knowledge never rose, so predict() never returned anything but '???', so the
     player never bought a single rung in ten nights and printed all 28. That is a
     pessimistic player, not a competent one - and the competent path is the one
     worth measuring first. Go out, stand near people, learn them. */
  if(night%7===5)SD.GAME.bank+=C.WAGE-C.BILLS;
  SD.startWalk();
  SD.DAYFOLK.slice(0,3).forEach(function(f){SD.talkTo(f);});
  SD.endWalk();
  SD.wifeAdd(-6);
  SD.GAME.lastHarden=SD.fireHardening();

  p(' '+String(night).padStart(4)+' | '+String(did).padStart(5)+' | '+
    (bought+' / '+printed).padStart(14)+' | '+
    (b.MISSED+' / '+b.DOUBT+' / '+b.CERTAINTY).padStart(13)+' | '+
    SD.collapseIndex().toFixed(1).padStart(8)+' | '+
    SD.streetSuspicion().toFixed(1).padStart(6)+' | '+
    (SD.streetAlert?SD.streetAlert().toFixed(0):'?').padStart(5)+' | '+
    SD.WIFE.susp.toFixed(0).padStart(4)+' | '+
    money().toFixed(0).padStart(4)+' | '+
    (SD.GAME.hardened.join(',')||'-'));

  var e=SD.checkEnding();
  if(e){p('');p('  ** RUN ENDED ON NIGHT '+night+': '+e.kind.toUpperCase()+' - '+e.title+' **');break;}
}

p('');
p('=== THE SHAPE OF IT ===');
p('  collapse at the end : '+SD.collapseIndex().toFixed(1)+' / '+C.SLICE_WIN_COLLAPSE);
p('  street suspicion    : '+SD.streetSuspicion().toFixed(1)+' / '+C.LOSE_STREET);
p('  Dana                : '+SD.WIFE.susp.toFixed(0)+' / 100');
p('  money left          : $'+money().toFixed(0));
p('  swaps bought        : '+howTally.bought);
p('  swaps printed       : '+howTally.printed);
p('  Human Knowledge     : '+SD.GAME.hk+'  (tier '+SD.hkTier()+' - predict needs 20 for a name, 50 for a band)');
p('  objects untouched   : '+SD.objects.filter(function(o){
      return SD.RESIDENTS[o.owner]&&!SD.CATALOG[o.id];}).length+
    ' of '+SD.objects.filter(function(o){return SD.RESIDENTS[o.owner];}).length);
if(ranOut)p('  RAN OUT OF THINGS TO DO on night '+ranOut);
p('  hardening installed : '+(SD.GAME.hardened.join(', ')||'none'));

/* Did it end, and how? */
SD.GAME.day=C.SLICE_NIGHTS+1;SD.GAME.over=null;
var end=SD.checkEnding();
p('  ending at the deadline: '+(end?end.kind+' - '+end.title:'none'));

p('');
p('=== PER-RESIDENT, AT THE END ===');
SD.activeResidents().forEach(function(r){
  p('  '+r.name.padEnd(15)+' doubt '+(r.doubt||0).toFixed(0).padStart(3)+
    '  susp '+(r.suspicion||0).toFixed(0).padStart(3)+
    '  cred '+r.credibility.toFixed(2)+
    (r.collapsed?'  COLLAPSED':''));
});
}catch(e){
  p('THREW: '+(e&&e.message)+' @ '+String((e&&e.stack)||'').split('\n').slice(0,4).join(' | '));
}
var pre=document.createElement('pre');pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\nSDTEST ALL-PASS pass=0 fail=0\n'+L.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);document.title='SDTEST ALL-PASS pass=0 fail=0';
})();

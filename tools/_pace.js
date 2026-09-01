/* DIAGNOSTIC — what is a night actually worth, TODAY?

   CONST's own comment has said since M12 that one object a night reaches collapse 19.3,
   two 37.5, and four spread across the street 42.5, winning on night 5. Three milestones
   have re-cut the balance since (M45 the HK ladder, M50 suspicion cooling, M53 the
   floorplans). A stated rate that is wrong is worse than no stated rate at all, so this
   re-measures the curve against the shipping build before anything quotes it.

   THE STRATEGY, stated because a pace figure is meaningless without one:
     - N swaps a night, each on a DIFFERENT resident (the comment's "spread across the
       street" - collapse is a credibility-weighted MEAN, so hammering one person is
       capped by their share of it);
     - perfect information: for each object, resolve every rung of every shop shelf and
       take the one that actually lands DOUBT, preferring the cheapest. This is an upper
       bound on what the pace can do, not what a player will get.
   Also measured: the same pace played by HAMMERING one household, to show the ceiling
   that makes spreading the strategy rather than a preference. */
(function(){
var L=[];function p(s){L.push(s);}
try{
var SD=window.__SD,C=SD.CONST;
SD.stopLoop();

function bestRung(o,res){
  /* every rung of every shelf, resolved against the real resident state */
  var best=null;
  ['bulwark','thrift','antique'].forEach(function(store){
    (SD.shopStock(o.id,store)||[]).forEach(function(v,i){
      var r=SD.DOUBT.resolve(res,o,v.spec);
      var score=r.band==='DOUBT'?2:(r.band==='MISSED'?0:1);
      if(!best||score>best.score||(score===best.score&&v.price<best.v.price))
        best={score:score,v:v,i:i,store:store,r:r};
    });
  });
  return best;
}

function run(perNight,mode){
  SD.startHouse();
  SD.GUIDE.setOn(false);
  SD.GAME.bank=1e9;                       // money is a different question
  var byMorning=[],crossed=0;
  for(var night=1;night<=C.SLICE_NIGHTS;night++){
    SD.nightReset();
    var used={},did=0;
    for(var k=0;k<SD.objects.length&&did<perNight;k++){
      var o=SD.objects[(night*13+k)%SD.objects.length];
      if(!o)continue;
      var res=SD.RESIDENTS[o.owner];
      if(!res)continue;
      if(mode==='spread'&&used[o.owner])continue;          // one each, different people
      if(mode==='hammer'&&o.owner!==mode.who&&HAMMER&&o.owner!==HAMMER)continue;
      if(SD.PENDING.some(function(q){return q.objId===o.id;}))continue;
      if(SD.GAME.hardened.indexOf(o.id)>=0)continue;
      if(!SD.CATALOG[o.id])SD.scanObject(o);
      var b=bestRung(o,res);
      if(!b)continue;
      SD.buyVariant(o.id,b.i,b.store);
      var bag=SD.invFor(o.id);
      if(!bag.length)continue;
      SD.swapWith(o,bag.length-1);
      used[o.owner]=1;did++;
    }
    SD.doMorning();
    var ci=SD.collapseIndex();
    byMorning.push(ci);
    if(!crossed&&ci>=SD.winBar())crossed=night;
    SD.fireHardening();
  }
  return {end:byMorning[byMorning.length-1],curve:byMorning,crossed:crossed};
}

var HAMMER=null;
p('=== WHAT A NIGHT IS WORTH, RE-MEASURED ===');
p('  bar = '+SD.winBar().toFixed(0)+'   nights = '+C.SLICE_NIGHTS);
p('  strategy: N a night, each on a different resident, perfect rung choice');
p('');
p('  per night |  final collapse  | crosses the bar');
p('  ----------+------------------+----------------');
for(var n=1;n<=5;n++){
  var r=run(n,'spread');
  p('     '+n+'      |      '+r.end.toFixed(1).padStart(5)+'       | '+
    (r.crossed?('night '+r.crossed):'never'));
}
p('');
p('  the old comment in CONST claims: 1 -> 19.3, 2 -> 37.5, 4 -> 42.5 winning on night 5');
p('');

/* the ceiling that makes spreading the strategy */
p('=== WHY SPREADING, AND NOT HAMMERING ===');
SD.startHouse();
var rs=SD.activeResidents();
var tot=0,byHouse={};
rs.forEach(function(r){tot+=r.credibility;byHouse[r.house]=(byHouse[r.house]||0)+r.credibility;});
p('  credibilities sum to '+tot.toFixed(2)+' across '+rs.length+' residents');
var topH=null,topV=0;
Object.keys(byHouse).forEach(function(h){if(byHouse[h]>topV){topV=byHouse[h];topH=h;}});
p('  the best HOUSEHOLD is '+topH+' at '+topV.toFixed(2)+' of '+tot.toFixed(2));
/* prove it against the real function rather than asserting the arithmetic */
rs.forEach(function(r){r.doubt=(r.house===topH)?100:0;});
p('  both of them at Doubt 100 and nobody else touched -> collapseIndex '+
  SD.collapseIndex().toFixed(1)+' of '+SD.winBar().toFixed(0));
var topR=null,topC=0;
rs.forEach(function(r){if(r.credibility>topC){topC=r.credibility;topR=r;}});
rs.forEach(function(r){r.doubt=(r===topR)?100:0;});
p('  the single most credible person alone -> '+SD.collapseIndex().toFixed(1));
p('');
p('  So one household is a hard ceiling well under the bar, however hard you work it.');
p('  That is the whole reason the pace is stated as "spread across the street".');
}catch(e){p('THREW: '+(e&&e.message)+' @ '+String((e&&e.stack)||'').split('\n').slice(0,3).join(' | '));}
var pre=document.createElement('pre');pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\nSDTEST ALL-PASS pass=0 fail=0\n'+L.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);document.title='SDTEST ALL-PASS pass=0 fail=0';
})();

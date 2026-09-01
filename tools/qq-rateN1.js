/* qq-rateN1 — ONE run of 1 swaps a night, as the FIRST and ONLY run in this page.
   Separate pages because fracture apply() permanently mutates RESIDENTS.marisol
   .attention (1.5 -> 1.9) and three sleepQuality values, and startHouse() resets
   neither - so a second run in the same page starts on a contaminated street. */
(function(){
var CAP=1;
var L=[];function p(s){L.push(s);}
try{
var SD=window.__SD,C=SD.CONST;
SD.stopLoop();
p('preset '+SD.OPT.diff+'  bar '+SD.winBar().toFixed(1)+'  marisol.attention '+SD.RESIDENTS.marisol.attention);
function buyBestDoubt(o){
  var best=null,bi=-1,bs=null;
  ['bulwark','thrift','antique'].forEach(function(store){
    (SD.shopStock(o.id,store)||[]).forEach(function(v,i){
      if(v.price>SD.money())return;
      var pr=SD.predict(o.id,v);
      if(!pr||pr.text!=='DOUBT')return;
      if(!best||v.price<best.price){best=v;bi=i;bs=store;}
    });
  });
  if(best){SD.buyVariant(o.id,bi,bs);return 1;}
  return SD.fabricate(o)?1:0;
}
SD.startHouse();SD.GUIDE.setOn(false);
var log=[],bands={MISSED:0,DOUBT:0,CERTAINTY:0};
for(var night=1;night<=C.SLICE_NIGHTS;night++){
  SD.nightReset();
  var did=0,start=(night*13)%SD.objects.length;
  for(var k=0;k<SD.objects.length&&did<CAP;k++){
    var o=SD.objects[(start+k)%SD.objects.length];
    if(!o||!SD.RESIDENTS[o.owner])continue;
    if(SD.PENDING.some(function(q){return q.objId===o.id;}))continue;
    if(!SD.CATALOG[o.id])SD.scanObject(o);
    if(!buyBestDoubt(o))continue;
    var bag=SD.invFor(o.id);if(!bag.length)continue;
    SD.swapWith(o,bag.length-1);did++;
    if(SD.HAUL.length)SD.sellItem(SD.HAUL.length-1,'thrift');
  }
  var lines=SD.doMorning();
  lines.forEach(function(l){bands[l.r.band]=(bands[l.r.band]||0)+1;});
  if(night%7===5)SD.GAME.bank+=C.WAGE-C.BILLS;
  SD.startWalk();SD.DAYFOLK.slice(0,3).forEach(function(f){SD.talkTo(f);});SD.endWalk();
  SD.wifeAdd(-6);SD.fireHardening();
  log.push({night:night,swaps:did,collapse:SD.collapseIndex(),street:SD.streetSuspicion(),
            money:SD.money(),over:SD.checkEnding()});
  if(log[log.length-1].over)break;
}
var last=log[log.length-1],cross=0;
log.forEach(function(x){if(!cross&&x.collapse>=SD.winBar())cross=x.night;});
p('CAP '+CAP+'  per-night collapse: '+log.map(function(x){return x.collapse.toFixed(1);}).join(' '));
p('CAP '+CAP+'  final '+last.collapse.toFixed(1)+'  cross '+(cross?('n'+cross):'never')+
  '  ending '+(last.over?last.over.kind:'unfinished')+'  street '+last.street.toFixed(1)+
  '  M/D/C '+bands.MISSED+'/'+bands.DOUBT+'/'+bands.CERTAINTY+
  '  swaps '+log.reduce(function(a,x){return a+x.swaps;},0)+
  '  low$'+Math.min.apply(null,log.map(function(x){return x.money;})).toFixed(0));
p('CAP '+CAP+'  stats.swapped '+SD.GAME.stats.swapped+'  stats.nightsOut '+SD.GAME.stats.nightsOut);
}catch(e){p('THREW: '+(e&&e.message)+' @ '+String((e&&e.stack)||'').split('\n').slice(0,4).join(' | '));}
var pre=document.createElement('pre');pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\nSDTEST ALL-PASS pass=0 fail=0\n'+L.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);document.title='SDTEST ALL-PASS pass=0 fail=0';
})();

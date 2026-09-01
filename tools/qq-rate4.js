/* qq-rate4 — the SPREAD strategy (one per house, skipping Ray) at N=1..5.
   This is the strategy the in-game advice will name, so these are the numbers it
   must state. */
(function(){
var L=[];function p(s){L.push(s);}
try{
var SD=window.__SD,C=SD.CONST;
SD.stopLoop();
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
function playRun(cap){
  SD.startHouse();SD.GUIDE.setOn(false);
  var log=[],bands={MISSED:0,DOUBT:0,CERTAINTY:0};
  for(var night=1;night<=C.SLICE_NIGHTS;night++){
    SD.nightReset();
    var did=0,list=[],byOwner={},ids=[];
    SD.objects.forEach(function(o){if(!SD.RESIDENTS[o.owner])return;
      if(!byOwner[o.owner]){byOwner[o.owner]=[];ids.push(o.owner);}byOwner[o.owner].push(o);});
    ids=ids.filter(function(i){return i!=='ray';});ids.sort();
    var maxLen=0;ids.forEach(function(i){maxLen=Math.max(maxLen,byOwner[i].length);});
    for(var r2=0;r2<maxLen;r2++)for(var q=0;q<ids.length;q++){
      var arr=byOwner[ids[(q+night)%ids.length]];var oo=arr[(r2+night)%arr.length];if(oo)list.push(oo);}
    for(var k2=0;k2<list.length&&did<cap;k2++){
      var o=list[k2];
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
  return {log:log,bands:bands};
}
p('=== SPREAD: one object per house per pass, Ray skipped. bar '+40+' ===');
p('   N | n1    n2    n3    n4    n5    n6    n7    n8    n9    n10  | final  cross  ending      street  M/D/C  low$');
[1,2,3,4,5].forEach(function(n){
  var R=playRun(n),last=R.log[R.log.length-1];
  var cells=[];for(var i=0;i<C.SLICE_NIGHTS;i++)cells.push(R.log[i]?R.log[i].collapse.toFixed(1).padStart(5):'    -');
  var cross=0;R.log.forEach(function(x){if(!cross&&x.collapse>=SD.winBar())cross=x.night;});
  p('   '+n+' | '+cells.join(' ')+' | '+last.collapse.toFixed(1).padStart(5)+
    '  '+(cross?('n'+cross):'never').padEnd(6)+' '+(last.over?last.over.kind:'unfinished').padEnd(11)+
    ' '+last.street.toFixed(1).padStart(5)+'  '+R.bands.MISSED+'/'+R.bands.DOUBT+'/'+R.bands.CERTAINTY+
    '  $'+Math.min.apply(null,R.log.map(function(x){return x.money;})).toFixed(0));
});
p('');
p('credibility sum over active residents = '+
  SD.activeResidents().reduce(function(a,r){return a+r.credibility;},0).toFixed(2));
SD.activeResidents().forEach(function(r){
  p('  a maxed '+r.name.split(' ')[0]+' alone is worth '+
    (100*r.credibility/SD.activeResidents().reduce(function(a,x){return a+x.credibility;},0)).toFixed(1)+
    ' of 40');
});
}catch(e){p('THREW: '+(e&&e.message)+' @ '+String((e&&e.stack)||'').split('\n').slice(0,4).join(' | '));}
var pre=document.createElement('pre');pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\nSDTEST ALL-PASS pass=0 fail=0\n'+L.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);document.title='SDTEST ALL-PASS pass=0 fail=0';
})();

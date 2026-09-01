/* qq-rate5 — the pace threshold on each DIFFICULTY preset. winBar() is scaled by
   OPT.preset().win, so any hard-coded "four a night" is only true on STANDARD. */
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
  var log=[];
  for(var night=1;night<=C.SLICE_NIGHTS;night++){
    SD.nightReset();
    var did=0,start=(night*13)%SD.objects.length;
    for(var k=0;k<SD.objects.length&&did<cap;k++){
      var o=SD.objects[(start+k)%SD.objects.length];
      if(!o||!SD.RESIDENTS[o.owner])continue;
      if(SD.PENDING.some(function(q){return q.objId===o.id;}))continue;
      if(!SD.CATALOG[o.id])SD.scanObject(o);
      if(!buyBestDoubt(o))continue;
      var bag=SD.invFor(o.id);if(!bag.length)continue;
      SD.swapWith(o,bag.length-1);did++;
      if(SD.HAUL.length)SD.sellItem(SD.HAUL.length-1,'thrift');
    }
    SD.doMorning();
    if(night%7===5)SD.GAME.bank+=C.WAGE-C.BILLS;
    SD.startWalk();SD.DAYFOLK.slice(0,3).forEach(function(f){SD.talkTo(f);});SD.endWalk();
    SD.wifeAdd(-6);SD.fireHardening();
    log.push({night:night,collapse:SD.collapseIndex(),street:SD.streetSuspicion(),
              over:SD.checkEnding()});
    if(log[log.length-1].over)break;
  }
  return log;
}
var was=SD.OPT.diff;
['gentle','standard','harsh'].forEach(function(d){
  SD.OPT.setDiff(d);
  p('=== '+d.toUpperCase()+'  bar '+SD.winBar().toFixed(1)+
    '  harden x'+SD.OPT.preset().harden+' ===');
  [2,3,4,5].forEach(function(n){
    var log=playRun(n),last=log[log.length-1];
    var cross=0;log.forEach(function(x){if(!cross&&x.collapse>=SD.winBar())cross=x.night;});
    p('   '+n+'/night -> final '+last.collapse.toFixed(1).padStart(5)+
      '  vs bar '+SD.winBar().toFixed(1)+'  '+(last.over?last.over.kind:'unfinished').padEnd(11)+
      ' cross '+(cross?('n'+cross):'never').padEnd(6)+' street '+last.street.toFixed(1));
  });
  p('');
});
SD.OPT.setDiff(was);
p('restored preset: '+SD.OPT.diff);
}catch(e){p('THREW: '+(e&&e.message)+' @ '+String((e&&e.stack)||'').split('\n').slice(0,4).join(' | '));}
var pre=document.createElement('pre');pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\nSDTEST ALL-PASS pass=0 fail=0\n'+L.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);document.title='SDTEST ALL-PASS pass=0 fail=0';
})();

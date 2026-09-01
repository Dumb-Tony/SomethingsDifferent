/* qq-rate — VERIFY THE RATE THE GAME IS ABOUT TO STATE.
   Copies m45-tests.js playRun VERBATIM except that the per-night swap cap is a
   parameter, and reports collapseIndex per night. */
(function(){
var L=[];function p(s){L.push(s);}
try{
var SD=window.__SD,C=SD.CONST;
SD.stopLoop();

function playRun(cap){
  SD.startHouse();
  SD.GUIDE.setOn(false);
  var log=[],bought=0,printed=0,bands={MISSED:0,DOUBT:0,CERTAINTY:0};
  for(var night=1;night<=C.SLICE_NIGHTS;night++){
    SD.nightReset();
    var did=0,start=(night*13)%SD.objects.length;
    for(var k=0;k<SD.objects.length&&did<cap;k++){
      var o=SD.objects[(start+k)%SD.objects.length];
      if(!o||!SD.RESIDENTS[o.owner])continue;
      if(SD.PENDING.some(function(q){return q.objId===o.id;}))continue;
      if(!SD.CATALOG[o.id])SD.scanObject(o);
      var best=null,bi=-1,bs=null;
      ['bulwark','thrift','antique'].forEach(function(store){
        (SD.shopStock(o.id,store)||[]).forEach(function(v,i){
          if(v.price>SD.money())return;
          var pr=SD.predict(o.id,v);
          if(!pr||pr.text!=='DOUBT')return;
          if(!best||v.price<best.price){best=v;bi=i;bs=store;}
        });
      });
      if(best){SD.buyVariant(o.id,bi,bs);bought++;}
      else{ if(!SD.fabricate(o))continue; printed++; }
      var bag=SD.invFor(o.id);
      if(!bag.length)continue;
      SD.swapWith(o,bag.length-1);did++;
      if(SD.HAUL.length)SD.sellItem(SD.HAUL.length-1,'thrift');
    }
    var lines=SD.doMorning();
    lines.forEach(function(l){bands[l.r.band]=(bands[l.r.band]||0)+1;});
    if(night%7===5)SD.GAME.bank+=C.WAGE-C.BILLS;
    SD.startWalk();
    SD.DAYFOLK.slice(0,3).forEach(function(f){SD.talkTo(f);});
    SD.endWalk();
    SD.wifeAdd(-6);
    SD.fireHardening();
    log.push({night:night,swaps:did,collapse:SD.collapseIndex(),
              street:SD.streetSuspicion(),money:SD.money(),
              over:SD.checkEnding()});
    if(log[log.length-1].over)break;
  }
  return {log:log,bought:bought,printed:printed,bands:bands,
          cap:cap};
}

p('=== COMPETENT PLAYER, N SWAPS A NIGHT, '+C.SLICE_NIGHTS+' NIGHTS, bar '+SD.winBar().toFixed(0)+' ===');
p('  (m45 playRun verbatim; cap parameterised. picks the cheapest rung predicted DOUBT)');
p('');
p('   N | n1    n2    n3    n4    n5    n6    n7    n8    n9    n10  | final  cross  ending      street  M/D/C');
p('  ---+---------------------------------------------------------- +-------------------------------------');
var res={};
[1,2,3,4,5].forEach(function(n){
  var R=playRun(n),last=R.log[R.log.length-1];
  var cells=[];for(var i=0;i<C.SLICE_NIGHTS;i++){
    cells.push(R.log[i]?R.log[i].collapse.toFixed(1).padStart(5):'    -');}
  var cross=0;R.log.forEach(function(x){if(!cross&&x.collapse>=SD.winBar())cross=x.night;});
  res[n]=R;
  p('   '+n+' | '+cells.join(' ')+' | '+last.collapse.toFixed(1).padStart(5)+
    '  '+(cross?('n'+cross):'never').padEnd(6)+' '+
    (last.over?last.over.kind:'unfinished').padEnd(11)+' '+
    last.street.toFixed(1).padStart(5)+'  '+
    R.bands.MISSED+'/'+R.bands.DOUBT+'/'+R.bands.CERTAINTY);
});
p('');
p('  swaps actually made per run: '+[1,2,3,4,5].map(function(n){
    return n+'->'+res[n].log.reduce(function(a,x){return a+x.swaps;},0);}).join('  '));
p('  bought/printed:              '+[1,2,3,4,5].map(function(n){
    return n+'->'+res[n].bought+'/'+res[n].printed;}).join('  '));
p('  lowest money in run:         '+[1,2,3,4,5].map(function(n){
    return n+'->$'+Math.min.apply(null,res[n].log.map(function(x){return x.money;})).toFixed(0);}).join('  '));
}catch(e){
  p('THREW: '+(e&&e.message)+' @ '+String((e&&e.stack)||'').split('\n').slice(0,4).join(' | '));
}
var pre=document.createElement('pre');pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\nSDTEST ALL-PASS pass=0 fail=0\n'+L.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);document.title='SDTEST ALL-PASS pass=0 fail=0';
})();

/* qq-rate3 — does SPREADING actually beat HAMMERING? and what does the street look like. */
(function(){
var L=[];function p(s){L.push(s);}
try{
var SD=window.__SD,C=SD.CONST;
SD.stopLoop();SD.startHouse();
p('residents (credibility / floor / band / attention / objects owned):');
Object.keys(SD.RESIDENTS).forEach(function(id){
  var r=SD.RESIDENTS[id];
  var n=SD.objects.filter(function(o){return o.owner===id;}).length;
  p('  '+r.name.padEnd(16)+' cred '+String(r.credibility).padEnd(5)+' floor '+
    String(r.noticeFloor).padEnd(4)+' band '+String(r.doubtBand).padEnd(4)+
    ' att '+String(r.attention).padEnd(5)+' owns '+n);
});
p('  owned objects total: '+SD.objects.filter(function(o){return SD.RESIDENTS[o.owner];}).length+
  ' of '+SD.objects.length);
p('');

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
function playRun(cap,mode){
  SD.startHouse();SD.GUIDE.setOn(false);
  var log=[];
  for(var night=1;night<=C.SLICE_NIGHTS;night++){
    SD.nightReset();
    var did=0,list=[];
    if(mode==='block'){
      var start=(night*13)%SD.objects.length;
      for(var k=0;k<SD.objects.length;k++)list.push(SD.objects[(start+k)%SD.objects.length]);
    }else if(mode.slice(0,6)==='hammer'){
      var who=mode.slice(7);
      SD.objects.forEach(function(o){if(o.owner===who)list.push(o);});
      // re-visit the same house's objects over and over
      var base=list.slice();for(var z=0;z<10;z++)list=list.concat(base);
    }else if(mode==='onePerHouse'){
      var byOwner={},ids=[];
      SD.objects.forEach(function(o){if(!SD.RESIDENTS[o.owner])return;
        if(!byOwner[o.owner]){byOwner[o.owner]=[];ids.push(o.owner);}byOwner[o.owner].push(o);});
      ids=ids.filter(function(i){return i!=='ray';});ids.sort();
      var maxLen=0;ids.forEach(function(i){maxLen=Math.max(maxLen,byOwner[i].length);});
      for(var r2=0;r2<maxLen;r2++)for(var q=0;q<ids.length;q++){
        var arr=byOwner[ids[(q+night)%ids.length]];var oo=arr[(r2+night)%arr.length];if(oo)list.push(oo);}
    }
    for(var k2=0;k2<list.length&&did<cap;k2++){
      var o=list[k2];
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
    log.push({night:night,swaps:did,collapse:SD.collapseIndex(),street:SD.streetSuspicion(),over:SD.checkEnding()});
    if(log[log.length-1].over)break;
  }
  var doubts=Object.keys(SD.RESIDENTS).map(function(id){
    return SD.RESIDENTS[id].name.split(' ')[0]+' '+SD.RESIDENTS[id].doubt.toFixed(0);}).join(', ');
  return {log:log,doubts:doubts};
}
function row(tag,R){
  var last=R.log[R.log.length-1];
  var cells=[];for(var i=0;i<C.SLICE_NIGHTS;i++)cells.push(R.log[i]?R.log[i].collapse.toFixed(1).padStart(5):'    -');
  p('  '+tag.padEnd(22)+cells.join(' ')+' | final '+last.collapse.toFixed(1).padStart(5)+
    '  '+(last.over?last.over.kind:'unfinished').padEnd(11)+' street '+last.street.toFixed(1).padStart(5));
  p('        doubt: '+R.doubts);
}
p('  4 a night, different target selection:');
row('block (m45)',      playRun(4,'block'));
row('one per house',    playRun(4,'onePerHouse'));
row('all on Walt',      playRun(4,'hammer:walt'));
row('all on June',      playRun(4,'hammer:june'));
row('all on Marisol',   playRun(4,'hammer:marisol'));
}catch(e){p('THREW: '+(e&&e.message)+' @ '+String((e&&e.stack)||'').split('\n').slice(0,4).join(' | '));}
var pre=document.createElement('pre');pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\nSDTEST ALL-PASS pass=0 fail=0\n'+L.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);document.title='SDTEST ALL-PASS pass=0 fail=0';
})();

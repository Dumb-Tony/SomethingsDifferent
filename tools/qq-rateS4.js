/* qq-rateS4 — clean single run: STANDARD, SPREAD order (one object per household
   per pass, Ray skipped), 4 a night. This is the strategy the advice names. */
(function(){
var CAP=4;
var L=[];function p(s){L.push(s);}
try{
var SD=window.__SD,C=SD.CONST;SD.stopLoop();
function buy(o){var b=null,bi=-1,bs=null;
  ['bulwark','thrift','antique'].forEach(function(s){(SD.shopStock(o.id,s)||[]).forEach(function(v,i){
    if(v.price>SD.money())return;var pr=SD.predict(o.id,v);if(!pr||pr.text!=='DOUBT')return;
    if(!b||v.price<b.price){b=v;bi=i;bs=s;}});});
  if(b){SD.buyVariant(o.id,bi,bs);return 1;}return SD.fabricate(o)?1:0;}
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
  for(var k=0;k<list.length&&did<CAP;k++){
    var o=list[k];
    if(SD.PENDING.some(function(q){return q.objId===o.id;}))continue;
    if(!SD.CATALOG[o.id])SD.scanObject(o);
    if(!buy(o))continue;
    var bag=SD.invFor(o.id);if(!bag.length)continue;
    SD.swapWith(o,bag.length-1);did++;
    if(SD.HAUL.length)SD.sellItem(SD.HAUL.length-1,'thrift');
  }
  var lines=SD.doMorning();
  lines.forEach(function(l){bands[l.r.band]=(bands[l.r.band]||0)+1;});
  if(night%7===5)SD.GAME.bank+=C.WAGE-C.BILLS;
  SD.startWalk();SD.DAYFOLK.slice(0,3).forEach(function(f){SD.talkTo(f);});SD.endWalk();
  SD.wifeAdd(-6);SD.fireHardening();
  log.push({collapse:SD.collapseIndex(),street:SD.streetSuspicion(),over:SD.checkEnding()});
  if(log[log.length-1].over)break;
}
var last=log[log.length-1];
p('SPREAD cap'+CAP+'  per-night: '+log.map(function(x){return x.collapse.toFixed(1);}).join(' '));
p('SPREAD cap'+CAP+'  final '+last.collapse.toFixed(1)+' vs bar '+SD.winBar().toFixed(1)+
  '  ending '+(last.over?last.over.kind:'unfinished')+'  street '+last.street.toFixed(1)+
  '  M/D/C '+bands.MISSED+'/'+bands.DOUBT+'/'+bands.CERTAINTY);
}catch(e){p('THREW: '+(e&&e.message));}
var pre=document.createElement('pre');pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\nSDTEST ALL-PASS pass=0 fail=0\n'+L.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);document.title='SDTEST ALL-PASS pass=0 fail=0';
})();

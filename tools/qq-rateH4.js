/* qq-rateH4 — clean single run: HARSH preset, block order, 4 a night. */
(function(){
var L=[];function p(s){L.push(s);}
try{
var SD=window.__SD,C=SD.CONST;SD.stopLoop();
var was=SD.OPT.diff;SD.OPT.setDiff('harsh');
p('preset '+SD.OPT.diff+'  bar '+SD.winBar().toFixed(1)+'  harden x'+SD.OPT.preset().harden);
function buy(o){var b=null,bi=-1,bs=null;
  ['bulwark','thrift','antique'].forEach(function(s){(SD.shopStock(o.id,s)||[]).forEach(function(v,i){
    if(v.price>SD.money())return;var pr=SD.predict(o.id,v);if(!pr||pr.text!=='DOUBT')return;
    if(!b||v.price<b.price){b=v;bi=i;bs=s;}});});
  if(b){SD.buyVariant(o.id,bi,bs);return 1;}return SD.fabricate(o)?1:0;}
SD.startHouse();SD.GUIDE.setOn(false);
var log=[];
for(var night=1;night<=C.SLICE_NIGHTS;night++){
  SD.nightReset();
  var did=0,start=(night*13)%SD.objects.length;
  for(var k=0;k<SD.objects.length&&did<4;k++){
    var o=SD.objects[(start+k)%SD.objects.length];
    if(!o||!SD.RESIDENTS[o.owner])continue;
    if(SD.PENDING.some(function(q){return q.objId===o.id;}))continue;
    if(!SD.CATALOG[o.id])SD.scanObject(o);
    if(!buy(o))continue;
    var bag=SD.invFor(o.id);if(!bag.length)continue;
    SD.swapWith(o,bag.length-1);did++;
    if(SD.HAUL.length)SD.sellItem(SD.HAUL.length-1,'thrift');
  }
  SD.doMorning();
  if(night%7===5)SD.GAME.bank+=C.WAGE-C.BILLS;
  SD.startWalk();SD.DAYFOLK.slice(0,3).forEach(function(f){SD.talkTo(f);});SD.endWalk();
  SD.wifeAdd(-6);SD.fireHardening();
  log.push({collapse:SD.collapseIndex(),over:SD.checkEnding(),hard:SD.GAME.hardened.length});
  if(log[log.length-1].over)break;
}
var last=log[log.length-1];
p('HARSH cap4  per-night: '+log.map(function(x){return x.collapse.toFixed(1);}).join(' '));
p('HARSH cap4  final '+last.collapse.toFixed(1)+' vs bar '+SD.winBar().toFixed(1)+
  '  ending '+(last.over?last.over.kind:'unfinished')+'  hardened '+last.hard);
SD.OPT.setDiff(was);
}catch(e){p('THREW: '+(e&&e.message));}
var pre=document.createElement('pre');pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\nSDTEST ALL-PASS pass=0 fail=0\n'+L.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);document.title='SDTEST ALL-PASS pass=0 fail=0';
})();

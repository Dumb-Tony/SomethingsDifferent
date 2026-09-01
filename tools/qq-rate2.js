/* qq-rate2 — spread vs hammer, and the rail-follower's actual score. */
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
  if(best){SD.buyVariant(o.id,bi,bs);return 'bought';}
  return SD.fabricate(o)?'printed':null;
}
function buyTopRow(o){
  var st=SD.shopStock(o.id,'bulwark')||[];
  for(var i=0;i<st.length;i++){ if(st[i].price<=SD.money()){SD.buyVariant(o.id,i,'bulwark');return 'bought';} }
  return SD.fabricate(o)?'printed':null;
}

/* order: 'block'  = m45's consecutive-from-rotating-index (what m45/_cool measure)
          'spread' = round-robin one object per RESIDENT before repeating anyone */
function playRun(cap,order,picker){
  SD.startHouse();SD.GUIDE.setOn(false);
  var log=[],bands={MISSED:0,DOUBT:0,CERTAINTY:0},ownersPerNight=[];
  for(var night=1;night<=C.SLICE_NIGHTS;night++){
    SD.nightReset();
    var did=0,touched={},list=[];
    if(order==='block'){
      var start=(night*13)%SD.objects.length;
      for(var k=0;k<SD.objects.length;k++)list.push(SD.objects[(start+k)%SD.objects.length]);
    }else{
      // one per resident, round robin, rotated by night
      var byOwner={},ids=[];
      SD.objects.forEach(function(o){ if(!SD.RESIDENTS[o.owner])return;
        if(!byOwner[o.owner]){byOwner[o.owner]=[];ids.push(o.owner);} byOwner[o.owner].push(o);});
      ids.sort();
      var maxLen=0;ids.forEach(function(id){maxLen=Math.max(maxLen,byOwner[id].length);});
      for(var r=0;r<maxLen;r++)for(var q=0;q<ids.length;q++){
        var arr=byOwner[ids[(q+night)%ids.length]];
        var o2=arr[(r+night)%arr.length];
        if(o2)list.push(o2);
      }
    }
    for(var k2=0;k2<list.length&&did<cap;k2++){
      var o=list[k2];
      if(!o||!SD.RESIDENTS[o.owner])continue;
      if(SD.PENDING.some(function(q){return q.objId===o.id;}))continue;
      if(!SD.CATALOG[o.id])SD.scanObject(o);
      if(!picker(o))continue;
      var bag=SD.invFor(o.id);
      if(!bag.length)continue;
      touched[o.owner]=1;
      SD.swapWith(o,bag.length-1);did++;
      if(SD.HAUL.length)SD.sellItem(SD.HAUL.length-1,'thrift');
    }
    ownersPerNight.push(Object.keys(touched).length);
    var lines=SD.doMorning();
    lines.forEach(function(l){bands[l.r.band]=(bands[l.r.band]||0)+1;});
    if(night%7===5)SD.GAME.bank+=C.WAGE-C.BILLS;
    SD.startWalk();SD.DAYFOLK.slice(0,3).forEach(function(f){SD.talkTo(f);});SD.endWalk();
    SD.wifeAdd(-6);SD.fireHardening();
    log.push({night:night,swaps:did,collapse:SD.collapseIndex(),
              street:SD.streetSuspicion(),over:SD.checkEnding()});
    if(log[log.length-1].over)break;
  }
  return {log:log,bands:bands,owners:ownersPerNight};
}
function row(tag,R){
  var last=R.log[R.log.length-1];
  var cross=0;R.log.forEach(function(x){if(!cross&&x.collapse>=SD.winBar())cross=x.night;});
  var cells=[];for(var i=0;i<C.SLICE_NIGHTS;i++)cells.push(R.log[i]?R.log[i].collapse.toFixed(1).padStart(5):'    -');
  p('  '+tag.padEnd(26)+cells.join(' ')+' | '+last.collapse.toFixed(1).padStart(5)+
    ' '+(cross?('n'+cross):'never').padEnd(6)+(last.over?last.over.kind:'unfinished').padEnd(11)+
    ' street '+last.street.toFixed(1).padStart(5)+
    ' M/D/C '+R.bands.MISSED+'/'+R.bands.DOUBT+'/'+R.bands.CERTAINTY+
    ' houses/night '+R.owners.join(''));
}
p('active residents: '+SD.activeResidents().map(function(r){return r.name.split(' ')[0]+'('+r.credibility+')';}).join(' '));
p('owned objects: '+SD.objects.filter(function(o){return SD.RESIDENTS[o.owner];}).length+' of '+SD.objects.length);
p('');
p('  strategy                  n1    n2    n3    n4    n5    n6    n7    n8    n9    n10  | final');
row('4/night block order',   playRun(4,'block' ,buyBestDoubt));
row('4/night SPREAD order',  playRun(4,'spread',buyBestDoubt));
row('2/night block order',   playRun(2,'block' ,buyBestDoubt));
row('2/night SPREAD order',  playRun(2,'spread',buyBestDoubt));
p('');
p('  THE RAIL FOLLOWER - top row of Bulwark, no forecast used:');
row('1/night top-row bulwark', playRun(1,'block',buyTopRow));
row('4/night top-row bulwark', playRun(4,'block',buyTopRow));
}catch(e){p('THREW: '+(e&&e.message)+' @ '+String((e&&e.stack)||'').split('\n').slice(0,4).join(' | '));}
var pre=document.createElement('pre');pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\nSDTEST ALL-PASS pass=0 fail=0\n'+L.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);document.title='SDTEST ALL-PASS pass=0 fail=0';
})();

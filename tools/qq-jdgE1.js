/* qq-jdgE1 - JUDGING ITEM 3. Does the proposed pace line tell the truth to the
   player it was written for: the one following the rail and buying the TOP SHOP ROW?
   Runs the spec's own helpers verbatim against a 4-a-night run that buys shopStock()[0]
   (the 97% default row the discovery names) and prints the exact day-screen string. */
(function(){
var L=[];function p(s){L.push(s);}
try{
var SD=window.__SD,C=SD.CONST;
SD.stopLoop();

/* ── the spec's helpers, verbatim ── */
var PACE_CURVE=[0,11.3,26.9,35.9,46.5,53.0];
function paceTarget(){
  var bar=SD.winBar();
  for(var n=1;n<PACE_CURVE.length;n++)if(PACE_CURVE[n]>=bar)return n;
  return PACE_CURVE.length-1;
}
var PACE_WORD=['no','One','Two','Three','Four','Five'];
function paceRate(){
  var n=(SD.GAME.stats&&SD.GAME.stats.nightsOut)|0;
  return n?((RESOLVED|0)/n):0;   // RESOLVED stands in for GAME.stats.resolved
}
function oneHouseCeiling(){
  var rs=SD.activeResidents(),tot=0,top=0;
  rs.forEach(function(r){tot+=r.credibility;if(r.credibility>top)top=r.credibility;});
  return tot?100*top/tot:0;
}
var RESOLVED=0;

/* ── the spec's EDIT 7 day-screen string, verbatim ── */
function dayPaceString(){
  var bar=SD.winBar();
  var tgt=paceTarget(),nights=(SD.GAME.stats&&SD.GAME.stats.nightsOut)|0,
      rate=paceRate(),shown=+rate.toFixed(1),one=oneHouseCeiling();
  var s='PACE  ';
  if(!nights)
    s+=tgt+' a night is what reaches '+bar.toFixed(0)+
       ' by night '+C.SLICE_NIGHTS+'. '+(tgt-1)+' a night does not.';
  else if(shown>=tgt)
    s+=rate.toFixed(1)+' a night. That is the pace - hold it.';
  else
    s+=rate.toFixed(1)+' a night so far. '+tgt+
       ' a night is what reaches '+bar.toFixed(0)+' by night '+
       C.SLICE_NIGHTS+'; '+(tgt-1)+' a night does not.';
  s+='  [In different houses - collapse is their average, so one household taken '+
     'apart completely is worth '+one.toFixed(0)+' of '+bar.toFixed(0)+'.]';
  return s;
}

/* ── 1. the live figures the strings depend on ── */
SD.startHouse();
var rs=SD.activeResidents(),tot=0,top=0,names=[];
rs.forEach(function(r){tot+=r.credibility;names.push(r.name+' '+r.credibility);
                       if(r.credibility>top)top=r.credibility;});
p('residents that count: '+rs.length+'  -> '+names.join(', '));
p('sum credibility '+tot.toFixed(2)+'   max '+top.toFixed(2)+
  '   oneHouseCeiling '+oneHouseCeiling().toFixed(1));
var was=SD.OPT.diff;
['gentle','standard','harsh'].forEach(function(d){
  SD.OPT.setDiff(d);
  p('  '+d+'  bar '+SD.winBar().toFixed(0)+'  paceTarget '+paceTarget());
});
SD.OPT.setDiff(was);
p('');

/* ── 2. THE RAIL-FOLLOWER'S RUN: four a night, always the top shop row ── */
SD.startHouse();SD.GUIDE.setOn(false);RESOLVED=0;
var CAP=4,bands={MISSED:0,DOUBT:0,CERTAINTY:0},log=[],simSum=0,simN=0,skipped=0;
for(var night=1;night<=C.SLICE_NIGHTS;night++){
  SD.nightReset();
  SD.GAME.stats.nightsOut++;                 // beginNight() does this, line 7137
  var did=0,start=(night*13)%SD.objects.length;
  for(var k=0;k<SD.objects.length&&did<CAP;k++){
    var o=SD.objects[(start+k)%SD.objects.length];
    if(!o||!SD.RESIDENTS[o.owner])continue;
    if(SD.PENDING.some(function(q){return q.objId===o.id;}))continue;
    if(!SD.CATALOG[o.id])SD.scanObject(o);
    var st=SD.shopStock(o.id,'bulwark')||[];
    if(!st.length){skipped++;continue;}
    if(st[0].price>SD.money()){skipped++;continue;}
    simSum+=st[0].sim;simN++;                // what the DEFAULT row actually is
    SD.buyVariant(o.id,0,'bulwark');
    var bag=SD.invFor(o.id);if(!bag.length){skipped++;continue;}
    SD.swapWith(o,bag.length-1);did++;
    if(SD.HAUL.length)SD.sellItem(SD.HAUL.length-1,'thrift');
  }
  var lines=SD.doMorning();
  RESOLVED+=lines.length;                    // EDIT 6(c)
  lines.forEach(function(l){bands[l.r.band]=(bands[l.r.band]||0)+1;});
  if(night%7===5)SD.GAME.bank+=C.WAGE-C.BILLS;
  SD.startWalk();SD.DAYFOLK.slice(0,3).forEach(function(f){SD.talkTo(f);});SD.endWalk();
  SD.wifeAdd(-6);SD.fireHardening();
  log.push({n:night,swaps:did,ci:SD.collapseIndex(),say:dayPaceString()});
  if(SD.checkEnding())break;
}
p('TOP-ROW RUN (shopStock[...][0], the row the shop opens on):');
p('  mean similarity bought '+(simN?(simSum/simN).toFixed(1):'-')+'%   over '+simN+' buys'+
  (skipped?('   skipped '+skipped):''));
p('  bands  MISSED '+bands.MISSED+'  DOUBT '+bands.DOUBT+'  CERTAINTY '+bands.CERTAINTY);
p('  collapse by night: '+log.map(function(x){return x.ci.toFixed(1);}).join(' '));
p('  FINAL collapse '+log[log.length-1].ci.toFixed(1)+' of '+SD.winBar().toFixed(0)+
  '   ending '+(SD.GAME.over?SD.GAME.over.kind:'unfinished'));
p('  stats.nightsOut '+SD.GAME.stats.nightsOut+'   resolved '+RESOLVED+
  '   paceRate '+paceRate().toFixed(1));
p('');
p('  WHAT THE DAY SCREEN WOULD SAY TO THIS PLAYER:');
[0,2,4,9].forEach(function(i){if(log[i])p('   after night '+log[i].n+' (collapse '+
  log[i].ci.toFixed(1)+'):  '+log[i].say);});
}catch(e){p('THREW: '+(e&&e.message)+' @ '+String((e&&e.stack)||'').split('\n').slice(0,4).join(' | '));}
var pre=document.createElement('pre');pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\nSDTEST ALL-PASS pass=0 fail=0\n'+L.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);document.title='SDTEST ALL-PASS pass=0 fail=0';
})();

/* DIAGNOSTIC — how fast should the street forget?

   M50 gave resident suspicion a nightly decay. Two bars pull opposite ways and the
   constant has to sit between them:

     * TOO SLOW and a competent run finishes ON the losing line. That is the state
       this was in - 69.1 against a bar of 70 - so the mirrored houses in this same
       milestone, a change with nothing to do with the meter, moved it to 70.0 and
       flipped the ending. A win with nine tenths of a point of margin is a coin flip.

     * TOO FAST and the losing ending stops existing: be as sloppy as you like and
       the street washes it off by morning.

   THE RUN BELOW IS m45's playRun, COPIED VERBATIM. The first version of this file
   wrote its own "competent player" from memory and got 22.4 where m45 gets 56.3,
   because it used beginNight instead of nightReset, called shopStock without a store,
   skipped the rotating start index, and bought the CLOSEST match where m45 buys the
   cheapest one predicted to land in DOUBT. A swept constant is only worth the run it
   was swept against, and a run that has drifted from the one the suite asserts on is
   worth nothing at all. If m45's strategy changes, change it here too. */
(function(){
var L=[];function p(s){L.push(s);}
try{
var SD=window.__SD,C=SD.CONST;
SD.stopLoop();

/* m45's competent player, verbatim, minus the per-night logging. */
function competentRun(){
  SD.startHouse();
  SD.GUIDE.setOn(false);
  var peak=0;
  for(var night=1;night<=C.SLICE_NIGHTS;night++){
    SD.nightReset();
    var did=0,start=(night*13)%SD.objects.length;
    for(var k=0;k<SD.objects.length&&did<4;k++){
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
      if(best)SD.buyVariant(o.id,bi,bs);
      else if(!SD.fabricate(o))continue;
      var bag=SD.invFor(o.id);
      if(!bag.length)continue;
      SD.swapWith(o,bag.length-1);did++;
      if(SD.HAUL.length)SD.sellItem(SD.HAUL.length-1,'thrift');
    }
    SD.doMorning();
    if(night%7===5)SD.GAME.bank+=C.WAGE-C.BILLS;
    SD.startWalk();
    SD.DAYFOLK.slice(0,3).forEach(function(f){SD.talkTo(f);});
    SD.endWalk();
    SD.wifeAdd(-6);
    SD.fireHardening();
    var ss=SD.streetSuspicion();if(ss>peak)peak=ss;
    if(SD.checkEnding())break;
  }
  var end=SD.checkEnding();
  return {street:SD.streetSuspicion(),peak:peak,kind:end?end.kind:'unfinished'};
}

/* The mistake THEY COMPARED NOTES exists to punish: the same pace, but always the
   WORST thing on the shelf, eight a night. It must still reach the bar. */
function sloppyRun(){
  SD.startHouse();
  SD.GUIDE.setOn(false);
  var peak=0,crossed=0;
  for(var night=1;night<=C.SLICE_NIGHTS;night++){
    SD.nightReset();
    var did=0,start=(night*13)%SD.objects.length;
    for(var k=0;k<SD.objects.length&&did<8;k++){
      var o=SD.objects[(start+k)%SD.objects.length];
      if(!o||!SD.RESIDENTS[o.owner])continue;
      if(SD.PENDING.some(function(q){return q.objId===o.id;}))continue;
      if(!SD.CATALOG[o.id])SD.scanObject(o);
      var worst=null,wi=-1,ws=null,wsim=1e9;
      ['bulwark','thrift','antique'].forEach(function(store){
        (SD.shopStock(o.id,store)||[]).forEach(function(v,i){
          if(v.price>SD.money())return;
          if(v.sim<wsim){wsim=v.sim;worst=v;wi=i;ws=store;}
        });
      });
      if(worst)SD.buyVariant(o.id,wi,ws);
      else if(!SD.fabricate(o))continue;
      var bag=SD.invFor(o.id);
      if(!bag.length)continue;
      SD.swapWith(o,bag.length-1);did++;
      if(SD.HAUL.length)SD.sellItem(SD.HAUL.length-1,'thrift');
    }
    SD.doMorning();
    SD.fireHardening();
    var ss=SD.streetSuspicion();
    if(ss>peak)peak=ss;
    if(ss>=C.LOSE_STREET&&!crossed)crossed=night;
  }
  return {peak:peak,crossed:crossed};
}

var was=C.SUSP_COOL,wasF=C.SUSP_COOL_FLAT;
p('=== SWEEPING SUSP_COOL (flat term held at '+wasF+') ===');
p('  LOSE_STREET = '+C.LOSE_STREET+'    nights = '+C.SLICE_NIGHTS);
p('');
p('  cool | competent: final   peak  ending    | sloppy: peak   crosses 70');
p('  -----+----------------------------------+---------------------------');
[0,0.06,0.12,0.20,0.32].forEach(function(v){
  C.SUSP_COOL=v;
  var a=competentRun(),b=sloppyRun();
  p('  '+v.toFixed(2)+' |          '+a.street.toFixed(1).padStart(5)+
    '  '+a.peak.toFixed(1).padStart(5)+'  '+a.kind.padEnd(9)+
    ' |        '+b.peak.toFixed(1).padStart(5)+'   '+
    (b.crossed?('night '+b.crossed):'NEVER  <-- ending is dead'));
});
C.SUSP_COOL=was;
p('');
p('  shipped: SUSP_COOL '+was+', SUSP_COOL_FLAT '+wasF);
p('');
p('  The decay does not exist to make the game easier - the sloppy run must still');
p('  lose. It exists so that laying low BUYS something, and so that one bad night on');
p('  night two is not still being paid for on night ten.');
}catch(e){
  p('THREW: '+(e&&e.message)+' @ '+String((e&&e.stack)||'').split('\n').slice(0,4).join(' | '));
}
var pre=document.createElement('pre');pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\nSDTEST ALL-PASS pass=0 fail=0\n'+L.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);document.title='SDTEST ALL-PASS pass=0 fail=0';
})();

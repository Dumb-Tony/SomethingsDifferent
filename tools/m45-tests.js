/* M45 — THE RUN HAS A SHAPE.

   Forty-four milestones, 1,431 assertions, and nobody had ever played this game from
   night one to the end. Every measurement had been of a MOMENT: one night, one swap,
   one frame. So the first end-to-end playthrough (tools/_arc.js) found three faults
   that no per-moment test could see, all of them compounding:

   1. THE FORECAST NEVER CAME ONLINE. predict() returns a BAND at Human Knowledge 50.
      A player who goes out every afternoon and stands with three neighbours reaches
      46 by night seven. So across an entire run the scanner never once said what a
      purchase would do - the thing the intro promises and the guide tells you to use.

   2. SO EVERY SWAP CAME OFF THE UNAIMED PRINTER, and FAB_SIM's low end sat under the
      DOUBT window for most residents: twelve CERTAINTY results in the first twenty
      swaps. Street suspicion went 3.7 -> 51.5 in a single night.

   3. AND THE STREET FINISHED HARDENING ON NIGHT THREE. Every HARDEN_AT threshold sat
      below the alert reading of night two, so all five defences installed at once and
      then nothing changed for seven nights. A ladder that finishes before the game
      does is a prologue, not an escalation.

   The run lost on night 7 to THEY COMPARED NOTES with collapse at 18.2 of 40.

   After: ten nights played, WON on night 10 at collapse 45.9, with street suspicion
   finishing at 69.1 against a bar of 70 - a photo finish on two meters at once, money
   down to $61, and twenty bought against twenty printed.

   This suite replays that arc. It is the slowest in the project and the only one that
   can see the shape of a game rather than the state of a frame. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}

try{
var SD=window.__SD,C=SD.CONST;
SD.stopLoop();

/* ── the same competent player _arc.js measures ─────────────────────────────*/
function playRun(){
  SD.startHouse();
  SD.GUIDE.setOn(false);
  var log=[],bought=0,printed=0,bands={MISSED:0,DOUBT:0,CERTAINTY:0};
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
              street:SD.streetSuspicion(),alert:SD.streetAlert(),
              hk:SD.GAME.hk,money:SD.money(),
              hardened:SD.GAME.hardened.slice(),
              over:SD.checkEnding()});
    if(log[log.length-1].over)break;
  }
  return {log:log,bought:bought,printed:printed,bands:bands};
}

var R=playRun();
var last=R.log[R.log.length-1];
R.log.forEach(function(n){
  info('n'+String(n.night).padStart(2)+'  collapse '+n.collapse.toFixed(1).padStart(5)+
       '  street '+n.street.toFixed(1).padStart(5)+'  alert '+n.alert.toFixed(0).padStart(4)+
       '  hk '+String(n.hk).padStart(3)+'  $'+n.money.toFixed(0).padStart(4)+
       '  ['+(n.hardened.join(',')||'-')+']');
});

/* ── 1. A COMPETENT RUN IS WINNABLE ─────────────────────────────────────────*/
(function(){
  ok('THE RUN GOES THE DISTANCE',R.log.length===C.SLICE_NIGHTS,
     'played '+R.log.length+' of '+C.SLICE_NIGHTS+' nights - it used to lose on 7');
  ok('...AND IT IS WON',last.over&&last.over.kind==='win',
     last.over?last.over.kind+' - '+last.over.title:'no ending');
  ok('...on collapse, past the bar',last.collapse>=C.SLICE_WIN_COLLAPSE,
     last.collapse.toFixed(1)+' / '+C.SLICE_WIN_COLLAPSE);
})();

/* ── 2. AND IT IS CLOSE ─────────────────────────────────────────────────────
   A run you win with everything still at zero is not tense. */
(function(){
  ok('THE STREET NEARLY CAUGHT YOU',last.street>C.LOSE_STREET*0.6,
     'finished at '+last.street.toFixed(1)+' against a bar of '+C.LOSE_STREET);
  ok('...and the money was tight all the way',
     R.log.some(function(n){return n.money<120;}),
     'lowest was $'+Math.min.apply(null,R.log.map(function(n){return n.money;})).toFixed(0));
  ok('...and collapse climbed rather than jumped',
     R.log[2].collapse<R.log[5].collapse&&R.log[5].collapse<last.collapse,
     R.log[2].collapse.toFixed(1)+' -> '+R.log[5].collapse.toFixed(1)+
     ' -> '+last.collapse.toFixed(1));
})();

/* ── 3. THE FORECAST COMES ONLINE WHILE THERE IS STILL A GAME LEFT ──────────*/
(function(){
  var tier2=R.log.filter(function(n){return n.hk>=20;})[0];
  ok('HUMAN KNOWLEDGE REACHES THE BAND FORECAST',!!tier2,
     tier2?('by night '+tier2.night):'never - it used to top out at 46 against a gate of 50');
  ok('...early enough to use it',tier2&&tier2.night<=C.SLICE_NIGHTS*0.5,
     tier2?('night '+tier2.night+' of '+C.SLICE_NIGHTS):'-');
  ok('...and the player actually buys things with it',R.bought>0,
     R.bought+' bought, '+R.printed+' printed - it used to be 0 and 28');
  ok('...and uses BOTH tools rather than one',
     R.bought>=5&&R.printed>=5,
     R.bought+' / '+R.printed);
})();

/* ── 4. THE PRINTER IS A FALLBACK, NOT A TRAP ───────────────────────────────*/
(function(){
  var total=R.bands.MISSED+R.bands.DOUBT+R.bands.CERTAINTY;
  info('over the whole run: '+R.bands.MISSED+' missed, '+R.bands.DOUBT+' doubt, '+
       R.bands.CERTAINTY+' certainty');
  ok('DOUBT IS THE MOST COMMON RESULT',
     R.bands.DOUBT>R.bands.CERTAINTY&&R.bands.DOUBT>R.bands.MISSED,
     R.bands.DOUBT+' of '+total);
  ok('...and CERTAINTY is not most of the run',
     R.bands.CERTAINTY/total<0.35,
     Math.round(100*R.bands.CERTAINTY/total)+'% - the old printer band gave 12 in the '+
     'first 20 swaps');
  ok('the printer still cannot reach the shops',C.FAB_SIM[1]<97,
     'ceiling '+C.FAB_SIM[1]+'%');
})();

/* ── 5. THE STREET ESCALATES ACROSS THE RUN, NOT IN THE PROLOGUE ────────────*/
(function(){
  var first=R.log[0].hardened.length,third=R.log[2].hardened.length;
  var end=last.hardened.length;
  info('installations by night: '+R.log.map(function(n){return n.hardened.length;}).join(','));
  ok('the street starts soft',first===0,first+' installed after night one');
  ok('THE LADDER IS NOT FINISHED BY NIGHT THREE',third<C.HARDEN_AT.length,
     third+' of '+C.HARDEN_AT.length+' by night 3 - it used to be all five');
  ok('...and it does finish by the end',end>=C.HARDEN_AT.length-1,
     end+' of '+C.HARDEN_AT.length+' by night '+last.night);
  ok('...arriving spread out rather than at once',
     R.log.filter(function(n,i){
       return i>0&&n.hardened.length>R.log[i-1].hardened.length;}).length>=3,
     'installed on '+R.log.filter(function(n,i){
       return i>0&&n.hardened.length>R.log[i-1].hardened.length;})
       .map(function(n){return 'n'+n.night;}).join(', '));
})();

/* ── 6. AND THERE IS STILL A STREET LEFT ────────────────────────────────────*/
(function(){
  var owned=SD.objects.filter(function(o){return SD.RESIDENTS[o.owner];});
  var untouched=owned.filter(function(o){return !SD.CATALOG[o.id];});
  ok('the run does not exhaust the street',untouched.length>owned.length*0.25,
     untouched.length+' of '+owned.length+' never touched');
  ok('...and every night had something to do',
     R.log.every(function(n){return n.swaps>0;}),
     'fewest in a night: '+Math.min.apply(null,R.log.map(function(n){return n.swaps;})));
})();

var eb=document.getElementById('err-banner');
ok('no crash banner',!eb,eb?eb.textContent.slice(0,160):'');
}catch(e){
  fail++;out.push('FAIL  threw: '+(e&&e.message)+' @ '+
    String((e&&e.stack)||'').split('\n').slice(0,3).join(' | '));
}
var summary='SDTEST '+(fail===0?'ALL-PASS':'FAILURES')+' pass='+pass+' fail='+fail;
var pre=document.createElement('pre');pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\n'+summary+'\n'+out.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);document.title=summary;
})();

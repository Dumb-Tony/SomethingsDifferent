/* M57 — CLOSE THE LOOP: THE SCORE, THE RATE, AND WHAT A WASTED NIGHT LOOKS LIKE.

   Fifty-six milestones passed every test and the game felt flat, because every test in
   this project asserts on STATE and the state was always correct. The test nobody had
   written is the only one that could have found this: PLAY THE GAME THE WAY THE GAME
   TELLS YOU TO, AND LOOK AT THE SCORE.

   Doing that turned up four things, all measured, none of which any existing suite
   could see:

   1. THE SCORE WAS NOT IN THE ROOM. collapseIndex() is a weighted mean of resident
      DOUBT, and doubt is written in exactly one place in the loop - DOUBT.commit, from
      doMorning. So it cannot move while you work, and it was on the DAY screen only.
      The player watched NOISE 0% and SEEN 0/3 all night - both honest, both pinned at
      zero for a careful approach - while the meter the run is scored on was somewhere
      they could not see until morning.

   2. THE PACE WAS NEVER STATED, AND CONST'S OWN FIGURES WERE THREE MILESTONES STALE.
      The note claimed 1/night reaches 19.3 and 4/night 42.5, winning on night 5.
      Re-measured (tools/_pace.js): 14.4 and 61.2, and 4/night crosses on night 7.
      Two a night was described as "a near miss" when two a night cannot win at all.

   3. MISSED WAS DRESSED AS A SUCCESS. showReport put class rp-miss on the "HOME BEFORE
      DAWN" header AND on every wasted swap - the same dead grey for the best outcome
      of the approach and the worst outcome of the work - and its line read "Walt walks
      past it", which in a game about not being noticed is the sentence for getting away
      with it. The gloss that says it gained you nothing fired ONCE PER RUN.

   4. AND THE PACE IS NOT THE WHOLE FIX, which is the finding this suite exists to keep
      honest. Measured in tools/_rail2.js, ten nights each, spread across residents:
          1 a night, printed (what the rail teaches)     final  4.0   never wins
          4 a night, printed (the rail teaching a pace)  final 23.3   never wins
          4 a night, best rung bought                    final 54.2   wins night 8
      The fabricator cannot aim: 40 printed copies land 19 MISSED and 13 CERTAINTY,
      while 40 chosen ones land 38 DOUBT. The game is all there - it is gated behind
      being able to AIM, and aiming is what the shop is for. That is the next milestone
      and section 6 pins the numbers so it cannot be quietly forgotten. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}

try{
var SD=window.__SD,C=SD.CONST;
SD.stopLoop();
function el(id){return document.getElementById(id);}

/* ── 1. THE SCORE IS IN THE NIGHT HUD ───────────────────────────────────────*/
(function(){
  SD.startHouse();SD.beginNight();
  SD.S.daytime=false;SD.S.evening=false;SD.S.focus=null;
  SD.updateHUD(1);
  var p=el('collapse-pill');
  ok('THE SCORE IS ON SCREEN WHILE YOU PLAY',p&&p.style.display!=='none',
     'it was on the day screen only');
  info('night pill reads: "'+p.textContent.trim()+'"');
  ok('...and it names the bar',
     p.textContent.indexOf(SD.winBar().toFixed(0))>=0,p.textContent.trim());
})();

/* ── 2. AND IT MOVES WHEN YOU DO SOMETHING ──────────────────────────────────
   The trap this whole item had to design around: collapseIndex() cannot change during
   a night, so a pill printing it alone would sit still and reproduce the open loop it
   is meant to close. */
(function(){
  SD.startHouse();SD.beginNight();SD.GAME.bank=1e9;
  SD.S.daytime=false;SD.S.evening=false;SD.S.focus=null;
  SD.updateHUD(1);
  var before=el('collapse-pill').textContent;
  var ci0=SD.collapseIndex();
  var done=0;
  for(var i=0;i<SD.objects.length&&done<3;i++){
    var o=SD.objects[i],res=SD.RESIDENTS[o.owner];
    if(!res)continue;
    SD.scanObject(o);
    if(!SD.fabricate(o))continue;
    var bag=SD.invFor(o.id);
    if(!bag.length)continue;
    SD.swapWith(o,bag.length-1);done++;
  }
  SD.updateHUD(1);
  var after=el('collapse-pill').textContent;
  info('before three swaps: "'+before.trim()+'"');
  info('after  three swaps: "'+after.trim()+'"');
  ok('three swaps were made',done===3,done+' swaps');
  ok('...and collapseIndex STILL has not moved',SD.collapseIndex()===ci0,
     'which is exactly why the pill cannot be collapseIndex alone');
  ok('THE PILL RESPONDS TO WHAT THE PLAYER DID',after!==before,
     'it shows what the ledger will be worth at dawn');
})();

/* ── 3. AND WHAT IT PROMISES IS WHAT THE MORNING DELIVERS ───────────────────
   Three shapes, because the failure modes differ. The middle one is the reason the
   forecast replays the ledger in order: DOUBT.commit writes res.stress and
   DOUBT.perceived reads stress back as an alertness multiplier, so several lines on
   ONE person cannot be resolved against a pristine copy of them. */
(function(){
  function worstRung(o){
    var best=null;
    ['bulwark','thrift','antique'].forEach(function(store){
      (SD.shopStock(o.id,store)||[]).forEach(function(v,i){
        if(!best||v.sim<best.v.sim)best={v:v,i:i,store:store};
      });
    });
    return best;
  }
  function trial(name,build){
    SD.startHouse();SD.nightReset();SD.GAME.bank=1e9;
    build();
    var fc=SD.nightForecast();
    var ciBefore=SD.collapseIndex();
    var fc2=SD.nightForecast();               // must be pure
    var pure=(fc2.ci===fc.ci)&&(SD.collapseIndex()===ciBefore);
    SD.doMorning();
    var real=SD.collapseIndex();
    info(name+': forecast '+fc.ci.toFixed(6)+'  dawn '+real.toFixed(6)+
         '  band '+fc.band+'  n='+fc.n);
    ok(name,Math.abs(fc.ci-real)<1e-9,'err '+Math.abs(fc.ci-real).toExponential(1));
    ok('...and asking did not change anything',pure,'nightForecast must not write');
  }
  trial('ONE LINE EACH ON FIVE PEOPLE',function(){
    var used={},n=0;
    for(var i=0;i<SD.objects.length&&n<5;i++){
      var o=SD.objects[i],res=SD.RESIDENTS[o.owner];
      if(!res||used[o.owner])continue;
      SD.scanObject(o);
      var w=worstRung(o);if(!w)continue;
      SD.buyVariant(o.id,w.i,w.store);
      var bag=SD.invFor(o.id);if(!bag.length)continue;
      SD.swapWith(o,bag.length-1);used[o.owner]=1;n++;
    }
  });
  trial('THREE LINES ON ONE PERSON',function(){
    SD.objects.filter(function(o){return o.owner==='walt';}).slice(0,3)
      .forEach(function(o){
        SD.scanObject(o);
        var w=worstRung(o);if(!w)return;
        SD.buyVariant(o.id,w.i,w.store);
        var bag=SD.invFor(o.id);if(!bag.length)return;
        SD.swapWith(o,bag.length-1);
      });
  });
  trial('SOMEBODY ALREADY NEAR THE CEILING',function(){
    SD.RESIDENTS.june.doubt=97;SD.RESIDENTS.june.stress=88;
    SD.objects.filter(function(o){return o.owner==='june';}).slice(0,3)
      .forEach(function(o){
        SD.scanObject(o);
        var w=worstRung(o);if(!w)return;
        SD.buyVariant(o.id,w.i,w.store);
        var bag=SD.invFor(o.id);if(!bag.length)return;
        SD.swapWith(o,bag.length-1);
      });
  });
})();

/* ── 4. IT IS NOT A DIAL YOU CAN TURN WHILE YOUR HANDS ARE ON THE OBJECT ────
   focusKey turns 8 degrees a press and applyChange coalesces every press onto the SAME
   ledger line, so a live band beside the focus panel's own similarity readout would be
   a binary search for the resident's notice floor - the number readTier deliberately
   sells at tier 2 (M46) and the number the shop exists to make you guess. */
(function(){
  SD.startHouse();SD.beginNight();
  SD.S.daytime=false;SD.S.evening=false;
  var o=SD.objects.filter(function(x){return SD.RESIDENTS[x.owner];})[0];
  SD.updateHUD(1);
  ok('the pill is up during a night',el('collapse-pill').style.display!=='none');
  SD.enterFocus(o);
  SD.updateHUD(1);
  ok('IT GOES DARK WHILE YOU ARE HOLDING SOMETHING',
     el('collapse-pill').style.display==='none',
     'a receipt for a commitment, not a dial to turn');
  SD.exitFocus();
  SD.updateHUD(1);
  ok('...and comes back when you step away',
     el('collapse-pill').style.display!=='none');
  SD.startWalk();SD.updateHUD(1);
  ok('...and stays off in daylight',el('collapse-pill').style.display==='none',
     'there is no night ledger in an afternoon');
  SD.endWalk();
})();

/* ── 5. A WASTED NIGHT NO LONGER LOOKS LIKE A SUCCESSFUL ONE ────────────────*/
(function(){
  var css=Array.prototype.map.call(document.querySelectorAll('style'),
    function(s){return s.textContent;}).join('\n');
  ok('the arrival header has its own class',/\.rp-home\{/.test(css),
     'it shared rp-miss with every wasted swap');
  ok('...and MISSED is no longer the same colour as it',
     /\.rp-miss\{border-left-color:#6b5a2e\}/.test(css),
     'warm and dimmed: a null result, not a disaster and not a win');
  ok('...and CERTAINTY is still the loudest thing on the screen',
     /\.rp-cert\{border-left-color:var\(--coral\)\}/.test(css));

  SD.startHouse();SD.nightReset();SD.GAME.bank=1e9;
  /* a swap nobody notices */
  var o=null;
  for(var i=0;i<SD.objects.length&&!o;i++){
    var c=SD.objects[i];
    if(!SD.RESIDENTS[c.owner])continue;
    SD.scanObject(c);
    var st=SD.shopStock(c.id,'antique')||[];
    if(!st.length)continue;
    var r=SD.DOUBT.resolve(SD.RESIDENTS[c.owner],c,st[0].spec);
    if(r.band!=='MISSED')continue;
    SD.buyVariant(c.id,0,'antique');
    var bag=SD.invFor(c.id);if(!bag.length)continue;
    SD.swapWith(c,bag.length-1);o=c;
  }
  ok('there is a wasted swap to report',!!o,o?o.label:'none found');
  SD.showReport('home','You are back before anyone stirs.');
  var body=el('report-body').innerHTML;
  ok('THE REPORT SAYS THE NIGHT WENT NOWHERE',/spent on nothing/.test(body),
     'it used to say only "walks past it", which reads as getting away with it');
  ok('...and the arrival header is not wearing the wasted-swap class',
     body.indexOf('rp-home')>=0,'HOME BEFORE DAWN has its own look now');
})();

/* ── 5b. AND IT SAYS SO EVERY TIME, NOT ONCE A RUN ──────────────────────────*/
(function(){
  ok('the MISSED gloss names the pace',
     /a night, in\s*$|different houses/.test(SD.BAND_GLOSS.MISSED)||
     SD.BAND_GLOSS.MISSED.indexOf('different houses')>=0,
     'so the sentence that matters arrives with the failure it explains');
  ok('...and tells you which way to move',/Aim lower/.test(SD.BAND_GLOSS.MISSED),
     'a copy has to be wrong enough to notice');
  /* the gloss gate: MISSED repeats, the other two do not */
  SD.startHouse();
  SD.GAME.glossed={MISSED:1,DOUBT:1,CERTAINTY:1};
  var src=SD.showReport.toString();
  ok('MISSED IS EXEMPT FROM THE ONCE-PER-RUN GATE',
     /r\.band===['"]MISSED['"]\|\|!GAME\.glossed/.test(src),
     'ten MISSED mornings used to share one sentence between them');
})();

/* ── 6. THE PACE IS STATED, AND THE STATED PACE IS TRUE ─────────────────────
   The failure this section exists to prevent is the one M12's numbers demonstrated:
   a figure written into a comment, believed for three milestones, and wrong. */
(function(){
  ok('there is a target pace at all',C.PACE_TARGET>=1&&C.PACE_TARGET<=8,
     C.PACE_TARGET+' a night');
  ok('...and a measured curve behind it',
     Array.isArray(C.PACE_CURVE)&&C.PACE_CURVE.length>C.PACE_TARGET,
     JSON.stringify(C.PACE_CURVE));
  ok('...and the target is a pace that actually clears the bar',
     C.PACE_CURVE[C.PACE_TARGET]>SD.winBar(),
     C.PACE_CURVE[C.PACE_TARGET]+' against a bar of '+SD.winBar().toFixed(0));
  /* The target is 4 and not 3 because 3 is a knife edge rather than a pace: it
     reaches 43.1 against a bar of 40 and does not cross until night NINE of ten,
     with perfect rung choice throughout. Two a night cannot win at all. So the
     honest claim is that the target clears the bar with room, and that the pace
     two below it is not a slower win but a loss. */
  ok('...and it clears the bar with room to be imperfect in',
     C.PACE_CURVE[C.PACE_TARGET]>SD.winBar()*1.2,
     C.PACE_CURVE[C.PACE_TARGET]+' against '+SD.winBar().toFixed(0)+
     ' - the curve is an upper bound, so the target has to leave slack');
  ok('...and two below the target cannot win at all',
     C.PACE_CURVE[C.PACE_TARGET-2]<SD.winBar(),
     C.PACE_CURVE[C.PACE_TARGET-2]+' of '+SD.winBar().toFixed(0)+
     '. '+C.PACE_CURVE[C.PACE_TARGET-1]+' at three a night does cross, but not '+
     'until night nine, which is why the number the game states is '+C.PACE_TARGET);

  /* re-measure two points of the curve rather than trusting the comment */
  function play(perNight){
    SD.startHouse();SD.GUIDE.setOn(false);SD.GAME.bank=1e9;
    for(var night=1;night<=C.SLICE_NIGHTS;night++){
      SD.nightReset();
      var used={},n=0;
      for(var k=0;k<SD.objects.length&&n<perNight;k++){
        var o=SD.objects[(night*13+k)%SD.objects.length];
        if(!o)continue;
        var res=SD.RESIDENTS[o.owner];
        if(!res||used[o.owner])continue;
        if(SD.PENDING.some(function(q){return q.objId===o.id;}))continue;
        if(SD.GAME.hardened.indexOf(o.id)>=0)continue;
        if(!SD.CATALOG[o.id])SD.scanObject(o);
        var best=null;
        ['bulwark','thrift','antique'].forEach(function(store){
          (SD.shopStock(o.id,store)||[]).forEach(function(v,i){
            var r=SD.DOUBT.resolve(res,o,v.spec);
            var sc=r.band==='DOUBT'?2:(r.band==='MISSED'?0:1);
            if(!best||sc>best.sc||(sc===best.sc&&v.price<best.price))
              best={sc:sc,i:i,store:store,price:v.price};
          });
        });
        if(!best)continue;
        SD.buyVariant(o.id,best.i,best.store);
        var bag=SD.invFor(o.id);if(!bag.length)continue;
        SD.swapWith(o,bag.length-1);used[o.owner]=1;n++;
      }
      SD.doMorning();SD.fireHardening();
    }
    return SD.collapseIndex();
  }
  var one=play(1),target=play(C.PACE_TARGET);
  info('re-measured now: 1 a night -> '+one.toFixed(1)+
       ',  '+C.PACE_TARGET+' a night -> '+target.toFixed(1)+
       '   (CONST claims '+C.PACE_CURVE[1]+' and '+C.PACE_CURVE[C.PACE_TARGET]+')');
  ok('THE CURVE IN CONST IS STILL TRUE',
     Math.abs(one-C.PACE_CURVE[1])<3&&Math.abs(target-C.PACE_CURVE[C.PACE_TARGET])<6,
     'M12 wrote 19.3 and 42.5 here and both had been wrong for three milestones');
  ok('...and one a night still cannot win',one<SD.winBar(),
     one.toFixed(1)+' of '+SD.winBar().toFixed(0)+' - which is what the rail teaches');
})();

/* ── 7. AND THE PLAYER IS TOLD, WHERE THEY ARE DECIDING ─────────────────────*/
(function(){
  SD.startHouse();SD.startDay();
  SD.GAME.day=3;
  SD.showDay();
  var body=el('day-body').innerHTML;
  ok('THE DAY SCREEN STATES THE PACE',/THE PACE/.test(body),
     'nothing in the game had ever said what a night was worth');
  ok('...and names the number',
     body.indexOf('>'+C.PACE_TARGET+'<')>=0,C.PACE_TARGET+' a night');
  ok('...and says to spread it',/different houses/.test(body),
     'collapse is a MEAN, so one household cannot win however hard it is worked');
})();

/* ── 8. THE OPEN PROBLEM, PINNED SO IT CANNOT BE FORGOTTEN ──────────────────
   Teaching the pace is NOT the whole fix, and this is the assertion that says so. If
   somebody makes the printed loop winnable, this goes red and they must come back and
   rewrite the claim above rather than quietly bank it. */
(function(){
  function printed(perNight){
    SD.startHouse();SD.GUIDE.setOn(false);SD.GAME.bank=1e9;
    for(var night=1;night<=C.SLICE_NIGHTS;night++){
      SD.nightReset();
      var used={},n=0;
      for(var k=0;k<SD.objects.length&&n<perNight;k++){
        var o=SD.objects[(night*13+k)%SD.objects.length];
        if(!o)continue;
        if(!SD.RESIDENTS[o.owner]||used[o.owner])continue;
        if(SD.PENDING.some(function(q){return q.objId===o.id;}))continue;
        if(SD.GAME.hardened.indexOf(o.id)>=0)continue;
        if(!SD.CATALOG[o.id])SD.scanObject(o);
        if(!SD.fabricate(o))continue;
        var bag=SD.invFor(o.id);if(!bag.length)continue;
        SD.swapWith(o,bag.length-1);used[o.owner]=1;n++;
      }
      SD.doMorning();SD.fireHardening();
    }
    return SD.collapseIndex();
  }
  var rail=printed(1),paced=printed(C.PACE_TARGET);
  info('printed copies only: 1 a night -> '+rail.toFixed(1)+
       ',  '+C.PACE_TARGET+' a night -> '+paced.toFixed(1)+
       '   against a bar of '+SD.winBar().toFixed(0));
  ok('FOLLOWING THE RAIL SCORES SOMETHING BY MORNING TWO',rail>0,
     rail.toFixed(1)+' after ten nights - not nothing, but not a win either');
  ok('THE FABRICATOR ALONE CANNOT WIN, EVEN AT THE RIGHT PACE',paced<SD.winBar(),
     paced.toFixed(1)+' of '+SD.winBar().toFixed(0)+'. 40 printed copies land 19 '+
     'MISSED and 13 CERTAINTY; 40 CHOSEN ones land 38 DOUBT. The game is gated behind '+
     'being able to aim, and the shop is where aiming lives - which is the next '+
     'milestone. If this assertion ever goes red, come back and rewrite it.');
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

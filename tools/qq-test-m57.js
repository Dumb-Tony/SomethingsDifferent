/* M57 — PLAY THE GAME THE WAY THE GAME TELLS YOU TO, AND CHECK THE SCORE.

   Fifty-six suites, all green, and the game is flat. Every one of them asserts on
   STATE — the doubt curve resolves correctly, the shelf sorts descending, the rail
   advances when its predicate goes true — and the state has always been right. What
   nobody ever asserted is the only thing a player experiences: FOLLOW THE GAME'S OWN
   INSTRUCTIONS FOR TEN NIGHTS AND SEE WHAT YOU SCORE.

   So this suite has no strategy. It reads GUIDE.step() — the card on screen — and
   does literally what it says, choosing whatever beaconTarget() is pointing at when
   the card refers to a place, and the row the shop lists FIRST when the card says
   buy. When the rail runs out and the card becomes "THAT IS THE LOOP / Now do it to
   the whole street", it repeats the loop the rail taught, once a night, moving down
   the street. That is the most generous reading of the instructions the game
   actually gives, and it is the run that has to be worth something.

   THE ASSERTIONS COME IN TWO HALVES ON PURPOSE.
   The SCORE half can be turned green by moving a number. The TEACHING half cannot:
   it asks whether the game told the player what a choice would do before they made
   it, whether the option the shop offers first is a good one, and whether the number
   the whole run is graded on is anywhere the player can see it while playing. Re-tune
   SHOP_LADDER until the rail scores 40 and the teaching asserts stay red — which is
   the point, because a player who cannot see the loop closing has not been taught
   anything, they have been carried. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}
function f(x,n){return (+x).toFixed(n===undefined?1:n);}

try{
var SD=window.__SD,C=SD.CONST,R=SD.RESIDENTS,D=SD.DOUBT;
SD.stopLoop();

/* CONST, line 695:
     "1 object/night reaches 19.3 (loses badly), 2/night 37.5 (a near miss),
      4/night SPREAD ACROSS THE STREET 42.5 and wins on night 5."
   The rail teaches ONE object a night: one `swap` step, one `shop` step, and a
   closing card that says do it again. 19.3 is therefore not an ambition — it is the
   number the game's own balance note says this exact cadence already reaches, and
   the floor a rail-follower has to clear before anything else is worth arguing
   about. It is deliberately BELOW the win bar: the rail is allowed to lose. It is
   not allowed to be worth half of losing. */
var RAIL_FLOOR=19.3;

/* ── THE DRIVER ───────────────────────────────────────────────────────────────
   GUIDE.step() (line 5504) is `GAME.guideDone?null:GUIDE_STEPS[GAME.guideStep||0]`,
   and GUIDE.advance() (5507) walks forward over every step whose done() predicate is
   already true. So "what does the game want" is one call, and "did it accept what I
   did" is GUIDE.tick(). beaconTarget() (8267) is the game's own answer to "which
   one" for every step that refers to a place. Nothing below picks anything the game
   did not point at, except the shop row — where it takes index 0, the row shopStock
   sorts to the top and the one a player's cursor lands on. */
function near(a,b){return Math.abs(a-b)<0.02;}
function planterAt(t){return SD.PLANTERS.filter(function(q){
  return near(q.pos[0],t.pos[0])&&near(q.pos[2],t.pos[2]);})[0];}
function doorAt(t){return SD.DOORS.filter(function(q){
  return near(q.pos[0],t.pos[0])&&near(q.pos[2],t.pos[2]);})[0];}
function objAt(t){return SD.objects.filter(function(q){
  return q.spec&&q.spec._pos&&near(q.spec._pos[0],t.pos[0])&&
         near(q.spec._pos[2],t.pos[2]);})[0];}
function bandOf(o,spec){
  return D.resolve(R[o.owner],
    {kind:o.kind,spec:o.spec,attach:o.attach,marked:o.marked,fresh:o.fresh},spec).band;}

var railLog=[],nightLog=[],forecasts=[],stalled=null;
var bands={MISSED:0,DOUBT:0,CERTAINTY:0};   // one entry per night, all ten of them

function doWhatTheCardSays(){
  var s=SD.GUIDE.step();
  if(!s)return null;
  var t=SD.beaconTarget();
  switch(s.id){
    case 'leave':if(t)SD.player.position.set(t.pos[0],0,t.pos[2]);break;
    case 'key':{var pl=t&&planterAt(t);if(pl)SD.searchPlanter(pl);break;}
    case 'in':{var d=t&&doorAt(t);if(d)SD.useDoor(d);break;}
    case 'read':SD.scanPulse();break;
    case 'scan':{var o=t&&objAt(t);if(o)SD.scanObject(o);break;}
    case 'fab':{var o2=t&&objAt(t);if(o2)SD.fabricate(o2);break;}
    case 'swap':{var o3=t&&objAt(t);
      if(o3){var it=SD.invFor(o3.id)[0];
        if(it){var b1=bandOf(o3,it.spec);
          if(bands[b1]!==undefined)bands[b1]++;
          railLog.push('night 1: '+o3.label+' <- printed '+f(it.sim)+'% -> '+b1);}
        SD.swapWith(o3,0);}break;}
    case 'out':SD.endNight('home','You are inside before the sky moves.');break;
    case 'shop':{
      /* "Buy a better one — at Bulwark Mart ... the scanner forecasts what each will
         do to its owner — you want the ones that say DOUBT." Take the card at its
         word: read the forecast, then buy the row the shop shows first. */
      var ids=Object.keys(SD.CATALOG),id=ids[ids.length-1];
      var rows=SD.shopStock(id,'bulwark');
      if(rows.length){
        var pr=SD.predict(id,rows[0])||{text:'-'};
        forecasts.push({when:'the rail\'s own shop step, day '+SD.GAME.day,
                        sim:rows[0].sim,text:pr.text});
        SD.buyVariant(id,0,'bulwark');
      }
      break;}
    case 'back':SD.beginNight();break;
    case 'fence':if(SD.HAUL.length)SD.sellItem(0,'thrift');break;
    case 'meet':{SD.startWalk();if(SD.DAYFOLK[0])SD.talkTo(SD.DAYFOLK[0]);SD.endWalk();break;}
    default:break;
  }
  SD.GUIDE.tick();
  return s.id;
}

/* ── 1. THE RAIL, FOLLOWED ────────────────────────────────────────────────── */
SD.startHouse();SD.GUIDE.setOn(true);
var wanted=SD.GUIDE_STEPS.map(function(s){return s.id;});
var taken=[],guard=0,repeat=0,prev=null;
while(guard++<200){
  var id=doWhatTheCardSays();
  if(id===null)break;
  /* a step may legitimately need several goes (three planters, one key), so only
     call it stuck after eight identical asks */
  if(id===prev){if(++repeat>8){stalled=id;break;}}else{repeat=0;taken.push(id);}
  prev=id;
}
info('the rail asked for: '+taken.join(' -> '));
ok('THE RAIL CAN BE FOLLOWED TO THE END',!stalled&&SD.GAME.guideDone,
   stalled?('stuck on step "'+stalled+'"'):('guideDone, '+taken.length+' steps'));
ok('...and it asked for every step it has',
   taken.join(',')===wanted.join(','),taken.length+' of '+wanted.length);

/* ── 2. THE MORNING OF DAY 2 ──────────────────────────────────────────────── */
var ci2=SD.collapseIndex();
info('morning of day '+SD.GAME.day+': collapse '+f(ci2,2)+' / '+f(SD.winBar(),0));
railLog.forEach(function(s){info(s);});
ok('THE FIRST NIGHT IS WORTH SOMETHING BY THE MORNING OF DAY 2',
   ci2>0&&SD.GAME.day>=2,'collapse '+f(ci2,2)+' on day '+SD.GAME.day);

/* ── 3. "THAT IS THE LOOP. NOW DO IT TO THE WHOLE STREET." ────────────────── */
SD.updateHUD(1);SD.GUIDE.render();
var closing=document.getElementById('guide-step').textContent;
info('the card now reads: "'+document.getElementById('guide-lbl').textContent+
     ' / '+closing+'"');
ok('the finished rail hands the player a repeat instruction',
   /whole street/i.test(closing),closing);

var rids=Object.keys(R).filter(function(id){
  return SD.objects.some(function(o){return o.owner===id;});});
var ri=0,mornings=[];
mornings.push('day '+SD.GAME.day+': '+f(ci2,2));
while(SD.GAME.day<=C.SLICE_NIGHTS&&guard++<400){
  if(!SD.NIGHT.running)SD.beginNight();
  var target=null;
  for(var k=0;k<rids.length&&!target;k++){
    var rid=rids[(ri+k)%rids.length];
    var mine=SD.objects.filter(function(o){return o.owner===rid&&o.spec&&o.spec._pos&&
      !SD.PENDING.some(function(pp){return pp.objId===o.id;});});
    if(mine.length){target=mine[0];ri=(ri+k+1)%rids.length;}
  }
  if(!target)break;
  SD.player.position.set(target.spec._pos[0],0,target.spec._pos[2]);
  SD.scanPulse();
  if(!SD.CATALOG[target.id])SD.scanObject(target);
  var rows=SD.shopStock(target.id,'bulwark'),how='',bought=null;
  if(rows.length){
    var pr=SD.predict(target.id,rows[0])||{text:'-'};
    forecasts.push({when:'night '+SD.GAME.day,sim:rows[0].sim,text:pr.text});
    bought=SD.buyVariant(target.id,0,'bulwark');
  }
  if(!rows.length||bought==='poor'||bought==='already'||bought===null){
    var pit=SD.fabricate(target);how=pit?('printed '+f(pit.sim)+'%'):'nothing';
  }else how='bought the top row, '+f(rows[0].sim)+'%';
  var inv=SD.invFor(target.id)[0];
  var band=inv?bandOf(target,inv.spec):'-';
  if(bands[band]!==undefined)bands[band]++;
  nightLog.push('night '+SD.GAME.day+': '+target.label+' ('+target.owner+') '+
                how+' -> '+band);
  SD.swapWith(target,0);
  SD.endNight('home','You are inside before the sky moves.');
  mornings.push('day '+SD.GAME.day+': '+f(SD.collapseIndex(),2));
  if(SD.HAUL.length)SD.sellItem(0,'antique');
  SD.startWalk();if(SD.DAYFOLK[0])SD.talkTo(SD.DAYFOLK[0]);SD.endWalk();
}
nightLog.forEach(function(s){info(s);});
info('collapse by morning: '+mornings.join('  '));

var ci10=SD.collapseIndex();
ok('the run reached the deadline',SD.GAME.day>C.SLICE_NIGHTS,'day '+SD.GAME.day);
ok('FOLLOWING THE GAME REACHES WHAT CONST SAYS ONE OBJECT A NIGHT REACHES',
   ci10>=RAIL_FLOOR,
   'collapse '+f(ci10,2)+' of '+f(SD.winBar(),0)+', against CONST\'s own '+RAIL_FLOOR+
   ' for this exact cadence');
var nights=bands.MISSED+bands.DOUBT+bands.CERTAINTY;
ok('...and MOST OF THOSE NIGHTS READ DOUBT, which is the band the game asks for',
   bands.DOUBT*2>nights,'DOUBT '+bands.DOUBT+'  MISSED '+bands.MISSED+
   '  CERTAINTY '+bands.CERTAINTY+' over '+nights+' nights');
info('ending: '+(SD.GAME.over?SD.GAME.over.kind+' - "'+SD.GAME.over.title+'"':'none'));
info('per-resident doubt: '+SD.activeResidents().map(function(r){
   return r.name.split(' ')[0]+'='+f(r.doubt,1);}).join(', '));

/* ── 4. THE TEACHING. None of this goes green by moving a number. ─────────── */
info('forecasts the scanner gave at the moment of buying:');
forecasts.forEach(function(q){info('  '+q.when+': '+f(q.sim)+'% row, forecast "'+q.text+'"');});
var legible=forecasts.filter(function(q){return /^(MISSED|DOUBT|CERTAINTY)$/.test(q.text);});
info('the forecast first became a BAND on purchase '+
     (legible.length?(forecasts.indexOf(legible[0])+1):'-')+' of '+forecasts.length+
     ' — and from there on it read "'+legible.map(function(q){return q.text;}).join('/')+
     '" on the row the shop lists first, which the rail never tells you to move off');
var railBuy=forecasts[0];
ok('THE GAME TELLS YOU WHAT A PURCHASE WILL DO, ON THE NIGHT IT TELLS YOU TO BUY',
   !!railBuy&&/^(MISSED|DOUBT|CERTAINTY)$/.test(railBuy.text),
   railBuy?('the rail says "you want the ones that say DOUBT" and the shelf said "'+
            railBuy.text+'"'):'no purchase was ever made');

/* the row the shop puts first, resolved against every owner on the street */
SD.startHouse();
var owned=SD.objects.filter(function(o){return o.owner&&R[o.owner]&&o.spec&&o.spec._pos;});
owned.forEach(function(o){SD.scanObject(o);});
var row0={MISSED:0,DOUBT:0,CERTAINTY:0};
owned.forEach(function(o){
  var rws=SD.shopStock(o.id,'bulwark');
  if(rws.length)row0[bandOf(o,rws[0].spec)]++;});
info('the row Bulwark shows FIRST, over all '+owned.length+' possessions on the street: '+
     'MISSED '+row0.MISSED+'  DOUBT '+row0.DOUBT+'  CERTAINTY '+row0.CERTAINTY);
ok('THE OPTION THE SHOP OFFERS FIRST IS NOT THE ONE THAT DOES NOTHING',
   row0.DOUBT>=row0.MISSED,
   'DOUBT '+row0.DOUBT+' vs MISSED '+row0.MISSED+' of '+owned.length);

/* the number the run is graded on, where the player is standing when it matters */
SD.startHouse();SD.beginNight();SD.updateHUD(1);
var hudTxt=document.getElementById('hud').textContent;
info('night HUD: "'+hudTxt.replace(/\s+/g,' ').trim()+'"');
ok('THE NUMBER THE RUN IS SCORED ON IS IN THE NIGHT HUD',
   /collapse/i.test(hudTxt),'no COLLAPSE pill; the night shows clock, noise, seen, mode');
var probe=owned[0];
SD.scanObject(probe);SD.fabricate(probe);SD.swapWith(probe,0);
SD.endNight('home','You are inside before the sky moves.');
var rep=document.getElementById('report-body').textContent;
info('report ends: "'+rep.slice(-110).replace(/\s+/g,' ').trim()+'"');
ok('...AND ON THE MORNING REPORT, WHICH IS WHERE THE NIGHT IS PRICED',
   /collapse/i.test(rep),
   'the report prices the night in doubt points and never in the score');

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

/* M39 — THE LOOP CLOSES BEFORE DAWN.

   MEASURED on the live M38 build, which is what prompted this: buying anything
   requires a prior scan (shop stock for an unscanned object is empty), and the shops
   are a DAYTIME action. So the loop was

       night 1  scan the mug
       day 2    drive to a shop, buy a near-match
       night 2  swap it
       morning 3 find out whether Walt noticed

   Two full cycles and about twenty-six minutes of night between touching an object
   and learning whether anybody noticed — in a game whose entire subject is whether
   anybody noticed. On night one you could not play the game at all; you could only
   take inventory. That is the thing that made it not feel like a game.

   The fabricator closes it. Scan, print a rough match, swap it tonight.

   AND IT MUST NOT UNDO M33. That milestone removed a key which handed you three
   matched variants (97/92/80%) instantly and free, and made money, the three shops,
   the stock roll and the whole fence economy optional. The difference is the whole
   design, so this suite asserts it: ONE copy, a similarity you do not choose, paid
   for in noise, once per object per night, and worse than what a shop sells. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}

try{
var SD=window.__SD,C=SD.CONST;
SD.stopLoop();
function heard(){
  var t=0;for(var i=0;i<SD.SLEEPERS.length;i++)t+=SD.SLEEPERS[i].noise||0;return t;
}
function nearSleeper(){
  var best=null,bd=1e9;
  for(var i=0;i<SD.objects.length;i++){
    var o=SD.objects[i];if(!o.spec||!o.spec._pos)continue;
    for(var j=0;j<SD.SLEEPERS.length;j++){
      var s=SD.SLEEPERS[j];s.absent=false;
      var d=Math.hypot(o.spec._pos[0]-s.x,o.spec._pos[2]-s.z);
      if(d<bd){bd=d;best=o;}
    }
  }
  return best;
}

/* ── 1. A WHOLE SWAP, ON NIGHT ONE, WITH NO SHOP ────────────────────────────
   The headline. Nothing here touches money, the day, or a store. */
(function(){
  SD.startHouse();SD.nightReset();
  ok('it is night one',SD.GAME.day===1&&SD.NIGHT.running,'day '+SD.GAME.day);
  ok('...and you have not been to a shop',!SD.GAME.everBought);
  var o=SD.objects[0];
  ok('the bag is empty',SD.INV.length===0);

  ok('you cannot print what you have not recorded',
     SD.fabricate(o)===null&&SD.INV.length===0,'the recon gate still holds');

  SD.scanObject(o);
  var made=SD.fabricate(o);
  ok('SCANNING THEN PRINTING PUTS A COPY IN THE BAG',
     !!made&&SD.INV.length===1,SD.INV.length+' in the bag');
  ok('...and it is a copy OF THAT OBJECT',made&&made.forId===o.id);

  var bag=SD.invFor(o.id);
  var swapped=SD.swapWith(o,bag.length-1);
  ok('AND YOU CAN SWAP IT IN, THE SAME NIGHT',!!swapped&&SD.PENDING.length===1,
     SD.PENDING.length+' change pending');

  SD.endNight('home','Back before anyone stirs.');
  ok('...and the morning resolves it',SD.GAME.day===2,'day '+SD.GAME.day);
  info('scan -> print -> swap -> report, inside one night. It used to take two.');
  ok('...all without spending a penny',SD.money()===140,'$'+SD.money());
})();

/* ── 2. IT CANNOT AIM, WHICH IS WHY THE SHOPS SURVIVE ───────────────────────*/
(function(){
  SD.startHouse();
  var sims=[],lo=C.FAB_SIM[0],hi=C.FAB_SIM[1];
  /* One print per object per night, so sample across many objects. */
  for(var i=0;i<SD.objects.length&&sims.length<40;i++){
    var o=SD.objects[i];
    SD.scanObject(o);
    var m=SD.fabricate(o);
    if(m)sims.push(m.sim);
  }
  var min=Math.min.apply(null,sims),max=Math.max.apply(null,sims);
  var mean=sims.reduce(function(a,b){return a+b;},0)/sims.length;
  info(sims.length+' prints: min '+min.toFixed(1)+'  mean '+mean.toFixed(1)+
       '  max '+max.toFixed(1)+'   (band '+lo+'-'+hi+')');
  ok('the fabricator lands inside its stated band',min>=lo-2&&max<=hi+2,
     min.toFixed(1)+'..'+max.toFixed(1));
  ok('IT DOES NOT LAND ON THE SAME NUMBER TWICE',max-min>5,
     'spread of '+(max-min).toFixed(1)+' points - you do not choose what you get');
  ok('...and it never prints a perfect match',max<99,
     'best print '+max.toFixed(1)+'%');
})();

/* ── 3. ...AND THE SHOPS ARE STILL STRICTLY BETTER ──────────────────────────
   The economic claim. If a shop cannot beat the printer, money is pointless. */
(function(){
  SD.startHouse();
  SD.GAME.bank=100000;SD.GAME.hk=99;
  var o=SD.objects.filter(function(x){return x.owner==='walt';})[0];
  SD.scanObject(o);
  var printed=SD.fabricate(o).sim;
  var stock=SD.shopStock(o.id,'bulwark')||[];
  var best=Math.max.apply(null,stock.map(function(s){return s.sim;}));
  var rungs=stock.map(function(s){return s.sim.toFixed(0);}).join('/');
  info('printed '+printed.toFixed(1)+'%   shop rungs '+rungs);
  ok('A SHOP SELLS A CLOSER MATCH THAN THE PRINTER CAN MAKE',best>C.FAB_SIM[1],
     'best rung '+best.toFixed(1)+'% vs the printer ceiling of '+C.FAB_SIM[1]+'%');
  ok('...and you get to CHOOSE the rung',stock.length>2,
     stock.length+' to pick from, against one you are handed');
  ok('...which is what the forecast is for',
     !!SD.predict(o.id,stock[0]),'predict() reads a chosen variant');
})();

/* ── 4. IT IS PAID FOR IN NOISE, AND IT CANNOT BE REROLLED ──────────────────*/
(function(){
  SD.startHouse();SD.nightReset();
  var o=nearSleeper();
  SD.scanObject(o);
  var base=heard();
  SD.fabricate(o);
  var cost=heard()-base;
  ok('PRINTING IS HEARD',cost>0,'+'+cost.toFixed(2)+' sleeper noise');

  SD.startHouse();SD.nightReset();
  o=nearSleeper();
  base=heard();
  SD.scanObject(o);
  var scanCost=heard()-base;
  base=heard();
  SD.fabricate(o);
  var fabCost=heard()-base;
  ok('...and it is much louder than simply looking at the thing',
     fabCost>scanCost*2,
     'print '+fabCost.toFixed(2)+' vs scan '+scanCost.toFixed(2)+
     ' (N_SCAN '+C.N_SCAN+' -> FAB_NOISE '+C.FAB_NOISE+')');

  /* No rerolling until you like the number. */
  SD.startHouse();
  o=SD.objects[0];SD.scanObject(o);
  var first=SD.fabricate(o);
  var second=SD.fabricate(o);
  ok('ONE PRINT PER OBJECT PER NIGHT',!!first&&second===null&&SD.INV.length===1,
     'the second attempt was refused');
  SD.GAME.day++;
  var nextNight=SD.fabricate(o);
  ok('...and the printer works again tomorrow',!!nextNight,'a new night, a new print');
})();

/* ── 5. M33 IS NOT UNDONE ───────────────────────────────────────────────────
   The key that came back is not the key that went away. */
(function(){
  SD.startHouse();
  var o=SD.objects[0];
  SD.scanObject(o);
  SD.INV.length=0;
  SD.enterFocus(o);
  window.dispatchEvent(new KeyboardEvent('keydown',{key:'r',bubbles:true}));
  ok('R DOES NOT HAND YOU THREE MATCHED VARIANTS',SD.INV.length===1,
     SD.INV.length+' copy, not the 97/92/80 set M33 removed');
  SD.exitFocus();

  ok('...and requisition() is gone entirely',SD.requisition===undefined,
     'superseded rather than left lying about');

  /* And the guide step it used to satisfy for free is still honest. */
  SD.startHouse();
  var shop=SD.GUIDE_STEPS.filter(function(s){return s.id==='shop';})[0];
  SD.scanObject(SD.objects[0]);SD.fabricate(SD.objects[0]);
  ok('PRINTING DOES NOT SATISFY THE "GO TO A SHOP" STEP',!shop.done(),
     'it asks whether you BOUGHT something, not whether the bag has anything in it');
  SD.GAME.bank=5000;SD.GAME.hk=60;
  SD.buyVariant(SD.objects[0].id,0,'bulwark');
  ok('...buying does',shop.done());
})();

/* ── 6. THE RAIL TEACHES THE LOOP THAT EXISTS ───────────────────────────────*/
(function(){
  var ids=SD.GUIDE_STEPS.map(function(s){return s.id;});
  info('the chain: '+ids.join(' > '));
  ok('THE RAIL TEACHES PRINTING',ids.indexOf('fab')>=0);
  ok('...before it teaches shopping',ids.indexOf('fab')<ids.indexOf('shop'));
  ok('...AND THE FIRST NIGHT NOW REACHES A SWAP',
     ids.indexOf('swap')<ids.indexOf('shop'),
     'swap at '+ids.indexOf('swap')+', shop at '+ids.indexOf('shop')+
     ' - the shop used to come first, which cost the player a whole night');
  ok('...and the morning report comes before the shops too',
     ids.indexOf('out')<ids.indexOf('shop'));
  ok('every step still has text and a predicate',
     SD.GUIDE_STEPS.every(function(s){
       return s.id&&s.t&&s.why&&typeof s.done==='function';}));
})();

/* ── 7. THE RUN LEDGER COUNTS IT ────────────────────────────────────────────*/
(function(){
  SD.startHouse();
  ok('a new run has printed nothing',SD.GAME.stats.fabbed===0);
  SD.scanObject(SD.objects[0]);SD.fabricate(SD.objects[0]);
  ok('printing is counted',SD.GAME.stats.fabbed===1);
  SD.GAME.over={kind:'win',title:'X',text:'Y',ci:45,ss:0};
  SD.showEnding();
  ok('...and the ending screen says so',
     /Copies printed/.test(document.getElementById('end-body').textContent));
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

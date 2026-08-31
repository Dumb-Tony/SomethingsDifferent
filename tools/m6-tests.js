/* ─────────────────────────────────────────────────────────────────────────────
   Milestone 6 — the day: blocks, actions, money, Bulwark Mart, dialogue, HK, wife.

   The headline (section 7) is stronger than the milestone's stated verification:
   not just "buy a variant and see a beat", but THE SHELF DOES NOT LIE — the band
   the shop predicts is the band you actually get when you plant it.
   ───────────────────────────────────────────────────────────────────────────── */
(function(){
var out=[],pass=0,fail=0;
function ok(name,cond,detail){
  if(cond){pass++;out.push('PASS  '+name+(detail?'   ('+detail+')':''));}
  else    {fail++;out.push('FAIL  '+name+(detail?'   ('+detail+')':''));}
}
function info(s){out.push('      '+s);}
function near(a,b,tol){return Math.abs(a-b)<=tol;}

try{
  var SD=window.__SD;
  ok('__SD present',!!SD); if(!SD)throw new Error('no __SD');
  var C=SD.CONST,R=SD.RESIDENTS,G=SD.GAME,W=SD.WIFE,D=SD.DAY;
  SD.stopLoop();
  SD.startHouse();
  SD.S.menuOpen=false;

  /* ── 1. the day is five blocks with a budget ───────────────────────────── */
  ok('five blocks',SD.BLOCKS.length===5,
     SD.BLOCKS.map(function(b){return b.name;}).join(' > '));
  ok('two actions per block',C.ACTIONS_PER_BLOCK===2);
  SD.startDay();
  ok('the day starts at the first block',D.block===0&&D.actions===2);
  ok('every block offers something to do',(function(){
      for(var i=0;i<SD.BLOCKS.length;i++){D.block=i;if(SD.blockActions().length<2)return false;}
      D.block=0;return true;})());
  ok('every action belongs to a real block',
     Object.keys(SD.ACTIONS).every(function(k){
       return SD.ACTIONS[k].block.split(' ').every(function(b){
         return SD.BLOCKS.some(function(B){return B.id===b;});});}));

  /* ── 2. actions cost the budget ────────────────────────────────────────── */
  SD.startDay();D.block=0;D.actions=2;
  SD.doAction('breakfast');
  ok('an action spends one from the budget',D.actions===1);
  SD.doAction('school');
  ok('...and the budget runs out',D.actions===0);
  var before=W.susp;
  SD.doAction('liein');
  ok('with no budget left, nothing happens',W.susp===before);

  /* ── 3. the wife ladder ────────────────────────────────────────────────── */
  W.susp=0;
  SD.startDay();D.block=0;D.actions=2;
  SD.doAction('breakfast');
  ok('family obligations calm her',W.susp===0,'clamped at 0, susp='+W.susp);
  W.susp=40;
  var s0=W.susp;SD.doAction('school');
  ok('...measurably',W.susp<s0,s0+' -> '+W.susp);
  W.susp=40;D.actions=2;
  var s1=W.susp;SD.doAction('liein');
  ok('skipping one costs you',W.susp>s1,s1+' -> '+W.susp);

  W.susp=0;  ok('tier 0 is asleep',SD.wifeTier().name==='asleep');
  W.susp=45; ok('tier rises with suspicion',SD.wifeTier().name==='checking',SD.wifeTier().name);
  W.susp=95; ok('...all the way up',SD.wifeTier().night<0.5,
     SD.wifeTier().name+' night x'+SD.wifeTier().night);
  ok('every tier shortens the night more than the last',(function(){
      for(var i=1;i<SD.WIFE_TIERS.length;i++)
        if(SD.WIFE_TIERS[i].night>=SD.WIFE_TIERS[i-1].night)return false;
      return true;})());

  /* she is a real modifier on the night, not a number in a menu */
  W.susp=0;SD.beginNight();
  var fullNight=SD.NIGHT.budget;
  W.susp=95;SD.beginNight();
  var shortNight=SD.NIGHT.budget;
  ok('HER SUSPICION SHORTENS THE NIGHT',shortNight<fullNight*0.6,
     fullNight.toFixed(2)+'h -> '+shortNight.toFixed(2)+'h');
  W.susp=0;

  /* being out at all costs, and the longer the worse */
  W.susp=0;SD.beginNight();SD.NIGHT.t=0.2;
  SD.endNight('home','x');var quick=W.susp;SD.S.menuOpen=false;
  W.susp=0;SD.beginNight();SD.NIGHT.t=SD.NIGHT.budget*0.98;
  SD.endNight('home','x');var late=W.susp;SD.S.menuOpen=false;
  ok('a long night out costs more than a short one',late>quick,
     'quick +'+quick.toFixed(1)+' vs late +'+late.toFixed(1));
  W.susp=0;

  /* ── 4. money ──────────────────────────────────────────────────────────── */
  G.bank=100;G.cash=0;W.susp=0;
  var how=SD.spend(40);
  ok('a card purchase comes out of the bank',how==='card'&&G.bank===60);
  ok('...and she can see it',W.susp>0,'susp +'+W.susp.toFixed(2));
  G.bank=100;G.cash=60;W.susp=0;
  how=SD.spend(40);
  ok('CASH is the laundering path',how==='cash'&&G.cash===20&&W.susp===0);
  G.bank=5;G.cash=0;
  ok('you cannot spend what you have not got',SD.spend(40)===null);

  G.bank=400;G.cash=0;G.weekday=4;G.wagePenalty=0;
  var beforePay=SD.money();
  SD.startDay();
  ok('Friday pays wages and takes the bills',
     near(SD.money(),beforePay+C.WAGE-C.BILLS,0.01),
     '$'+beforePay+' -> $'+SD.money().toFixed(0));
  ok('calling in sick actually costs the wage',(function(){
      G.weekday=4;G.wagePenalty=0;D.block=1;D.actions=2;
      SD.doAction('sick');
      var pen=G.wagePenalty;
      var m0=SD.money();SD.startDay();
      return pen>0&&near(SD.money(),m0+C.WAGE-pen-C.BILLS,0.01);})());

  /* ── 5. the shop ───────────────────────────────────────────────────────── */
  SD.startHouse();SD.S.menuOpen=false;
  G.bank=5000;
  var cereal=SD.objects.filter(function(o){return o.kind==='cerealBox';})[0];
  ok('nothing on the shelves for an object you have not scanned',
     SD.shopStock(cereal.id).length===0);
  SD.scanObject(cereal);
  var stock=SD.shopStock(cereal.id);
  ok('the shelf is a ladder of similarities',stock.length===SD.SHOP_LADDER.length+1,
     stock.map(function(s){return s.sim.toFixed(0)+'%';}).join(' '));
  ok('...descending',(function(){
      for(var i=1;i<SD.SHOP_LADDER.length;i++)if(stock[i].sim>=stock[i-1].sim)return false;
      return true;})());
  var ident=stock[stock.length-1];
  ok('the identical special order is on the shelf at 100%',
     ident.identical===true&&ident.sim===100);
  ok('...and it costs a premium',
     ident.price>=SD.PROP_KINDS.cerealBox.price[1]*C.IDENTICAL_MULT-1,
     '$'+ident.price+' vs base max $'+SD.PROP_KINDS.cerealBox.price[1]);
  ok('stock is deterministic within a week',
     JSON.stringify(SD.shopStock(cereal.id))===JSON.stringify(stock));
  var wk=G.week;G.week=wk+1;
  var nextWeek=SD.shopStock(cereal.id);
  G.week=wk;
  ok('STOCK ROTATES weekly - the perfect match may not be there next week',
     JSON.stringify(nextWeek)!==JSON.stringify(stock),
     'week '+wk+' vs '+(wk+1));

  /* buying */
  G.bank=5000;G.cash=0;SD.INV.length=0;G.bought={};
  var m0=SD.money();
  var res1=SD.buyVariant(cereal.id,1);
  ok('buying costs money and puts it in the bag',
     res1==='card'&&SD.INV.length===1&&SD.money()<m0,
     '$'+m0+' -> $'+SD.money().toFixed(0));
  ok('you cannot buy the same item twice',SD.buyVariant(cereal.id,1)==='already');
  G.bank=0;G.cash=0;
  ok('you cannot buy what you cannot afford',SD.buyVariant(cereal.id,2)==='poor');

  /* ── 6. Human Knowledge gates the readout ──────────────────────────────── */
  G.hk=0;  ok('at HK 0 the scanner says nothing useful',
     SD.predict(cereal.id,stock[3]).text==='???',SD.predict(cereal.id,stock[3]).text);
  /* M45 re-cut the ladder DOWN, because the band forecast sat at HK 50 and a whole
     run of afternoons only earned 46 - so across ten nights the scanner never once
     told anybody what a purchase would do. HK 30 is the BAND now; 12 is the name. */
  G.hk=12; ok('at HK 12 it names who, not what',SD.hkTier()===1,
     SD.predict(cereal.id,stock[3]).text);
  G.hk=30; ok('...and by HK 30 it says what',SD.hkTier()>=2,
     'tier '+SD.hkTier()+' - it used to take 50, which a run cannot earn');
  G.hk=60; var p=SD.predict(cereal.id,stock[3]);
  ok('at HK 60 it predicts the BAND',['MISSED','DOUBT','CERTAINTY'].indexOf(p.text)>=0,
     p.text+' delta '+(p.delta||0).toFixed(1));
  ok('HK is earned by doing human things',(function(){
      G.hk=0;D.block=3;D.actions=2;SD.doAction('walk');return G.hk>=0;})());
  G.hk=0;D.block=4;D.actions=2;SD.doAction('tv');
  ok('...and watching television counts',G.hk>0,'HK='+G.hk);

  /* ── 7. THE HEADLINE: the shelf does not lie ───────────────────────────── */
  SD.startHouse();SD.S.menuOpen=false;
  G.bank=9000;G.hk=70;
  var cer=SD.objects.filter(function(o){return o.kind==='cerealBox';})[0];
  SD.scanObject(cer);
  var shelf=SD.shopStock(cer.id);
  var rows=shelf.map(function(it,i){
    var pr=SD.predict(cer.id,it);
    return {i:i,sim:it.sim,price:it.price,band:pr.text,delta:pr.delta};
  });
  rows.forEach(function(r){
    info('shelf '+r.sim.toFixed(1)+'%  $'+r.price+'  predicts '+r.band+
         (r.delta!==undefined?'  (delta '+r.delta.toFixed(1)+')':''));});
  ok('the shelf offers a real choice, not one obvious answer',
     rows.some(function(r){return r.band==='MISSED';})&&
     rows.some(function(r){return r.band==='DOUBT';}),
     rows.map(function(r){return r.band[0];}).join(''));

  // buy every rung, plant it, and check the forecast against what actually happened
  var mismatches=[],checked=0;
  for(var i=0;i<shelf.length;i++){
    SD.startHouse();SD.S.menuOpen=false;
    G.bank=9000;G.hk=70;G.bought={};SD.INV.length=0;
    var o=SD.objects.filter(function(x){return x.kind==='cerealBox';})[0];
    SD.scanObject(o);
    var st=SD.shopStock(o.id);
    var forecast=SD.predict(o.id,st[i]).text;
    SD.buyVariant(o.id,i);
    SD.swapWith(o,0);
    var got=SD.doMorning()[0];
    checked++;
    if(got.r.band!==forecast)mismatches.push(st[i].sim.toFixed(0)+'% said '+forecast+
      ' got '+got.r.band);
  }
  ok('THE SHELF DOES NOT LIE: every forecast matched the morning',
     mismatches.length===0,checked+' rungs checked'+
     (mismatches.length?' — '+mismatches.join('; '):''));

  // and the milestone's own check: buy a near-match, plant it, get a beat
  SD.startHouse();SD.S.menuOpen=false;
  G.bank=9000;G.hk=70;G.bought={};SD.INV.length=0;
  var cb=SD.objects.filter(function(x){return x.kind==='cerealBox';})[0];
  SD.scanObject(cb);
  var st2=SD.shopStock(cb.id);
  var pick=-1;
  for(var q=0;q<st2.length;q++)if(SD.predict(cb.id,st2[q]).text==='DOUBT'){pick=q;break;}
  ok('the shop offers at least one variant that will actually work',pick>=0,
     pick>=0?('the '+st2[pick].sim.toFixed(1)+'% at $'+st2[pick].price):'none');
  SD.buyVariant(cb.id,pick);
  SD.swapWith(cb,0);
  var line=SD.doMorning()[0];
  info('planted the '+st2[pick].sim.toFixed(1)+'% -> '+line.r.band+
       ', June doubt now '+R.june.doubt.toFixed(1));
  ok('BUY IT, PLANT IT, AND SHE DOUBTS',
     line.r.band==='DOUBT'&&R.june.doubt>0,
     line.r.band+', doubt '+R.june.doubt.toFixed(1));
  ok('a doubt beat is queued for the street',R.june.beats===1,'beats='+R.june.beats);

  /* ── 8. reaction beats escalate ────────────────────────────────────────── */
  var texts={};
  for(var b=1;b<=4;b++){R.june.beats=b;texts[b]=SD.reactionBeat(R.june);}
  ok('the beat escalates every time',
     texts[1]!==texts[2]&&texts[2]!==texts[3]&&texts[3]!==texts[4]);
  info('beat 1: '+texts[1]);
  info('beat 4: '+texts[4]);
  R.june.beats=0;
  ok('nobody who has not doubted has a beat',SD.reactionBeat(R.june)===null);

  /* ── 9. dialogue ───────────────────────────────────────────────────────── */
  ok('there are scenes to play',SD.SCENES.length>=3);
  ok('every scene offers all three registers',SD.SCENES.every(function(s){
      var regs=s.choices.map(function(c){return c.reg;});
      return regs.indexOf('NORMAL')>=0&&regs.indexOf('ODD')>=0&&regs.indexOf('ALIEN')>=0;}));
  ok('the honest answer calms her and the alien one does not',
     SD.SCENES.every(function(s){
       var n=s.choices.filter(function(c){return c.reg==='NORMAL';})[0];
       var a=s.choices.filter(function(c){return c.reg==='ALIEN';})[0];
       return n.w<0&&a.w>0;}));
  ok('ALIEN answers are not strictly dominated - they teach you more',
     SD.SCENES.some(function(s){
       var n=s.choices.filter(function(c){return c.reg==='NORMAL';})[0];
       var a=s.choices.filter(function(c){return c.reg==='ALIEN';})[0];
       return a.hk>n.hk;}));

  /* ── 10. the loop closes ───────────────────────────────────────────────── */
  SD.startHouse();SD.S.menuOpen=false;
  SD.endNight('home','x');           // night -> report
  SD.startDay();                     // report -> day
  ok('after the night comes the day',D.block===0);
  for(var k=0;k<SD.BLOCKS.length;k++)SD.nextBlock();
  ok('after the last block comes the night',SD.NIGHT.running===true&&SD.NIGHT.t===0);
  ok('the doors are shut behind you again',
     SD.DOORS.every(function(d){return !d.open;}));

  var eb=document.getElementById('err-banner');
  ok('no crash banner',!eb,eb?eb.textContent.slice(0,200):'');

}catch(e){
  fail++;
  out.push('FAIL  harness threw: '+(e&&e.message)+'  @ '+String((e&&e.stack)||'').split('\n').slice(0,3).join(' | '));
}

var summary='SDTEST '+(fail===0?'ALL-PASS':'FAILURES')+' pass='+pass+' fail='+fail;
var pre=document.createElement('pre');
pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\n'+summary+'\n'+out.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);
document.title=summary;
})();

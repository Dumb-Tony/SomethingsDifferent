/* ─────────────────────────────────────────────────────────────────────────────
   Milestone 10 — the stores.

   The defect this milestone exists to close has been open in GDD 15 since M2:
   "Grace is unreachable by shop stock". Measured before the fix: 0 of her 4 objects
   had a single DOUBT rung in any week. She owned things, so a sixth of the cast was
   decoration.

   The cause was structural, not a number: `perceived` multiplies raw delta by
   attention AND attachment, so one shelf cannot serve a cast whose doubt windows span
   raw 0.027 (Marisol) to 0.87 (Grace). Three stores stocking three RANGES is the fix,
   plus one resident retune that follows the Walt precedent exactly.

   The headline assertion is coverage: EVERY RESIDENT IS PLAYABLE.
   ───────────────────────────────────────────────────────────────────────────── */
(function(){
var out=[],pass=0,fail=0;
function ok(name,cond,detail){
  if(cond){pass++;out.push('PASS  '+name+(detail?'   ('+detail+')':''));}
  else    {fail++;out.push('FAIL  '+name+(detail?'   ('+detail+')':''));}
}
function info(s){out.push('      '+s);}
function near(a,b,t){return Math.abs(a-b)<=t;}

try{
  var SD=window.__SD;
  ok('__SD present',!!SD); if(!SD)throw new Error('no __SD');
  var C=SD.CONST;
  SD.stopLoop();
  SD.startHouse();
  SD.GAME.hk=99;                      // predictive scanner, so bands are visible
  SD.GAME.bank=500000;                // reachability, not affordability, is the subject

  /* ── 1. the stores exist and are actually different ────────────────────────*/
  ok('there are three stores',SD.STORES.length===3,
     SD.STORES.map(function(s){return s.name;}).join(' / '));
  ok('every store has a descending ladder',
     SD.STORES.every(function(s){
       for(var i=1;i<s.ladder.length;i++)if(s.ladder[i]>=s.ladder[i-1])return false;
       return s.ladder.length>=4;}),
     SD.STORES.map(function(s){return s.short+' '+s.ladder.length+' rungs';}).join(', '));
  var ranges=SD.STORES.map(function(s){return s.ladder[0]-s.ladder[s.ladder.length-1];});
  ok('the three ladders cover DIFFERENT parts of the spectrum',
     SD.STORES[2].ladder[SD.STORES[2].ladder.length-1] > SD.STORES[0].ladder[0] &&
     SD.STORES[0].ladder[SD.STORES[0].ladder.length-1] > SD.STORES[1].ladder[0],
     SD.STORES.map(function(s){
       return s.short+' '+s.ladder[s.ladder.length-1]+'-'+s.ladder[0]+'%';}).join('  <  '));
  info('antique is finer than bulwark, which is finer than thrift, with no overlap');

  /* ── 2. back-compatibility: the default store is still Bulwark ─────────────*/
  var mug=SD.objects.filter(function(o){return o.kind==='coffeeMug'&&o.owner==='walt';})[0];
  SD.objects.forEach(function(o){SD.scanObject(o);});
  ok('shopStock() with no store still means Bulwark',
     JSON.stringify(SD.shopStock(mug.id))===JSON.stringify(SD.shopStock(mug.id,'bulwark')));
  ok('...so the M6 shelf is unchanged',
     SD.shopStock(mug.id).length===SD.SHOP_LADDER.length+1,
     SD.shopStock(mug.id).length+' rungs');
  ok('an unknown store falls back rather than throwing',
     SD.shopStock(mug.id,'nonsense').length>0);

  /* ── 3. the identical special order is Bulwark-only ────────────────────────*/
  function hasIdentical(st){
    return SD.shopStock(mug.id,st).some(function(i){return i.identical;});}
  ok('Bulwark can special-order an identical copy',hasIdentical('bulwark'));
  ok('...the thrift cannot (it is second-hand)',!hasIdentical('thrift'));
  ok('...and neither can the antique shop',!hasIdentical('antique'));
  info('putting it everywhere would quietly halve the cost of defeating a mark (M7)');

  /* ── 4. prices ─────────────────────────────────────────────────────────────
     The thrift may simply not have this kind this week, so find a week where it does
     rather than indexing into an empty shelf. */
  var wk=-1;
  for(var ww=0;ww<12;ww++){SD.GAME.week=ww;if(SD.storeHas('thrift',mug.kind)){wk=ww;break;}}
  ok('the thrift stocks a mug in SOME week',wk>=0,wk>=0?('week '+wk):'never in 12 weeks');
  var pB=SD.shopStock(mug.id,'bulwark')[0].price,
      pT=SD.shopStock(mug.id,'thrift')[0].price,
      pA=SD.shopStock(mug.id,'antique')[0].price;
  ok('the thrift is the cheap one',pT<pB,'$'+pT+' vs $'+pB);
  ok('the antique shop is the expensive one',pA>pB,'$'+pA+' vs $'+pB);
  SD.GAME.week=0;

  /* ── 5. thrift stock rotates, deterministically ────────────────────────────*/
  var kinds={};SD.objects.forEach(function(o){kinds[o.kind]=1;});
  var kindList=Object.keys(kinds),weeks=8,missCount=0,total=0,pattern=[];
  for(var w=0;w<weeks;w++){
    SD.GAME.week=w;
    var miss=0;
    kindList.forEach(function(k){total++;if(!SD.storeHas('thrift',k)){miss++;missCount++;}});
    pattern.push(miss);
  }
  SD.GAME.week=0;
  ok('the thrift does not always have your kind of thing',missCount>0,
     missCount+' of '+total+' (kind, week) pairs out of stock');
  ok('...but it usually does',missCount<total*0.6,
     'in stock '+(100*(1-missCount/total)).toFixed(0)+'% of the time, target '+
     (C.THRIFT_STOCK*100).toFixed(0)+'%');
  ok('...and what it has is the same all week',
     SD.storeHas('thrift',kindList[0])===SD.storeHas('thrift',kindList[0]));
  ok('Bulwark always has everything',
     kindList.every(function(k){return SD.storeHas('bulwark',k);}));
  info('out-of-stock by week: '+pattern.join(','));

  /* ── 6. buying is keyed per store ──────────────────────────────────────────*/
  SD.GAME.bought={};
  SD.GAME.week=wk>=0?wk:0;             // a week the thrift actually has mugs
  var r1=SD.buyVariant(mug.id,1,'bulwark');
  ok('you can buy at Bulwark',r1==='card'||r1==='cash',String(r1));
  ok('...and buying it twice is refused',SD.buyVariant(mug.id,1,'bulwark')==='already');
  var r2=SD.buyVariant(mug.id,1,'thrift');
  ok('THE SAME RUNG AT ANOTHER SHOP IS A DIFFERENT ITEM',r2==='card'||r2==='cash',
     String(r2));
  SD.GAME.week=0;
  info('a shared key would have made one purchase silently consume the other shelf');

  /* ── 7. the thrift costs Wife Suspicion, and Bulwark does not ──────────────*/
  var s0=SD.WIFE.susp;
  SD.ACTIONS.shop.run();
  var titleB=document.getElementById('shop-name').textContent;
  var s1=SD.WIFE.susp;
  SD.ACTIONS.antique.run();
  var titleA=document.getElementById('shop-name').textContent;
  ok('the screen title names the shop you actually drove to',
     /BULWARK/.test(titleB)&&/ARDSLEY/.test(titleA),
     '"'+titleB+'" then "'+titleA+'"');
  info('it was a hard-coded "BULWARK MART" and was silently wrong at the other two');
  SD.ACTIONS.thrift.run();
  var s2=SD.WIFE.susp;
  SD.S.menuOpen=false;                 // openShop opened a screen; the sim must not stay paused
  ok('driving to Bulwark is unremarkable',near(s1,s0,1e-9),s0+' -> '+s1);
  ok('DRIVING TO THE THRIFT IS NOT',s2>s1,s1+' -> '+s2+' (+'+C.THRIFT_SUSP+')');
  info('that is the thrift\'s real price - the money is nothing');
  SD.WIFE.susp=s0;

  /* ── 8. THE HEADLINE: is every resident playable? ──────────────────────────*/
  var WEEKS=6;
  var perRes={},storeUnique={},untouchable=[];
  SD.STORES.forEach(function(s){storeUnique[s.id]=[];});
  Object.keys(SD.RESIDENTS).forEach(function(id){
    perRes[id]={name:SD.RESIDENTS[id].name,objs:0,ok:0};});

  SD.objects.forEach(function(o){
    var res=SD.RESIDENTS[o.owner]; if(!res)return;
    var probe={kind:o.kind,spec:o.spec,attach:o.attach,marked:o.marked,fresh:o.fresh};
    var byStore={},weeksOK=0;
    SD.STORES.forEach(function(s){byStore[s.id]=0;});
    for(var w=0;w<WEEKS;w++){
      SD.GAME.week=w;
      var any=false;
      SD.STORES.forEach(function(s){
        var hit=SD.shopStock(o.id,s.id).some(function(it){
          return SD.DOUBT.resolve(res,probe,it.spec).band==='DOUBT';});
        if(hit){byStore[s.id]++;any=true;}
      });
      if(any)weeksOK++;
    }
    SD.GAME.week=0;
    var P=perRes[o.owner];
    P.objs++; if(weeksOK>0)P.ok++;
    if(weeksOK===0)untouchable.push(res.name+"'s "+o.label);
    // which store is the ONLY way in for this object?
    var live=SD.STORES.filter(function(s){return byStore[s.id]>0;});
    if(live.length===1)storeUnique[live[0].id].push(o.label);
  });

  var deadCast=[];
  Object.keys(perRes).forEach(function(id){
    var P=perRes[id];
    if(!P.objs)return;
    info(P.name+': '+P.ok+'/'+P.objs+' objects reachable');
    if(P.ok===0)deadCast.push(P.name);
  });
  ok('EVERY RESIDENT WHO OWNS SOMETHING CAN BE MADE TO DOUBT',
     deadCast.length===0,deadCast.length?deadCast.join(', '):'the whole cast is playable');

  /* ── 9. the specific regression: Grace ─────────────────────────────────────*/
  var grace=SD.RESIDENTS.grace;
  var graceObjs=SD.objects.filter(function(o){return o.owner==='grace';});
  var graceOK=0,graceThriftOnly=0;
  graceObjs.forEach(function(o){
    var probe={kind:o.kind,spec:o.spec,attach:o.attach,marked:o.marked,fresh:o.fresh};
    var byStore={};
    SD.STORES.forEach(function(s){
      byStore[s.id]=0;
      for(var w=0;w<WEEKS;w++){
        SD.GAME.week=w;
        if(SD.shopStock(o.id,s.id).some(function(it){
             return SD.DOUBT.resolve(grace,probe,it.spec).band==='DOUBT';}))byStore[s.id]++;
      }
    });
    SD.GAME.week=0;
    if(byStore.bulwark+byStore.thrift+byStore.antique>0)graceOK++;
    if(byStore.thrift>0&&byStore.bulwark===0&&byStore.antique===0)graceThriftOnly++;
  });
  ok('GRACE IS PLAYABLE - the defect open since M2 is closed',
     graceOK===graceObjs.length,graceOK+'/'+graceObjs.length+' of her objects');
  ok('...and the thrift store is the ONLY way in for some of them',graceThriftOnly>0,
     graceThriftOnly+' of her objects are thrift-only');
  ok('...she is still the hardest person on the street',
     grace.noticeFloor===Math.max.apply(null,Object.keys(SD.RESIDENTS).map(function(k){
       return SD.RESIDENTS[k].noticeFloor;})),
     'floor '+grace.noticeFloor+' (highest in the cast)');

  /* ── 10. does each store earn its place? ───────────────────────────────────
     Measured per (object, week), not per object: a store earns its slot by being the
     ONLY way in somewhere. Anything else is a strictly-dominated menu entry. */
  var WK=12,sole={},rescue={},cover={},pairs=0;
  SD.STORES.forEach(function(s){sole[s.id]=0;rescue[s.id]=0;cover[s.id]=0;});
  SD.objects.forEach(function(o){
    var res=SD.RESIDENTS[o.owner]; if(!res)return;
    var probe={kind:o.kind,spec:o.spec,attach:o.attach,marked:o.marked,fresh:o.fresh};
    for(var w=0;w<WK;w++){
      SD.GAME.week=w;
      var hit={};
      SD.STORES.forEach(function(s){
        hit[s.id]=SD.shopStock(o.id,s.id).some(function(it){
          return SD.DOUBT.resolve(res,probe,it.spec).band==='DOUBT';});
        if(hit[s.id])cover[s.id]++;
      });
      pairs++;
      var live=SD.STORES.filter(function(s){return hit[s.id];});
      if(live.length===1)sole[live[0].id]++;
      if(!hit.bulwark)SD.STORES.forEach(function(s){
        if(s.id!=='bulwark'&&hit[s.id])rescue[s.id]++;});
    }
  });
  SD.GAME.week=0;
  info('over '+WK+' weeks x '+SD.objects.length+' objects = '+pairs+' (object,week) pairs:');
  SD.STORES.forEach(function(s){
    info('  '+(s.name+'                 ').slice(0,20)+
         'covers '+('   '+cover[s.id]).slice(-4)+
         '   SOLE OPTION in '+('   '+sole[s.id]).slice(-4));
  });
  ok('no store is strictly dominated by Bulwark',
     rescue.thrift>0&&rescue.antique>0,
     'thrift rescues '+rescue.thrift+' Bulwark-misses, antique '+rescue.antique);
  ok('THE THRIFT IS LOAD-BEARING for this cast',sole.thrift>=10,
     'sole option in '+sole.thrift+' of '+pairs+' pairs');
  ok('SO IS THE ANTIQUE SHOP',sole.antique>=1,
     'sole option in '+sole.antique+' of '+pairs+' pairs');
  ok('the antique shop owns the top of the spectrum outright',
     SD.storeById('antique').ladder[SD.storeById('antique').ladder.length-1] >
     SD.storeById('bulwark').ladder[0],
     'its worst rung ('+SD.storeById('antique').ladder[SD.storeById('antique').ladder.length-1]+
     '%) is finer than Bulwark\'s best ('+SD.storeById('bulwark').ladder[0]+'%)');
  info('each shop is the only way in somewhere, so which one you drive to is the decision');

  /* ── 11. the family photo: the hardest object on the street ────────────────
     June's window on it is only ~6 percentage points wide, because the photo hits her
     `memory` fixation (x1.8 via SEED_BONUS) AND she is more attached to it than to
     anything else (1.9). On top of that, pictureFrame.photo has salience 1.00, so the
     producible spectrum jumps 86% -> 92%: you either keep the picture or you change
     it. Measured: 1 in 400 random mutations lands in her window, versus 111 in 400
     with the fixation removed. */
  ok('NOTHING on the street is completely un-fakeable',untouchable.length===0,
     untouchable.length?untouchable.join(', '):'all '+SD.objects.length+' objects reachable');
  var photo=SD.objects.filter(function(o){
    return o.kind==='pictureFrame'&&o.owner==='june';})[0];
  var pprobe={kind:photo.kind,spec:photo.spec,attach:photo.attach,
              marked:photo.marked,fresh:photo.fresh};
  var photoWeeks=0,photoStores={};
  SD.STORES.forEach(function(s){photoStores[s.id]=0;});
  for(var pw=0;pw<WK;pw++){
    SD.GAME.week=pw;
    var any=false;
    SD.STORES.forEach(function(s){
      if(SD.shopStock(photo.id,s.id).some(function(it){
           return SD.DOUBT.resolve(SD.RESIDENTS.june,pprobe,it.spec).band==='DOUBT';})){
        photoStores[s.id]++;any=true;}
    });
    if(any)photoWeeks++;
  }
  SD.GAME.week=0;
  ok('...but the family photo is the HARDEST thing on the street',
     photoWeeks>0&&photoWeeks<WK*0.5,
     'buyable in only '+photoWeeks+' of '+WK+' weeks');
  ok('...and ONLY the antique shop can fake it',
     photoStores.antique>0&&photoStores.bulwark===0&&photoStores.thrift===0,
     SD.STORES.map(function(s){return s.short.toLowerCase()+' '+photoStores[s.id];}).join('  '));
  info('to fake the thing she treasures most you go to the antique shop, and even then');
  info('only some weeks - which is exactly what that shop should be for');
  var warned=SD.shopStock(photo.id,'bulwark').every(function(it){
    var p=SD.predict(photo.id,it);
    return p.text==='MISSED'||p.text==='CERTAINTY';});
  ok('THE SUPERMARKET SHELF WARNS YOU rather than letting you walk into it',warned,
     'every Bulwark rung forecasts MISSED or CERTAINTY - none claims DOUBT');

  /* ── 12. the shelf still does not lie, at every store ──────────────────────*/
  var mismatches=[];
  SD.STORES.forEach(function(s){
    var target=SD.objects.filter(function(o){
      return o.owner==='grace'&&SD.shopStock(o.id,s.id).length;})[0]
      ||SD.objects.filter(function(o){return SD.shopStock(o.id,s.id).length;})[0];
    if(!target)return;
    var stock=SD.shopStock(target.id,s.id);
    var res=SD.RESIDENTS[target.owner];
    stock.forEach(function(it,i){
      var forecast=SD.predict(target.id,it).text;
      var probe={kind:target.kind,spec:target.spec,attach:target.attach,
                 marked:target.marked,fresh:target.fresh};
      var actual=SD.DOUBT.resolve(res,probe,it.spec).band;
      if(forecast!==actual)mismatches.push(s.short+' rung '+i+': said '+forecast+
                                           ', would be '+actual);
    });
  });
  ok('THE SHELF DOES NOT LIE, IN ANY OF THE THREE SHOPS',mismatches.length===0,
     mismatches.length?mismatches.join(' | '):'every rung at every store checked');

  /* ── 13. buy it, plant it, and the morning agrees ──────────────────────────*/
  SD.startHouse();SD.GAME.hk=99;SD.GAME.bank=500000;
  var target=SD.objects.filter(function(o){return o.owner==='grace'&&o.kind==='curtains';})[0];
  SD.scanObject(target);
  var st=SD.shopStock(target.id,'thrift'),pick=-1;
  for(var q=0;q<st.length;q++)if(SD.predict(target.id,st[q]).text==='DOUBT'){pick=q;break;}
  ok('the thrift stocks something that will work on Grace',pick>=0,
     pick>=0?('the '+st[pick].sim.toFixed(1)+'% at $'+st[pick].price):'nothing');
  if(pick>=0){
    SD.buyVariant(target.id,pick,'thrift');
    var mine=SD.invFor(target.id);
    SD.swapWith(target,mine.length-1);
    var before=SD.RESIDENTS.grace.doubt;
    var lines=SD.doMorning();
    var line=lines.filter(function(L){return L.owner==='grace';})[0];
    ok('BUY IT AT THE THRIFT, PLANT IT, AND GRACE DOUBTS HERSELF',
       !!line&&line.r.band==='DOUBT',line?line.r.band:'no line');
    ok('...and her Doubt actually moves',SD.RESIDENTS.grace.doubt>before,
       before.toFixed(1)+' -> '+SD.RESIDENTS.grace.doubt.toFixed(1));
    info('eight milestones after she was added, Grace is finally in the game');
  }

  var eb=document.getElementById('err-banner');
  ok('no crash banner',!eb,eb?eb.textContent.slice(0,200):'');

}catch(e){
  fail++;
  out.push('FAIL  harness threw: '+(e&&e.message)+'  @ '+
    String((e&&e.stack)||'').split('\n').slice(0,3).join(' | '));
}

var summary='SDTEST '+(fail===0?'ALL-PASS':'FAILURES')+' pass='+pass+' fail='+fail;
var pre=document.createElement('pre');
pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\n'+summary+'\n'+out.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);
document.title=summary;
})();

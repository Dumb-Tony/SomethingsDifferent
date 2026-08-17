/* ─────────────────────────────────────────────────────────────────────────────
   Milestone 2 — the Doubt Curve (GDD 4).

   Every expected value below is HAND-COMPUTED from the constants, not captured
   from a previous run, so a silent constant change fails loudly instead of
   re-baselining itself.

   Reference weights (both kinds happen to total 3.65):
     cerealBox    hue .90 + brand .85 + mascot 1.00 + pattern .40 + h .50 = 3.65
     pictureFrame frameHue .60 + frameStyle .70 + photo 1.00 + smiling .85 + w .50
     placement    _pos .75 + _rot .45          (appended to EVERY kind)
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
  ok('__SD present',!!SD);
  if(!SD)throw new Error('no __SD');
  var C=SD.CONST,SP=SD.SPEC,D=SD.DOUBT,K=SD.PROP_KINDS,R=SD.RESIDENTS;
  ok('build is tagged',/^M\d+$/.test(SD.version||''),'version='+SD.version);

  /* ── 1. axisDist, per type ─────────────────────────────────────────────── */
  ok('hue: opposite hues are max distance',
     SP.axisDist({t:'hue'},0,180)===1);
  ok('hue: wraps the short way round',
     near(SP.axisDist({t:'hue'},10,350),20/180,1e-9),
     SP.axisDist({t:'hue'},10,350).toFixed(5)+' expected '+(20/180).toFixed(5));
  ok('num: normalized by the axis range',
     SP.axisDist({t:'num',min:0,max:10},0,5)===0.5);
  ok('num: clamped at 1',SP.axisDist({t:'num',min:0,max:10},0,50)===1);
  ok('enum: same=0 different=1',
     SP.axisDist({t:'enum'},'a','a')===0&&SP.axisDist({t:'enum'},'a','b')===1);
  ok('bool: flip = 1',SP.axisDist({t:'bool'},true,false)===1);
  ok('pos3: PROP_POS_SCALE metres = full delta',
     SP.axisDist({t:'pos3'},[0,0,0],[C.PROP_POS_SCALE,0,0])===1);
  ok('pos3: 5cm of a 25cm scale = 0.2',
     near(SP.axisDist({t:'pos3'},[0,0,0],[0.05,0,0]),0.2,1e-9));
  ok('rot: PROP_ROT_SCALE degrees = full delta',
     SP.axisDist({t:'rot'},0,C.PROP_ROT_SCALE)===1);
  ok('rot: takes the short way round',
     near(SP.axisDist({t:'rot'},0,350),10/45,1e-9));

  /* ── 2. specDelta ──────────────────────────────────────────────────────── */
  var base={hue:0,brand:'CRUNCH-O',mascot:'bird',pattern:'solid',h:0.30};
  var same=SP.specDelta('cerealBox',base,base);
  ok('identical specs: raw 0, similarity 100',
     same.raw===0&&same.similarity===100&&same.diffs.length===0);

  var patt=Object.assign({},base,{pattern:'stripe'});
  var dPat=SP.specDelta('cerealBox',base,patt);
  ok('one enum axis: raw = its salience / total salience',
     near(dPat.raw,0.40/3.65,1e-9),
     'raw='+dPat.raw.toFixed(6)+' expected '+(0.40/3.65).toFixed(6));
  ok('similarity is 100*(1-raw)',near(dPat.similarity,100*(1-0.40/3.65),1e-9),
     dPat.similarity.toFixed(2)+'%');
  ok('delta is symmetric',
     SP.specDelta('cerealBox',patt,base).raw===dPat.raw);
  ok('diffs name the axis that changed',
     dPat.diffs.length===1&&dPat.diffs[0].axis==='pattern'&&
     dPat.diffs[0].from==='solid'&&dPat.diffs[0].to==='stripe');

  var many=Object.assign({},base,{pattern:'stripe',mascot:'tiger'});
  var dMany=SP.specDelta('cerealBox',base,many);
  ok('diffs are ranked by weighted contribution',
     dMany.diffs[0].axis==='mascot',dMany.diffs.map(function(x){return x.axis;}).join('>'));

  /* placement participates as an ordinary axis — no separate "move" system */
  var pA=Object.assign({},base,{_pos:[0,0,0],_rot:0});
  var pB=Object.assign({},base,{_pos:[0.05,0,0],_rot:0});
  var dMove=SP.specDelta('cerealBox',pA,pB);
  ok('moving an object IS a spec delta',
     near(dMove.raw,(0.2*0.75)/4.85,1e-9),
     'raw='+dMove.raw.toFixed(6)+' expected '+((0.2*0.75)/4.85).toFixed(6));
  ok('placement component is reported separately',dMove.placement>0);
  ok('a pure swap has zero placement component',dPat.placement===0);

  /* ── 3. THE HEADLINE: one change, three people, three outcomes ──────────── */
  function objOf(kind,spec,o){o=o||{};
    return {kind:kind,spec:spec,attach:o.attach===undefined?1:o.attach,
            marked:!!o.marked,fresh:o.fresh===undefined?1:o.fresh};}
  function res(id,over){return Object.assign({},R[id],over||{});}

  var rM=D.resolve(res('marisol'),objOf('cerealBox',base),patt);
  var rW=D.resolve(res('walt'),   objOf('cerealBox',base),patt);
  var rR=D.resolve(res('ray'),    objOf('cerealBox',base),patt);
  ok('same swap -> Marisol DOUBT',rM.band==='DOUBT',
     'delta='+rM.delta.toFixed(2)+' floor '+rM.floor+' ceil '+rM.ceiling.toFixed(1));
  ok('same swap -> Walt MISSED',rW.band==='MISSED',
     'delta='+rW.delta.toFixed(2)+' floor '+rW.floor);
  ok('same swap -> Ray CERTAINTY',rR.band==='CERTAINTY',
     'delta='+rR.delta.toFixed(2)+' ceil '+rR.ceiling.toFixed(2));
  ok('Marisol delta is hand-computable (raw*100*attention)',
     near(rM.delta,(0.40/3.65)*100*1.5,1e-6),rM.delta.toFixed(5));
  ok('Marisol ceiling = floor + band*plaus',
     near(rM.ceiling,6+35*0.90,1e-9),rM.ceiling.toFixed(3));
  ok('DOUBT pays K_DOUBT * delta',
     near(rM.doubt,C.K_DOUBT*rM.delta,1e-9),rM.doubt.toFixed(4));
  ok('DOUBT pays K_STRESS * delta and NO suspicion',
     near(rM.stress,C.K_STRESS*rM.delta,1e-9)&&rM.suspicion===0);
  ok('CERTAINTY pays suspicion, not clean doubt',
     rR.suspicion>0&&near(rR.doubt,C.K_DOUBT*rR.delta*C.CERTAIN_DOUBT_FRAC,1e-9),
     'susp='+rR.suspicion.toFixed(2));
  ok('CERTAINTY makes them mark the object',rR.mark===true);
  ok('MISSED costs freshness and nothing else',
     rW.freshDelta===-C.FRESH_DECAY&&rW.doubt===0&&rW.suspicion===0);

  /* ── 4. the identical variant is USELESS for doubt (GDD 5.7) ────────────── */
  var rIdent=D.resolve(res('marisol'),objOf('cerealBox',base),Object.assign({},base));
  ok('a 100% identical replacement creates no doubt',
     rIdent.band==='MISSED'&&rIdent.delta===0&&rIdent.doubt===0);

  /* ── 5. marking collapses the doubt window (the counter-play) ───────────── */
  var hueA={hue:0,brand:'CRUNCH-O',mascot:'bird',pattern:'solid',h:0.30};
  var hueB=Object.assign({},hueA,{hue:146});     // raw = .9*(146/180)/3.65 = 0.2000
  var mUn=D.resolve(res('marisol'),objOf('cerealBox',hueA),hueB);
  var mMk=D.resolve(res('marisol'),objOf('cerealBox',hueA,{marked:true}),hueB);
  ok('constructed delta is exactly 30',near(mUn.delta,30,1e-6),mUn.delta.toFixed(6));
  ok('unmarked -> DOUBT',mUn.band==='DOUBT','ceil='+mUn.ceiling.toFixed(3));
  ok('MARKED -> the same swap becomes CERTAINTY',mMk.band==='CERTAINTY',
     'ceil dropped '+mUn.ceiling.toFixed(2)+' -> '+mMk.ceiling.toFixed(2));
  ok('marked ceiling = floor + band*plaus*MARK_PLAUS_PENALTY',
     near(mMk.ceiling,6+35*0.90*C.MARK_PLAUS_PENALTY,1e-9));

  /* ── 6. the seed (fixation) multiplier ──────────────────────────────────── */
  var frA={frameHue:0,frameStyle:'thin',photo:'wedding',smiling:true,w:0.20};
  var frB=Object.assign({},frA,{smiling:false});   // raw = .85/3.65
  var jSeed=D.resolve(res('june'),              objOf('pictureFrame',frA),frB);
  var jNone=D.resolve(res('june',{seed:null}),  objOf('pictureFrame',frA),frB);
  ok('hitting the fixation multiplies delta by 1+SEED_BONUS',
     near(jSeed.delta/jNone.delta,1+C.SEED_BONUS,1e-9),
     (jSeed.delta/jNone.delta).toFixed(4));
  ok('June: an altered family photo tips DOUBT -> CERTAINTY',
     jNone.band==='DOUBT'&&jSeed.band==='CERTAINTY',
     'no-seed '+jNone.delta.toFixed(1)+' vs seed '+jSeed.delta.toFixed(1)+
     ' ceil '+jSeed.ceiling.toFixed(1));

  /* order-fixation reads DISPLACEMENT of any object, whatever it is */
  var moveM=D.resolve(res('marisol'),objOf('cerealBox',pA),pB);
  var moveW=D.resolve(res('walt'),   objOf('cerealBox',pA),pB);
  ok('a 5cm nudge is DOUBT to the perfectionist',moveM.band==='DOUBT',
     'delta='+moveM.delta.toFixed(2));
  ok('...and invisible to everyone else',moveW.band==='MISSED',
     'delta='+moveW.delta.toFixed(2));

  /* ── 7. attachment ─────────────────────────────────────────────────────── */
  var a1=D.resolve(res('marisol'),objOf('cerealBox',base,{attach:1.0}),patt);
  var a2=D.resolve(res('marisol'),objOf('cerealBox',base,{attach:2.0}),patt);
  ok('attachment scales delta linearly',near(a2.delta,a1.delta*2,1e-9));
  // same physical swap (delta 30 at attach 1), on an object she treasures
  var t1=D.resolve(res('marisol'),objOf('cerealBox',hueA,{attach:1.0}),hueB);
  var t2=D.resolve(res('marisol'),objOf('cerealBox',hueA,{attach:1.6}),hueB);
  ok('a treasured object can be pushed past the ceiling by attachment alone',
     t1.band==='DOUBT'&&t2.band==='CERTAINTY',
     'delta '+t1.delta.toFixed(1)+' -> '+t2.delta.toFixed(1)+' vs ceil '+t1.ceiling.toFixed(1));

  /* ── 8. alertness: stress makes them harder to fool ─────────────────────── */
  var s0=D.resolve(res('marisol',{stress:0}),  objOf('cerealBox',base),patt);
  var s100=D.resolve(res('marisol',{stress:100}),objOf('cerealBox',base),patt);
  ok('stress raises perceived delta by K_ALERT',
     near(s100.delta/s0.delta,1+C.K_ALERT,1e-9),(s100.delta/s0.delta).toFixed(4));

  /* ── 9. purity + commit ────────────────────────────────────────────────── */
  var pRes=res('marisol'),pObj=objOf('cerealBox',base);
  var snapR=JSON.stringify(pRes),snapO=JSON.stringify(pObj);
  D.resolve(pRes,pObj,patt);
  ok('resolve() is PURE - mutates neither resident nor object',
     JSON.stringify(pRes)===snapR&&JSON.stringify(pObj)===snapO);

  var cRes=res('marisol'),cObj=objOf('cerealBox',base);
  var cr=D.commit(cRes,cObj,patt);
  ok('commit() writes the meters',
     near(cRes.doubt,cr.doubt,1e-9)&&near(cRes.stress,cr.stress,1e-9));
  ok('commit() swaps in the new spec',cObj.spec.pattern==='stripe');

  var clampRes=res('marisol',{doubt:99.5});
  D.commit(clampRes,objOf('cerealBox',base),patt);
  ok('meters clamp to 100',clampRes.doubt===100,'doubt='+clampRes.doubt);

  var fRes=res('walt'),fObj=objOf('cerealBox',base);
  for(var i=0;i<10;i++){var spec=Object.assign({},fObj.spec,{pattern:i%2?'solid':'stripe'});
    D.commit(fRes,fObj,spec);}
  ok('repeated MISSES decay freshness to FRESH_MIN and stop',
     near(fObj.fresh,C.FRESH_MIN,1e-9),'fresh='+fObj.fresh.toFixed(3));
  ok('a resident who never notices gains nothing',fRes.doubt===0&&fRes.suspicion===0);

  /* ── 10. band map — the design artefact ────────────────────────────────── */
  var bm=D.bandMap();
  var byId={};bm.forEach(function(r){byId[r.id]=r;});
  var i94=bm[0].sims.indexOf(94);
  ok('band map covers 94% similarity',i94>=0);
  ok('at 94% similar: Marisol DOUBTS',byId.marisol.cells[i94]==='D');
  ok('at 94% similar: Walt notices NOTHING',byId.walt.cells[i94]==='M');
  ok('at 94% similar: Ray is CERTAIN',byId.ray.cells[i94]==='C');
  ok('Ray has a 3-point doubt window and it is the only reason he is immune',
     near(byId.ray.ceiling-byId.ray.floor,3*0.90,1e-9),
     'window='+(byId.ray.ceiling-byId.ray.floor).toFixed(2)+' points wide');
  ok('Ray has the narrowest window of anyone',
     bm.every(function(r){return r.id==='ray'||(r.ceiling-r.floor)>(byId.ray.ceiling-byId.ray.floor);}));

  /* Walt is the SAFE GRINDING TARGET (GDD 6.1): he must be reachable, and he must
     never alarm. His enormous band is what buys that — he blames himself. */
  ok('Walt never alarms on a neutral object - he is the safe target',
     byId.walt.cells.indexOf('C')<0,byId.walt.cells.join(''));
  ok('Walt is reachable, but only with a visibly different object',
     byId.walt.cells.indexOf('D')>=0&&
     byId.walt.cells.slice(0,8).every(function(c){return c==='M';}),
     byId.walt.cells.join(''));
  var fx=D.bandMap(null,'cerealBox',{attach:1.6,seed:true});
  var fxById={};fx.forEach(function(r){fxById[r.id]=r;});
  ok('...but IS reachable once you work his fixation with a treasured object',
     fxById.walt.cells.indexOf('D')>=0,fxById.walt.cells.join(''));
  ok('the fixation map does not move the band edges, only the perceived delta',
     fxById.walt.floor===byId.walt.floor&&fxById.walt.ceiling===byId.walt.ceiling);

  /* ── 11. histogram — the statistical check the GDD asks for ─────────────── */
  var h=D.histogram(200,7);
  var hb={};h.rows.forEach(function(r){hb[r.id]=r;});
  ok('histogram ran 200 samples',h.pairs===200,'shop-range subset='+h.shopPairs);
  ok('the shop-range subset is non-empty',h.shopPairs>=20,'n='+h.shopPairs);

  /* The GDD originally predicted "Marisol lands DOUBT far more often than Walt".
     The maths says something sharper: their DOUBT *rates* are comparable, but the
     two are opposite KINDS of target. Marisol is reachable with subtle, cheap
     changes and punishes overshoot; Walt needs a visibly different object but
     almost never alarms. That contrast is what is asserted here. See GDD 15. */
  ok('Marisol doubts at similarities Walt cannot even feel',
     byId.marisol.cells[i94]==='D'&&byId.walt.cells[i94]==='M',
     '94%: marisol '+byId.marisol.cells[i94]+' walt '+byId.walt.cells[i94]);
  ok('SHOP RANGE: Marisol overshoots into CERTAINTY far more readily than Walt',
     hb.marisol.shop.CERTAINTY>hb.walt.shop.CERTAINTY*3,
     'marisol '+hb.marisol.shop.CERTAINTY+' vs walt '+hb.walt.shop.CERTAINTY+
     ' of '+hb.walt.shopN);
  ok('SHOP RANGE: Walt is reachable and rarely alarmed - safe to grind',
     hb.walt.shop.DOUBT>0&&hb.walt.shop.CERTAINTY/hb.walt.shopN<0.10,
     'M/D/C '+hb.walt.shop.MISSED+'/'+hb.walt.shop.DOUBT+'/'+hb.walt.shop.CERTAINTY+
     ' = '+(100*hb.walt.shop.CERTAINTY/hb.walt.shopN).toFixed(1)+'% alarm');
  ok('SHOP RANGE: Marisol doubts on a substantial share of buyable variants',
     hb.marisol.shop.DOUBT/hb.marisol.shopN>0.25,
     (100*hb.marisol.shop.DOUBT/hb.marisol.shopN).toFixed(0)+'%');
  /* Flagged, not asserted: Grace's floor 30 at attention 0.7 puts her effective
     floor at raw 0.43, outside SHOP_RAW_MAX entirely. She is a Phase-2 background
     character, but she needs a tuning pass before she carries any content. */
  info('NOTE Grace shop-range M/D/C = '+hb.grace.shop.MISSED+'/'+hb.grace.shop.DOUBT+
       '/'+hb.grace.shop.CERTAINTY+' - unreachable by shop stock, see GDD 15');
  /* Ray is NOT literally immune, and asserting "never" was wrong. His real
     property is sharper and more interesting: his doubt window sits BELOW
     everyone else's floor, so the only changes that make him doubt are ones
     nobody else in the neighborhood can perceive. You cannot work Ray and work
     anyone else with the same object. Proven below as an invariant over the
     whole sample, not a rate. */
  ok('Ray converts nearly everything into CERTAINTY (suspicion, not doubt)',
     hb.ray.all.CERTAINTY/hb.ray.n>0.8,
     (100*hb.ray.all.CERTAINTY/hb.ray.n).toFixed(0)+'%');

  var kinds=Object.keys(K);
  /* Restricted to kinds that are NOT Marisol's fixation. On her fixation her
     effective floor drops to raw 6/(100*1.5*1.8)=0.0222, which slides UNDER Ray's
     ceiling of raw 4.7/(100*1.6)=0.0294 — so the two windows genuinely overlap in
     a ~0.7-point band. Measured and reported below rather than hidden. */
  var neutralKinds=kinds.filter(function(k){
    return (K[k].seeds||[]).indexOf(R.marisol.seed)<0;});
  ok('there are neutral (non-order) kinds to test the invariant on',
     neutralKinds.length>=3,neutralKinds.join(','));

  var violations=0,maxMarisolWhenRayDoubts=0,rayDoubtN=0;
  var rng2=SD.mulberry32(7);
  for(var q=0;q<400;q++){
    var kd=neutralKinds[q%neutralKinds.length];
    var sa=SP.randomSpec(kd,rng2),sb=SP.mutateSpec(kd,sa,rng2,0.02+rng2()*0.98);
    var vR=D.resolve(res('ray'),objOf(kd,sa),sb);
    var vM=D.resolve(res('marisol'),objOf(kd,sa),sb);
    if(vM.band!=='MISSED'&&vR.band!=='CERTAINTY')violations++;
    if(vR.band==='DOUBT'){rayDoubtN++;
      maxMarisolWhenRayDoubts=Math.max(maxMarisolWhenRayDoubts,vM.delta);}
  }
  ok('INVARIANT: on a neutral object, anything Marisol perceives is CERTAINTY to Ray',
     violations===0,violations+' violations in 400 samples');
  ok('every change Ray doubts is beneath Marisol\'s notice floor',
     rayDoubtN>0&&maxMarisolWhenRayDoubts<R.marisol.noticeFloor,
     'worst case '+maxMarisolWhenRayDoubts.toFixed(2)+' < floor '+R.marisol.noticeFloor+
     ' over '+rayDoubtN+' Ray-doubt samples');

  /* Quantify the overlap on HER fixation, so the number is on the record. */
  var fixKinds=kinds.filter(function(k){
    return (K[k].seeds||[]).indexOf(R.marisol.seed)>=0;});
  var overlap=0,fixN=0,rng3=SD.mulberry32(11);
  for(var q2=0;q2<400;q2++){
    var kd2=fixKinds[q2%fixKinds.length];
    var sa2=SP.randomSpec(kd2,rng3),sb2=SP.mutateSpec(kd2,sa2,rng3,0.02+rng3()*0.98);
    var vR2=D.resolve(res('ray'),objOf(kd2,sa2),sb2);
    var vM2=D.resolve(res('marisol'),objOf(kd2,sa2),sb2);
    fixN++;
    if(vM2.band!=='MISSED'&&vR2.band==='DOUBT')overlap++;
  }
  ok('on HER fixation the windows overlap, but only marginally',
     overlap/fixN<0.05,
     overlap+'/'+fixN+' = '+(100*overlap/fixN).toFixed(1)+
     '% of order-category changes are doubted by BOTH');
  ok('FULL RANGE: gross changes alarm even the oblivious',
     hb.walt.all.CERTAINTY>0,'walt certainty='+hb.walt.all.CERTAINTY);
  ok('every resident is represented',h.rows.length===Object.keys(R).length,
     h.rows.length+' residents');

  var h2=D.histogram(200,7);
  ok('histogram is deterministic for a fixed seed',
     JSON.stringify(h)===JSON.stringify(h2));
  var h3=D.histogram(200,8);
  ok('...and actually varies with the seed',JSON.stringify(h)!==JSON.stringify(h3));

  /* ── 12. no runtime damage ─────────────────────────────────────────────── */
  var eb=document.getElementById('err-banner');
  ok('no crash banner',!eb,eb?eb.textContent.slice(0,160):'');

  /* ── the report, for eyeballing ────────────────────────────────────────── */
  info('');
  String(D.report(200,7)).split('\n').forEach(info);

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

/* ─────────────────────────────────────────────────────────────────────────────
   Milestone 3 — prop geometry, variants, thumbnails.

   The load-bearing test here is section 6: does the COMPUTED similarity number
   actually predict how different the object LOOKS? If it doesn't, the whole
   parametric premise fails — the scanner would be quoting a number that has
   nothing to do with what a human would notice.
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
  var C=SD.CONST,SP=SD.SPEC,K=SD.PROP_KINDS;
  var kinds=Object.keys(K);
  var rng=SD.mulberry32(4242);

  /* ── 1. every kind builds ──────────────────────────────────────────────── */
  ok('the kind registry has grown with the street',kinds.length>=12,kinds.length+': '+kinds.join(','));
  var missing=kinds.filter(function(k){return typeof K[k].build!=='function';});
  ok('every kind has a build()',missing.length===0,missing.join(',')||'none');

  var built={},specs={};
  kinds.forEach(function(k){
    specs[k]=SP.randomSpec(k,rng);
    built[k]=SD.buildProp(k,specs[k]);
  });
  ok('every kind builds without throwing',
     kinds.every(function(k){return !!built[k];}));

  /* ── 2. the placement contract ─────────────────────────────────────────── */
  var badBase=[],badCentre=[],badMeta=[];
  kinds.forEach(function(k){
    var g=built[k],bb=new THREE.Box3().setFromObject(g);
    if(!near(bb.min.y,0,1e-6))badBase.push(k+'='+bb.min.y.toFixed(5));
    var cx=(bb.min.x+bb.max.x)/2,cz=(bb.min.z+bb.max.z)/2;
    if(!near(cx,0,1e-6)||!near(cz,0,1e-6))badCentre.push(k+'=('+cx.toFixed(5)+','+cz.toFixed(5)+')');
    if(g.userData.kind!==k||!g.userData.spec||!g.userData.size)badMeta.push(k);
  });
  ok('every prop has its base at y=0',badBase.length===0,badBase.join(' ')||'all ok');
  ok('every prop is centred on its footprint',badCentre.length===0,badCentre.join(' ')||'all ok');
  ok('every prop records kind/spec/size',badMeta.length===0,badMeta.join(',')||'all ok');

  /* ── 3. geometry integrity + budget ────────────────────────────────────── */
  function geoStats(g){
    var tris=0,nan=0,meshes=0;
    g.traverse(function(o){
      if(!o.isMesh||!o.geometry)return;
      meshes++;
      var p=o.geometry.attributes.position;
      if(!p)return;
      tris+=o.geometry.index?o.geometry.index.count/3:p.count/3;
      for(var i=0;i<p.array.length;i++)if(!isFinite(p.array[i]))nan++;
    });
    return {tris:Math.round(tris),nan:nan,meshes:meshes};
  }
  var totalTris=0,maxTris=0,worst='',anyNaN=[];
  kinds.forEach(function(k){
    var st=geoStats(built[k]);
    totalTris+=st.tris;
    if(st.tris>maxTris){maxTris=st.tris;worst=k;}
    if(st.nan)anyNaN.push(k+'='+st.nan);
    info('geom '+(k+'          ').slice(0,14)+' tris='+(''+st.tris+'    ').slice(0,5)+
         ' meshes='+st.meshes+'  size='+
         built[k].userData.size.x.toFixed(3)+'x'+built[k].userData.size.y.toFixed(3)+
         'x'+built[k].userData.size.z.toFixed(3));
  });
  ok('no NaN vertices anywhere',anyNaN.length===0,anyNaN.join(' ')||'clean');
  ok('every prop is under the 3000-triangle budget',maxTris<3000,
     'worst '+worst+'='+maxTris+', all 8 total='+totalTris);
  ok('mesh counts stay low enough for a room full of props',
     kinds.every(function(k){return geoStats(built[k]).meshes<=14;}));

  /* ── 4. determinism ────────────────────────────────────────────────────── */
  function geoSig(g){
    var parts=[];
    g.traverse(function(o){
      if(!o.isMesh||!o.geometry||!o.geometry.attributes.position)return;
      o.updateWorldMatrix(true,false);
      parts.push(o.matrixWorld.elements.map(function(v){return v.toFixed(6);}).join(':'));
      var p=o.geometry.attributes.position.array;
      parts.push(p.length);
      var step=Math.max(1,Math.floor(p.length/60));
      for(var i=0;i<p.length;i+=step)parts.push(p[i].toFixed(6));
    });
    return parts.join('|');
  }
  var nondet=[];
  kinds.forEach(function(k){
    var a=SD.buildProp(k,specs[k]),b=SD.buildProp(k,specs[k]);
    if(geoSig(a)!==geoSig(b))nondet.push(k);
  });
  ok('build(spec) is deterministic - same spec, identical geometry',
     nondet.length===0,nondet.join(',')||'all 8 stable');

  /* THREE's Object3D constructor calls Math.random for UUIDs, so "no Math.random
     during build" is not assertable. Determinism of the VERTEX DATA is the property
     that actually matters, and it is proven above. Counted here for the record. */
  var realRandom=Math.random,randomCalls=0;
  Math.random=function(){randomCalls++;return realRandom();};
  SD.buildProp('cerealBox',specs.cerealBox);
  Math.random=realRandom;
  info('note: '+randomCalls+' Math.random calls during one build (THREE UUIDs) - '+
       'geometry is still byte-identical, see the determinism test above');

  /* ── 5. the spec actually drives the geometry ──────────────────────────── */
  var cb=SD.buildProp('cerealBox',Object.assign({},specs.cerealBox,{h:0.31}));
  ok('cerealBox height follows spec.h',near(cb.userData.size.y,0.31,1e-6),
     cb.userData.size.y.toFixed(5));
  var kb=SD.buildProp('keyboard',Object.assign({},specs.keyboard,{w:0.40}));
  ok('keyboard width follows spec.w',near(kb.userData.size.x,0.40,1e-6),
     kb.userData.size.x.toFixed(5));
  var pf=SD.buildProp('pictureFrame',Object.assign({},specs.pictureFrame,{w:0.24}));
  ok('pictureFrame width follows spec.w',near(pf.userData.size.x,0.24,1e-6),
     pf.userData.size.x.toFixed(5));
  var wc=SD.buildProp('wallClock',Object.assign({},specs.wallClock,{r:0.18}));
  ok('wallClock height follows 2*spec.r',near(wc.userData.size.y,0.36,1e-6),
     wc.userData.size.y.toFixed(5));
  var g1=SD.buildProp('gardenGnome',Object.assign({},specs.gardenGnome,{h:0.22}));
  var g2=SD.buildProp('gardenGnome',Object.assign({},specs.gardenGnome,{h:0.44}));
  ok('gardenGnome scales proportionally with spec.h',
     near(g2.userData.size.y/g1.userData.size.y,2,0.02),
     (g2.userData.size.y/g1.userData.size.y).toFixed(4));
  var k2=SD.buildProp('keyring',Object.assign({},specs.keyring,{count:7}));
  var k1=SD.buildProp('keyring',Object.assign({},specs.keyring,{count:2}));
  ok('keyring key count changes the mesh count',
     geoStats(k2).meshes>geoStats(k1).meshes,
     '2 keys='+geoStats(k1).meshes+' meshes, 7 keys='+geoStats(k2).meshes);

  /* ── 6. THE ONE THAT MATTERS: does similarity predict visible difference? ── */
  /* Metrics are normalized by the object's COVERAGE of the frame. A raw
     "% of pixels changed" saturates at whatever fraction of the thumbnail the prop
     occupies (~18% for a cereal box), so it cannot tell a 20-degree hue shift from
     a 150-degree one. `changed` is the share of the OBJECT that changed; `mean` is
     the average per-channel difference over the object, which scales smoothly. */
  var THUMB_BG=[26,24,38];   // must match the thumbnail scene background #1a1826
  function isBgPix(buf,i){
    return Math.abs(buf[i]-THUMB_BG[0])+Math.abs(buf[i+1]-THUMB_BG[1])+
           Math.abs(buf[i+2]-THUMB_BG[2])<12;
  }
  function pixDiff(a,b){
    var cov=0,changed=0,sum=0;
    for(var i=0;i<a.buf.length;i+=4){
      // UNION coverage: measuring only the ORIGINAL's silhouette hides everything a
      // variant adds outside it (a taller box, a longer curtain).
      if(isBgPix(a.buf,i)&&isBgPix(b.buf,i))continue;
      cov++;
      var d=Math.abs(a.buf[i]-b.buf[i])+Math.abs(a.buf[i+1]-b.buf[i+1])+
            Math.abs(a.buf[i+2]-b.buf[i+2]);
      sum+=d;
      if(d>18)changed++;
    }
    return {coverage:cov/(a.buf.length/4),
            changed:cov?changed/cov:0,      // share of the OBJECT that changed
            mean:cov?sum/(cov*3):0};        // 0..255 per channel, over the object
  }
  var t0=SD.propThumb('cerealBox',specs.cerealBox,96);
  ok('a thumbnail renders actual content, not a flat fill',(function(){
      var seen={},n=0;
      for(var i=0;i<t0.buf.length;i+=4){
        var key=(t0.buf[i]>>4)+','+(t0.buf[i+1]>>4)+','+(t0.buf[i+2]>>4);
        if(!seen[key]){seen[key]=1;n++;}
      }
      return n>=6;
    })(),'distinct colour buckets present');
  var t0b=SD.propThumb('cerealBox',specs.cerealBox,96);
  ok('thumbnails are deterministic for a fixed spec',pixDiff(t0,t0b).mean===0,
     'mean diff='+pixDiff(t0,t0b).mean);

  /* Hue-only ladder on a fixed-size box: framing is constant, so pixel difference
     is a clean read on perceptual change and raw delta is exactly monotonic. */
  var hb={hue:0,brand:'CRUNCH-O',mascot:'bird',pattern:'solid',h:0.30};
  var base=SD.propThumb('cerealBox',hb,96);
  var ladder=[5,20,60,150].map(function(dh){
    var s2=Object.assign({},hb,{hue:dh});
    return {dh:dh,raw:SP.specDelta('cerealBox',hb,s2).raw,
            d:pixDiff(base,SD.propThumb('cerealBox',s2,96))};
  });
  info('object covers '+(100*ladder[0].d.coverage).toFixed(1)+'% of the thumbnail frame');
  ladder.forEach(function(L){info('hue +'+(''+L.dh+'   ').slice(0,4)+
    ' raw='+L.raw.toFixed(4)+'  object pixels changed='+(100*L.d.changed).toFixed(1)+
    '%   mean channel diff='+L.d.mean.toFixed(1));});
  ok('raw delta rises monotonically along the hue ladder',
     ladder.every(function(L,i){return i===0||L.raw>ladder[i-1].raw;}));
  ok('VISIBLE change rises monotonically with it',
     ladder.every(function(L,i){return i===0||L.d.mean>=ladder[i-1].d.mean;}),
     ladder.map(function(L){return L.d.mean.toFixed(1);}).join(' -> '));
  ok('a 5-degree hue shift is nearly invisible',ladder[0].d.mean<12,
     'mean channel diff '+ladder[0].d.mean.toFixed(1)+'/255');
  ok('a 150-degree hue shift is unmistakable',
     ladder[3].d.mean>ladder[0].d.mean*4&&ladder[3].d.changed>0.85,
     'mean '+ladder[3].d.mean.toFixed(1)+' vs '+ladder[0].d.mean.toFixed(1)+
     ', '+(100*ladder[3].d.changed).toFixed(0)+'% of the object changed');

  /* Broader check across every kind: low-raw variants must look closer to the
     original than high-raw variants do. */
  var lowSum=0,lowN=0,hiSum=0,hiN=0,rng6=SD.mulberry32(31);
  kinds.forEach(function(k){
    var o=SP.randomSpec(k,rng6),ot=SD.propThumb(k,o,64);
    for(var i=0;i<6;i++){
      var st=0.03+i*0.16;
      var v=SP.mutateSpec(k,o,rng6,st);
      var raw=SP.specDelta(k,o,v).raw;
      var pd=pixDiff(ot,SD.propThumb(k,v,64)).mean;
      if(raw<0.10){lowSum+=pd;lowN++;}
      else if(raw>0.35){hiSum+=pd;hiN++;}
    }
  });
  var lowAvg=lowN?lowSum/lowN:0,hiAvg=hiN?hiSum/hiN:0;
  ok('sampled both ends of the range across all kinds',lowN>=5&&hiN>=5,
     'low-raw n='+lowN+', high-raw n='+hiN);
  ok('ACROSS ALL KINDS: high-raw variants look far more different than low-raw ones',
     hiAvg>lowAvg*1.5,
     'low-raw mean diff '+lowAvg.toFixed(1)+' vs high-raw '+hiAvg.toFixed(1)+' /255');

  /* ── 6b. variantNear: targeted shop stock ─────────────────────────────── */
  var rngV=SD.mulberry32(77),errs=[],worstErr=0;
  [97,92,80,65].forEach(function(target){
    kinds.forEach(function(k){
      var o=SP.randomSpec(k,rngV);
      var v=SP.variantNear(k,o,rngV,target);
      var got=SP.specDelta(k,o,v).similarity;
      var e=Math.abs(got-target);
      errs.push(e);if(e>worstErr)worstErr=e;
    });
  });
  var avgErr=errs.reduce(function(a,b){return a+b;},0)/errs.length;
  ok('variantNear hits its target similarity closely',avgErr<4,
     'mean error '+avgErr.toFixed(2)+' pts, worst '+worstErr.toFixed(2)+
     ' over '+errs.length+' targets');
  var rngD1=SD.mulberry32(5),rngD2=SD.mulberry32(5);
  var o1=SP.randomSpec('cerealBox',rngD1),o2=SP.randomSpec('cerealBox',rngD2);
  ok('variantNear is deterministic for a fixed seed',
     JSON.stringify(SP.variantNear('cerealBox',o1,rngD1,94))===
     JSON.stringify(SP.variantNear('cerealBox',o2,rngD2,94)));
  /* REGRESSION GUARD: thumbnails must be framed at a fixed per-kind scale. If they
     auto-fit each variant's own bbox, every size axis becomes invisible and the
     shop's compare card silently lies about the axis being bought. */
  var shortBox=Object.assign({},hb,{h:0.24}),tallBox=Object.assign({},hb,{h:0.34});
  var dSize=pixDiff(SD.propThumb('cerealBox',shortBox,96),SD.propThumb('cerealBox',tallBox,96));
  ok('a size-only change is VISIBLE in the thumbnail (fixed per-kind framing)',
     dSize.mean>8,'h 0.24 vs 0.34 -> mean channel diff '+dSize.mean.toFixed(1)+
     ', '+(100*dSize.changed).toFixed(0)+'% of the object');

  /* ⚠ SALIENCE MODELS HUMAN NOTICING, NOT PIXEL AREA. Do not "calibrate" salience
     against pixel difference — it would gut the design.
     APPEARANCE axes (hue, size, pattern) change many pixels and the correlation
     with raw delta holds — that is the hue ladder above and the cross-kind test.
     SEMANTIC axes (brand text, photo subject, slogan) change very few pixels but
     are enormously noticeable to a human: reading "FLAKEE" where "CRUNCH-O" used
     to be is the pitch's own opening example. The assertion below pins that
     intentional divergence so a future pixel-based "fix" fails loudly. */
  var rngL=SD.mulberry32(21);
  var lo=SP.randomSpec('cerealBox',rngL);
  var loT=SD.propThumb('cerealBox',lo,96);
  var v97=SP.variantNear('cerealBox',lo,rngL,97),v80=SP.variantNear('cerealBox',lo,rngL,80);
  var d97=pixDiff(loT,SD.propThumb('cerealBox',v97,96));
  var d80=pixDiff(loT,SD.propThumb('cerealBox',v80,96));
  var s97=SP.specDelta('cerealBox',lo,v97),s80=SP.specDelta('cerealBox',lo,v80);
  info('97% target -> '+s97.similarity.toFixed(1)+'% actual, axes: '+
    s97.diffs.map(function(x){return x.axis+'('+x.dist.toFixed(2)+')';}).join(' ')+
    '  visual '+d97.mean.toFixed(1));
  info('80% target -> '+s80.similarity.toFixed(1)+'% actual, axes: '+
    s80.diffs.map(function(x){return x.axis+'('+x.dist.toFixed(2)+')';}).join(' ')+
    '  visual '+d80.mean.toFixed(1));
  ok('SEMANTIC axes are high-salience by design, even at low pixel cost',
     s80.diffs.length===1&&s80.diffs[0].axis==='brand'&&s80.raw>0.15&&d80.mean<8,
     'brand-only swap = '+(100*s80.raw).toFixed(0)+'% spec delta but only '+
     d80.mean.toFixed(1)+'/255 pixel change - intentional, see the comment above');
  /* Within a SINGLE appearance axis, more spec delta must mean more visible change. */
  var apA=Object.assign({},hb,{hue:12}),apB=Object.assign({},hb,{hue:110});
  var dA=pixDiff(base,SD.propThumb('cerealBox',apA,96));
  var dB=pixDiff(base,SD.propThumb('cerealBox',apB,96));
  ok('within an appearance axis, bigger spec delta = bigger visible change',
     SP.specDelta('cerealBox',hb,apA).raw<SP.specDelta('cerealBox',hb,apB).raw&&
     dA.mean<dB.mean,
     'hue+12 '+dA.mean.toFixed(1)+'  <  hue+110 '+dB.mean.toFixed(1));

  /* ── 7. the montage artefact ───────────────────────────────────────────── */
  var mont=SD.propMontage(4,96,99);
  ok('montage canvas has the expected dimensions',
     mont.width===4*(96+8)+8&&mont.height===kinds.length*(96+8+18+15)+8,
     mont.width+'x'+mont.height);
  var mctx=mont.getContext('2d'),md=mctx.getImageData(0,0,mont.width,mont.height).data;
  var nonBg=0;
  for(var i=0;i<md.length;i+=4){
    if(md[i]!==11||md[i+1]!==10||md[i+2]!==18)nonBg++;
  }
  ok('montage is mostly drawn content, not empty background',
     nonBg/(md.length/4)>0.5,(100*nonBg/(md.length/4)).toFixed(1)+'% non-background');

  var eb=document.getElementById('err-banner');
  ok('no crash banner',!eb,eb?eb.textContent.slice(0,180):'');

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


/* ─────────────────────────────────────────────────────────────────────────────
   Milestone 12 — content: 12 prop kinds -> 30, and a 10-night run.

   18 kinds were authored in one pass, so nothing about them is taken on trust. The
   assertions here are the ones that catch generated content going quietly wrong:
   it builds, it is the size of the real object, and — the one that matters — every
   axis a kind DECLARES actually changes what you see. An axis the builder ignores is
   a change the player pays money for and nobody can perceive, which in a game about
   noticing is the worst bug available.
   ───────────────────────────────────────────────────────────────────────────── */
(function(){
var out=[],pass=0,fail=0;
function ok(name,cond,detail){
  if(cond){pass++;out.push('PASS  '+name+(detail?'   ('+detail+')':''));}
  else    {fail++;out.push('FAIL  '+name+(detail?'   ('+detail+')':''));}
}
function info(s){out.push('      '+s);}

try{
  var SD=window.__SD;
  ok('__SD present',!!SD); if(!SD)throw new Error('no __SD');
  var C=SD.CONST,SPEC=SD.SPEC;
  SD.stopLoop();
  SD.startHouse();

  /* ── 1. the registry ───────────────────────────────────────────────────────*/
  var kinds=Object.keys(SD.PROP_KINDS);
  ok('there are 30 prop kinds',kinds.length===30,kinds.length+' kinds');
  ok('every kind has a builder',
     kinds.every(function(k){return typeof SD.PROP_KINDS[k].build==='function';}),
     kinds.filter(function(k){return !SD.PROP_KINDS[k].build;}).join(', ')||'all wired');
  ok('every kind has a material the audio layer understands',
     kinds.every(function(k){
       return ['ceramic','glass','metal','cloth','paper','soil','card','plastic','wood']
         .indexOf(SD.PROP_KINDS[k].mtl)>=0;}),
     kinds.filter(function(k){
       return ['ceramic','glass','metal','cloth','paper','soil','card','plastic','wood']
         .indexOf(SD.PROP_KINDS[k].mtl)<0;}).join(', ')||'all valid');
  ok('every alienName is unique',
     Object.keys(kinds.reduce(function(a,k){a[SD.PROP_KINDS[k].alienName]=1;return a;},{}))
       .length===kinds.length);
  ok('plausibility stays inside its meaningful range',
     kinds.every(function(k){var p=SD.PROP_KINDS[k].plaus;return p>=0.1&&p<=0.95;}));
  ok('every kind is priced',
     kinds.every(function(k){var p=SD.PROP_KINDS[k].price;
       return p&&p.length===2&&p[0]>0&&p[1]>p[0];}));

  /* ── 2. every kind BUILDS, and is the size of the real thing ───────────────*/
  var broke=[],huge=[],tiny=[],nan=[];
  kinds.forEach(function(k){
    var g=null;
    try{g=SD.buildProp(k,SPEC.randomSpec(k,SD.mulberry32(11)));}catch(e){broke.push(k);return;}
    if(!g){broke.push(k);return;}
    var s=g.userData&&g.userData.size,meshes=0,bad=0;
    if(!s||!isFinite(s.x)||!isFinite(s.y)||!isFinite(s.z)){nan.push(k);SD.disposeProp(g);return;}
    g.traverse(function(o){
      if(!o.isMesh)return;
      meshes++;
      var p=o.geometry&&o.geometry.attributes&&o.geometry.attributes.position;
      if(!p){bad++;return;}
      for(var i=0;i<p.count*3;i++)if(!isFinite(p.array[i])){bad++;break;}
    });
    if(bad||!meshes)broke.push(k+'(geom)');
    var big=Math.max(s.x,s.y,s.z);
    if(big>2.6)huge.push(k+' '+big.toFixed(2)+'m');
    if(big<0.012)tiny.push(k+' '+big.toFixed(3)+'m');
    SD.disposeProp(g);
  });
  ok('EVERY KIND BUILDS, with finite geometry',broke.length===0&&nan.length===0,
     broke.concat(nan).join(', ')||kinds.length+' built clean');
  ok('nothing is absurdly large',huge.length===0,huge.join(', ')||'all under 2.6m');
  ok('nothing is invisibly small',tiny.length===0,tiny.join(', ')||'all over 12mm');

  /* ── 3. THE ONE THAT MATTERS: no dead axes ─────────────────────────────────
     A signature over world matrices + |vertices| + texture identity. All three parts
     are load-bearing: a box is symmetric about its origin so a signed vertex sum
     barely moves when you scale it; anything expressed as a rotation or a position
     never touches the vertex buffer at all; and most IDENTITY axes are texture-only —
     a brand name moves nothing. canvasTex caches by a key that must capture every
     spec value the draw reads, so sharing a texture object means sharing that key. */
  function sig(k,spec){
    var g;try{g=SD.buildProp(k,spec);}catch(e){return 'ERR';}
    if(!g)return 'NULL';
    g.updateMatrixWorld(true);
    var n=0,acc=0;
    g.traverse(function(o){
      if(!o.isMesh)return;
      var p=o.geometry.attributes.position;
      n+=p.count;
      for(var i=0;i<p.count*3;i+=3)acc+=Math.abs(p.array[i])*(i%13+1);
      var e=o.matrixWorld.elements;
      for(var j=0;j<16;j++)acc+=Math.abs(e[j])*(j+3);
      var m=o.material,ms=Array.isArray(m)?m:[m];
      ms.forEach(function(mm){
        if(!mm)return;
        if(mm.map&&mm.map.uuid){var u=mm.map.uuid,h=0;
          for(var q=0;q<u.length;q++)h=(h*31+u.charCodeAt(q))>>>0;
          acc+=h%100003;}
        if(mm.color)acc+=mm.color.r*7+mm.color.g*13+mm.color.b*17;
      });
    });
    SD.disposeProp(g);
    return n+'|'+acc.toFixed(4);
  }
  var dead=[],axisTotal=0;
  kinds.forEach(function(k){
    var K=SD.PROP_KINDS[k],base=SPEC.randomSpec(k,SD.mulberry32(4242)),b=sig(k,base);
    Object.keys(K.axes).forEach(function(a){
      var d=K.axes[a],alt=JSON.parse(JSON.stringify(base));
      if(d.t==='hue')alt[a]=(base[a]+180)%360;
      else if(d.t==='num')alt[a]=(base[a]-d.min)<(d.max-d.min)/2?d.max:d.min;
      else if(d.t==='bool')alt[a]=!base[a];
      else if(d.t==='enum'){var o2=d.v.filter(function(v){return v!==base[a];})[0];
                            if(o2===undefined)return;alt[a]=o2;}
      axisTotal++;
      if(sig(k,alt)===b)dead.push(k+'.'+a);
    });
  });
  ok('EVERY DECLARED AXIS ACTUALLY CHANGES THE OBJECT',dead.length===0,
     dead.length?dead.join(', '):axisTotal+' axes across '+kinds.length+' kinds, all live');
  info('an axis the builder ignores is a change the player pays for and cannot see');
  ok('every kind has a high-salience identity axis',
     kinds.every(function(k){
       var K=SD.PROP_KINDS[k];
       return Object.keys(K.axes).some(function(a){return K.axes[a].sal>=0.85;});}),
     'the "that is not my mug" axis');

  /* ── 4. the content is in the WORLD, not just the registry ─────────────────*/
  ok('the street is furnished',SD.objects.length>=30,SD.objects.length+' objects');
  var per={};
  SD.objects.forEach(function(o){per[o.house]=(per[o.house]||0)+1;});
  ok('every neighbour house has ten things in it',
     ['hoyt','vance','okonkwo'].every(function(h){return per[h]>=10;}),
     Object.keys(per).map(function(h){return h+':'+per[h];}).join(' '));
  var used={};SD.objects.forEach(function(o){used[o.kind]=1;});
  ok('the new kinds are actually placed, not just registered',
     Object.keys(used).length>=16,
     Object.keys(used).length+' distinct kinds in play');
  ok('every object still has a real owner',
     SD.objects.every(function(o){return !!SD.RESIDENTS[o.owner];}));
  ok('every object still has a mesh in the scene',
     SD.objects.every(function(o){return o.group&&o.group.parent===SD.scene;}),
     SD.objects.filter(function(o){return !(o.group&&o.group.parent);})
       .map(function(o){return o.label;}).join(', ')||'all '+SD.objects.length+' in the scene');
  ok('nothing was placed below the floor',
     SD.objects.every(function(o){return o.spec._pos[1]>=-0.001;}),
     SD.objects.filter(function(o){return o.spec._pos[1]<-0.001;})
       .map(function(o){return o.label;}).join(', ')||'all at or above y=0');
  ok('nothing was placed outside the lots',
     SD.objects.every(function(o){
       var h=SD.houseById(o.house);
       return h&&Math.abs(o.spec._pos[0]-h.x)<8&&Math.abs(o.spec._pos[2])<10;}),
     'all within their own lot');

  /* ── 5. a longer run ───────────────────────────────────────────────────────*/
  ok('a run is ten nights',C.SLICE_NIGHTS===10,C.SLICE_NIGHTS+' nights');
  ok('the deadline actually ends it',(function(){
     SD.startHouse();SD.GAME.day=C.SLICE_NIGHTS+1;
     var e=SD.checkEnding();
     return e&&e.kind==='timeout';})(),'day '+(C.SLICE_NIGHTS+1)+' -> timeout');
  ok('...and one night short does NOT',(function(){
     SD.startHouse();SD.GAME.day=C.SLICE_NIGHTS;
     return SD.checkEnding()===null;})());
  ok('the copy agrees with the constant',
     !/seven nights/i.test(document.getElementById('s-title').textContent),
     document.getElementById('s-title').querySelector('.sub').textContent.trim().slice(0,52)+'...');

  /* ── 6. the win threshold was re-measured, not left to drift ───────────────
     Both changes in this milestone (7->10 nights, 18->30 objects) make doubt easier
     to accumulate, so the threshold had to be checked against real play rather than
     assumed still valid. Collapse is a MEAN over residents, so the strategy that
     matters is spreading across the street, not hammering one house. */
  function play(perNight){
    SD.startHouse();SD.GAME.hk=99;SD.GAME.bank=1000000;
    var byOwner={};
    SD.objects.forEach(function(o){(byOwner[o.owner]=byOwner[o.owner]||[]).push(o);});
    var owners=Object.keys(byOwner),order=[],oi=0;
    while(order.length<SD.objects.length){
      var any=false;
      for(var w=0;w<owners.length;w++){var L=byOwner[owners[w]];
        if(oi<L.length){order.push(L[oi]);any=true;}}
      if(!any)break; oi++;
    }
    for(var n=0;n<C.SLICE_NIGHTS&&!SD.GAME.over;n++){
      SD.GAME.bought={};
      var did=0;
      for(var i=0;i<order.length&&did<perNight;i++){
        var o=order[i];
        SD.scanObject(o);
        var best=null,bd=-1;
        SD.STORES.forEach(function(st){
          SD.shopStock(o.id,st.id).forEach(function(it,idx){
            var p=SD.predict(o.id,it);
            if(p&&p.text==='DOUBT'&&p.delta>bd){bd=p.delta;best={s:st.id,i:idx};}
          });
        });
        if(!best)continue;
        SD.buyVariant(o.id,best.i,best.s);
        var mine=SD.invFor(o.id);
        if(mine.length){SD.swapWith(o,mine.length-1);did++;}
      }
      SD.doMorning();SD.checkEnding();
      SD.GAME.weekday=(SD.GAME.weekday+1)%7;
      if(SD.GAME.weekday===0)SD.GAME.week++;
    }
    return {ci:SD.collapseIndex(),over:SD.GAME.over?SD.GAME.over.kind:'none'};
  }
  /* TWO runs, not three. Each one generates shop stock for 30 objects across 3 shops
     every night, and variantNear searches 28 mutations per rung — a third run pushed
     this suite past the harness's virtual-time budget and hung the browser. The
     middle of the curve lives in tools/_balance.js, which is a diagnostic and can
     afford to be slow; the gate only needs the two ends. */
  var lazy=play(1),diligent=play(4);
  info('one a night   -> collapse '+lazy.ci.toFixed(1)+'  ('+lazy.over+')');
  info('four a night  -> collapse '+diligent.ci.toFixed(1)+'  ('+diligent.over+')');
  info('(two a night reaches 37.5 and times out — see tools/_balance.js)');
  info('threshold is '+C.SLICE_WIN_COLLAPSE);
  ok('A DILIGENT TEN-NIGHT RUN IS WINNABLE',diligent.over==='win',
     'four a night, spread across the street -> '+diligent.ci.toFixed(1));
  ok('...and doing the bare minimum is not',lazy.over!=='win',
     'one a night -> '+lazy.ci.toFixed(1)+' vs '+C.SLICE_WIN_COLLAPSE);
  ok('the threshold sits ABOVE the lazy run and BELOW the diligent one',
     lazy.ci<C.SLICE_WIN_COLLAPSE&&diligent.ci>=C.SLICE_WIN_COLLAPSE,
     lazy.ci.toFixed(1)+' < '+C.SLICE_WIN_COLLAPSE+' <= '+diligent.ci.toFixed(1));
  info('SPREADING beats hammering one house, because Collapse is a mean over residents');

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

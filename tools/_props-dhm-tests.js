/* Scratch suite for doormat / houseNumber / mailbox. Not shipped. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
  else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}
try{
  var SD=window.__SD;ok('__SD present',!!SD);if(!SD)throw new Error('no __SD');
  var SP=SD.SPEC,K=SD.PROP_KINDS,NEW=['doormat','houseNumber','mailbox'];
  var MTL=['ceramic','glass','metal','cloth','paper','soil','card','plastic','wood'];
  var CAT=['kitchen','living','bedroom','hall','garden'];
  var SEED=['provision','identity','memory','order','precision','tech'];

  /* ── 0. the data table ─────────────────────────────────────────── */
  NEW.forEach(function(k){
    ok(k+': registered with a build()',!!K[k]&&typeof K[k].build==='function');
    if(!K[k])return;
    var d=K[k],ax=Object.keys(d.axes);
    var hi=ax.filter(function(a){return d.axes[a].sal>=0.90&&d.axes[a].sal<=1.00;});
    ok(k+': 3-5 axes',ax.length>=3&&ax.length<=5,ax.join(','));
    ok(k+': exactly one identity axis at sal 0.90-1.00',hi.length===1,hi.join(',')||'none');
    ok(k+': has a num size axis',ax.some(function(a){return d.axes[a].t==='num';}));
    ok(k+': cat/mtl/seeds legal',CAT.indexOf(d.cat)>=0&&MTL.indexOf(d.mtl)>=0&&
       (d.seeds||[]).every(function(z){return SEED.indexOf(z)>=0;}),
       d.cat+'/'+d.mtl+'/['+(d.seeds||[]).join(' ')+']');
    ok(k+': plaus + price sane',d.plaus>=0.10&&d.plaus<=0.95&&d.price[0]>0&&d.price[0]<d.price[1],
       d.plaus+' $'+d.price.join('-'));
  });
  var names={};Object.keys(K).forEach(function(k){names[K[k].alienName]=(names[K[k].alienName]||0)+1;});
  ok('every alienName in the registry is unique',
     Object.keys(names).every(function(n){return names[n]===1;}),
     Object.keys(names).filter(function(n){return names[n]>1;}).join(' / ')||'all unique');

  /* ── 1. placement contract + budgets over many random specs ────── */
  function stats(g){var t=0,nan=0,m=0;
    g.traverse(function(o){if(!o.isMesh||!o.geometry)return;m++;
      var p=o.geometry.attributes.position;if(!p)return;
      t+=o.geometry.index?o.geometry.index.count/3:p.count/3;
      for(var i=0;i<p.array.length;i++)if(!isFinite(p.array[i]))nan++;});
    return {tris:Math.round(t),nan:nan,meshes:m};}
  var rng=SD.mulberry32(909);
  var badBase=[],badMid=[],badTri=[],badMesh=[],badNaN=[];
  NEW.forEach(function(k){
    var wt=0,wm=0,sz='';
    for(var i=0;i<12;i++){
      var sp=SP.randomSpec(k,rng),g=SD.buildProp(k,sp);
      var bb=new THREE.Box3().setFromObject(g),st=stats(g);
      if(Math.abs(bb.min.y)>1e-6)badBase.push(k+'='+bb.min.y.toFixed(5));
      if(Math.abs(bb.min.x+bb.max.x)>1e-6||Math.abs(bb.min.z+bb.max.z)>1e-6)badMid.push(k);
      if(st.tris>=3000)badTri.push(k+'='+st.tris);
      if(st.meshes>14)badMesh.push(k+'='+st.meshes);
      if(st.nan)badNaN.push(k+'='+st.nan);
      if(st.tris>wt)wt=st.tris; if(st.meshes>wm)wm=st.meshes;
      if(i===0)sz=g.userData.size.x.toFixed(3)+' x '+g.userData.size.y.toFixed(3)+
                  ' x '+g.userData.size.z.toFixed(3);
      SD.disposeProp(g);
    }
    info('geom '+(k+'            ').slice(0,12)+' worst tris='+wt+'  worst meshes='+wm+
         '  sample size='+sz+' m');
  });
  ok('base sits on y=0',badBase.length===0,badBase.join(' ')||'all ok');
  ok('centred on the footprint',badMid.length===0,badMid.join(' ')||'all ok');
  ok('under the 3000-triangle budget',badTri.length===0,badTri.join(' ')||'all ok');
  ok('under 14 meshes (the m3 ceiling)',badMesh.length===0,badMesh.join(' ')||'all ok');
  ok('no NaN vertices',badNaN.length===0,badNaN.join(' ')||'clean');

  /* worst case over EVERY enum branch, not just the sampled ones */
  var wcBad=[];
  NEW.forEach(function(k){
    var ax=K[k].axes,base=SP.randomSpec(k,rng),worst=0;
    Object.keys(ax).forEach(function(a){
      var d=ax[a],vals=d.t==='enum'?d.v:(d.t==='bool'?[true,false]:
        (d.t==='hue'?[0,180]:[d.min,d.max]));
      vals.forEach(function(v){var s2=Object.assign({},base);s2[a]=v;
        var g=SD.buildProp(k,s2),n=stats(g).meshes;SD.disposeProp(g);if(n>worst)worst=n;});
    });
    info('worst-case mesh count over all branches: '+k+'='+worst);
    if(worst>14)wcBad.push(k+'='+worst);
  });
  ok('worst-case branch still under 14 meshes',wcBad.length===0,wcBad.join(' ')||'all ok');

  /* ── 2. real-world metres ──────────────────────────────────────── */
  var s0={};NEW.forEach(function(k){s0[k]=SP.randomSpec(k,rng);});
  var dm=SD.buildProp('doormat',Object.assign({},s0.doormat,{w:0.60,border:'none'}));
  ok('doormat: 0.60m wide, mat-thin',
     Math.abs(dm.userData.size.x-0.60)<1e-6&&dm.userData.size.y<0.03,
     dm.userData.size.x.toFixed(3)+'m x '+dm.userData.size.z.toFixed(3)+'m, '+
     dm.userData.size.y.toFixed(3)+'m thick');
  var hn=SD.buildProp('houseNumber',Object.assign({},s0.houseNumber,{h:0.15}));
  ok('houseNumber: height follows spec.h',Math.abs(hn.userData.size.y-0.15)<1e-6,
     hn.userData.size.y.toFixed(4)+'m tall, '+hn.userData.size.x.toFixed(3)+'m wide');
  var m10=SD.buildProp('mailbox',Object.assign({},s0.mailbox,{h:1.00,flag:false}));
  var m12=SD.buildProp('mailbox',Object.assign({},s0.mailbox,{h:1.20,flag:false}));
  ok('mailbox: ~1.0m tall including the post',Math.abs(m10.userData.size.y-1.00)<1e-6,
     m10.userData.size.y.toFixed(4)+'m tall, box '+m10.userData.size.z.toFixed(3)+'m deep');
  ok('mailbox: height follows spec.h',Math.abs(m12.userData.size.y-1.20)<1e-6,
     m12.userData.size.y.toFixed(4));
  var mbBox=SD.buildProp('mailbox',Object.assign({},s0.mailbox,{h:1.00,shape:'box',flag:false}));
  ok('mailbox: the box shape is the same height as the tunnel',
     Math.abs(mbBox.userData.size.y-1.00)<1e-6,mbBox.userData.size.y.toFixed(4));

  /* ── 3. determinism ────────────────────────────────────────────── */
  function sig(g){var p=[];g.traverse(function(o){
      if(!o.isMesh||!o.geometry||!o.geometry.attributes.position)return;
      o.updateWorldMatrix(true,false);
      p.push(o.matrixWorld.elements.map(function(v){return v.toFixed(6);}).join(':'));
      var a=o.geometry.attributes.position.array;p.push(a.length);
      var st=Math.max(1,Math.floor(a.length/60));
      for(var i=0;i<a.length;i+=st)p.push(a[i].toFixed(6));});
    return p.join('|');}
  var nondet=[];
  NEW.forEach(function(k){if(sig(SD.buildProp(k,s0[k]))!==sig(SD.buildProp(k,s0[k])))nondet.push(k);});
  ok('build(spec) is deterministic',nondet.length===0,nondet.join(',')||'all stable');

  /* ── 4. RULE 5a: reads exactly the declared axes ───────────────── */
  var readErr=[];
  NEW.forEach(function(k){
    var declared=Object.keys(K[k].axes),seen={};
    var prox=new Proxy(s0[k],{get:function(t,p){if(typeof p==='string')seen[p]=1;return t[p];}});
    SD.buildProp(k,prox);
    var extra=declared.length?Object.keys(seen).filter(function(p){return declared.indexOf(p)<0;}):[];
    var never=declared.filter(function(p){return !seen[p];});
    if(extra.length)readErr.push(k+' reads undeclared: '+extra.join(','));
    if(never.length)readErr.push(k+' never reads: '+never.join(','));
  });
  ok('builders read exactly their declared axes',readErr.length===0,
     readErr.join(' | ')||'all three exact');
  /* enum branches can hide an unread axis - re-run the proxy over every branch */
  var readErr2=[];
  NEW.forEach(function(k){
    var ax=K[k].axes,declared=Object.keys(ax);
    declared.forEach(function(a){
      var d=ax[a];if(d.t!=='enum'&&d.t!=='bool')return;
      (d.t==='enum'?d.v:[true,false]).forEach(function(v){
        var base=Object.assign({},s0[k]);base[a]=v;var seen={};
        SD.buildProp(k,new Proxy(base,{get:function(t,p){if(typeof p==='string')seen[p]=1;return t[p];}}));
        Object.keys(seen).forEach(function(p){
          if(declared.indexOf(p)<0&&readErr2.indexOf(k+'.'+p)<0)readErr2.push(k+'.'+p);});
      });
    });
  });
  ok('no branch reads an undeclared key',readErr2.length===0,readErr2.join(' ')||'clean');

  /* ── 5. RULE 5b + RULE 2: every axis changes what you SEE ───────
     A canvasTex key that misses a value also fails here: the cache would hand back
     the stale texture and the pixels would come out identical. */
  var BG=[26,24,38];
  function bg(b,i){return Math.abs(b[i]-BG[0])+Math.abs(b[i+1]-BG[1])+Math.abs(b[i+2]-BG[2])<12;}
  function diff(a,b){var cov=0,sum=0,ch=0;
    for(var i=0;i<a.buf.length;i+=4){
      if(bg(a.buf,i)&&bg(b.buf,i))continue;cov++;
      var d=Math.abs(a.buf[i]-b.buf[i])+Math.abs(a.buf[i+1]-b.buf[i+1])+Math.abs(a.buf[i+2]-b.buf[i+2]);
      sum+=d;if(d>18)ch++;}
    return {mean:cov?sum/(cov*3):0,changed:cov?ch/cov:0};}
  var dead=[];
  NEW.forEach(function(k){
    var ax=K[k].axes,mid={};
    for(var a in ax)mid[a]=ax[a].t==='num'?(ax[a].min+ax[a].max)/2:
      (ax[a].t==='enum'?ax[a].v[0]:(ax[a].t==='hue'?30:false));
    if(k==='mailbox')mid.name='HOYT';
    var bt=SD.propThumb(k,mid,128);
    Object.keys(ax).forEach(function(a){
      var d=ax[a],alts;
      if(d.t==='hue')alts=[200];
      else if(d.t==='num')alts=[d.min,d.max];
      else if(d.t==='bool')alts=[!mid[a]];
      else alts=d.v.filter(function(v){return v!==mid[a];});
      var worst=1e9,det=[];
      alts.forEach(function(v){
        var s2=Object.assign({},mid);s2[a]=v;
        var m=diff(bt,SD.propThumb(k,s2,128)).mean;
        det.push(v+'='+m.toFixed(1));if(m<worst)worst=m;});
      /* SEMANTIC axes (a word, a number, a surname) are deliberately tiny in pixels
         and enormous in salience - the same divergence m3 pins for cerealBox.brand
         (a brand-only swap is asserted to be UNDER 8/255). They only have to be
         non-zero; the appearance axes carry the pixel bar. */
      var sem=(a==='digits'||a==='name'||a==='word');
      info('axis '+(k+'.'+a+'                    ').slice(0,24)+' from '+mid[a]+
           ' -> '+det.join('  ')+(sem?'   [semantic]':''));
      if(worst<(sem?0.30:1.0))dead.push(k+'.'+a+'='+worst.toFixed(2));
    });
  });
  ok('EVERY axis value is visibly different from the reference',dead.length===0,
     dead.join(' ')||'no dead axes');

  /* ── 6. RULE 2 directly: the texture key covers every value it reads ── */
  function maps(k,sp){var g=SD.buildProp(k,sp),u=[];
    g.traverse(function(o){if(o.isMesh){[].concat(o.material).forEach(function(m){
      if(m&&m.map)u.push(m.map.uuid);});}});
    SD.disposeProp(g);return u.sort().join(',');}
  var keyBad=[];
  [['doormat','hue',210],['doormat','word','GO AWAY'],['doormat','border','rope'],
   ['doormat','weave','rubber'],
   ['houseNumber','plateHue',300],['houseNumber','digits','13'],
   ['houseNumber','numerals','stencil'],['houseNumber','finish','chrome'],
   ['mailbox','name','VANCE'],['mailbox','hue',120]].forEach(function(t){
    var k=t[0],a=t[1],v=t[2],base={},ax=K[k].axes;
    for(var q in ax)base[q]=ax[q].t==='num'?(ax[q].min+ax[q].max)/2:
      (ax[q].t==='enum'?ax[q].v[0]:(ax[q].t==='hue'?30:false));
    if(k==='mailbox')base.name='HOYT';
    var s2=Object.assign({},base);s2[a]=v;
    if(maps(k,base)===maps(k,s2))keyBad.push(k+'.'+a);
  });
  ok('canvasTex keys capture every spec value their draw reads',keyBad.length===0,
     keyBad.join(' ')||'all keys complete');

  var eb=document.getElementById('err-banner');
  ok('no crash banner',!eb,eb?eb.textContent.slice(0,200):'');
}catch(e){
  fail++;out.push('FAIL  harness threw: '+(e&&e.message)+' @ '+
    String((e&&e.stack)||'').split('\n').slice(0,3).join(' | '));
}
var summary='SDTEST '+(fail===0?'ALL-PASS':'FAILURES')+' pass='+pass+' fail='+fail;
var pre=document.createElement('pre');pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\n'+summary+'\n'+out.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);document.title=summary;
})();

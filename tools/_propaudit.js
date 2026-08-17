/* Scratch audit for three new prop kinds (spiceJar / saltShaker / cuttingBoard).
   Checks the two rules that fail SILENTLY:
     rule 2 - the canvasTex key captures every spec value the draw reads
     rule 5 - every declared axis is read, and no undeclared key is read
   plus an exhaustive build over every enum/bool combination. Not a shipping suite. */
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
  var SP=SD.SPEC,K=SD.PROP_KINDS;
  var MINE=['spiceJar','saltShaker','cuttingBoard'];
  /* axes whose art I intend to live in a canvas texture — the key must name them */
  var TEXAXES={spiceJar:['label','hue'],saltShaker:['holes'],cuttingBoard:['grain','hue']};

  ok('all three kinds are registered with a build()',
     MINE.every(function(k){return K[k]&&typeof K[k].build==='function';}));

  /* ── axis-table shape ──────────────────────────────────────────────────── */
  var SEEDS=['provision','identity','memory','order','precision','tech'];
  var MTL=['ceramic','glass','metal','cloth','paper','soil','card','plastic','wood'];
  var CAT=['kitchen','living','bedroom','hall','garden'];
  MINE.forEach(function(k){
    var d=K[k],ax=d.axes,keys=Object.keys(ax);
    var hi=keys.filter(function(a){return ax[a].sal>=0.90&&ax[a].sal<=1.00;});
    var nums=keys.filter(function(a){return ax[a].t==='num';});
    ok(k+': 3-5 axes',keys.length>=3&&keys.length<=5,keys.length+' — '+keys.join(','));
    ok(k+': EXACTLY ONE axis at salience 0.90-1.00',hi.length===1,hi.join(',')||'none');
    ok(k+': has a num size axis the shop can sell you',nums.length>=1,nums.join(','));
    ok(k+': cat/mtl/seeds are from the allowed vocabularies',
       CAT.indexOf(d.cat)>=0&&MTL.indexOf(d.mtl)>=0&&
       (d.seeds||[]).every(function(s){return SEEDS.indexOf(s)>=0;}),
       d.cat+'/'+d.mtl+'/['+(d.seeds||[]).join(' ')+']');
    ok(k+': plaus in range, price sane',
       d.plaus>=0.10&&d.plaus<=0.95&&d.price[0]>0&&d.price[1]>d.price[0]);
  });
  var names={};Object.keys(K).forEach(function(k){
    names[K[k].alienName]=(names[K[k].alienName]||0)+1;});
  var dup=Object.keys(names).filter(function(n){return names[n]>1;});
  ok('no duplicated alienName anywhere in the registry',dup.length===0,dup.join(' | ')||'all unique');

  /* ── exhaustive combination build ──────────────────────────────────────── */
  function combosFor(k){
    var ax=K[k].axes,keys=Object.keys(ax),combos=[{}];
    keys.forEach(function(a){
      var d=ax[a],vals;
      if(d.t==='enum')vals=d.v.slice();
      else if(d.t==='bool')vals=[true,false];
      else if(d.t==='num')vals=[d.min,(d.min+d.max)/2,d.max];
      else vals=[0,95,200,330];
      var next=[];
      combos.forEach(function(c){vals.forEach(function(v){
        var n=Object.assign({},c);n[a]=v;next.push(n);});});
      combos=next;
    });
    return combos;
  }
  MINE.forEach(function(k){
    var combos=combosFor(k),threw=null,badBase=null,nan=0,maxT=0,maxM=0,minY=1e9,maxY=0;
    combos.forEach(function(sp){
      var g;
      try{g=SD.buildProp(k,sp);}
      catch(e){if(!threw)threw=JSON.stringify(sp)+' -> '+e.message;return;}
      var bb=new THREE.Box3().setFromObject(g),tris=0,meshes=0;
      g.traverse(function(o){
        if(!o.isMesh||!o.geometry)return;
        meshes++;
        var p=o.geometry.attributes.position;if(!p)return;
        tris+=o.geometry.index?o.geometry.index.count/3:p.count/3;
        for(var i=0;i<p.array.length;i++)if(!isFinite(p.array[i]))nan++;
      });
      if(Math.abs(bb.min.y)>1e-6&&!badBase)badBase=JSON.stringify(sp)+' base y='+bb.min.y;
      if(tris>maxT)maxT=tris; if(meshes>maxM)maxM=meshes;
      var sz=g.userData.size.y; if(sz<minY)minY=sz; if(sz>maxY)maxY=sz;
      SD.disposeProp(g);
    });
    ok(k+': every enum/bool/num combination builds ('+combos.length+' specs)',!threw,threw||'clean');
    ok(k+': no NaN vertices in any combination',nan===0,nan+' bad floats');
    ok(k+': base sits at y=0 in every combination',!badBase,badBase||'all ok');
    ok(k+': stays inside the tri/mesh budget',maxT<3000&&maxM<=14,
       'worst '+Math.round(maxT)+' tris, '+maxM+' meshes');
    info(k+': height range across all combos '+minY.toFixed(3)+'m .. '+maxY.toFixed(3)+'m');
  });

  /* ── rule 5: reads exactly the declared axes, nothing more ─────────────── */
  MINE.forEach(function(k){
    var declared=Object.keys(K[k].axes),seen={};
    combosFor(k).forEach(function(sp){
      /* the draw callback closes over this same object, so texture reads are counted */
      var prox=new Proxy(sp,{get:function(t,p){
        if(typeof p==='string')seen[p]=1; return t[p];}});
      K[k].build(prox);
    });
    var read=Object.keys(seen);
    var extra=read.filter(function(p){return declared.indexOf(p)<0;});
    var dead =declared.filter(function(p){return read.indexOf(p)<0;});
    ok(k+': reads NO undeclared spec key',extra.length===0,extra.join(',')||'none');
    ok(k+': every declared axis is actually read',dead.length===0,
       dead.length?('DEAD AXIS: '+dead.join(',')):read.sort().join(','));
  });

  /* ── rule 2: the canvasTex key names every axis the draw uses ──────────── */
  function mapsOf(g){var m=[];g.traverse(function(o){
    if(!o.isMesh)return;
    (Array.isArray(o.material)?o.material:[o.material]).forEach(function(mt){
      if(mt&&mt.map)m.push(mt.map);});});
    return m;}
  function texPix(t){
    var img=t.image,c=document.createElement('canvas');
    c.width=img.width;c.height=img.height;
    c.getContext('2d').drawImage(img,0,0);
    return c.getContext('2d').getImageData(0,0,c.width,c.height).data;
  }
  function pixSame(a,b){
    if(a.length!==b.length)return false;
    for(var i=0;i<a.length;i+=4)if(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2])return false;
    return true;
  }
  function otherVal(d,v){
    if(d.t==='enum')return d.v.filter(function(x){return x!==v;})[0];
    if(d.t==='bool')return !v;
    if(d.t==='num')return (v===d.max?d.min:d.max);
    return (v+150)%360;
  }
  var rng=SD.mulberry32(777);
  MINE.forEach(function(k){
    var base=SP.randomSpec(k,rng),ax=K[k].axes;
    TEXAXES[k].forEach(function(a){
      var alt=Object.assign({},base);alt[a]=otherVal(ax[a],base[a]);
      var gA=SD.buildProp(k,base),gB=SD.buildProp(k,alt);
      var mA=mapsOf(gA),mB=mapsOf(gB);
      /* if the key omitted this axis, _texCache hands back the SAME texture object */
      var sameObj=mA.length===mB.length&&mA.every(function(t,i){return t===mB[i];});
      var sameArt=mA.length===mB.length&&mA.every(function(t,i){
        return pixSame(texPix(t),texPix(mB[i]));});
      ok(k+'.'+a+': the texture KEY captures it (art really changes)',
         !sameObj&&!sameArt,
         sameObj?'CACHE HIT — key is missing '+a:(sameArt?'same pixels':'new texture, new pixels'));
      SD.disposeProp(gA);SD.disposeProp(gB);
    });
  });

  /* ── label art must fit INSIDE its canvas, with margin on both sides ───── */
  K.spiceJar.axes.label.v.forEach(function(lv){
    var g=SD.buildProp('spiceJar',{hue:20,label:lv,lid:'black',h:0.11});
    var m=mapsOf(g)[0],px=texPix(m),W=m.image.width,H=m.image.height;
    var minX=1e9,maxX=-1;
    for(var y=Math.floor(H*0.18);y<H*0.70;y++)for(var xx=0;xx<W;xx++){
      var i=(y*W+xx)*4;
      if(px[i]<110&&px[i+1]<110&&px[i+2]<110){if(xx<minX)minX=xx;if(xx>maxX)maxX=xx;}
    }
    var lm=minX/W,rm=(W-1-maxX)/W;
    ok('spiceJar label "'+lv+'" fits its canvas with margin both sides',
       minX>2&&maxX<W-3&&Math.abs(lm-rm)<0.04,
       'ink spans x '+minX+'..'+maxX+' of '+W+'  (margins '+(100*lm).toFixed(1)+'% / '+
       (100*rm).toFixed(1)+'%, width '+(100*(maxX-minX)/W).toFixed(1)+'% of canvas)');
    SD.disposeProp(g);
  });

  /* ── every axis is VISIBLE: change one axis, look at the thumbnail ─────── */
  function pixDiff(a,b){
    var n=0,sum=0;
    for(var i=0;i<a.buf.length;i+=4){
      var d=Math.abs(a.buf[i]-b.buf[i])+Math.abs(a.buf[i+1]-b.buf[i+1])+
            Math.abs(a.buf[i+2]-b.buf[i+2]);
      if(d>8)n++; sum+=d/3;
    }
    return {mean:sum/(a.buf.length/4),changed:n/(a.buf.length/4)};
  }
  /* Coverage = the object's share of the frame. A spice jar is a fraction of the
     frame a cereal box fills, so a RAW frame-mean confounds "small prop" with
     "invisible axis". Normalising by coverage measures what actually matters:
     how much of the OBJECT changed. */
  function coverage(t){
    var bg=[t.buf[0],t.buf[1],t.buf[2]],n=0;
    for(var i=0;i<t.buf.length;i+=4){
      if(Math.abs(t.buf[i]-bg[0])+Math.abs(t.buf[i+1]-bg[1])+
         Math.abs(t.buf[i+2]-bg[2])>12)n++;
    }
    return Math.max(n/(t.buf.length/4),0.001);
  }
  MINE.forEach(function(k){
    var base=SP.randomSpec(k,rng),ax=K[k].axes,t0=SD.propThumb(k,base,96);
    var cov=coverage(t0),weak=[];
    info(k+': object covers '+(100*cov).toFixed(1)+'% of the thumbnail frame');
    Object.keys(ax).forEach(function(a){
      var alt=Object.assign({},base);alt[a]=otherVal(ax[a],base[a]);
      var d=pixDiff(t0,SD.propThumb(k,alt,96)),norm=d.mean/cov;
      info('  '+(k+'.'+a+'              ').slice(0,26)+' frame-mean '+d.mean.toFixed(2)+
           '   ON-OBJECT '+norm.toFixed(2)+'/255   '+
           (100*d.changed/cov).toFixed(1)+'% of the object   ('+
           base[a]+' -> '+alt[a]+')');
      if(norm<0.50)weak.push(a);
    });
    ok(k+': every axis makes a VISIBLE difference ON THE OBJECT',weak.length===0,
       weak.length?('INVISIBLE: '+weak.join(',')):'all axes move object pixels');
  });

  var eb=document.getElementById('err-banner');
  ok('no crash banner',!eb,eb?eb.textContent.slice(0,180):'');

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

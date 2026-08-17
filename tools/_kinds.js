/* DIAGNOSTIC: does every prop kind actually BUILD, and is it sane?
   18 of these were authored in one pass, so nothing here is trusted: every kind is
   built at several specs and checked for mesh integrity, real-world size, that every
   declared axis genuinely changes the geometry, and that no two variants collide. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}

try{
  var SD=window.__SD,SPEC=SD.SPEC;
  SD.stopLoop();
  var kinds=Object.keys(SD.PROP_KINDS);
  info(kinds.length+' kinds registered');

  var broken=[],huge=[],tiny=[],nan=[],deadAxes=[],noSal=[],badMtl=[];
  var MTL={ceramic:1,glass:1,metal:1,cloth:1,paper:1,soil:1,card:1,plastic:1,wood:1};

  kinds.forEach(function(k){
    var K=SD.PROP_KINDS[k];
    if(!MTL[K.mtl])badMtl.push(k+':'+K.mtl);
    // exactly one axis should be the "that is not my X" axis
    var sals=Object.keys(K.axes).map(function(a){return K.axes[a].sal;});
    if(Math.max.apply(null,sals)<0.85)noSal.push(k+' max sal '+Math.max.apply(null,sals));

    var g=null;
    try{ g=SD.buildProp(k,SPEC.randomSpec(k,SD.mulberry32(11))); }
    catch(e){ broken.push(k+': '+e.message); return; }
    if(!g){broken.push(k+': built null');return;}

    var sz=g.userData&&g.userData.size;
    if(!sz||!isFinite(sz.x)||!isFinite(sz.y)||!isFinite(sz.z)){nan.push(k);SD.disposeProp(g);return;}
    var big=Math.max(sz.x,sz.y,sz.z),small=Math.max(sz.x,sz.y,sz.z);
    if(big>2.2)huge.push(k+' '+big.toFixed(2)+'m');
    if(big<0.012)tiny.push(k+' '+big.toFixed(3)+'m');

    // NaN / degenerate vertices anywhere in the mesh
    var badVerts=0,meshes=0;
    g.traverse(function(o){
      if(!o.isMesh)return;
      meshes++;
      var p=o.geometry&&o.geometry.attributes&&o.geometry.attributes.position;
      if(!p){badVerts++;return;}
      for(var i=0;i<p.count*3;i++)if(!isFinite(p.array[i])){badVerts++;break;}
    });
    if(badVerts)broken.push(k+': '+badVerts+' bad geometry');
    if(!meshes)broken.push(k+': no meshes');
    SD.disposeProp(g);

    /* EVERY DECLARED AXIS MUST CHANGE SOMETHING. An axis the builder ignores is a
       change the player pays for and nobody can see — the worst possible bug in a
       game about noticing. Compare the built vertex signature across an axis flip. */
    var base=SPEC.randomSpec(k,SD.mulberry32(4242));
    function sig(spec){
      var gg;try{gg=SD.buildProp(k,spec);}catch(e){return 'ERR';}
      if(!gg)return 'NULL';
      var n=0,acc=0;
      gg.updateMatrixWorld(true);
      gg.traverse(function(o){
        if(!o.isMesh)return;
        var p=o.geometry.attributes.position;
        n+=p.count;
        /* ABS, and the WORLD matrix. Reading raw local vertices misses two whole
           classes of axis: a box is symmetric about its origin so scaling it barely
           moves a signed sum, and anything expressed as a rotation or a position
           (a tipped board, a raised mailbox flag) never touches the vertex buffer
           at all. Both were false "dead axis" reports before this. */
        for(var i=0;i<p.count*3;i+=3)acc+=Math.abs(p.array[i])*(i%13+1);
        var e=o.matrixWorld.elements;
        for(var j=0;j<16;j++)acc+=Math.abs(e[j])*(j+3);
        // materials/textures matter too: a texture-only axis changes the map's key
        /* Most identity axes are TEXTURE-only: a brand name moves no vertices at all.
           canvasTex caches by a key that must capture every spec value the draw reads,
           so two specs share a texture OBJECT iff they share that key — which makes
           map.uuid an exact proxy for "did the art change". Hashing colour alone
           misses every painted axis in the game. */
        var m=o.material,ms=Array.isArray(m)?m:[m];
        ms.forEach(function(mm){
          if(!mm)return;
          if(mm.map&&mm.map.uuid){var u=mm.map.uuid,hh=0;
            for(var q=0;q<u.length;q++)hh=(hh*31+u.charCodeAt(q))>>>0;
            acc+=hh%100003;}
          if(mm.color)acc+=mm.color.r*7+mm.color.g*13+mm.color.b*17;
        });
      });
      var s2=n+'|'+acc.toFixed(4);
      SD.disposeProp(gg);return s2;
    }
    var b=sig(base);
    Object.keys(K.axes).forEach(function(a){
      var d=K.axes[a],alt=JSON.parse(JSON.stringify(base));
      if(d.t==='hue')alt[a]=(base[a]+180)%360;
      else if(d.t==='num')alt[a]=(base[a]-d.min)<(d.max-d.min)/2?d.max:d.min;
      else if(d.t==='bool')alt[a]=!base[a];
      else if(d.t==='enum'){alt[a]=d.v.filter(function(v){return v!==base[a];})[0];
                            if(alt[a]===undefined)return;}
      if(sig(alt)===b)deadAxes.push(k+'.'+a);
    });
  });

  ok('every kind builds without throwing',broken.length===0,
     broken.length?broken.slice(0,6).join(' | '):kinds.length+' kinds built');
  ok('every kind has finite geometry',nan.length===0,nan.join(', '));
  ok('nothing is absurdly large',huge.length===0,huge.join(', '));
  ok('nothing is invisibly small',tiny.length===0,tiny.join(', '));
  ok('every material is one the audio layer knows',badMtl.length===0,badMtl.join(', '));
  ok('every kind has a high-salience identity axis',noSal.length===0,noSal.join(', '));
  ok('EVERY DECLARED AXIS ACTUALLY CHANGES THE OBJECT',deadAxes.length===0,
     deadAxes.length?deadAxes.join(', '):'all axes across all kinds are live');
  info('an axis the builder ignores is a change the player pays for and cannot see');

  // sizes, for the eyeball
  info('');
  info('=== built sizes (metres, w x h x d) ===');
  kinds.forEach(function(k){
    var g;try{g=SD.buildProp(k,SPEC.randomSpec(k,SD.mulberry32(7)));}catch(e){return;}
    if(!g)return;
    var s=g.userData.size;
    info('  '+(k+'                ').slice(0,16)+
         s.x.toFixed(3)+' x '+s.y.toFixed(3)+' x '+s.z.toFixed(3)+
         '   '+SD.PROP_KINDS[k].cat+'/'+SD.PROP_KINDS[k].mtl);
    SD.disposeProp(g);
  });

  var eb=document.getElementById('err-banner');
  ok('no crash banner',!eb,eb?eb.textContent.slice(0,200):'');
}catch(e){
  fail++;out.push('FAIL  threw: '+(e&&e.message)+' @ '+
    String((e&&e.stack)||'').split('\n').slice(0,3).join(' | '));
}
var summary='SDTEST '+(fail===0?'ALL-PASS':'FAILURES')+' pass='+pass+' fail='+fail;
var pre=document.createElement('pre');pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\n'+summary+'\n'+out.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);document.title=summary;
})();

/* DIAGNOSTIC: what is actually wrong with the way this looks?
   "Needs a visual overhaul" is a feeling. These are the numbers under it — value
   structure, palette spread, material variety and render cost — measured over the
   real scene so the overhaul can be aimed rather than guessed at. */
(function(){
  var out=[],SD=window.__SD;
  function line(k,v){out.push((k+'                        ').slice(0,26)+v);}
  function n2(x){return (Math.round(x*100)/100).toString();}
  try{
    SD.stopLoop();SD.startHouse();

    /* ── VALUE STRUCTURE ─────────────────────────────────────────────────────
       The most common reason flat-shaded art reads as "programmer art" is that
       everything sits in the same luminance band, so nothing separates from
       anything else and the eye finds no structure. */
    var mats={},lum=[],types={};
    SD.scene.traverse(function(o){
      if(!o.isMesh)return;
      var m=o.material;
      (Array.isArray(m)?m:[m]).forEach(function(x){
        if(!x||mats[x.uuid])return;
        mats[x.uuid]=1;
        types[x.type]=(types[x.type]||0)+1;
        if(x.color){
          var c=x.color;
          lum.push(0.2126*c.r+0.7152*c.g+0.0722*c.b);
        }
      });
    });
    lum.sort(function(a,b){return a-b;});
    function pct(p){return lum.length?lum[Math.floor(lum.length*p)]:0;}
    line('materials',Object.keys(mats).length);
    line('material types',Object.keys(types).map(function(k){
      return k.replace('Mesh','').replace('Material','')+' '+types[k];}).join('  '));
    line('luminance p10',n2(pct(0.10)));
    line('luminance p50',n2(pct(0.50)));
    line('luminance p90',n2(pct(0.90)));
    line('luminance spread',n2(pct(0.90)-pct(0.10)));
    var band=lum.filter(function(v){return v>0.18&&v<0.55;}).length;
    line('% in the mid band',Math.round(100*band/Math.max(1,lum.length))+'%  (0.18-0.55)');
    var darks=lum.filter(function(v){return v<0.10;}).length;
    var lights=lum.filter(function(v){return v>0.75;}).length;
    line('true darks (<0.10)',darks+'  ('+Math.round(100*darks/Math.max(1,lum.length))+'%)');
    line('true lights (>0.75)',lights+'  ('+Math.round(100*lights/Math.max(1,lum.length))+'%)');

    /* ── SATURATION ─────────────────────────────────────────────────────────*/
    var sats=[];
    SD.scene.traverse(function(o){
      if(!o.isMesh||!o.material||!o.material.color)return;
      var hsl={};o.material.color.getHSL(hsl);sats.push(hsl.s);
    });
    sats.sort(function(a,b){return a-b;});
    line('saturation p50',n2(sats.length?sats[Math.floor(sats.length/2)]:0));
    line('saturation p90',n2(sats.length?sats[Math.floor(sats.length*0.9)]:0));

    /* ── WHAT THE LIGHTING HAS TO WORK WITH ─────────────────────────────────
       Lambert has no specular term at all: every surface in the game returns
       light identically, so wood, ceramic, glass and painted plaster are the
       same material with different colours. */
    line('specular surfaces',(types['MeshPhongMaterial']||0)+(types['MeshStandardMaterial']||0));
    var shadowCasters=0,receivers=0;
    SD.scene.traverse(function(o){
      if(!o.isMesh)return;
      if(o.castShadow)shadowCasters++;
      if(o.receiveShadow)receivers++;
    });
    line('shadow casters',shadowCasters);
    line('shadow receivers',receivers);

    /* ── COST, so the overhaul can be afforded ──────────────────────────────*/
    var r=SD.renderer;
    function timeIt(n){
      r.info.reset&&r.info.reset();
      var t0=performance.now();
      for(var i=0;i<n;i++)r.render(SD.scene,SD.camera);
      return (performance.now()-t0)/n;
    }
    var base=timeIt(20);
    line('render ms/frame (night)',n2(base));
    line('draw calls',r.info.render.calls);
    SD.setLighting('day');
    var day=timeIt(20);
    line('render ms/frame (day)',n2(day));
    SD.setLighting('night');

    /* What a material upgrade would cost: swap every Lambert for Standard and
       time it, then put it all back. Measured, not assumed — Standard is a much
       heavier shader and this scene carries 29 lights. */
    var swapped=[];
    SD.scene.traverse(function(o){
      if(!o.isMesh||!o.material||o.material.type!=='MeshLambertMaterial')return;
      var old=o.material;
      var nu=new THREE.MeshStandardMaterial({color:old.color,map:old.map,
        roughness:0.85,metalness:0.0});
      swapped.push([o,old]);
      o.material=nu;
    });
    var std=timeIt(20);
    line('...as MeshStandard',n2(std)+'  ('+n2(std/Math.max(0.01,base))+'x)');
    swapped.forEach(function(p){p[0].material.dispose();p[0].material=p[1];});
    // and the middle option: Phong has a specular term and a far cheaper shader
    var sw2=[];
    SD.scene.traverse(function(o){
      if(!o.isMesh||!o.material||o.material.type!=='MeshLambertMaterial')return;
      var old=o.material;
      var nu=new THREE.MeshPhongMaterial({color:old.color,map:old.map,
        shininess:18,specular:0x141414});
      sw2.push([o,old]);
      o.material=nu;
    });
    var pho=timeIt(20);
    line('...as MeshPhong',n2(pho)+'  ('+n2(pho/Math.max(0.01,base))+'x)');
    sw2.forEach(function(p){p[0].material.dispose();p[0].material=p[1];});
    line('swapped back',swapped.length+' materials');
  }catch(e){
    line('EXCEPTION',(e&&e.message)+' @ '+String((e&&e.stack)||'').split('\n')[1]);
  }
  var pre=document.createElement('pre');
  pre.textContent='==SDTEST-BEGIN==\n'+out.join('\n')+'\nALL-PASS (diagnostic)\n==SDTEST-END==';
  document.body.appendChild(pre);
})();


/* Standing diagnostic: how full is the world, actually? (not a gate)
   Counts what is in the scene, how much of the floor anything stands on, how many
   distinct materials/colours the eye has to work with, and what a frame costs -
   so a "the world feels empty" note can be answered with numbers instead of vibes. */
(function(){
  var out=[],SD=window.__SD;
  function line(k,v){out.push(k+': '+v);}
  function n2(x){return (Math.round(x*100)/100).toString();}
  function done(){
    var pre=document.createElement('pre');
    pre.textContent='==SDTEST-BEGIN==\n'+out.join('\n')+'\nALL-PASS (diagnostic)\n==SDTEST-END==';
    document.body.appendChild(pre);
  }
  if(!SD){line('__SD','MISSING');done();return;}

  function walk(root){
    var meshes=[],tris=0,mats={},geos={};
    root.traverse(function(o){
      if(!o.isMesh)return;
      meshes.push(o);
      var g=o.geometry;
      if(g){
        geos[g.uuid]=1;
        var c=g.index?g.index.count:(g.attributes.position?g.attributes.position.count:0);
        tris+=c/3;
      }
      var m=o.material;
      (Array.isArray(m)?m:[m]).forEach(function(x){if(x)mats[x.uuid]=x;});
    });
    return {meshes:meshes,tris:tris,mats:mats,geos:Object.keys(geos).length};
  }
  function colours(mats){
    var set={};
    Object.keys(mats).forEach(function(k){
      var m=mats[k];
      if(m.color)set['#'+m.color.getHexString()]=1;
    });
    return Object.keys(set);
  }
  /* footprint of everything in a bounding-box sense, on the XZ plane */
  function footprint(meshes,skip){
    var B=new THREE.Box3(),area=0,items=0;
    meshes.forEach(function(o){
      if(skip&&skip(o))return;
      B.setFromObject(o);
      if(!isFinite(B.min.x))return;
      var w=B.max.x-B.min.x,d=B.max.z-B.min.z;
      if(w<=0||d<=0)return;
      if(w>12||d>12)return;            // floors/walls/ground are not clutter
      area+=w*d;items++;
    });
    return {area:area,items:items};
  }

  try{
    SD.startHouse();
    var W=walk(SD.scene);
    line('scene.meshes',W.meshes.length);
    line('scene.triangles',Math.round(W.tris));
    line('scene.geometries',W.geos);
    line('scene.materials',Object.keys(W.mats).length);
    var cols=colours(W.mats);
    line('distinct.colours',cols.length);
    line('colours',cols.sort().join(' '));

    /* lights */
    var L=[];
    SD.scene.traverse(function(o){
      if(o.isLight)L.push(o.type+'('+(o.color?'#'+o.color.getHexString():'-')+' i='+n2(o.intensity)+
        (o.castShadow?' shadow':'')+')');
    });
    line('lights.count',L.length);
    line('lights',L.join(' '));

    /* fog / sky */
    line('scene.fog',SD.scene.fog?(SD.scene.fog.type+' #'+SD.scene.fog.color.getHexString()+
      ' near='+n2(SD.scene.fog.near||0)+' far='+n2(SD.scene.fog.far||SD.scene.fog.density||0)):'none');
    line('scene.background',SD.scene.background?(SD.scene.background.isColor?
      '#'+SD.scene.background.getHexString():'texture'):'none');

    /* swappable possessions vs everything else */
    var objs=SD.objects||[];
    line('possessions.total',objs.length);
    var byOwner={};
    objs.forEach(function(o){byOwner[o.owner]=(byOwner[o.owner]||0)+1;});
    line('possessions.byOwner',Object.keys(byOwner).map(function(k){return k+'='+byOwner[k];}).join(' '));

    /* house interior: floor area vs occupied footprint */
    var H=SD.HOUSES||[];
    line('houses',H.length);
    var fp=footprint(W.meshes,function(o){
      return o.userData&&o.userData.noClutter;
    });
    line('clutter.items',fp.items);
    line('clutter.footprint.m2',n2(fp.area));

    /* the walkable outdoors: how big is it and how much is in it */
    if(SD.WORLD_BOUNDS){line('world.bounds',JSON.stringify(SD.WORLD_BOUNDS));}
    var gb=new THREE.Box3().setFromObject(SD.scene);
    line('scene.extent',n2(gb.max.x-gb.min.x)+' x '+n2(gb.max.y-gb.min.y)+' x '+n2(gb.max.z-gb.min.z));

    /* colliders */
    var C=SD.COLLIDERS||SD.WALLS||null;
    line('colliders',C?C.length:'not exported');

    /* draw calls + frame cost, measured */
    var r=SD.renderer;
    r.info.reset&&r.info.reset();
    var t0=performance.now();
    for(var i=0;i<30;i++)r.render(SD.scene,SD.camera);
    var t1=performance.now();
    line('render.ms.per.frame',n2((t1-t0)/30));
    line('render.calls',r.info.render.calls);
    line('render.triangles',r.info.render.triangles);
    line('renderer.shadowMap',r.shadowMap.enabled?('on type='+r.shadowMap.type):'off');
    line('renderer.pixelRatio',n2(r.getPixelRatio()));

    /* per-frame simulation cost, measured (physics + sight + sound + hardening) */
    var s0=performance.now();
    SD.run(120,1/60);
    var s1=performance.now();
    line('tick.ms.per.frame',n2((s1-s0)/120));

    /* how much of the night is spent OUTSIDE - distance between front doors */
    if(SD.HOUSES&&SD.HOUSES.length){
      var xs=SD.HOUSES.map(function(h){return h.x;}).sort(function(a,b){return a-b;});
      line('house.x',xs.join(' '));
      var gaps=[];
      for(var j=1;j<xs.length;j++)gaps.push(n2(xs[j]-xs[j-1]));
      line('house.gaps',gaps.join(' '));
    }
  }catch(e){
    line('EXCEPTION',(e&&e.message)+' @ '+(e&&e.stack||'').split('\n')[1]);
  }
  done();
})();

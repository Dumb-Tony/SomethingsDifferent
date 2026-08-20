/* M21 — THE LOOK.
   "We might need a visual overhaul." MEASURED first (tools/_look.js): 684 materials,
   610 Lambert and 74 Basic and ZERO with a specular term — wood, ceramic, glass and
   painted plaster all return light identically. 39% of the palette sat above
   luminance 0.75 against 4% true darks, which is why daylight bleached and night
   went uniformly grey.

   The upgrade was PRICED rather than assumed: every Lambert → Standard costs 2.13x
   the frame, → Phong 2.60x. Both too much to buy shininess with. So value structure
   (free) plus specular on the ~5% of surfaces the eye expects a highlight from.

   And the rule the whole milestone turns on: GRADE THE WORLD, NEVER THE EVIDENCE. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}
function n2(x){return (Math.round(x*100)/100).toString();}
function Y(c){return 0.2126*c.r+0.7152*c.g+0.0722*c.b;}

try{
var SD=window.__SD,C=SD.CONST;
SD.stopLoop();SD.startHouse();SD.S.menuOpen=false;

/* ── 1. THE CURVE DOES WHAT IT CLAIMS ───────────────────────────────────────*/
(function(){
  function y(hex){return Y(new THREE.Color(SD.grade(hex)));}
  /* Measured as MOVEMENT, not as absolutes. r128 has no colour management, so
     Color.r/g/b hold the sRGB-encoded values and #808080 reads 0.50 here rather
     than the 0.216 it would in linear light — the first version of this test
     asserted linear numbers against sRGB ones and failed a curve that was correct.
     What the curve claims is "compress the top, leave the bottom alone", and that
     claim is about how far each end travels. */
  var hi=y('#ffffff'),mid=y('#808080'),lo=y('#1a1a1a');
  ok('HIGHLIGHTS COME DOWN',hi<0.80,'white 1.00 -> '+n2(hi));
  ok('...midtones barely move',Math.abs(mid-0.502)<0.10,
     'mid grey 0.50 -> '+n2(mid)+'  (moved '+n2(Math.abs(mid-0.502))+')');
  ok('...and the darks are left alone',Math.abs(lo-0.102)<0.02,
     'near-black 0.10 -> '+n2(lo)+'  (moved '+n2(Math.abs(lo-0.102))+')');
  ok('...so the compression is progressive',
     (1-hi)>Math.abs(mid-0.502)&&Math.abs(mid-0.502)>Math.abs(lo-0.102),
     'white moves '+n2(1-hi)+', mid '+n2(Math.abs(mid-0.502))+
     ', black '+n2(Math.abs(lo-0.102)));
  ok('the curve is monotonic — nothing crosses over',hi>mid&&mid>lo,
     n2(lo)+' < '+n2(mid)+' < '+n2(hi));
  // hue survives it: a grade that rotated hue would repaint twenty milestones of art
  var a=new THREE.Color(SD.grade('#c04030')),b=new THREE.Color(SD.grade('#3040c0'));
  var ha={},hb={};a.getHSL(ha);b.getHSL(hb);
  ok('HUE IS PRESERVED',Math.abs(ha.h-0.0157)<0.02&&Math.abs(hb.h-0.6314)<0.02,
     'red stays red, blue stays blue');
})();

/* ── 2. GRADE THE WORLD, NEVER THE EVIDENCE ─────────────────────────────────
   THE ASSERTION THIS MILESTONE EXISTS FOR. The game is judging whether two
   objects are the same object; a compressive curve pulls colours toward each
   other, which is precisely what the player is trying to do. Applying it to props
   attacks the signal — measured, it turned three declared hue axes into dead
   axes and broke m12's gate and m3's 150-degree assertion at the same time. */
(function(){
  ok('grading is ON for the world',SD.GRADE_ON!==false);
  var raw='#c04030';
  var world=SD.grade(raw);
  var before=SD.setGrade(false);
  var prop=SD.grade(raw);
  SD.setGrade(before);
  ok('THE SAME COLOUR IS GRADED IN THE WORLD AND NOT IN A PROP',
     world!==prop,'world #'+world.toString(16)+'  prop #'+prop.toString(16));
  ok('...and a prop gets exactly what was authored',
     prop===new THREE.Color(raw).getHex(),'#'+prop.toString(16)+' === '+raw);
  // and building a prop must leave the switch as it found it
  SD.buildProp('coffeeMug',SD.SPEC.randomSpec('coffeeMug',SD.mulberry32(4)));
  ok('BUILDING A PROP RESTORES IT',SD.GRADE_ON===true,
     'a leaked false would silently un-grade the rest of the street');
})();

/* ── 3. SURFACES THAT CAN CATCH A HIGHLIGHT ─────────────────────────────────*/
(function(){
  ok('the shiny list is the material taxonomy PROP_KINDS already declared',
     C.SHINY_MTL.length>0&&C.SHINY_MTL.every(function(m){
       return Object.keys(SD.PROP_KINDS).some(function(k){
         return SD.PROP_KINDS[k].mtl===m;});}),
     C.SHINY_MTL.join(', '));
  /* Glass and metal, not ceramic. Ceramic is the commonest material on the street -
     mugs, gnomes, vases, salt shakers, table lamps - and carrying specular on all of
     it took the frame far enough on the software renderer the harness uses that
     m11's LIVE render-loop check starved: 3 frames at 0 fps against a threshold of
     10. Dropping ceramic put it back to 92 frames at 26. The cheap-looking line in
     CONST is load-bearing. */
  var frame=SD.buildProp('pictureFrame',SD.SPEC.randomSpec('pictureFrame',SD.mulberry32(9)));
  var cereal=SD.buildProp('cerealBox',SD.SPEC.randomSpec('cerealBox',SD.mulberry32(9)));
  function shiny(g){
    var n=0;g.traverse(function(o){
      if(o.isMesh&&o.material&&o.material.type==='MeshPhongMaterial')n++;});
    return n;
  }
  ok('GLASS CAN GLINT',shiny(frame)>0,shiny(frame)+' specular parts');
  ok('...and a cardboard cereal box cannot',shiny(cereal)===0,'card is matte');
  ok('...and ceramic is deliberately NOT on the list',
     C.SHINY_MTL.indexOf('ceramic')<0,
     'it is the commonest mtl on the street and it cost the frame rate');
  SD.disposeProp(frame);SD.disposeProp(cereal);
  // the count across the whole street, so the 2.6x bill is never accidentally paid
  var types={};
  SD.scene.traverse(function(o){
    if(!o.isMesh||!o.material)return;
    var m=o.material;(Array.isArray(m)?m:[m]).forEach(function(x){
      if(x)types[x.type]=(types[x.type]||0)+1;});
  });
  var phong=types['MeshPhongMaterial']||0,lam=types['MeshLambertMaterial']||0;
  info('street materials: Lambert '+lam+'  Phong '+phong);
  ok('SPECULAR IS THE EXCEPTION, NOT THE RULE',phong>0&&phong<lam*0.35,
     phong+' of '+(phong+lam)+' — a wholesale swap was measured at 2.13-2.60x frame');
})();

/* ── 4. THE BIG SURFACES ACTUALLY MOVED ─────────────────────────────────────
   Walls, floors, lawns and roads are `new MeshLambertMaterial({map})` with no
   colour argument — material.color is white and the whole palette is in the
   canvas. Grading mat() alone moved the measured bright share only 39% -> 30%. */
(function(){
  var a=SD.gradeCss('#ffffff'),b=SD.gradeCss('rgba(255,255,255,.5)');
  ok('CANVAS FILLS ARE GRADED TOO',a!=='#ffffff',
     'white fill becomes '+a);
  ok('...and alpha survives it',/^rgba\(/.test(b)&&/0?\.5\)$/.test(b),b);
  ok('...which the tree line on the horizon depends on',
     SD.gradeCss('rgba(0,0,0,0)').indexOf('0)')>0);
})();

/* ── 5. VALUE STRUCTURE, MEASURED OVER THE REAL STREET ──────────────────────*/
(function(){
  SD.startHouse();
  var lum=[],seen={};
  SD.scene.traverse(function(o){
    if(!o.isMesh||!o.material)return;
    var m=o.material;
    (Array.isArray(m)?m:[m]).forEach(function(x){
      if(!x||!x.color||seen[x.uuid])return;
      seen[x.uuid]=1;
      if(x.map)return;                    // textured: its palette is in the canvas
      if(x.type==='MeshBasicMaterial')return;   // bulbs, LEDs, screens: meant to be hot
      lum.push(Y(x.color));
    });
  });
  lum.sort(function(a,b){return a-b;});
  var bright=lum.filter(function(v){return v>0.75;}).length;
  var frac=bright/Math.max(1,lum.length);
  info('untextured lit materials: '+lum.length+', '+
       Math.round(frac*100)+'% above luminance 0.75');
  ok('THE PALETTE HAS A CEILING',frac<0.22,
     Math.round(frac*100)+'% above 0.75 (was 39% before the grade)');
  var p10=lum[Math.floor(lum.length*0.10)],p90=lum[Math.floor(lum.length*0.90)];
  ok('...and a usable range',p90-p10>0.35,'p10 '+n2(p10)+' -> p90 '+n2(p90));
})();

/* ── 6. IT STILL RUNS, AND THE TESTS STILL RUN ──────────────────────────────
   2048x2048 shadows looked better and made all twenty suites time out at once on
   the software renderer the harness uses. The box follows the player, so tightening
   it buys the same texel density for nothing. */
(function(){
  var sc=SD.scene.children.filter(function(o){return o.isDirectionalLight&&o.castShadow;})[0];
  ok('there is a shadow caster',!!sc);
  if(sc){
    var w=sc.shadow.camera.right-sc.shadow.camera.left;
    var texel=w/sc.shadow.mapSize.x;
    info('shadow box '+w+'m over '+sc.shadow.mapSize.x+' texels = '+
         (texel*100).toFixed(1)+'cm each');
    ok('SHADOWS ARE FINER THAN THEY WERE',texel<32/1024,
       (texel*100).toFixed(1)+'cm vs 3.1cm before');
    ok('...without a bigger map than the harness can render',sc.shadow.mapSize.x<=1024,
       sc.shadow.mapSize.x+'x'+sc.shadow.mapSize.y);
    ok('...and it still covers the near field',w>=20,w+'m across');
  }
})();

var eb=document.getElementById('err-banner');
ok('no crash banner',!eb,eb?eb.textContent.slice(0,160):'');
}catch(e){
  fail++;out.push('FAIL  threw: '+(e&&e.message)+' @ '+
    String((e&&e.stack)||'').split('\n').slice(0,3).join(' | '));
}
var summary='SDTEST '+(fail===0?'ALL-PASS':'FAILURES')+' pass='+pass+' fail='+fail;
var pre=document.createElement('pre');pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\n'+summary+'\n'+out.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);document.title=summary;
})();

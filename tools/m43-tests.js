/* M43 — SODIUM.

   Chosen off rendered comparisons rather than description: tools/artdir.ps1 put the
   same two scenes through a moonlit control, a hard-contrast noir and this, and the
   images are in docs/ad-*.png. Sodium won on LEGIBILITY - under the old cool rig the
   house was a near-black slab with no readable door, window or roofline - and on one
   argument the other two could not make:

     WARM OUTDOORS, COOL INDOORS, so the COLOUR of the light tells you which side of
     a window you are standing on.

   That is not decoration. This is a game about being seen through glass.

   The first attempt applied sodium to EVERYTHING, which is what the option image
   actually showed, and the interior came out pale pink with 0% pure black - a lounge
   that read like dawn. The rig here is the pitch rather than that image: the ambient
   is weak so houses stay dark, and everything bright outdoors comes from a lamp you
   can see and walk around. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}

try{
var SD=window.__SD,C=SD.CONST,T=window.THREE;
SD.stopLoop();

function warmth(hex){
  /* How amber is this light? Red minus blue, normalised. Sodium is strongly
     positive; moonlight is negative. */
  /* getHexString() returns '3b3020' with NO leading hash, and THREE.Color quietly
     falls back to WHITE on a string it cannot parse - so every reading came back
     0.00 and five assertions failed against a rig that was correct. */
  var c=new T.Color(String(hex).charAt(0)==='#'?hex:'#'+hex);
  return c.r-c.b;
}

/* ── 1. THE STREET IS LIT BY LAMPS, NOT BY THE SKY ──────────────────────────*/
(function(){
  SD.startHouse();SD.setLighting('night');
  var hemi=null,dirs=[];
  SD.scene.traverse(function(o){
    if(o.isHemisphereLight)hemi=o;
    else if(o.isDirectionalLight)dirs.push(o);
  });
  ok('there is a sky light and a key light',!!hemi&&dirs.length>0,
     'hemi + '+dirs.length+' directional');
  ok('THE AMBIENT IS WEAK, so interiors stay dark',hemi.intensity<=0.25,
     'hemi '+hemi.intensity.toFixed(2)+' - at 0.42 the lounge went to 0% pure black '+
     'and read like dawn');
  ok('...and it is sodium-coloured, not moonlight',warmth(hemi.color.getHexString())>0,
     '#'+hemi.color.getHexString()+' (r-b '+warmth(hemi.color.getHexString()).toFixed(2)+')');
  ok('...and so is the key',warmth(dirs[0].color.getHexString())>0,
     '#'+dirs[0].color.getHexString());
})();

/* ── 2. WHICH SIDE OF THE GLASS ─────────────────────────────────────────────
   The whole reason this direction was picked. Outdoor lamps must be measurably
   warmer than the light that comes through a window. */
(function(){
  SD.startHouse();SD.setLighting('night');
  var sodium=warmth(C.SODIUM);
  ok('there is a named sodium colour',!!C.SODIUM,C.SODIUM);
  ok('...and it really is amber',sodium>0.4,'r-b '+sodium.toFixed(2));

  /* The moon spill through a window is the cold one. */
  var cold=warmth('#9dbaf0');
  info('sodium '+sodium.toFixed(2)+' vs the window spill '+cold.toFixed(2));
  ok('A STREET LAMP AND A WINDOW POOL ARE DIFFERENT COLOURS',
     sodium-cold>0.5,
     'a gap of '+(sodium-cold).toFixed(2)+' - you can tell from the colour alone '+
     'whether the light you are standing in came from outside');

  /* And it is actually in use on the outdoor practicals. */
  var lamps=[],warmN=0;
  SD.scene.traverse(function(o){
    if(!o.isPointLight)return;
    lamps.push(o);
    if(warmth(o.color.getHexString())>0.4)warmN++;
  });
  ok('the street has lamps in it',lamps.length>0,lamps.length+' practicals');
  ok('...and some of them are sodium',warmN>0,
     warmN+' of '+lamps.length+' are amber');
  ok('...but NOT all of them - the interiors are a different colour',
     warmN<lamps.length,
     (lamps.length-warmN)+' cooler lights left indoors');
})();

/* ── 3. IT IS STILL A NIGHT ─────────────────────────────────────────────────*/
(function(){
  SD.startHouse();SD.setLighting('night');
  ok('the exposure moved with the palette',
     SD.renderer.toneMappingExposure>0.6,
     SD.renderer.toneMappingExposure.toFixed(2)+' - the old 0.52 was set against a '+
     'cool key that no longer exists, and reads as mud against this one');
  ok('...and the fog is warm too',
     !!SD.scene.fog&&warmth(SD.scene.fog.color.getHexString())>0,
     SD.scene.fog?'#'+SD.scene.fog.color.getHexString():'no fog');
  ok('...and the sky is still nearly black',
     SD.scene.background&&SD.scene.background.getHSL({}).l<0.10,
     '#'+SD.scene.background.getHexString());
})();

/* ── 4. AND THE DAY IS UNTOUCHED ────────────────────────────────────────────
   M20's afternoon has its own rig and its own reasons; the night's palette must
   not leak into it. */
(function(){
  SD.startHouse();SD.setLighting('day');
  var hemi=null;
  SD.scene.traverse(function(o){if(o.isHemisphereLight)hemi=o;});
  ok('DAYLIGHT IS STILL DAYLIGHT',
     hemi&&warmth(hemi.color.getHexString())<0,
     'hemi #'+(hemi?hemi.color.getHexString():'?')+' - a cool sky bounce, as before');
  ok('...and brighter than the night',hemi.intensity>0.25,
     'hemi '+hemi.intensity.toFixed(2));
  SD.setLighting('night');
})();

/* ── 5. STILL NOT A DIFFICULTY CONTROL ──────────────────────────────────────*/
(function(){
  SD.startHouse();SD.nightReset();
  var zone=SD.LIGHTS.filter(function(z){return z.i>0.2;})[0];
  var probe=zone?[zone.x+zone.r*0.3,zone.z]:[SD.HOME.x,-6];
  var before=SD.litAt(probe[0],probe[1]);
  SD.setLighting('night');
  ok('re-lighting the whole street does not move where you can be seen',
     SD.litAt(probe[0],probe[1])===before,
     'litAt '+before.toFixed(3));
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

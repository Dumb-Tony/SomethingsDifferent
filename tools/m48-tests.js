/* M48 — STEVE MAREK IS DRESSED ON PURPOSE.

   makeBlockout called personLook('steve-marek') — a random draw seeded off a string.
   Deterministic, but nobody chose it. What it drew was TOPS #7b4289: a magenta shirt.
   Under the M43 sodium rig that made the man breaking into houses at three in the
   morning the single brightest object in the frame, and he is also the one body you
   look at, from behind, for the entire game.

   He has a fixed dark look now. That is the fiction — you do not burgle a cul-de-sac
   in fuchsia — and it is the read: he should be a SILHOUETTE against a lit wall,
   because the whole game is about which side of the light you are standing on.

   Everybody else keeps the random wardrobe. An afternoon street should have colour
   in it; a man on a porch at 3am should not. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}

try{
var SD=window.__SD,C=SD.CONST,T=window.THREE;
SD.stopLoop();
function lum(hex){
  var c=new T.Color(String(hex).charAt(0)==='#'?hex:'#'+hex);
  return 0.2126*c.r+0.7152*c.g+0.0722*c.b;
}
function sat(hex){
  var c=new T.Color(String(hex).charAt(0)==='#'?hex:'#'+hex),h={};
  c.getHSL(h);return h.s;
}

/* ── 1. HE IS CHOSEN, NOT DRAWN ─────────────────────────────────────────────*/
(function(){
  ok('there is a named look for Steve',!!SD.STEVE_LOOK,
     SD.STEVE_LOOK?JSON.stringify(SD.STEVE_LOOK.top):'none');
  var drawn=SD.personLook('steve-marek');
  info('what the random draw gave him: top '+drawn.top+
       ' (luminance '+lum(drawn.top).toFixed(2)+', saturation '+sat(drawn.top).toFixed(2)+')');
  info('what he wears now:             top '+SD.STEVE_LOOK.top+
       ' (luminance '+lum(SD.STEVE_LOOK.top).toFixed(2)+', saturation '+
       sat(SD.STEVE_LOOK.top).toFixed(2)+')');
  ok('HIS CLOTHES ARE NO LONGER A RANDOM DRAW',
     SD.STEVE_LOOK.top!==drawn.top,
     'the draw gave him '+drawn.top);
})();

/* ── 2. HE IS DARK, AND DARKER THAN THE WARDROBE ────────────────────────────*/
(function(){
  var tops=SD.TOPS.map(lum);
  var avg=tops.reduce(function(a,b){return a+b;},0)/tops.length;
  var mine=lum(SD.STEVE_LOOK.top);
  info('wardrobe luminance runs '+Math.min.apply(null,tops).toFixed(2)+' to '+
       Math.max.apply(null,tops).toFixed(2)+', average '+avg.toFixed(2));
  ok('STEVE IS DARKER THAN THE AVERAGE SHIRT ON THIS STREET',mine<avg,
     mine.toFixed(2)+' against '+avg.toFixed(2));
  ok('...and darker than every single one of them',
     mine<=Math.min.apply(null,tops)+0.02,
     mine.toFixed(2)+' vs the darkest in the wardrobe, '+
     Math.min.apply(null,tops).toFixed(2));
  ok('...and not a colour anybody would remember',sat(SD.STEVE_LOOK.top)<0.25,
     'saturation '+sat(SD.STEVE_LOOK.top).toFixed(2)+' - the draw gave him '+
     sat(SD.personLook('steve-marek').top).toFixed(2));
  ok('his trousers and shoes are dark too',
     lum(SD.STEVE_LOOK.legs)<0.20&&lum(SD.STEVE_LOOK.shoe)<0.20,
     'legs '+lum(SD.STEVE_LOOK.legs).toFixed(2)+', shoes '+
     lum(SD.STEVE_LOOK.shoe).toFixed(2));
})();

/* ── 3. HE READS AS A SILHOUETTE AGAINST A LIT WALL ─────────────────────────
   The point of the whole change. A sodium-lit wall is the thing he stands in front
   of on the opening shot. */
(function(){
  var wall=lum('#c9b088');            // the key light's colour on a pale facade
  var him=lum(SD.STEVE_LOOK.top);
  info('sodium key '+wall.toFixed(2)+' vs his jacket '+him.toFixed(2));
  ok('HE IS A SILHOUETTE AGAINST A SODIUM WALL',wall-him>0.35,
     'a gap of '+(wall-him).toFixed(2));
  ok('...and against the sodium lamp colour itself',
     lum(C.SODIUM)-him>0.4,
     'lamp '+lum(C.SODIUM).toFixed(2)+' vs him '+him.toFixed(2));
})();

/* ── 4. THE PLAYER'S BODY REALLY USES IT ────────────────────────────────────*/
(function(){
  SD.startHouse();
  /* Compared by DISTANCE, not by hex. Every material goes through M21's grade(),
     which nudges saturation and rolls off luminance, so the colour on the mesh is
     never the literal string in STEVE_LOOK - the first version of this looked for an
     exact match and failed against a body that was wearing exactly the right thing. */
  function near(a,b){
    var x=new T.Color(a),y=new T.Color(b);
    return Math.hypot(x.r-y.r,x.g-y.g,x.b-y.b)<0.12;
  }
  var found={top:false,legs:false};
  SD.player.traverse(function(o){
    if(!o.isMesh||!o.material||!o.material.color)return;
    var h='#'+o.material.color.getHexString();
    if(near(h,SD.STEVE_LOOK.top))found.top=true;
    if(near(h,SD.STEVE_LOOK.legs))found.legs=true;
  });
  ok('THE BODY ON SCREEN IS WEARING IT',found.top&&found.legs,
     'jacket '+found.top+', trousers '+found.legs+' (graded, so matched by distance)');

  /* and no part of him is a bright colour any more */
  var brightest=0,worst='';
  SD.player.traverse(function(o){
    if(!o.isMesh||!o.material||!o.material.color)return;
    var h='#'+o.material.color.getHexString(),l=lum(h);
    if(l>brightest){brightest=l;worst=h;}
  });
  info('his brightest surface is '+worst+' at '+brightest.toFixed(2)+' (skin)');
  ok('...and nothing on him is glaring',brightest<0.72,
     worst+' '+brightest.toFixed(2));
})();

/* ── 5. EVERYBODY ELSE KEEPS THEIR CLOTHES ──────────────────────────────────*/
(function(){
  SD.startHouse();SD.startWalk();
  var tops=[];
  SD.DAYFOLK.forEach(function(f){
    var l=SD.personLook(f.res);
    tops.push(l.top);
  });
  info('the afternoon street wears: '+tops.join(' '));
  var distinct={};tops.forEach(function(t){distinct[t]=1;});
  ok('THE STREET IS NOT ALL DRESSED THE SAME',
     Object.keys(distinct).length>=3,
     Object.keys(distinct).length+' different tops among '+tops.length+' people');
  ok('...and somebody out there is wearing a colour',
     tops.some(function(t){return sat(t)>0.20;}),
     'an afternoon should have colour in it; a 3am porch should not');
  ok('...and none of them is Steve',
     !tops.some(function(t){return t===SD.STEVE_LOOK.top;}),
     'he is the only one dressed for this');
  SD.endWalk();
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

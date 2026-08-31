/* M55 — A POWER NOBODY PRESSES IS WORTH NOTHING.

   M54 built Temporal Freeze and then documented it in exactly one place: the controls
   screen, which a player reads once before they know what any of it means. Nothing in
   the running game ever mentions it. On the evidence of every milestone in this file
   that shipped a mechanic nobody could reach, that is the same as not building it.

   Two places, chosen for when a person actually looks:

     * THE MOMENT SOMEBODY SITS UP. The stir line has always said "go still". The
       first time it fires in a run it now says what else there is. That is the moment
       the power exists for, and the same moment enterHide() starts refusing you the
       wardrobe. Not GUIDE_STEPS: that is a linear rail, and a panic button taught at
       step seven of twelve is taught while there is nothing to panic about.

     * THE DOSSIER. It held three columns about THEM - residents, catalog, what you
       are carrying - and not one line about you, in a game whose entire premise is
       that you are not a person. Tab is the key a curious player presses. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}

try{
var SD=window.__SD,C=SD.CONST;
SD.stopLoop();
function el(id){return document.getElementById(id);}
function night(){
  SD.startHouse();SD.beginNight();
  SD.S.freeze=0;SD.S.freezeCd=0;SD.S.daytime=false;SD.S.evening=false;
  SD.GAME.taughtFreeze=false;
  if(SD.GAME.stats)SD.GAME.stats.freezes=0;
}
/* push a sleeper over their wake threshold and run the frame that notices */
function makeStir(){
  var s=SD.SLEEPERS[0];
  s.state='asleep';s.noise=999;s.stir=0;
  SD.tick(1/60);
  return s;
}

/* ── 1. THE DOSSIER SAYS WHAT YOU ARE ───────────────────────────────────────*/
(function(){
  night();
  SD.showDossier();
  var h=el('dossier-body').innerHTML;
  ok('the dossier still lists their things',/CATALOG/.test(h)&&/RESIDENTS/.test(h),
     'residents and catalog');
  ok('THE DOSSIER LISTS WHAT YOU ARE',/WHAT YOU ARE/.test(h),
     'it held three columns about them and none about you');
  ok('...and names both abilities the slice ships',
     /Night vision/i.test(h)&&/Hold time/i.test(h),
     'GDD 5.10: Night Vision and Temporal Freeze');
  ok('...and tells you which key',/<b>G<\/b>/.test(h),'the key is in the dossier');
  ok('...and what it costs',/watching/i.test(h),
     'that being seen doing it is the whole price');
  SD.S.menuOpen=false;
})();

/* ── 2. AND IT READS THE ACTUAL STATE ───────────────────────────────────────*/
(function(){
  night();
  SD.showDossier();
  ok('it says ready when it is ready',/ready/.test(el('dossier-body').innerHTML),
     'freeze '+SD.S.freeze+', cd '+SD.S.freezeCd);
  SD.S.menuOpen=false;

  night();
  SD.freezeTime();
  SD.showDossier();
  var h=el('dossier-body').innerHTML;
  ok('...and holding while it holds',/holding/.test(h),'mid-freeze');
  SD.S.menuOpen=false;

  SD.S.freeze=0;
  SD.showDossier();
  ok('...and recharging while it recharges',
     /recharging/.test(el('dossier-body').innerHTML),
     'cd '+SD.S.freezeCd.toFixed(1)+'s');
  SD.S.menuOpen=false;

  night();SD.startWalk();
  SD.showDossier();
  ok('...and refuses in daylight, in the dossier too',
     /not in daylight/.test(el('dossier-body').innerHTML),'afternoon');
  SD.S.menuOpen=false;SD.endWalk();
})();

/* ── 3. THE STIR LINE TEACHES IT, ONCE ──────────────────────────────────────*/
(function(){
  night();
  var s=makeStir();
  var first=el('hint').textContent;
  info('first stir of the run: "'+first+'"');
  ok('somebody actually stirred',s.state==='stirring',s.state);
  ok('THE FIRST STIR OF A RUN TEACHES THE KEY',/press G/.test(first),
     first);
  ok('...and still says the thing it always said',/still/.test(first),
     'go still is the other half of the answer');

  /* second time: back to the plain line */
  s.state='asleep';s.noise=999;s.stir=0;
  el('hint').textContent='';
  SD.tick(1/60);
  var second=el('hint').textContent;
  info('second stir: "'+second+'"');
  ok('...AND IT IS NOT REPEATED',!/press G/.test(second)&&/stirs/.test(second),
     second);
})();

/* ── 4. AND NOT AT ALL IF YOU ALREADY KNOW ──────────────────────────────────*/
(function(){
  night();
  SD.freezeTime();                 // you have used it; you do not need telling
  SD.S.freeze=0;SD.S.freezeCd=0;
  el('hint').textContent='';
  var s=makeStir();
  var line=el('hint').textContent;
  info('stir after you have already used it: "'+line+'"');
  ok('SOMEBODY WHO HAS USED IT IS NOT TOLD ABOUT IT',
     !/press G/.test(line)&&/stirs/.test(line),line);
})();

/* ── 5. THE TEACH IS NOT ON THE RAIL ────────────────────────────────────────
   A panic button taught at a fixed step is taught while there is nothing to panic
   about, and worse, a rail step that blocks on an OPTIONAL ability strands anybody
   who does not want it - the same lesson the `read` and `key` steps carry. */
(function(){
  var onRail=SD.GUIDE_STEPS.filter(function(g){
    return /\bG\b/.test(g.t)||/hold time/i.test(g.t);
  });
  ok('THE FREEZE IS NOT A STEP ON THE GUIDE RAIL',onRail.length===0,
     onRail.map(function(g){return g.id;}).join(', ')||'none');
  ok('...and the rail is still the length it was',SD.GUIDE_STEPS.length>=10,
     SD.GUIDE_STEPS.length+' steps');
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

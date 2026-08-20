/* M20 — DAYLIGHT.
   setLighting() had only ever been called with 'greybox' and 'night'. The street is
   146m long and carries ~2000 meshes — five dressed houses, eight facades, a
   cul-de-sac, a tree line — and no player had ever seen any of it in light. The day
   was fourteen text actions across five blocks, and the one that touches the social
   layer resolved the WHOLE street in a single click: every resident's reaction beat
   printed into a log at once, +3 Human Knowledge each, nobody seen. GDD 5.4 says
   watching a neighbour come apart is how you learn to be human; you could not watch
   anybody, because RESIDENTS have never had bodies anywhere except asleep in a bed. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}

try{
var SD=window.__SD,C=SD.CONST;
SD.stopLoop();SD.startHouse();SD.S.menuOpen=false;

/* ── 1. THERE IS A DAYTIME AT ALL ───────────────────────────────────────────*/
(function(){
  SD.setLighting('night');
  var nExp=SD.renderer.toneMappingExposure,nFog=SD.scene.fog?SD.scene.fog.density:0;
  var nMap=SD.scene.background?SD.scene.background.getHex():0;
  SD.setLighting('day');
  var dExp=SD.renderer.toneMappingExposure,dFog=SD.scene.fog?SD.scene.fog.density:0;
  var dMap=SD.scene.background?SD.scene.background.getHex():0;
  ok('DAYLIGHT IS BRIGHTER THAN NIGHT',dExp>nExp,
     'exposure '+nExp.toFixed(2)+' -> '+dExp.toFixed(2));
  ok('...and you can see further',dFog<nFog,
     'fog density '+nFog.toFixed(4)+' -> '+dFog.toFixed(4));
  ok('...against a different sky',dMap!==nMap,
     '#'+nMap.toString(16)+' -> #'+dMap.toString(16));
  ok('the body knows which it is',document.body.classList.contains('daylight'));
  SD.setLighting('night');
  ok('...and night puts it all back',
     !document.body.classList.contains('daylight')&&
     Math.abs(SD.renderer.toneMappingExposure-nExp)<0.001,
     SD.renderer.toneMappingExposure.toFixed(2));
})();

/* ── 2. THE AFTERNOON IS A PLACE ────────────────────────────────────────────*/
(function(){
  SD.startHouse();SD.S.menuOpen=false;
  ok('you start indoors, at night',!SD.S.daytime);
  var started=SD.startWalk();
  ok('WALKING THE STREET PUTS YOU ON THE STREET',started===true&&SD.S.daytime===true);
  ok('...in daylight',SD.renderer.toneMappingExposure>0.6,
     SD.renderer.toneMappingExposure.toFixed(2));
  ok('...outside your own front door',
     Math.abs(SD.player.position.x-SD.HOME.x)<0.01,
     SD.player.position.x.toFixed(1)+', '+SD.player.position.z.toFixed(1));
  ok('...and the night is not running',!SD.NIGHT.running);
  ok('NOBODY IS IN BED AT FOUR IN THE AFTERNOON',
     SD.SLEEPERS.every(function(s){return !s.group||!s.group.visible;}),
     SD.SLEEPERS.length+' beds empty');
})();

/* ── 3. THE NEIGHBOURS HAVE BODIES ──────────────────────────────────────────*/
(function(){
  ok('THE STREET IS POPULATED',SD.DAYFOLK.length>0,SD.DAYFOLK.length+' people outside');
  var mine=SD.DAYFOLK.filter(function(f){
    var h=SD.houseById(SD.RESIDENTS[f.res].house);return h&&h.yours;});
  ok('...but not your own house',mine.length===0);
  ok('every one of them is an actual body',
     SD.DAYFOLK.every(function(f){
       var n=0;f.group.traverse(function(o){if(o.isMesh)n++;});return n>=6;}),
     'the same blockout proportions as the player');
  ok('...standing on their own lot',
     SD.DAYFOLK.every(function(f){
       var h=SD.houseById(SD.RESIDENTS[f.res].house);
       return h&&Math.abs(f.x-h.x)<12;}));
  // everybody who owns something and has not collapsed should be out
  var expect=Object.keys(SD.RESIDENTS).filter(function(id){
    var h=SD.houseById(SD.RESIDENTS[id].house);
    return h&&!h.yours&&!SD.RESIDENTS[id].collapsed;}).length;
  ok('...and everybody who lives here is out',SD.DAYFOLK.length===expect,
     SD.DAYFOLK.length+' of '+expect);
})();

/* ── 4. YOU HAVE TO GO AND STAND NEAR THEM ──────────────────────────────────
   The mechanic the old menu button skipped entirely. */
(function(){
  var f=SD.DAYFOLK[0];
  var r=SD.RESIDENTS[f.res];
  r.beats=2;                                    // mid-way up their reaction ladder
  var hk0=SD.GAME.hk;
  // standing across the street is not standing near them
  SD.player.position.set(f.x+14,0,f.z);
  SD.S.py=0;SD.S.yaw=Math.PI*1.5;
  var far=SD.findTarget();
  ok('YOU CANNOT HEAR THEM FROM ACROSS THE STREET',
     !far||far.t!=='folk',far?far.t:'nothing in reach');
  // ...but standing next to them is
  SD.player.position.set(f.x,0,f.z+1.0);
  SD.S.py=0;SD.S.yaw=0;
  var near=SD.findTarget();
  ok('...and standing next to them is',!!near&&near.t==='folk'&&near.f===f,
     near?('E '+near.t):'nothing');
  SD.talkTo(f);
  ok('WATCHING A BEAT PAYS HUMAN KNOWLEDGE',SD.GAME.hk>hk0,
     '+'+(SD.GAME.hk-hk0)+' HK');
  ok('...and it goes in the day log',SD.DAY.log.length>0,
     SD.DAY.log[SD.DAY.log.length-1].slice(0,54)+'…');
  var hk1=SD.GAME.hk;
  SD.talkTo(f);
  ok('...ONCE. They do not repeat themselves for money',SD.GAME.hk===hk1,
     'still '+SD.GAME.hk+' HK');
  ok('...and the prompt says so',f.spoken===true);
})();

/* ── 5. AND IT ENDS ─────────────────────────────────────────────────────────*/
(function(){
  var before=SD.DAYFOLK.length;
  SD.endWalk();
  ok('GOING BACK INSIDE ENDS THE AFTERNOON',!SD.S.daytime);
  ok('...and takes everybody in with it',SD.DAYFOLK.length===0,
     before+' -> 0');
  ok('...restores the night rig',
     !document.body.classList.contains('daylight')&&
     SD.renderer.toneMappingExposure<0.6,
     SD.renderer.toneMappingExposure.toFixed(2));
  ok('...and puts the sleepers back in their beds',
     SD.SLEEPERS.some(function(s){return s.group&&s.group.visible;}));
})();

/* ── 6. IT DOES NOT LEAK PEOPLE ─────────────────────────────────────────────
   buildFolk() runs per walk, and the world is only rebuilt on startHouse() — the
   same shape of bug that had hardenNight() stacking a light zone per porch per
   night all the way through M19. */
(function(){
  SD.startWalk();var a=SD.DAYFOLK.length;
  var meshes0=0;SD.scene.traverse(function(o){if(o.isMesh)meshes0++;});
  SD.endWalk();
  SD.startWalk();var b=SD.DAYFOLK.length;
  var meshes1=0;SD.scene.traverse(function(o){if(o.isMesh)meshes1++;});
  SD.endWalk();
  ok('WALKING TWICE DOES NOT DOUBLE THE STREET',a===b,a+' -> '+b);
  ok('...nor the mesh count',meshes0===meshes1,meshes0+' -> '+meshes1);
})();

/* ── 7. THE MENU NO LONGER PLAYS THE GAME FOR YOU ───────────────────────────*/
(function(){
  SD.startHouse();SD.S.menuOpen=false;
  Object.keys(SD.RESIDENTS).forEach(function(id){SD.RESIDENTS[id].beats=3;});
  var hk0=SD.GAME.hk;
  SD.ACTIONS.walk.run();
  ok('THE WALK ACTION NO LONGER HANDS YOU THE WHOLE STREET',SD.GAME.hk===hk0,
     'it used to pay +3 HK per resident from one click; now it pays '+
     (SD.GAME.hk-hk0));
  ok('...it puts you outside instead',SD.S.daytime===true);
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

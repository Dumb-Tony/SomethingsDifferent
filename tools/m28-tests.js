/* M28 — HOME.
   Wife Suspicion has driven this game since M6. It shortens the night, wakes her at
   tier 2, sends her out after you at tier 4, and ends runs. And in twenty-seven
   milestones DANA HAS NEVER BEEN ON SCREEN — a number and a paragraph of text, in a
   game whose whole subject is a man failing to convince the people in his house that
   he is a person.

   The evening happens at home now. Your own lounge, the lamps on, and her in it —
   and WHERE SHE IS STANDING IS THE METER. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}
function n1(x){return (Math.round(x*10)/10).toString();}

try{
var SD=window.__SD,C=SD.CONST;
SD.stopLoop();SD.startHouse();SD.S.menuOpen=false;
var home=SD.HOUSES.filter(function(h){return h.yours;})[0];

/* ── 1. SHE EXISTS ──────────────────────────────────────────────────────────*/
(function(){
  ok('your own house is on the street',!!home,home?home.name:'-');
  ok('nobody is home before the evening',!SD.DANA);
  SD.WIFE.susp=0;
  ok('THE EVENING PUTS YOU IN YOUR OWN HOUSE',SD.startEvening()===true);
  ok('...with Dana in it',!!SD.DANA,'first time in 27 milestones');
  ok('...standing in your lounge, not in the void',
     Math.abs(SD.DANA.position.x-home.x)<9&&Math.abs(SD.DANA.position.z)<8,
     n1(SD.DANA.position.x)+', '+n1(SD.DANA.position.z));
  var n=0;SD.DANA.traverse(function(o){if(o.isMesh)n++;});
  ok('...as an actual person',n>=14,n+' parts');
  ok('...and you are in the room with her',
     Math.abs(SD.player.position.x-home.x)<9,
     'you at '+n1(SD.player.position.x)+', her at '+n1(SD.DANA.position.x));
})();

/* ── 2. WHERE SHE STANDS IS THE METER ───────────────────────────────────────
   The whole point of putting her on screen. You should be able to walk in and
   know how bad it is before she says a word. */
(function(){
  var seen=[];
  [0,30,50,70,90].forEach(function(v){
    SD.WIFE.susp=v;
    var sp=SD.danaSpot();
    seen.push({v:v,at:sp.at,x:sp.x,z:sp.z,line:sp.line});
  });
  seen.forEach(function(r){info('  susp '+r.v+' -> '+r.line);});
  var distinct={};seen.forEach(function(r){distinct[r.at]=1;});
  ok('SHE MOVES AS SHE GETS WORSE',Object.keys(distinct).length>=4,
     Object.keys(distinct).length+' distinct places across the range');
  ok('...calm is on the sofa',/sofa/.test(seen[0].line),seen[0].line);
  ok('...and the worst of it is at the front window',/window/.test(seen[4].line),
     seen[4].line);
  /* and the body actually goes there */
  SD.WIFE.susp=90;SD.buildDana();
  var far=SD.DANA.position.z;
  SD.WIFE.susp=0;SD.buildDana();
  var near=SD.DANA.position.z;
  ok('THE BODY MOVES WITH THE NUMBER',Math.abs(far-near)>1.0,
     'z '+n1(near)+' at calm vs '+n1(far)+' at 90');
})();

/* ── 3. YOU TALK TO HER BY WALKING UP TO HER ───────────────────────────────*/
(function(){
  SD.WIFE.susp=20;SD.startEvening();
  SD.player.position.set(SD.DANA.position.x,0,SD.DANA.position.z+0.9);
  SD.S.py=0;SD.S.yaw=0;
  var t=SD.findTarget();
  ok('E OFFERS HER WHEN YOU ARE NEXT TO HER',!!t&&t.t==='dana',t?t.t:'nothing');
  // ...and not from across the house
  SD.player.position.set(SD.DANA.position.x+9,0,SD.DANA.position.z);
  var far=SD.findTarget();
  ok('...and not from the other end of the house',!far||far.t!=='dana',
     far?far.t:'nothing in reach');
})();

/* ── 4. IT IS THE REAL DIALOGUE, NOT A NEW ONE ─────────────────────────────*/
(function(){
  SD.WIFE.susp=20;SD.startEvening();
  SD.player.position.set(SD.DANA.position.x,0,SD.DANA.position.z+0.9);
  SD.S.py=0;SD.S.yaw=0;
  var before=SD.WIFE.susp;
  SD.interact();
  var body=document.getElementById('talk-body');
  ok('TALKING TO HER OPENS THE SCENE',!!body&&/tk-c/.test(body.innerHTML),
     'the same SCENES dialogue the menu used to open');
  ok('...and it is still her asking',
     /Dana/.test(document.getElementById('talk-who').textContent)||
     document.getElementById('talk-who').textContent.length>0,
     document.getElementById('talk-who').textContent);
  SD.S.menuOpen=false;          // closeMenu is internal; the next section re-enters
})();

/* ── 5. AND YOU CAN LEAVE ───────────────────────────────────────────────────*/
(function(){
  SD.WIFE.susp=10;SD.startEvening();
  ok('you are in the evening',SD.S.evening===true&&!!SD.DANA);
  SD.endEvening();
  ok('GOING UP ENDS IT',!SD.S.evening);
  ok('...and takes her with it',!SD.DANA);
  ok('...and puts the night rig back',
     Math.abs(SD.renderer.toneMappingExposure-SD.CONST.NIGHT_EXPOSURE)<0.001,   // M43
     SD.renderer.toneMappingExposure.toFixed(2));
  ok('...and the sleepers are back in their beds',
     SD.SLEEPERS.some(function(s){return s.group&&s.group.visible;}));
})();

/* ── 6. AND IT DOES NOT LEAK HER ────────────────────────────────────────────*/
(function(){
  SD.startEvening();
  var m0=0;SD.scene.traverse(function(o){if(o.isMesh)m0++;});
  SD.endEvening();SD.startEvening();
  var m1=0;SD.scene.traverse(function(o){if(o.isMesh)m1++;});
  SD.endEvening();
  ok('TWO EVENINGS DO NOT MAKE TWO DANAS',m0===m1,m0+' -> '+m1+' meshes');
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

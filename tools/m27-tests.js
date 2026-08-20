/* M27 — HIDING.
   The game has had detection since M5 and never had COUNTERPLAY. A sleeper sits up,
   a man with a torch comes round the corner, somebody gets out of bed for a glass of
   water — and the only thing you could do about any of it was walk away and hope.
   Every stealth game is a conversation between hiding and looking, and this one only
   ever had half of it.

   Two rules keep it honest: you cannot climb into a wardrobe while somebody is
   already looking at you, and hiding spends the one thing the night is short of. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}
function n1(x){return (Math.round(x*10)/10).toString();}

try{
var SD=window.__SD,C=SD.CONST;
SD.stopLoop();SD.startHouse();SD.S.menuOpen=false;

/* ── 1. THERE ARE PLACES TO GO ──────────────────────────────────────────────*/
(function(){
  ok('THE STREET HAS HIDING PLACES',SD.HIDES.length>0,SD.HIDES.length+' of them');
  var perHouse=SD.HIDES.length/SD.HOUSES.length;
  ok('...several in every house',perHouse>=4,n1(perHouse)+' per lot');
  var labels={};SD.HIDES.forEach(function(h){labels[h.label]=1;});
  info('kinds: '+Object.keys(labels).join(', '));
  ok('...of more than one kind',Object.keys(labels).length>=4,
     Object.keys(labels).length+' kinds');
  ok('...and every one of them says something when you get in',
     SD.HIDES.every(function(h){return !!h.line;}));
  /* They must be ON something. A hiding place floating in the middle of a room is
     an invisible volume, which is exactly what this milestone is not. */
  var indoors=SD.HIDES.filter(function(h){return SD.ceilAt(h.pos[0],h.pos[2])>0;});
  ok('...and some are indoors and some are not',
     indoors.length>0&&indoors.length<SD.HIDES.length,
     indoors.length+' inside, '+(SD.HIDES.length-indoors.length)+' out');
})();

/* ── 2. YOU CAN GET IN, AND E IS ALSO THE WAY OUT ───────────────────────────*/
(function(){
  SD.startHouse();SD.S.menuOpen=false;SD.NIGHT.running=true;
  var hd=SD.HIDES.filter(function(h){return /wardrobe/.test(h.label);})[0];
  ok('there is a wardrobe to get into',!!hd);
  SD.player.position.set(hd.pos[0],0,hd.pos[2]+0.8);SD.S.py=0;
  ok('GETTING IN WORKS',SD.enterHide(hd)===true);
  ok('...and you are hidden',!!SD.S.hidden);
  ok('...and out of sight, which is the point',
     SD.player.visible===false,'the body is not in the room any more');
  SD.hideTick(C.HIDE_SETTLE+0.1);
  ok('...once you have settled',SD.isHidden()===true);
  SD.interact();
  ok('E GETS YOU BACK OUT',!SD.S.hidden&&SD.player.visible===true);
})();

/* ── 3. IT ACTUALLY STOPS THEM SEEING YOU ───────────────────────────────────
   The whole mechanic. Same sleeper, same position, same light — the only thing
   that changes is whether you are in the wardrobe. */
(function(){
  SD.startHouse();SD.S.menuOpen=false;SD.NIGHT.running=true;
  var s=SD.SLEEPERS[0];
  s.state='awake';s.awake=1e9;
  var px=s.x,pz=s.z-1.4;
  s.look=Math.atan2(pz-s.z,px-s.x);
  SD.player.position.set(px,0,pz);SD.S.py=0;
  SD.LIGHTS.push({x:px,z:pz,r:4,i:0.9});
  ok('THEY CAN SEE YOU STANDING THERE',SD.canSee(s,px,pz),
     'awake, facing you, in the light');
  var hd=SD.HIDES.filter(function(h){return /wardrobe/.test(h.label);})[0];
  SD.S.hidden=hd;SD.S.hideT=0;
  ok('AND NOT WHEN YOU ARE IN THE WARDROBE',!SD.canSee(s,px,pz),
     'in there is out of the world');
  SD.S.hidden=null;
  s.state='asleep';s.awake=0;
})();

/* ── 4. BUT YOU CANNOT CLIMB IN WHILE THEY ARE WATCHING ─────────────────────
   Without this the mechanic is an escape key: get caught, press E, be fine. */
(function(){
  SD.startHouse();SD.S.menuOpen=false;SD.NIGHT.running=true;
  var s=SD.SLEEPERS[0];
  var hd=SD.HIDES.filter(function(h){
    return /wardrobe/.test(h.label)&&Math.abs(h.pos[0]-s.x)<8;})[0];
  SD.player.position.set(hd.pos[0],0,hd.pos[2]+0.8);SD.S.py=0;
  var px=SD.player.position.x,pz=SD.player.position.z;
  s.state='awake';s.awake=1e9;
  s.look=Math.atan2(pz-s.z,px-s.x);
  SD.LIGHTS.push({x:px,z:pz,r:5,i:0.95});
  ok('somebody is watching',!!SD.watchedNow(),String(SD.watchedNow()));
  ok('YOU CANNOT HIDE WHILE THEY ARE LOOKING AT YOU',
     SD.enterHide(hd)===false&&!SD.S.hidden,
     'they watched you walk over to it');
  s.state='asleep';s.awake=0;
  ok('...and once they settle, you can',SD.enterHide(hd)===true);
  SD.exitHide();
})();

/* ── 5. AND IT COSTS YOU THE NIGHT ──────────────────────────────────────────*/
(function(){
  SD.startHouse();SD.S.menuOpen=false;SD.NIGHT.running=true;
  var hd=SD.HIDES[0];
  SD.player.position.set(hd.pos[0],0,hd.pos[2]+0.8);SD.S.py=0;
  SD.enterHide(hd);
  ok('getting in is not instant',SD.S.hideT>0&&!SD.isHidden(),
     n1(SD.S.hideT)+'s of settling first');
  var t0=SD.NIGHT.t;
  SD.run(120,1/30);
  ok('THE CLOCK RUNS WHILE YOU ARE IN THERE',SD.NIGHT.t>t0,
     'the night does not wait for you');
  var p0=SD.player.position.x;
  SD.hold(['w'],40,1/30);
  ok('...and you cannot walk about inside a wardrobe',
     Math.abs(SD.player.position.x-p0)<0.01,'you stay put');
  SD.exitHide();
})();

/* ── 6. THE MAN WITH THE TORCH CANNOT SEE YOU EITHER ────────────────────────*/
(function(){
  SD.startHouse();SD.S.menuOpen=false;
  SD.GAME.hardened=['watch'];SD.nightReset();SD.NIGHT.running=true;
  var w=SD.WATCH;
  ok('the watchman is out',!!w);
  var hd=SD.HIDES.filter(function(h){return /hedge/.test(h.label);})[0];
  ok('there is a hedge to get behind',!!hd);
  // stand in front of him, in the open
  w.x=hd.pos[0]-3.0;w.dir=1;w.seen=false;
  SD.player.position.set(hd.pos[0],0,w.z);SD.S.py=0;
  ok('he would catch you standing there',!!SD.watchedNow(),String(SD.watchedNow()));
  SD.S.hidden=hd;SD.S.hideT=0;
  SD.run(6,1/60);
  ok('BEHIND THE HEDGE HE WALKS PAST',SD.NIGHT.running&&!w.seen,
     'the night is still going');
  SD.S.hidden=null;
  SD.GAME.hardened=[];SD.nightReset();
})();

/* ── 7. AND A NEW NIGHT DOES NOT START INSIDE A WARDROBE ────────────────────*/
(function(){
  SD.startHouse();SD.S.menuOpen=false;
  var hd=SD.HIDES[0];
  SD.player.position.set(hd.pos[0],0,hd.pos[2]+0.8);SD.S.py=0;
  SD.enterHide(hd);
  ok('you are hidden',!!SD.S.hidden);
  SD.nightReset();
  ok('A NEW NIGHT PUTS YOU BACK IN THE WORLD',
     !SD.S.hidden&&SD.player.visible===true,
     'not still folded into somebody else’s coats');
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

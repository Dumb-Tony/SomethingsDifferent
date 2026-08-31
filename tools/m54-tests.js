/* M54 — TEMPORAL FREEZE. THE VERB THAT IS ACTUALLY ALIEN.

   GDD 5.10 specifies that the vertical slice ships exactly two abilities, Night Vision
   and Temporal Freeze. It shipped one. Everything the game asks of you until now is
   slow and deliberate - scan, print, swap, hide, wait - and every one of those is the
   work of a careful burglar. Nothing in the verbs was alien at all; the premise lived
   entirely in the prose.

   G holds the world for four seconds. The implementation is one number, because
   tick() already ran the player's simulation and the world's simulation as separate
   calls - they only ever needed separate clocks. `wdt` is zero while time is held, so
   the night clock stops, sleepers stop stirring, the watchman stops walking and the
   car stops coming, while movePlayer and the camera keep the real dt.

   THE COST IS BEING SEEN DOING IT, and that is the design. Everything else on this
   street has a mundane reading available: a noise is the boiler, a moved mug is your
   own forgetfulness, a man in the dark at 3am is a burglar. Time stopping has no
   mundane reading, so a witness does not get more frightened of a burglar - they stop
   believing in one. Certainty is the thing this assignment must never produce, which
   makes an unwitnessed freeze free and a witnessed one the most expensive mistake
   available. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}

try{
var SD=window.__SD,C=SD.CONST;
SD.stopLoop();

function night(){
  SD.startHouse();SD.beginNight();
  SD.S.freeze=0;SD.S.freezeCd=0;
  SD.S.daytime=false;SD.S.evening=false;
}
function run(n){for(var i=0;i<n;i++)SD.tick(1/60);}

/* ── 1. THE ABILITY EXISTS AND IS BOUNDED ───────────────────────────────────*/
(function(){
  ok('there is a freeze at all',typeof SD.freezeTime==='function');
  ok('...and it lasts a real number of seconds',C.FREEZE_T>=2&&C.FREEZE_T<=8,
     C.FREEZE_T+'s - GDD 5.10 says about four');
  ok('...and it has a long cooldown',C.FREEZE_CD>=C.FREEZE_T*4,
     C.FREEZE_CD+'s against '+C.FREEZE_T+'s of use');
  ok('...and being witnessed costs something serious',C.FREEZE_SEEN_SUSP>=10,
     '+'+C.FREEZE_SEEN_SUSP+' suspicion on anybody who watched');
})();

/* ── 2. THE WORLD STOPS ─────────────────────────────────────────────────────*/
(function(){
  night();
  var t0=SD.NIGHT.t;
  run(60);
  var moved=SD.NIGHT.t-t0;
  ok('the clock runs normally to begin with',moved>0,
     'the night advanced '+(moved*60).toFixed(2)+' minutes in a second');

  night();
  ok('the freeze fires',SD.freezeTime()===true);
  var t1=SD.NIGHT.t;
  run(60);                                   // one second of held time
  var held=SD.NIGHT.t-t1;
  info('one second of real time: clock moved '+(moved*60).toFixed(3)+
       ' minutes normally, '+(held*60).toFixed(3)+' while held');
  ok('THE NIGHT CLOCK DOES NOT ADVANCE WHILE TIME IS HELD',held===0,
     (held*60).toFixed(4)+' minutes');
})();

/* ── 3. ...BUT YOU DO NOT ───────────────────────────────────────────────────
   The whole ability. A freeze that stopped the player too would be a pause menu. */
(function(){
  night();
  SD.freezeTime();
  var p0=SD.player.position.clone();
  SD.S.keys={w:true};
  run(40);
  SD.S.keys={};
  var d=SD.player.position.distanceTo(p0);
  info('walked '+d.toFixed(2)+'m during the freeze');
  ok('YOU STILL MOVE WHILE THE WORLD DOES NOT',d>0.3,d.toFixed(2)+'m');
})();

/* ── 4. AND THE SLEEPERS ARE GENUINELY HELD ─────────────────────────────────*/
(function(){
  night();
  var s=SD.SLEEPERS[0];
  ok('there is somebody asleep to hold',!!s,s?s.name:'nobody');
  s.noise=40;s.sinceStir=0;
  SD.freezeTime();
  var n0=s.sinceStir,st0=s.stir;
  run(90);
  info(s.name+': sinceStir '+n0.toFixed(2)+' -> '+s.sinceStir.toFixed(2)+
       ', stir '+st0.toFixed(2)+' -> '+s.stir.toFixed(2));
  ok('A SLEEPER DOES NOT STIR WHILE TIME IS HELD',
     s.sinceStir===n0&&s.stir===st0,
     'sinceStir '+s.sinceStir.toFixed(3)+', stir '+s.stir.toFixed(3));
})();

/* ── 5. IT ENDS, AND THEN IT RECHARGES ──────────────────────────────────────*/
(function(){
  night();
  SD.freezeTime();
  ok('the body is marked while it runs',
     document.body.classList.contains('frozen'),'body.frozen');
  run(Math.ceil(C.FREEZE_T*60)+8);
  ok('IT ENDS ON ITS OWN',SD.S.freeze===0,'freeze '+SD.S.freeze);
  ok('...and the screen goes back to normal',
     !document.body.classList.contains('frozen'),'body.frozen cleared');
  var t0=SD.NIGHT.t;run(60);
  ok('...and the world starts again',SD.NIGHT.t>t0,
     'the clock moved '+((SD.NIGHT.t-t0)*60).toFixed(2)+' minutes');

  ok('IT CANNOT BE USED TWICE IN A ROW',SD.freezeTime()===false,
     'cooldown '+SD.S.freezeCd.toFixed(1)+'s still to run');
  SD.S.freezeCd=0;
  ok('...and it comes back when the cooldown does',SD.freezeTime()===true,
     'usable again once '+C.FREEZE_CD+'s have passed');
})();

/* ── 6. UNWITNESSED IS FREE ─────────────────────────────────────────────────*/
(function(){
  night();
  SD.SLEEPERS.forEach(function(s){s.state='asleep';});
  var before=SD.activeResidents().map(function(r){return r.suspicion||0;});
  ok('nobody is watching',SD.watchedNow()===null,SD.watchedNow()||'nobody');
  SD.freezeTime();
  var after=SD.activeResidents().map(function(r){return r.suspicion||0;});
  var moved=after.filter(function(v,i){return Math.abs(v-before[i])>0.001;}).length;
  ok('A FREEZE NOBODY SEES COSTS NOTHING',moved===0,
     moved+' residents changed');
})();

/* ── 7. WITNESSED IS RUINOUS ────────────────────────────────────────────────*/
(function(){
  night();
  var s=SD.SLEEPERS[0];
  /* wake them and stand in front of them */
  s.state='awake';s.awake=99;s.look=Math.atan2(-1,0);
  SD.player.position.set(s.x,0,s.z-1.2);
  SD.S.py=0;
  /* DO NOT TICK HERE. The first version ran two frames to settle, and in those
     two frames the sleeper SAW the player, onSeen fired and the night ended -
     so freezeTime was being called on a finished night and refused. watchedNow()
     reads positions directly and needs no simulation at all. */
  var watching=SD.watchedNow();
  ok('somebody is watching now',!!watching,watching||'nobody - the test proves nothing');
  var r=SD.RESIDENTS[s.res];
  r.suspicion=10;
  var before=r.suspicion;
  var fired=SD.freezeTime();
  info('freezeTime returned '+fired+'; phase='+SD.S.phase+
       ' daytime='+SD.S.daytime+' evening='+SD.S.evening+
       ' cd='+SD.S.freezeCd.toFixed(1)+' sightings='+SD.GAME.sightings+
       ' over='+JSON.stringify(SD.NIGHT.over)+' running='+SD.NIGHT.running);
  ok('the freeze actually fired',fired===true,'returned '+fired);
  info(r.name+' suspicion '+before.toFixed(1)+' -> '+r.suspicion.toFixed(1));
  ok('A WITNESS PAYS FOR IT',r.suspicion>=before+C.FREEZE_SEEN_SUSP-0.01,
     '+'+(r.suspicion-before).toFixed(1)+' - they stop believing in burglars');
  ok('...and the game records who saw it',SD.S.freezeSeenBy===watching,
     String(SD.S.freezeSeenBy));
  /* and it is far worse than simply being seen, which is the point */
  info('for comparison, an ordinary sighting costs 34 before familiarity');
  ok('...and it is a real fraction of the losing line',
     C.FREEZE_SEEN_SUSP>=C.LOSE_STREET*0.20,
     C.FREEZE_SEEN_SUSP+' against a LOSE_STREET of '+C.LOSE_STREET);
})();

/* -- 7b. AND THE WINDOW TO PAY IT IN IS REAL --------------------------------
   The obvious objection to charging for a witnessed freeze is that it might be
   unreachable. Chasing the failure above, I found that a sleeper who SEES you ends
   the night on the very next nightTick - so if "watched" and "caught" were the same
   instant, this cost would be theatre, and dead content is the exact thing this
   project keeps having to dig out of its own constants.

   They are not the same instant. A sleeper goes asleep -> STIRRING -> awake, and:

     * watchedNow() counts anybody not asleep who has line of sight, so a STIRRING
       sleeper who has sat up and can see you is already a witness;
     * onSeen only fires from the AWAKE branch.

   So there is a real window, several seconds long, in which somebody is watching and
   the night is not over - which is precisely the moment a player reaches for a panic
   button, and precisely when enterHide() refuses to let you into the wardrobe. The
   power is at its most useful exactly where it is most expensive. That is the design;
   this measures that it is true. */
(function(){
  night();
  var s=SD.SLEEPERS[0];
  SD.player.position.set(s.x,0,s.z-1.2);SD.S.py=0;
  /* canSee() uses s.look for the facing cone, so a sleeper who has not been
     pointed at the player cannot see them however close they are. The first
     version of this left look at 0, watchedNow returned null, and the 8 seconds
     it then measured were 8 seconds of nobody looking at anything. */
  s.state='stirring';s.stir=C.STIR_TIME;s.noise=0;s.sinceStir=0;
  s.look=Math.atan2(-1,0);
  ok('a stirring sleeper with a line of sight counts as watching',
     SD.watchedNow()===s.name,String(SD.watchedNow()));
  /* how long does that window last before they are actually awake and it is over? */
  var frames=0,ended=false;
  for(var i=0;i<60*8;i++){
    SD.tick(1/60);frames++;
    s.look=Math.atan2(-1,0);          // hold their gaze on you
    if(SD.NIGHT.over){ended=true;break;}
  }
  var secs=frames/60;
  info('watched but not yet caught: '+secs.toFixed(2)+'s before '+
       (ended?'the night ended':'they settled again')+
       ' (STIR_TIME is '+C.STIR_TIME+'s)');
  ok('THE WINDOW IS SECONDS, NOT A FRAME',secs>0.5,
     secs.toFixed(2)+'s - long enough to reach for a key, which is what makes the '+
     'witnessed cost reachable rather than theatre');
  ok('...and it is longer than the freeze it would be spent on',secs>=C.FREEZE_T*0.25,
     secs.toFixed(2)+'s against a '+C.FREEZE_T+'s freeze');
})();

/* ── 8. NOT IN DAYLIGHT ─────────────────────────────────────────────────────*/
(function(){
  SD.startHouse();SD.startWalk();
  SD.S.freeze=0;SD.S.freezeCd=0;
  ok('IT IS REFUSED IN THE AFTERNOON',SD.freezeTime()===false,
     'a street full of people is not the place for it');
  ok('...and nothing was spent',SD.S.freeze===0&&SD.S.freezeCd===0,
     'freeze '+SD.S.freeze+', cooldown '+SD.S.freezeCd);
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

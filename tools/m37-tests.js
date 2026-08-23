/* M37 — THE WORLD KEEPS THE PROMISES THE FICTION MAKES.

   FRACTURES says in its own header that "Every entry is a WORLD CHANGE, not a
   cutscene". Two entries move a body or an object by writing coordinates, and neither
   had ever been checked against the world it writes into.

   GRACE @100 — "started sleeping in the front room, facing the door" — is
   moveSleeper('grace',0,-0.8). dx=0 is the CENTRE of the house, which is exactly
   where the partition runs: measured, she landed inside a collider 0.76m wide and
   8.66m deep. A body in a wall is a pair of eyes that can never look at anything, so
   collapsing Grace silently deleted a threat.

   JUNE @50 — "moved the family photo somewhere she thinks is safer" — was
   relocate('pictureFrame',[1.35,0.60,2.95]): a KIND with no owner, taking
   objects.filter(kind)[0], the first of that kind on the whole street. There are
   three pictureFrames, belonging to June, Marisol and Grace. It picked June's only by
   the order the houses happen to be built in. And the position was absolute with no
   house offset, so it was also 3.6m from the bed rather than on the next nightstand.

   A note on method: an earlier pass of this measurement reported that no sleeper
   could see a man standing a metre away and nearly filed it as a bug. The probe was
   standing in an unlit bedroom at night, and being invisible there is the game
   working. The check below lights the room. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}

try{
var SD=window.__SD,C=SD.CONST;
SD.stopLoop();

/* A WALL is thin in one axis and long in the other. A bed is roughly square, and
   lying on one is the entire point - the first version of this check counted any
   collider and reported all seven sleepers as buried, in their beds. */
function wallsAt(x,z){
  var hits=[];
  for(var i=0;i<SD.colliders.length;i++){
    var c=SD.colliders[i];
    if(c.top!==undefined&&c.top<0.5)continue;
    var w=c.maxX-c.minX,d=c.maxZ-c.minZ;
    if(!((w<1.0&&d>2.0)||(d<1.0&&w>2.0)))continue;
    if(x>c.minX&&x<c.maxX&&z>c.minZ&&z<c.maxZ)hits.push(c);
  }
  return hits;
}

/* ── 1. NOBODY ENDS A RUN INSIDE A WALL ─────────────────────────────────────*/
(function(){
  SD.startHouse();
  var before=SD.SLEEPERS.filter(function(s){return wallsAt(s.x,s.z).length;});
  ok('nobody starts a run inside a wall',before.length===0,
     before.map(function(s){return s.res;}).join(',')||'all seven in bed');

  SD.activeResidents().forEach(function(r){r.doubt=100;});
  var fired=SD.fireFractures();
  info(fired.length+' fractures fired, every resident driven to 100');

  var buried=SD.SLEEPERS.filter(function(s){return wallsAt(s.x,s.z).length;});
  buried.forEach(function(s){
    var c=wallsAt(s.x,s.z)[0];
    info('  '+s.res+' at ('+s.x.toFixed(2)+','+s.z.toFixed(2)+') is inside a wall '+
         (c.maxX-c.minX).toFixed(2)+'m x '+(c.maxZ-c.minZ).toFixed(2)+'m');
  });
  ok('NOBODY IS INSIDE A WALL AFTER EVERY FRACTURE HAS FIRED',buried.length===0,
     buried.length?('buried: '+buried.map(function(s){return s.res;}).join(', '))
                  :'all seven somewhere real');

  /* Grace specifically - the one that was broken. */
  var g=SD.SLEEPERS.filter(function(s){return s.res==='grace';})[0];
  var h=SD.houseById('okonkwo');
  ok('GRACE REALLY DID MOVE to the front room',g.z<0,
     'z='+g.z.toFixed(2)+' (the front of the house is negative z)');
  ok('...and she is clear of the partition at the centre of the house',
     Math.abs(g.x-h.x)>0.5,
     'she is '+Math.abs(g.x-h.x).toFixed(2)+'m off centre; the partition is at 0');
  ok('...and still inside her own house',
     Math.abs(g.x-h.x)<6,'|dx| = '+Math.abs(g.x-h.x).toFixed(2));
})();

/* ── 2. ...AND CAN STILL SEE, WHICH IS WHY IT MATTERS ───────────────────────*/
(function(){
  SD.startHouse();
  SD.activeResidents().forEach(function(r){r.doubt=100;});
  SD.fireFractures();
  var g=SD.SLEEPERS.filter(function(s){return s.res==='grace';})[0];
  g.state='awake';g.absent=false;
  /* canSee(s,px,pz) takes the position explicitly - calling it with one argument
     passes undefined and every comparison against NaN is false, which is how an
     earlier draft of this nearly filed "no sleeper can see anything" as a bug.
     s.look is an ANGLE they are sweeping, not a flag, so point it at the player. */
  var probeX=g.x+0.9,probeZ=g.z;
  g.look=Math.atan2(probeZ-g.z,probeX-g.x);
  /* And light it: an unlit spot beyond 2.2m is invisible BY DESIGN. */
  SD.LIGHTS.push({x:g.x,z:g.z,r:6,i:1.0});
  SD.player.position.set(probeX,0,probeZ);SD.S.py=0;
  var seen=SD.canSee(g,probeX,probeZ);
  ok('A COLLAPSED GRACE CAN STILL SEE YOU',!!seen,
     'standing lit, one metre in front of her');
  info('this is the assertion the wall was silently defeating - a body inside solid');
  info('geometry is a threat that has been deleted without anything saying so');
})();

/* ── 3. A FRACTURE HAPPENS TO THE PERSON IT NAMES ───────────────────────────*/
(function(){
  SD.startHouse();
  var frames=SD.objects.filter(function(o){return o.kind==='pictureFrame';});
  info(frames.length+' pictureFrames on the street: '+
       frames.map(function(f){return f.owner;}).join(', '));
  ok('more than one person owns one',frames.length>1,
     'which is why filter(kind)[0] was a coin flip');

  var june=frames.filter(function(f){return f.owner==='june';})[0];
  var others=frames.filter(function(f){return f.owner!=='june';});
  var beforeOthers=others.map(function(f){return f.spec._pos.slice();});
  var beforeJune=june.spec._pos.slice();

  /* Fire June's 50 only. */
  SD.RESIDENTS.june.doubt=55;
  SD.fireFractures();

  ok('JUNE’S PHOTOGRAPH IS THE ONE THAT MOVED',
     JSON.stringify(june.spec._pos)!==JSON.stringify(beforeJune),
     'from ('+beforeJune[0].toFixed(2)+','+beforeJune[2].toFixed(2)+') to ('+
     june.spec._pos[0].toFixed(2)+','+june.spec._pos[2].toFixed(2)+')');
  ok('...AND NOBODY ELSE’S DID',
     others.every(function(f,i){
       return JSON.stringify(f.spec._pos)===JSON.stringify(beforeOthers[i]);}),
     others.map(function(f){return f.owner;}).join(', ')+' untouched');

  /* ...and it landed somewhere that makes sense of the sentence. */
  var jb=SD.SLEEPERS.filter(function(s){return s.res==='june';})[0];
  var d=Math.hypot(june.spec._pos[0]-jb.x,june.spec._pos[2]-jb.z);
  /* The bed is 2.34m wide and June sleeps on the far side of it, so the other
     nightstand is necessarily a bed-width away. 2.5 is that, plus the nightstand. */
  ok('...ON THE OTHER NIGHTSTAND, not across the room',d<2.5,
     d.toFixed(2)+'m from her bed, across a 2.34m bed; it used to be 3.63m');
  ok('...and not inside a wall',wallsAt(june.spec._pos[0],june.spec._pos[2]).length===0);
  ok('...and inside her own house',
     Math.abs(june.spec._pos[0]-SD.houseById('hoyt').x)<8,
     'dx '+(june.spec._pos[0]-SD.houseById('hoyt').x).toFixed(2));
})();

/* ── 4. relocate() IS CORRECT BY CONSTRUCTION, NOT BY BUILD ORDER ───────────*/
(function(){
  SD.startHouse();
  /* Ask it for somebody else's frame and it must move THEIRS. */
  var grace=SD.objects.filter(function(o){
    return o.kind==='pictureFrame'&&o.owner==='grace';})[0];
  var june=SD.objects.filter(function(o){
    return o.kind==='pictureFrame'&&o.owner==='june';})[0];
  var jBefore=june.spec._pos.slice();
  SD.relocate('grace','pictureFrame',[2.60,0.60,4.30]);
  ok('ASKING FOR GRACE’S MOVES GRACE’S',
     Math.abs(grace.spec._pos[0]-(SD.houseById('okonkwo').x+2.60))<0.01,
     'landed at dx '+(grace.spec._pos[0]-SD.houseById('okonkwo').x).toFixed(2)+
     ' in her own house');
  ok('...and leaves June’s alone',
     JSON.stringify(june.spec._pos)===JSON.stringify(jBefore));
  ok('...and the position is LOCAL to the house it lands in',
     Math.abs(grace.spec._pos[0]-june.spec._pos[0])>10,
     'two houses apart, same local offset');
  ok('asking for a kind nobody owns fails cleanly',
     SD.relocate('nobody','pictureFrame',[0,0,0])===false);
})();

/* ── 5. STATE THAT DESCRIBES NOTHING IS GONE ────────────────────────────────*/
(function(){
  ok('CONST.HIDE_R is gone',C.HIDE_R===undefined,
     'it documented a 1.6m reach rule nothing ever read; the real one is INTERACT_RANGE');
  /* INTERACT_RANGE is a module-level constant, not a member of CONST - so assert the
     BEHAVIOUR instead of hunting for a name. Hiding obeys the same reach as every
     other E in the game, which is the whole reason HIDE_R was redundant. */
  SD.startHouse();SD.nightReset();
  var hd=SD.HIDES[0];
  SD.player.position.set(hd.pos[0],0,hd.pos[2]+0.6);SD.S.py=0;
  ok('...and hiding still works at ordinary reach',SD.enterHide(hd)===true,
     'from 0.6m, the same E that opens a door');
  SD.exitHide();
  SD.startHouse();
  ok('GAME.watched is gone',SD.GAME.watched===undefined,
     'set by the afternoon walk since M20 and read nowhere');
  /* ...and the walk still works without it. */
  SD.startDay();SD.DAY.block=3;SD.DAY.actions=3;SD.showDay();
  SD.doAction('walk');
  ok('...and the afternoon still works',SD.S.daytime===true&&SD.DAYFOLK.length>0,
     SD.DAYFOLK.length+' neighbours out');
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

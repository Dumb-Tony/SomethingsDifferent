/* ─────────────────────────────────────────────────────────────────────────────
   Milestone 5 — night pressure: clock, noise, sleepers, light, being seen.

   The milestone's stated verification is "deliberately wake Walt; deliberately get
   caught". Sections 5 and 7 do exactly that.
   ───────────────────────────────────────────────────────────────────────────── */
(function(){
var out=[],pass=0,fail=0;
function ok(name,cond,detail){
  if(cond){pass++;out.push('PASS  '+name+(detail?'   ('+detail+')':''));}
  else    {fail++;out.push('FAIL  '+name+(detail?'   ('+detail+')':''));}
}
function info(s){out.push('      '+s);}
function near(a,b,tol){return Math.abs(a-b)<=tol;}

try{
  var SD=window.__SD;
  ok('__SD present',!!SD); if(!SD)throw new Error('no __SD');
  var C=SD.CONST,R=SD.RESIDENTS;
  SD.stopLoop();
  SD.startHouse();

  /* FLOORPLAN LAYOUT UNITS -> metres, exactly as the builder converts them. Values
     taken from live objects (walt.x, walt.z) are already metres; do not convert. */
  function P(v){return v*SD.CONST.ROOM_SCALE;}
  function stand(x,z,yaw){
    SD.player.position.set(x,0,z);
    SD.S.py=0;SD.S.vy=0;SD.S.grounded=true;SD.S.mvx=0;SD.S.mvz=0;
    SD.S.yaw=yaw===undefined?0:yaw;SD.S.camP=null;SD.S.camL=null;SD.S.focus=null;
  }
  function getIn(){                       // key, unlock, open, stand in the hall
    SD.GAME.hasSpareKey=true;
    if(SD.frontDoor.locked||!SD.frontDoor.open)SD.useDoor(SD.frontDoor);
    stand(0,P(-2.4),Math.PI);
  }
  var walt=SD.SLEEPERS.filter(function(s){return s.res==='walt';})[0];
  var june=SD.SLEEPERS.filter(function(s){return s.res==='june';})[0];

  /* ── 1. sleepers exist and start asleep ────────────────────────────────── */
  var hoytSleep=SD.SLEEPERS.filter(function(s){return s.house==='hoyt';});
  ok('two sleepers in the Hoyt bed',hoytSleep.length===2,
     hoytSleep.map(function(s){return s.name;}).join(' & '));
  ok('the whole street is asleep',SD.SLEEPERS.length>=6,SD.SLEEPERS.length+' sleepers');
  ok('both start asleep with no accumulated noise',
     SD.SLEEPERS.every(function(s){return s.state==='asleep'&&s.noise===0;}));
  ok('they have bodies in the scene',
     SD.SLEEPERS.every(function(s){return s.group&&s.group.parent===SD.scene;}));
  ok('the bedroom is where they are',walt.z>1.0&&june.z>1.0,
     'walt z='+walt.z+' june z='+june.z);

  /* ── 2. the night clock ────────────────────────────────────────────────── */
  SD.nightReset();
  ok('the night starts at 23:00',SD.clockString()==='23:00',SD.clockString());
  ok('the night is 6.5 hours long',near(SD.NIGHT_HOURS,6.5,1e-9),SD.NIGHT_HOURS);
  SD.NIGHT.t=3.0;
  ok('the clock advances past midnight correctly',SD.clockString()==='02:00',SD.clockString());
  SD.nightReset();
  var realSeconds=0;
  while(SD.NIGHT.running&&realSeconds<2000){SD.nightTick(1/60);realSeconds+=1/60;}
  ok('a whole night takes about 13 real minutes',near(realSeconds,780,3),
     realSeconds.toFixed(1)+'s = '+(realSeconds/60).toFixed(1)+' min');
  ok('curfew ends the night',!SD.NIGHT.running&&SD.NIGHT.over.reason==='curfew',
     SD.NIGHT.over?SD.NIGHT.over.reason:'still running');
  SD.closeMenuForTest&&SD.closeMenuForTest();
  SD.S.menuOpen=false;

  /* ── 3. noise: distance and WALLS ──────────────────────────────────────── */
  SD.nightReset();
  var wallsHallToBed=SD.wallsBetween(0,-2.4,walt.x,walt.z);
  ok('there are walls between the hall and the bed',wallsHallToBed>=1,
     wallsHallToBed+' walls');
  ok('there is a clear line within the bedroom',
     SD.wallsBetween(2.6,1.6,walt.x,walt.z)===0);

  SD.nightReset();SD.emitNoise(walt.x,walt.z-0.6,10);
  var near1=walt.noise;
  SD.nightReset();SD.emitNoise(walt.x,walt.z-3.0,10);
  var far1=walt.noise;
  ok('noise falls off with distance',near1>far1&&far1>0,
     'at 0.6m '+near1.toFixed(2)+' vs at 3m '+far1.toFixed(2));

  SD.nightReset();SD.emitNoise(0,P(-2.4),10);         // hall, through walls
  var throughWalls=walt.noise;
  SD.nightReset();SD.emitNoise(P(2.6),P(1.6),10);     // bedroom doorway, same-ish range
  var sameRoom=walt.noise;
  ok('walls muffle sound',throughWalls<sameRoom*0.6,
     'through '+wallsHallToBed+' walls '+throughWalls.toFixed(2)+
     ' vs same room '+sameRoom.toFixed(2));
  ok('noise beyond NOISE_RANGE is silent',(function(){
      SD.nightReset();SD.emitNoise(walt.x,walt.z-C.NOISE_RANGE-1,50);
      return walt.noise===0;})());

  /* ── 4. wake thresholds ────────────────────────────────────────────────── */
  var thW=SD.wakeThreshold(walt),thJ=SD.wakeThreshold(june);
  ok('June is the lighter sleeper',thJ<thW,
     'walt '+thW.toFixed(1)+' vs june '+thJ.toFixed(1));
  var calm=SD.wakeThreshold(walt);
  R.walt.stress=100;
  var stressed=SD.wakeThreshold(walt);
  R.walt.stress=0;
  ok('STRESS WRECKS SLEEP: working a resident makes their house louder',
     stressed<calm,'calm '+calm.toFixed(1)+' -> stressed '+stressed.toFixed(1));

  /* ── 5. DELIBERATELY WAKE WALT ─────────────────────────────────────────── */
  SD.nightReset();
  stand(P(2.6),P(1.6),0);                              // in the bedroom doorway
  ok('he is asleep before you start',walt.state==='asleep');
  var bangs=0;
  while(walt.state==='asleep'&&bangs<200){
    SD.emitNoise(P(2.6),P(1.9),3);SD.updateSleepers(1/60);bangs++;
  }
  ok('enough noise makes him STIR',walt.state==='stirring',
     walt.state+' after '+bangs+' knocks, noise '+walt.noise.toFixed(1)+
     '/'+thW.toFixed(1));
  info('stirring is a GRACE PERIOD - go still and he settles');
  var settled=0;
  while(walt.state!=='asleep'&&settled<900){SD.updateSleepers(1/60);settled++;}
  ok('GOING STILL lets him settle back',walt.state==='asleep',
     'settled after '+(settled/60).toFixed(2)+'s of silence');
  ok('...and he does not immediately re-trigger',walt.noise<thW,
     'noise '+walt.noise.toFixed(1)+' < '+thW.toFixed(1));

  // now keep going through the grace period
  SD.nightReset();
  var t2=0;
  while(walt.state!=='awake'&&t2<1800){
    SD.emitNoise(P(2.6),P(1.9),3);SD.updateSleepers(1/60);t2++;
  }
  ok('CARRYING ON REGARDLESS wakes him fully',walt.state==='awake',
     walt.state+' after '+(t2/60).toFixed(2)+'s');
  ok('a woken sleeper sits up',walt.group.userData.torso.rotation.x<-0.1,
     'torso '+walt.group.userData.torso.rotation.x.toFixed(2)+' rad');

  /* ── 6. light zones ────────────────────────────────────────────────────── */
  ok('the streetlight lights the path',SD.litAt(P(-3.0),P(-8.3))>0.8,
     SD.litAt(P(-3.0),P(-8.3)).toFixed(2));
  ok('the far corner of the yard is dark',SD.litAt(P(5.0),P(-4.0))<C.LIT_SEEN_MIN,
     SD.litAt(P(5.0),P(-4.0)).toFixed(2));
  ok('windows throw a pool of moonlight inside',SD.litAt(P(4.0),P(-0.3))>0.3,
     SD.litAt(P(4.0),P(-0.3)).toFixed(2));
  ok('the middle of the hall is unlit',SD.litAt(0,P(-2.4))<C.LIT_SEEN_MIN,
     SD.litAt(0,P(-2.4)).toFixed(2));

  /* ── 7. DELIBERATELY GET CAUGHT ────────────────────────────────────────── */
  SD.nightReset();R.walt.suspicion=0;SD.GAME.sightings=0;
  walt.state='awake';walt.awake=C.AWAKE_TIME;
  walt.look=Math.atan2(-1,0);                           // looking toward -z, the door
  stand(walt.x,walt.z-1.2,0);                           // right in front of him, close
  ok('a woken sleeper sees you standing over him',SD.canSee(walt,walt.x,walt.z-1.2),
     'range 1.2m, unlit but close');
  var susBefore=R.walt.suspicion;
  SD.updateSleepers(1/60);
  ok('BEING SEEN ends the night',!SD.NIGHT.running&&SD.NIGHT.over.reason==='seen',
     SD.NIGHT.over?SD.NIGHT.over.reason:'still running');
  ok('being seen converts the night into SUSPICION, not doubt',
     R.walt.suspicion>susBefore+20&&R.walt.doubt===0,
     'suspicion '+susBefore.toFixed(1)+' -> '+R.walt.suspicion.toFixed(1)+
     ', doubt '+R.walt.doubt.toFixed(1));
  ok('the sighting is counted',SD.GAME.sightings===1,'n='+SD.GAME.sightings);
  SD.S.menuOpen=false;

  /* darkness and distance protect you */
  SD.nightReset();
  walt.state='awake';walt.awake=C.AWAKE_TIME;walt.look=Math.atan2(-1,0);
  ok('at range in the dark you are invisible',
     !SD.canSee(walt,walt.x,walt.z-5.0),
     'lit '+SD.litAt(walt.x,walt.z-5.0).toFixed(2)+' < '+C.LIT_SEEN_MIN);
  ok('...but standing in the window light gives you away',
     SD.canSee(walt,P(2.4),P(2.95))===true||SD.litAt(P(2.4),P(2.95))>=C.LIT_SEEN_MIN,
     'bedroom window pool lit '+SD.litAt(P(2.4),P(2.95)).toFixed(2));
  walt.look=Math.atan2(1,0);                            // turn him around
  ok('he cannot see behind himself',!SD.canSee(walt,walt.x,walt.z-1.2));
  walt.state='asleep';

  /* a wall still blocks sight even at point-blank */
  SD.nightReset();
  june.state='awake';june.awake=C.AWAKE_TIME;june.look=Math.atan2(-1,0);
  ok('a wall blocks line of sight',!SD.canSee(june,june.x,P(-2.4)),
     SD.wallsBetween(june.x,june.z,june.x,-2.4)+' walls between');
  june.state='asleep';

  /* ── 8. sneaking actually helps ────────────────────────────────────────── */
  ok('sneaking is far quieter than running',
     C.N_STEP_SNEAK*3<C.N_STEP_WALK&&C.N_STEP_WALK*2<C.N_STEP_RUN,
     'sneak '+C.N_STEP_SNEAK+' walk '+C.N_STEP_WALK+' run '+C.N_STEP_RUN);
  /* Cross the bedroom the same distance in each mode and see who wakes. Steps are
     emitted at the real cadence, with decay running, so this is the actual game. */
  function crossBedroom(mode){
    SD.nightReset();
    var mag=mode==='sneak'?C.N_STEP_SNEAK:(mode==='run'?C.N_STEP_RUN:C.N_STEP_WALK);
    var cadence=mode==='sneak'?0.95:(mode==='run'?0.24:0.44);
    var acc=0;
    for(var f=0;f<24*60;f++){                 // 24 seconds of crossing
      acc+=1/60;
      if(acc>=cadence){acc=0;SD.emitNoise(P(2.6),P(1.7),mag);}
      SD.updateSleepers(1/60);
      if(walt.state==='awake')break;
    }
    return {state:walt.state,noise:walt.noise};
  }
  var sneakRun=crossBedroom('sneak');
  var runRun=crossBedroom('run');
  info('crossing the bedroom: sneaking -> '+sneakRun.state+
      ' (noise '+sneakRun.noise.toFixed(1)+'), running -> '+runRun.state+
      ' (noise '+runRun.noise.toFixed(1)+'), threshold '+thW.toFixed(1));
  ok('you can cross the bedroom sneaking without waking him',
     sneakRun.state==='asleep',sneakRun.state);
  ok('running across it wakes him',runRun.state==='awake',runRun.state);
  walt.state='asleep';

  /* ── 9. handling objects is audible ────────────────────────────────────── */
  SD.nightReset();
  var photo=SD.objects.filter(function(o){return o.kind==='pictureFrame';})[0];
  ok('the family photo is on the nightstand beside them',
     photo&&photo.owner==='june'&&photo.spec._pos[2]>2.0,
     photo?('z='+photo.spec._pos[2]):'missing');
  SD.scanObject(photo);
  var scanNoise=walt.noise;
  ok('scanning is quiet but not silent',scanNoise>0&&scanNoise<thW*0.25,
     scanNoise.toFixed(2));
  SD.nightReset();
  SD.rotateObject(photo,8);
  ok('handling an object right beside a sleeper is loud',walt.noise>scanNoise*2,
     walt.noise.toFixed(2)+' vs scan '+scanNoise.toFixed(2));

  /* ── 10. presentation didn't break anything ────────────────────────────── */
  ok('night lighting is applied in the house',
     document.body.classList.contains('night'));
  ok('shadows are on',SD.renderer.shadowMap.enabled===true);
  SD.renderer.render(SD.scene,SD.camera);
  var gl=SD.renderer.getContext();
  var cw=SD.renderer.domElement.width,ch=SD.renderer.domElement.height;
  var seen={},pts=[[0.5,0.5],[0.25,0.7],[0.75,0.35],[0.5,0.15],
                   [0.12,0.5],[0.88,0.62],[0.4,0.85],[0.62,0.28]];
  for(var s2=0;s2<pts.length;s2++){
    var b=new Uint8Array(4);
    gl.readPixels(Math.floor(cw*pts[s2][0]),Math.floor(ch*pts[s2][1]),1,1,gl.RGBA,gl.UNSIGNED_BYTE,b);
    seen[b[0]+','+b[1]+','+b[2]]=1;
  }
  ok('the night scene still renders varied geometry',Object.keys(seen).length>=3,
     Object.keys(seen).join(' | '));

  var eb=document.getElementById('err-banner');
  ok('no crash banner',!eb,eb?eb.textContent.slice(0,200):'');

}catch(e){
  fail++;
  out.push('FAIL  harness threw: '+(e&&e.message)+'  @ '+String((e&&e.stack)||'').split('\n').slice(0,3).join(' | '));
}

var summary='SDTEST '+(fail===0?'ALL-PASS':'FAILURES')+' pass='+pass+' fail='+fail;
var pre=document.createElement('pre');
pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\n'+summary+'\n'+out.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);
document.title=summary;
})();



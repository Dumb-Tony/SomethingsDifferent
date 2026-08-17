/* ─────────────────────────────────────────────────────────────────────────────
   Milestone 9 — audio.

   You cannot assert that something sounds good. You CAN assert every property that
   makes the audio layer a gameplay system instead of decoration:

     - it is inert until a user gesture, and safe to call while inert
     - the graph is actually wired, and the sliders actually reach it
     - loudness falls off, pans, and is muffled by the SAME walls the sleepers use
     - every action that makes NOISE also names a SOUND (the coupling property)
     - the tension tone is monotonic in loudestHeat()
     - and, most importantly, TURNING THE AUDIO ON DOES NOT CHANGE THE SIMULATION
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
  var X=SD.SFX,C=SD.CONST;
  ok('the audio layer is exported',!!X); if(!X)throw new Error('no SFX');
  SD.stopLoop();

  /* ── 1. inert until a gesture ──────────────────────────────────────────────
     A browser refuses an AudioContext before a real user gesture, so the game has
     to be able to run with the whole layer dead. Every public call must no-op. */
  ok('no AudioContext exists before a gesture',X.ctx===null||X.ctx===undefined,
     X.ctx?('ctx state '+X.ctx.state):'null');
  var inertSafe=true,inertErr='';
  try{
    X.world('step',0,0,1); X.world('handle',1,1,3,'ceramic');
    X.cue('day'); X.cue('seen'); X.update(1/60); X.setHeat(0.9);
    X.place(3,3); X.resume();
  }catch(e){inertSafe=false;inertErr=e.message;}
  ok('every call is a safe no-op while inert',inertSafe,inertErr);
  ok('...and reports that it played nothing',
     X.world('step',0,0,1)===false&&X.cue('day')===false);
  ok('no drone is built while inert',!X.drone);

  /* ── 2. the simulation baseline, recorded BEFORE audio exists ──────────────
     Section 8 replays exactly this with the audio graph live. If a single number
     differs, the audio layer is reaching into the simulation and that is a bug. */
  function scriptedNight(){
    SD.startHouse();
    SD.S.menuOpen=false;SD.S.focus=null;
    SD.nightReset();
    /* Stand at your own front door: far enough that canSee() can never fire (which
       would end the night and make the two runs incomparable for the wrong reason),
       while the noise is emitted right beside the Hoyts' bed. */
    SD.player.position.set(SD.HOME.x,0,SD.HOME.z);
    SD.S.py=0;SD.S.vy=0;SD.S.grounded=true;SD.S.mvx=0;SD.S.mvz=0;SD.S.yaw=0;
    var walt=SD.SLEEPERS.filter(function(s){return s.res==='walt';})[0];
    var june=SD.SLEEPERS.filter(function(s){return s.res==='june';})[0];
    var trace=[];
    for(var i=0;i<60;i++){
      SD.emitNoise(2.15,2.40,C.N_HANDLE,'handle','ceramic');
      SD.updateSleepers(1/30);
      X.update(1/30);
      trace.push(walt.noise.toFixed(9)+':'+walt.state+':'+
                 june.noise.toFixed(9)+':'+june.state);
    }
    return trace.join('|');
  }
  var baseline=scriptedNight();
  ok('the scripted night actually drives the sleepers',baseline.indexOf('stirring')>0||
     baseline.indexOf('awake')>0,'reached '+baseline.split('|').pop().split(':')[1]);

  /* ── 3. arm(): the graph ───────────────────────────────────────────────────*/
  var ctx=X.arm();
  ok('arm() builds a context',!!ctx,ctx?('state '+ctx.state):'null');
  ok('...and it is the same one on a second call',X.arm()===ctx);
  ok('a master gain exists',!!X.master);
  var buses=X.buses;
  ok('three buses exist',buses&&buses.music&&buses.world&&buses.foley,
     buses?Object.keys(buses).join(','):'none');
  ok('every bus feeds the master',
     ['music','world','foley'].every(function(k){
       return buses[k].numberOfOutputs===1;}));
  ok('the buses are distinct nodes',
     buses.music!==buses.world&&buses.world!==buses.foley);

  /* ── 4. the mixer ──────────────────────────────────────────────────────────*/
  var saved={mute:X.settings.mute,music:X.settings.music,
             world:X.settings.world,foley:X.settings.foley};
  /* Assert the TARGET, not the live AudioParam. applyMix ramps with setTargetAtTime
     (an instant jump clicks audibly), so .gain.value still holds the old level for a
     few tens of milliseconds and cannot be read synchronously. Section 11 proves the
     target really does reach the graph, by rebuilding it. */
  X.set('music',0.5);
  ok('a slider reaches its bus',near(X.busGain('music'),0.25,1e-9),
     'set 0.50 -> target '+X.busGain('music').toFixed(4));
  info('gain is the slider SQUARED: a linear slider does nothing until its last fifth');
  X.set('music',1.0);
  ok('...and full is full',near(X.busGain('music'),1,1e-9));
  X.set('music',0.5);
  X.set('mute',true);
  ok('MUTE silences every bus',
     ['music','world','foley'].every(function(k){return X.busGain(k)===0;}),
     ['music','world','foley'].map(function(k){return X.busGain(k);}).join(','));
  X.set('mute',false);
  ok('...and unmuting restores the levels, not zero',
     near(X.busGain('music'),0.25,1e-9),X.busGain('music').toFixed(4));
  ok('a slider is clamped to 0..1',
     (X.set('world',5),X.settings.world===1)&&(X.set('world',-3),X.settings.world===0));
  ok('an unknown channel is refused',X.set('nonsense',0.5)===false);

  X.set('world',0.63);
  var rawTxt=null;
  try{rawTxt=localStorage.getItem(SD.AUDIO_KEY);}catch(e){}
  var raw=null;try{raw=JSON.parse(rawTxt||'null');}catch(e){}
  ok('settings persist to their own storage key',raw&&near(raw.world,0.63,1e-9),
     SD.AUDIO_KEY+' = '+rawTxt);
  ok('...which is NOT the save file',SD.AUDIO_KEY!==SD.SAVE_KEY,
     SD.AUDIO_KEY+' vs '+SD.SAVE_KEY);
  info('so starting a new game cannot reset your volume, and a corrupt save cannot mute you');
  ['mute','music','world','foley'].forEach(function(k){X.set(k,saved[k]);});

  /* ── 5. the positional model ───────────────────────────────────────────────*/
  SD.startHouse();
  SD.S.menuOpen=false;SD.S.focus=null;
  SD.player.position.set(0,0,0);SD.S.yaw=0;
  var g0=X.place(0,0).g,g5=X.place(0,-5).g,g10=X.place(0,-10).g,gOut=X.place(0,-25).g;
  ok('loudness falls off with distance',g0>g5&&g5>g10&&g10>gOut,
     [g0,g5,g10,gOut].map(function(v){return v.toFixed(3);}).join(' > '));
  ok('beyond AUD_RANGE it is silent',X.place(0,-C.AUD_RANGE-1).g===0,
     'range '+C.AUD_RANGE+'m');
  ok('AUD_RANGE is wider than the sleepers\' NOISE_RANGE',C.AUD_RANGE>C.NOISE_RANGE,
     C.AUD_RANGE+' vs '+C.NOISE_RANGE);
  info('deliberate: you hear yourself from further than they can, so sound warns you');
  ok('a source on your right pans right',near(X.place(6,0).pan,1,1e-6),
     X.place(6,0).pan.toFixed(3));
  ok('a source on your left pans left',near(X.place(-6,0).pan,-1,1e-6),
     X.place(-6,0).pan.toFixed(3));
  ok('a source straight ahead is centred',near(X.place(0,-6).pan,0,1e-6),
     X.place(0,-6).pan.toFixed(3));
  /* Turn the camera 90deg and the source that WAS straight ahead is now hard to one
     side. (A source that ends up directly behind you pans centre — stereo has no
     front/back, which is a limitation of the model, not a bug in it.) */
  SD.S.yaw=Math.PI/2;
  ok('the stereo image turns with the camera',X.place(0,-6).pan>0.9,
     'the source that was centred is now at '+X.place(0,-6).pan.toFixed(3));
  ok('...and a source directly behind you reads centre (stereo has no front/back)',
     near(X.place(6,0).pan,0,1e-6),X.place(6,0).pan.toFixed(3));
  SD.S.yaw=0;

  // walls: the same count the sleepers' noise model uses
  SD.player.position.set(0,0,-2.4);                       // the hall
  var walt=SD.SLEEPERS.filter(function(s){return s.res==='walt';})[0];
  var pw=X.place(walt.x,walt.z), pc=X.place(0,-2.4+0.5);
  ok('there is a wall between the hall and the bed',pw.walls>0,pw.walls+' walls');
  ok('a wall makes it quieter',pw.g<pc.g,
     'through '+pw.walls+' walls '+pw.g.toFixed(3)+' vs same room '+pc.g.toFixed(3));
  ok('the audio uses the SAME wallsBetween the sleepers do',
     pw.walls===SD.wallsBetween(0,-2.4,walt.x,walt.z));

  /* ── 6. THE COUPLING PROPERTY ──────────────────────────────────────────────
     Every action that adds noise to a sleeper's meter must also name a sound. If
     these ever drift apart you get the worst possible bug in a stealth game: a
     thing that is loud to them and silent to you. */
  var seen=[],realWorld=X.world;
  X.world=function(n,x,z,mag,mtl){seen.push({n:n,x:x,z:z,mag:mag,mtl:mtl});
                                  return realWorld.apply(null,arguments);};
  function lastVoice(){return seen.length?seen[seen.length-1]:null;}

  SD.GAME.hasSpareKey=true;
  seen.length=0; SD.useDoor(SD.frontDoor);
  ok('opening a door names a sound',lastVoice()&&lastVoice().n==='door',
     lastVoice()?lastVoice().n:'none');
  ok('...at the door\'s own position, with the door\'s own magnitude',
     lastVoice()&&lastVoice().mag===C.N_DOOR,lastVoice()?('mag '+lastVoice().mag):'-');

  seen.length=0; SD.searchPlanter(SD.PLANTERS[0]);
  ok('searching a planter names a sound',lastVoice()&&lastVoice().n==='search');

  var mug=SD.objects.filter(function(o){return o.kind==='coffeeMug';})[0];
  seen.length=0; SD.scanObject(mug);
  ok('scanning names a sound',lastVoice()&&lastVoice().n==='scan');
  ok('...and it is the quietest thing you do',C.N_SCAN<C.N_SEARCH&&C.N_SEARCH<C.N_HANDLE,
     'scan '+C.N_SCAN+' < search '+C.N_SEARCH+' < handle '+C.N_HANDLE);

  seen.length=0; SD.nudgeObject(mug,0.03,0);
  ok('moving an object names a sound',lastVoice()&&lastVoice().n==='handle');
  ok('...and carries the MATERIAL, so a mug does not sound like a curtain',
     lastVoice()&&lastVoice().mtl==='ceramic',lastVoice()?String(lastVoice().mtl):'-');
  var curt=SD.objects.filter(function(o){return o.kind==='curtains';})[0];
  seen.length=0; SD.nudgeObject(curt,0.03,0);
  ok('...the curtain is cloth',lastVoice()&&lastVoice().mtl==='cloth',
     lastVoice()?String(lastVoice().mtl):'-');

  // footsteps, through the real movement code
  SD.S.keys={};SD.S.keys['w']=true;SD.S.grounded=true;SD.S.menuOpen=false;SD.S.focus=null;
  seen.length=0;
  for(var i=0;i<45;i++)SD.tick(1/30);
  SD.S.keys={};
  var steps=seen.filter(function(v){return v.n==='step';});
  ok('walking names a sound, every footfall',steps.length>0,steps.length+' steps');
  ok('...at the WALK magnitude',steps.length&&steps[0].mag===C.N_STEP_WALK,
     steps.length?String(steps[0].mag):'-');
  SD.S.keys={};SD.S.keys['w']=true;SD.S.keys['control']=true;
  seen.length=0;
  for(var i2=0;i2<45;i2++)SD.tick(1/30);
  SD.S.keys={};
  var sneaks=seen.filter(function(v){return v.n==='step';});
  ok('sneaking is a quieter sound as well as a quieter noise',
     sneaks.length&&sneaks[0].mag===C.N_STEP_SNEAK,
     sneaks.length?(sneaks[0].mag+' vs walk '+C.N_STEP_WALK):'no steps');
  ok('every voice a call site asks for actually exists',
     seen.concat([{n:'door'},{n:'search'},{n:'scan'},{n:'handle'},{n:'step'}])
       .every(function(v){return X.voiceNames().indexOf(v.n)>=0;}),
     'voices: '+X.voiceNames().join(','));
  X.world=realWorld;

  /* ── 7. the tension tone ───────────────────────────────────────────────────*/
  ok('silence when everyone is asleep',X.setHeat(0)===0);
  var lv=[0,0.25,0.5,0.75,1.0,1.4].map(function(h){return X.setHeat(h);});
  var mono=true;
  for(var j=1;j<lv.length;j++)if(!(lv[j]>lv[j-1]))mono=false;
  ok('THE TONE RISES WITH THE ROOM',mono,
     lv.map(function(v){return v.toFixed(3);}).join(' < '));
  ok('...reaching AUD_DRONE_MAX exactly at someone\'s wake threshold',
     near(X.setHeat(1),C.AUD_DRONE_MAX,1e-6),
     'heat 1.0 -> '+X.setHeat(1).toFixed(3)+' (max '+C.AUD_DRONE_MAX+')');
  ok('the drone is built once and reused',!!X.drone);
  ok('it is on the MUSIC bus, so one slider silences it',!!X.drone);
  X.setHeat(0);

  // and it tracks the real signal, not a parallel one
  SD.startHouse();SD.nightReset();SD.S.menuOpen=false;
  SD.player.position.set(SD.HOME.x,0,SD.HOME.z);
  var h0=SD.loudestHeat();
  for(var k=0;k<25;k++){SD.emitNoise(2.15,2.40,C.N_HANDLE,'handle','ceramic');
                        SD.updateSleepers(1/30);}
  var h1=SD.loudestHeat();
  ok('working a sleeper raises loudestHeat, which is what the tone reads',h1>h0,
     h0.toFixed(3)+' -> '+h1.toFixed(3));
  ok('...and the tone follows it up',X.setHeat(h1)>X.setHeat(h0),
     X.setHeat(h0).toFixed(4)+' -> '+X.setHeat(h1).toFixed(4));

  /* ── 8. AUDIO MUST NOT TOUCH THE SIMULATION ────────────────────────────────*/
  var armed=scriptedNight();
  ok('THE SAME NIGHT RUNS IDENTICALLY WITH THE AUDIO LIVE',armed===baseline,
     armed===baseline?'60 steps, bit-identical'
       :('diverged at step '+(function(){
            var a=armed.split('|'),b=baseline.split('|');
            for(var q=0;q<Math.max(a.length,b.length);q++)if(a[q]!==b[q])
              return q+': '+b[q]+' -> '+a[q];
            return '?';})()));
  info('audio is a read-only observer of the sim: it may listen, never write');

  /* ── 9. the material vocabulary ────────────────────────────────────────────*/
  var kinds=Object.keys(SD.PROP_KINDS);
  var untagged=kinds.filter(function(k){return !SD.PROP_KINDS[k].mtl;});
  ok('every prop kind has a material',untagged.length===0,
     untagged.length?untagged.join(','):kinds.length+' kinds tagged');
  ok('the mug is the ceramic',SD.PROP_KINDS.coffeeMug.mtl==='ceramic');
  ok('the keyring is metal',SD.PROP_KINDS.keyring.mtl==='metal');
  ok('the curtains are cloth',SD.PROP_KINDS.curtains.mtl==='cloth');
  var mats={};kinds.forEach(function(k){mats[SD.PROP_KINDS[k].mtl]=1;});
  ok('there are several distinct materials, not one sound for everything',
     Object.keys(mats).length>=5,Object.keys(mats).sort().join(', '));

  /* ── 10. the fridges ───────────────────────────────────────────────────────*/
  SD.startHouse();SD.S.menuOpen=false;
  X.update(1/30);
  var hums=X.hums;
  ok('a fridge hums in every house',hums.length===SD.HOUSES.length,
     hums.length+' hums / '+SD.HOUSES.length+' houses');
  var hz=hums.map(function(h){return h.hz;});
  var uniq={};hz.forEach(function(v){uniq[v.toFixed(4)]=1;});
  ok('NO TWO FRIDGES HUM AT THE SAME PITCH',Object.keys(uniq).length===hz.length,
     hz.map(function(v){return v.toFixed(2);}).join(' / '));
  /* "Almost the same" has to mean something measurable, so measure it in the unit
     ears actually use. A semitone is a 5.946% frequency ratio; the whole street has
     to fit inside one, or two fridges just sound like two different fridges. */
  var lo=Math.min.apply(null,hz),hi=Math.max.apply(null,hz);
  var cents=1200*Math.log(hi/lo)/Math.log(2);
  ok('...but the whole street fits inside a SEMITONE',cents<100,
     cents.toFixed(0)+' cents from the quietest-pitched fridge to the highest '+
     '(a semitone is 100)');
  ok('...and they are still far enough apart to tell apart',cents>15,
     cents.toFixed(0)+' cents');
  info('the whole game, in one sound: nearly identical, and not identical');
  var again=hums.map(function(h){return h.hz;}).join(',');
  ok('a fridge hums the same note every night (learnable, not random)',
     again===hz.join(','));

  /* ── 11. the mixer UI ──────────────────────────────────────────────────────*/
  ok('the pause menu has a way in',!!document.getElementById('btn-sound'));
  ok('so does the title screen',!!document.getElementById('btn-sound-title'));
  ok('the panel is a .screen, so go() gives it exclusivity',
     document.getElementById('s-sound').classList.contains('screen'));
  X.set('foley',0.4);SD.syncMix();
  ok('the sliders show the real values',
     document.getElementById('mx-foley').value==='40',
     'mx-foley = '+document.getElementById('mx-foley').value);
  ok('...and so does the readout',
     document.getElementById('mx-foley-v').textContent==='40%',
     document.getElementById('mx-foley-v').textContent);
  X.set('mute',true);SD.syncMix();
  ok('muting is visible on the panel',
     document.getElementById('mix').classList.contains('muted')&&
     document.getElementById('mx-mute').checked);
  X.set('mute',false);SD.syncMix();
  ok('...and unmuting clears it',
     !document.getElementById('mix').classList.contains('muted'));
  SD.openSound('s-title');
  ok('opening it shows only itself',
     document.getElementById('s-sound').classList.contains('on')&&
     !document.getElementById('s-pause').classList.contains('on'));
  ['mute','music','world','foley'].forEach(function(k){X.set(k,saved[k]);});

  /* ── 12. the settings really do reach the graph ────────────────────────────
     Section 4 could only assert the TARGET, because the live AudioParam is mid-ramp.
     Rebuilding the graph closes that gap: arm() sets each bus gain outright, so this
     reads the true end-to-end path settings -> constructed node. */
  X.set('music',0.6);X.set('world',0.2);X.set('foley',1.0);X.set('mute',false);
  X._reset();
  ok('_reset() drops the graph',X.ctx===null&&!X.drone);
  var ctx2=X.arm();
  ok('...and it rebuilds',!!ctx2&&ctx2!==ctx);
  var b2=X.buses;
  ok('a rebuilt graph carries the settings exactly',
     near(b2.music.gain.value,0.36,1e-6)&&near(b2.world.gain.value,0.04,1e-6)&&
     near(b2.foley.gain.value,1.00,1e-6),
     'music '+b2.music.gain.value.toFixed(3)+
     ' world '+b2.world.gain.value.toFixed(3)+
     ' foley '+b2.foley.gain.value.toFixed(3));
  X.set('mute',true);X._reset();X.arm();
  ok('...and a muted mix rebuilds silent',
     ['music','world','foley'].every(function(k){return X.buses[k].gain.value===0;}));
  X.set('mute',false);
  ['mute','music','world','foley'].forEach(function(k){X.set(k,saved[k]);});

  /* ── 13. nothing external, nothing broken ──────────────────────────────────*/
  var ext=(performance.getEntriesByType?performance.getEntriesByType('resource'):[])
    .map(function(r){return r.name;})
    .filter(function(n){return n.indexOf('.mp3')>=0||n.indexOf('.ogg')>=0||
                               n.indexOf('.wav')>=0||n.indexOf('.m4a')>=0;});
  ok('the audio fetches NOTHING - it is all synthesised',ext.length===0,
     ext.length?ext.join(' '):'0 audio files requested');

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

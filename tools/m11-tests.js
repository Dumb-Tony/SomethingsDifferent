/* ─────────────────────────────────────────────────────────────────────────────
   Milestone 11 — onboarding.

   Ten milestones in, nobody had played this end to end, and everything a new player
   needed lived in a README on GitHub. This suite exists to prove the game now teaches
   its own loop.

   The important property is that the guide is DRIVEN BY GAME STATE, not by a script
   of keypresses: the whole chain is walked here by calling the real verbs
   (searchPlanter / useDoor / scanObject / buyVariant / swapWith / endNight), never by
   poking the step counter. If the guide can be satisfied without actually playing,
   it is teaching the wrong thing.
   ───────────────────────────────────────────────────────────────────────────── */
(function(){
var out=[],pass=0,fail=0;
function ok(name,cond,detail){
  if(cond){pass++;out.push('PASS  '+name+(detail?'   ('+detail+')':''));}
  else    {fail++;out.push('FAIL  '+name+(detail?'   ('+detail+')':''));}
}
function info(s){out.push('      '+s);}

var SD=window.__SD,G=SD&&SD.GUIDE,C=SD&&SD.CONST;
ok('__SD present',!!SD);
ok('the guide is exported',!!G);

/* ── 0. THE LIVE CHECK — runs FIRST, before anything detaches the render loop.
   Every other section below walks the chain by calling GUIDE.tick() by hand, and all
   of them would still pass if updateHUD had never been wired to the guide at all —
   i.e. if the rail never moved during actual play. This one puts the player somewhere
   and then leaves the game completely alone. */
if(SD&&G){
  G.setOn(true);SD.startHouse();G.reset();
  SD.player.position.set(SD.houseById('hoyt').x,0,-6.0);
  SD.S.py=0;SD.S.grounded=true;SD.S.mvx=0;SD.S.mvz=0;
  var frames=0;(function c(){frames++;requestAnimationFrame(c);})();
  setTimeout(function(){
    ok('the render loop is actually running',frames>10,
       frames+' frames, fps '+SD.S.fps.toFixed(0));
    var lbl=document.getElementById('guide-lbl').textContent;
    ok('THE GUIDE ADVANCES DURING ORDINARY PLAY, with nothing poking it',
       /2\/9/.test(lbl),
       lbl+' — '+document.getElementById('guide-step').textContent);
    info('updateHUD -> GUIDE.tick sits on the requestAnimationFrame path, not only');
    info('on the path a test can reach. Without this, the rail could be permanently');
    info('frozen in the real game and every other assertion here would still be green.');
    SD.stopLoop();
    rest();
    flush();
  },1500);
}else{flush();}

function rest(){
try{

  /* ── 1. the chain itself ───────────────────────────────────────────────────*/
  ok('there is a step chain',SD.GUIDE_STEPS.length>=8,SD.GUIDE_STEPS.length+' steps');
  ok('every step has text and a predicate',
     SD.GUIDE_STEPS.every(function(s){
       return s.id&&s.t&&typeof s.done==='function';}));
  ok('every step id is unique',
     Object.keys(SD.GUIDE_STEPS.reduce(function(a,s){a[s.id]=1;return a;},{})).length
       ===SD.GUIDE_STEPS.length);
  ok('the chain covers the whole loop, not just the break-in',
     ['leave','key','in','scan','home','shop','back','swap','out']
       .every(function(id){return SD.GUIDE_STEPS.some(function(s){return s.id===id;});}),
     SD.GUIDE_STEPS.map(function(s){return s.id;}).join(' > '));

  /* ── 2. it starts at the beginning ─────────────────────────────────────────*/
  SD.startHouse();
  G.setOn(true);
  G.reset();
  ok('a new run starts on step 1',SD.GAME.guideStep===0&&!SD.GAME.guideDone,
     G.step()?G.step().id:'none');
  ok('...and it is the one that gets you out of your own garden',
     G.step().id==='leave');
  ok('the rail is showing',document.getElementById('guide').classList.contains('on'));

  /* ── 3. WALK THE WHOLE CHAIN using the real verbs ──────────────────────────*/
  function at(){return G.step()?G.step().id:'DONE';}
  var trace=[at()];
  function note(what){
    G.tick();
    if(at()!==trace[trace.length-1]){trace.push(at());}
    return what;
  }

  // leave -> stand outside the Hoyts
  var hoyt=SD.houseById('hoyt');
  SD.player.position.set(hoyt.x,0,-6.0);
  SD.S.py=0;SD.S.grounded=true;
  note('walked over');
  ok('WALKING TO A NEIGHBOUR HOUSE advances the guide',at()==='key',at());

  // key -> search planters until one yields
  var got=false;
  SD.PLANTERS.forEach(function(p){if(!got){SD.searchPlanter(p);
    if(Object.keys(SD.GAME.keys).length)got=true;}});
  note('searched');
  ok('FINDING THE SPARE KEY advances it',at()==='in',at());
  ok('...and it took a real search, not a flag',Object.keys(SD.GAME.keys).length>0,
     JSON.stringify(SD.GAME.keys));

  // in -> open the door
  SD.useDoor(SD.frontDoor);
  note('opened');
  ok('OPENING THE DOOR advances it',at()==='scan',at());

  // scan -> catalogue something
  var mug=SD.objects.filter(function(o){return o.kind==='coffeeMug';})[0];
  SD.scanObject(mug);
  note('scanned');
  ok('SCANNING advances it',at()==='home',at());

  // home -> end the night
  SD.endNight('home','You are back before anyone stirs.');
  note('went home');
  ok('GOING HOME advances it',at()==='shop',at());

  // shop -> buy something
  SD.GAME.bank=500000;SD.GAME.hk=99;
  var stock=SD.shopStock(mug.id,'bulwark');
  SD.buyVariant(mug.id,2,'bulwark');
  note('bought');
  ok('BUYING advances it',at()==='back',at());
  ok('...and there is something in the bag',SD.INV.length>0,SD.INV.length+' items');

  // back -> the next night begins
  SD.S.menuOpen=false;
  SD.beginNight();
  note('night 2');
  ok('THE NEXT NIGHT advances it',at()==='swap',at());

  // swap -> plant it
  var mine=SD.invFor(mug.id);
  SD.swapWith(mug,mine.length-1);
  note('swapped');
  ok('SWAPPING IT IN advances it',at()==='out',at());
  ok('...and it is really on tonight\'s ledger',SD.PENDING.length>0,
     SD.PENDING.length+' pending');

  // out -> home again, chain complete
  SD.endNight('home','Back on your own path before the sky changes.');
  note('home again');
  ok('THE CHAIN COMPLETES BY PLAYING THE GAME',SD.GAME.guideDone===true,at());
  info('walked: '+trace.join(' > ')+' > DONE');
  ok('...and every step was reached in order',
     trace.join(',')==='leave,key,in,scan,home,shop,back,swap,out,DONE',
     trace.join(','));

  /* ── 4. it gets out of the way ─────────────────────────────────────────────*/
  /* endNight() leaves the morning report up, and the rail hides behind it — clear the
     screens first or this is measuring the report, not the finished chain. */
  SD.go?SD.go(null):document.querySelectorAll('.screen')
    .forEach(function(s){s.classList.remove('on');});
  SD.S.menuOpen=false;
  G.render();
  ok('a finished chain still shows one closing note',
     document.getElementById('guide').classList.contains('done'),
     document.getElementById('guide-lbl').textContent);
  ok('...and the rail hides on the menus',
     (function(){
       document.getElementById('s-pause').classList.add('on');
       G.render();
       var hidden=!document.getElementById('guide').classList.contains('on');
       document.getElementById('s-pause').classList.remove('on');
       G.render();
       return hidden;})());
  ok('...but NOT on the day or shop screens, which are gameplay',
     (function(){
       document.getElementById('s-day').classList.add('on');
       G.render();
       var shown=document.getElementById('guide').classList.contains('on');
       document.getElementById('s-day').classList.remove('on');
       G.render();
       return shown;})());

  /* ── 5. out-of-order play collapses instead of stalling ────────────────────*/
  SD.startHouse();G.reset();
  SD.GAME.hasSpareKey=true;      // a master key: got inside without touching a planter
  SD.player.position.set(hoyt.x,0,-6.0);
  SD.useDoor(SD.frontDoor);
  SD.scanObject(SD.objects.filter(function(o){return o.kind==='keyring';})[0]);
  G.tick();
  ok('DOING THINGS OUT OF ORDER SKIPS AHEAD rather than getting stuck',
     G.step()&&G.step().id==='home',G.step()?G.step().id:'DONE');
  info('four steps collapsed in one tick, including a "find the key" step satisfied by');
  info('never finding a key - a step asserts the STATE it wanted, not the route taken');

  /* ── 6. the guide is skippable, and the preference outlives the run ────────*/
  G.setOn(false);
  ok('turning it off hides the rail',
     !document.getElementById('guide').classList.contains('on'));
  ok('...and it stops advancing',(function(){
     SD.startHouse();G.reset();
     var before=SD.GAME.guideStep;
     SD.player.position.set(hoyt.x,0,-6.0);
     G.tick();
     return SD.GAME.guideStep===before;})(),'step stayed at '+SD.GAME.guideStep);
  var raw=null;try{raw=JSON.parse(localStorage.getItem(SD.GUIDE_KEY)||'null');}catch(e){}
  ok('the preference persists to its own storage key',raw&&raw.on===false,
     SD.GUIDE_KEY+' = '+JSON.stringify(raw));
  ok('...which is NOT the save file',SD.GUIDE_KEY!==SD.SAVE_KEY);
  G.setOn(true);

  /* ── 7. the premise card ───────────────────────────────────────────────────*/
  ok('there is an intro screen',!!document.getElementById('s-intro'));
  var introTxt=document.getElementById('s-intro').textContent;
  ok('...and it states all three bands by name',
     /TOO SIMILAR/.test(introTxt)&&/TOO DIFFERENT/.test(introTxt)&&/IN BETWEEN/.test(introTxt));
  ok('...and says which one wins and which one loses',
     /how you lose/i.test(introTxt)&&/doubt/i.test(introTxt));
  ok('startHouse() does NOT throw a screen in front of the world',
     (function(){SD.startHouse();
       return !document.getElementById('s-intro').classList.contains('on')
           && !SD.S.menuOpen;})());
  info('every suite calls startHouse() directly - beginRun() is the one that intros');

  /* ── 8. the band glosses ───────────────────────────────────────────────────*/
  ok('every band has an explanation',
     ['MISSED','DOUBT','CERTAINTY'].every(function(b){
       return SD.BAND_GLOSS[b]&&SD.BAND_GLOSS[b].length>60;}),
     Object.keys(SD.BAND_GLOSS).join(', '));
  ok('the DOUBT gloss says it is the thing you want',
     /you are here for|thing you want/i.test(SD.BAND_GLOSS.DOUBT));
  ok('the CERTAINTY gloss says it is how you lose',
     /losing|lose|Suspicion/i.test(SD.BAND_GLOSS.CERTAINTY));

  SD.startHouse();SD.GAME.hk=99;SD.GAME.bank=500000;
  var cb=SD.objects.filter(function(o){return o.kind==='cerealBox'&&o.owner==='june';})[0];
  SD.scanObject(cb);
  var st2=SD.shopStock(cb.id),pick=-1;
  for(var q=0;q<st2.length;q++)if(SD.predict(cb.id,st2[q]).text==='DOUBT'){pick=q;break;}
  SD.buyVariant(cb.id,pick,'bulwark');
  SD.swapWith(cb,SD.invFor(cb.id).length-1);
  SD.showReport('home','x');
  var body=document.getElementById('report-body').innerHTML;
  ok('THE FIRST TIME A BAND HAPPENS, THE REPORT EXPLAINS IT',
     /rp-gloss/.test(body),'gloss present in the morning report');
  ok('...and it is marked as taught',!!SD.GAME.glossed.DOUBT,
     JSON.stringify(SD.GAME.glossed));
  var n1=(body.match(/rp-gloss/g)||[]).length;
  SD.swapWith(cb,0);
  SD.showReport('home','x');
  var body2=document.getElementById('report-body').innerHTML;
  var n2=(body2.match(/rp-gloss/g)||[]).length;
  ok('...but it does NOT nag you about it a second time',n2<n1||n2===0,
     'first report '+n1+' glosses, second '+n2);

  /* ── 9. the controls panel, and stale copy ─────────────────────────────────*/
  var ctl=document.getElementById('s-controls');
  ok('there is a controls panel',!!ctl);
  ok('...reachable from the pause menu',!!document.getElementById('btn-controls'));
  ok('...and it documents FOCUS mode, which the title screen never did',
     /scan it into the catalog|scan it/i.test(ctl.textContent)&&
     /requisition/i.test(ctl.textContent)&&/nudge/i.test(ctl.textContent));
  ok('the title screen no longer claims to be Milestone 4',
     !/Milestone 4/i.test(document.getElementById('s-title').textContent),
     document.getElementById('s-title').querySelector('.sub').textContent.trim().slice(0,60)+'...');
  /* Asserts the tag AGREES WITH the build, rather than naming a milestone — pinning
     it to 'M11' just meant this suite failed the moment M12 shipped. */
  ok('the build tag agrees with the build',
     document.getElementById('build-tag').textContent.indexOf(SD.version)>=0,
     document.getElementById('build-tag').textContent+'  vs  '+SD.version);

  var eb=document.getElementById('err-banner');
  ok('no crash banner',!eb,eb?eb.textContent.slice(0,200):'');

}catch(e){
  fail++;
  out.push('FAIL  harness threw: '+(e&&e.message)+'  @ '+
    String((e&&e.stack)||'').split('\n').slice(0,3).join(' | '));
}
}

function flush(){
  var summary='SDTEST '+(fail===0?'ALL-PASS':'FAILURES')+' pass='+pass+' fail='+fail;
  var pre=document.createElement('pre');
  pre.id='test-out';
  pre.textContent='==SDTEST-BEGIN==\n'+summary+'\n'+out.join('\n')+'\n==SDTEST-END==';
  document.body.appendChild(pre);
  document.title=summary;
}
})();

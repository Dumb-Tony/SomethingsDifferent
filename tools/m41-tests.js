/* M41 — THE NIGHT HAS A PULSE.

   I told the user to shrink the street: 99m wide, 24.8m lots, 83 seconds to sneak
   across. Then I measured the footprints, and the gaps between neighbouring houses
   are 2.4 METRES. The street is 99m because the houses and their yards are 21.6m wide
   and 39.7m deep, not because the lots are spread out — there is no slack to remove,
   and moving the pitch would push the houses into each other. That advice was wrong
   and this suite pins the measurement so nobody acts on it later.

   What the same measurement DID find is that the night is empty of TIME, not space.
   Two to four events across a 780-second night left gaps of 117s, 143s, 249s and
   200s — up to four minutes of nothing — and there is nothing else out there either:
   no porch lights until night three, no dogs until four, no watchman until five. So
   the first two nights, the ones a new player forms their entire opinion on, are four
   silent houses and a walk.

   Two changes: more events, spaced tighter; and a sleeper who turns over on their own
   so a room with somebody in it stops feeling like an empty one. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}

try{
var SD=window.__SD,C=SD.CONST;
SD.stopLoop();
var REAL=function(h){return h*3600/C.NIGHT_SCALE;};   // game hours -> real seconds

/* ── 1. THE NIGHT HAS SOMETHING IN IT ───────────────────────────────────────*/
(function(){
  SD.startHouse();
  var worst=0,counts=[],allGaps=[];
  for(var d=1;d<=C.SLICE_NIGHTS;d++){
    SD.GAME.day=d;SD.nightReset();
    counts.push(SD.EVENTS.length);
    var budget=SD.NIGHT.budget||SD.NIGHT_HOURS;
    var ts=SD.EVENTS.map(function(e){return e.at;}).sort(function(a,b){return a-b;});
    var last=0;
    for(var i=0;i<ts.length;i++){allGaps.push(REAL(ts[i]-last));last=ts[i];}
    allGaps.push(REAL(budget-last));
  }
  worst=Math.max.apply(null,allGaps);
  var mean=allGaps.reduce(function(a,b){return a+b;},0)/allGaps.length;
  info('ten nights: '+counts.join(',')+' events');
  info('longest stretch with nothing happening: '+worst.toFixed(0)+'s  (mean '+
       mean.toFixed(0)+'s)');
  ok('EVERY NIGHT HAS AT LEAST FIVE THINGS IN IT',
     Math.min.apply(null,counts)>=C.EVENT_COUNT[0],
     'fewest was '+Math.min.apply(null,counts)+', EVENT_COUNT is '+
     C.EVENT_COUNT.join('-'));
  ok('NOTHING GOES MORE THAN THREE MINUTES WITHOUT HAPPENING',worst<180,
     worst.toFixed(0)+'s - it used to be 249s');
  ok('...and the typical gap is under two minutes',mean<120,mean.toFixed(0)+'s');

  /* The ceiling is real: asking for more than the budget can hold would silently
     clip, and a constant that lies about what it delivers is worse than a low one. */
  var maxFit=Math.floor(((SD.NIGHT_HOURS-C.EVENT_FIRST-0.35)/C.EVENT_GAP));
  ok('EVENT_COUNT does not ask for more than the night can hold',
     C.EVENT_COUNT[1]<=maxFit,
     'asks for '+C.EVENT_COUNT[1]+', the budget fits about '+maxFit);
})();

/* ── 2. A ROOM WITH SOMEBODY IN IT IS NOT AN EMPTY ROOM ─────────────────────*/
(function(){
  SD.startHouse();SD.nightReset();
  var s=SD.SLEEPERS.filter(function(x){return !x.absent;})[0];
  ok('somebody is asleep',!!s,s?s.name:'nobody');
  SD.player.position.set(s.x,0,s.z-2);SD.S.py=0;

  var heard=[],realWorld=SD.SFX.world;
  SD.SFX.world=function(n,x,z,m,mt){heard.push(n);return realWorld.apply(SD.SFX,arguments);};
  var moved=0,tor=s.group&&s.group.userData.torso;
  var maxRoll=0;
  /* Two minutes of a night in which the player does absolutely nothing. */
  for(var i=0;i<7200;i++){
    SD.updateSleepers(1/60);
    if(tor)maxRoll=Math.max(maxRoll,Math.abs(tor.rotation.z));
  }
  SD.SFX.world=realWorld;
  info('two minutes of standing still: '+heard.length+' sounds from the bed');
  ok('THE SLEEPER TURNS OVER ON THEIR OWN',heard.length>0,
     heard.length+' bedclothes sounds - the room used to be silent until YOU moved');
  ok('...and you can see it happen',maxRoll>0.05,
     'torso rolled '+maxRoll.toFixed(2)+' radians');
})();

/* ── 3. ...AND IT CANNOT WAKE THEM. THAT IS THE POINT ───────────────────────
   Presence, not difficulty. Being woken by something you did not do would be
   unfair, so the ambient turn must never touch the meters that wake somebody. */
(function(){
  SD.startHouse();SD.nightReset();
  var s=SD.SLEEPERS.filter(function(x){return !x.absent;})[0];
  SD.player.position.set(s.x+40,0,s.z);SD.S.py=0;      // miles away, doing nothing
  s.noise=0;s.sinceStir=0;
  var states={};
  for(var i=0;i<18000;i++){                            // five minutes
    SD.updateSleepers(1/60);
    states[s.state]=1;
  }
  info('five minutes of a player doing nothing: noise '+s.noise.toFixed(3)+
       ', states seen '+Object.keys(states).join(','));
  ok('TURNING OVER ADDS NO NOISE TO THEIR OWN METER',s.noise<0.001,
     'noise '+s.noise.toFixed(4));
  ok('...and they never stir from it',!states.stirring&&!states.awake,
     Object.keys(states).join(','));
  ok('...so nobody is ever woken by something the player did not do',
     s.state==='asleep');
})();

/* ── 4. THE GEOMETRY IS NOT THE PROBLEM — PINNED ────────────────────────────*/
(function(){
  SD.startHouse();
  var row=SD.HOUSES.slice().sort(function(a,b){return a.x-b.x;});
  function foot(h){
    var minX=1e9,maxX=-1e9;
    for(var i=0;i<SD.colliders.length;i++){
      var c=SD.colliders[i];
      if(c.top!==undefined&&c.top<0.5)continue;
      if(Math.abs((c.minX+c.maxX)/2-h.x)>11)continue;
      minX=Math.min(minX,c.minX);maxX=Math.max(maxX,c.maxX);
    }
    return {minX:minX,maxX:maxX,w:maxX-minX};
  }
  var fps=row.map(foot);
  var gaps=[];
  for(var i=1;i<fps.length;i++)gaps.push(fps[i].minX-fps[i-1].maxX);
  var minGap=Math.min.apply(null,gaps);
  info('house footprints are '+fps[0].w.toFixed(1)+'m wide; the gaps between them are '+
       gaps.map(function(g){return g.toFixed(1);}).join(', ')+'m');
  ok('THERE IS NO SLACK BETWEEN THE HOUSES TO REMOVE',minGap<4,
     'tightest gap '+minGap.toFixed(1)+'m - shrinking LOT_PITCH would overlap them');
  ok('...so the 99m street is the HOUSES, not the spacing',
     fps[0].w*row.length>70,
     (fps[0].w*row.length).toFixed(0)+'m of building across a '+
     (row[row.length-1].x-row[0].x).toFixed(0)+'m street');

  /* And crossing it is not actually the problem either. */
  var pitch=row[1].x-row[0].x;
  var night=REAL(SD.NIGHT_HOURS);
  info('one lot: '+(pitch/C.SNEAK_SPEED).toFixed(0)+'s sneaking, '+
       (pitch/C.WALK_SPEED).toFixed(0)+'s walking');
  ok('a lot takes well under half a minute to cross',pitch/C.WALK_SPEED<20,
     (pitch/C.WALK_SPEED).toFixed(0)+'s at a walk');
  ok('...and a round trip to the far house is a small part of a night',
     2*Math.abs(row[row.length-1].x-SD.HOME.x)/C.SNEAK_SPEED < night*0.25,
     ((2*Math.abs(row[row.length-1].x-SD.HOME.x)/C.SNEAK_SPEED)/night*100).toFixed(0)+
     '% of the night, sneaking the whole way');
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

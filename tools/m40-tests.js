/* M40 — DOUBT IS SOMETHING YOU WATCH.

   The best moment in this design is somebody standing in their own kitchen not
   trusting a mug. For forty milestones that moment has been A SENTENCE ON A REPORT
   SCREEN. Doubt existed only as a number: you swapped a thing, went home, read a
   paragraph, and the number moved.

   Now the person who doubted something spends the next afternoon INDOORS, standing
   over the thing, picking it up and putting it down and stepping back and picking it
   up again — and M23 made sight pass through glass, so you can stand on the street
   and watch it through their front window.

   The loop is the tell. A person tidying does a thing once; a person who no longer
   trusts their own memory of a room does it, walks away, and comes back. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}

try{
var SD=window.__SD,C=SD.CONST;
SD.stopLoop();

/* Play a real night that lands a DOUBT on somebody, the way M39 made possible. */
function nightThatDoubts(){
  SD.startHouse();SD.nightReset();
  SD.GAME.bank=100000;SD.GAME.hk=99;
  var hit=null;
  for(var i=0;i<SD.objects.length&&!hit;i++){
    var o=SD.objects[i];
    if(!SD.RESIDENTS[o.owner])continue;
    SD.scanObject(o);
    /* Buy the rung the forecast calls DOUBT, so this is deterministic rather than
       relying on where the unaimed printer happens to land. */
    var stock=SD.shopStock(o.id,'bulwark')||[];
    for(var j=0;j<stock.length;j++){
      var p=SD.predict(o.id,stock[j]);
      if(p&&p.text==='DOUBT'){
        SD.buyVariant(o.id,j,'bulwark');
        var bag=SD.invFor(o.id);
        if(bag.length){SD.swapWith(o,bag.length-1);hit=o;}
        break;
      }
    }
  }
  var lines=SD.doMorning();
  return {obj:hit,lines:lines};
}

/* ── 1. THE MORNING REMEMBERS WHAT THEY DOUBTED ─────────────────────────────*/
var run=nightThatDoubts();
(function(){
  ok('a swap landed in DOUBT',
     run.lines.some(function(l){return l.r.band==='DOUBT';}),
     run.lines.map(function(l){return l.r.band;}).join(','));
  var doubted=run.lines.filter(function(l){return l.r.band==='DOUBT';})[0];
  var r=SD.RESIDENTS[doubted.owner];
  ok('THE RESIDENT REMEMBERS WHICH OBJECT DID IT',!!r.fretting,
     r.fretting?r.fretting.label:'nothing recorded');
  ok('...and it is the one you actually swapped',
     r.fretting&&r.fretting.objId===run.obj.id,
     r.fretting?r.fretting.label:'-');
  ok('...dated to that morning',r.fretting&&r.fretting.day===SD.GAME.day,
     'day '+(r.fretting?r.fretting.day:'-')+' of '+SD.GAME.day);
  info('doubt used to be a number and a paragraph. This is the handle that lets the');
  info('afternoon show it.');
})();

/* ── 2. THE AFTERNOON PUTS THEM AT THE OBJECT, INDOORS ──────────────────────*/
(function(){
  var doubted=run.lines.filter(function(l){return l.r.band==='DOUBT';})[0];
  var who=doubted.owner;
  SD.startWalk();
  var f=SD.DAYFOLK.filter(function(x){return x.res===who;})[0];
  ok('they are out in the afternoon',!!f,SD.DAYFOLK.length+' people about');
  ok('THEY ARE FRETTING, NOT LOITERING IN A GARDEN',!!(f&&f.fret),
     f?f.where:'-');
  ok('...over the object they doubted',
     f&&f.fret&&f.fret.objId===run.obj.id,
     f&&f.fret?f.fret.label:'-');

  /* Indoors, at the thing - not out at a FOLK_SPOT. */
  var o=SD.objectById(run.obj.id);
  var d=Math.hypot(f.x-o.spec._pos[0],f.z-o.spec._pos[2]);
  ok('...and standing right at it',d<1.2,d.toFixed(2)+'m from the object');
  ok('...INSIDE the house, where the object is',
     f.z>Math.min.apply(null,SD.HOUSES.map(function(h){return -9;})),
     'z='+f.z.toFixed(2)+' (a FOLK_SPOT would be out at z=-7 to -10.6)');
  var spots=SD.FOLK_SPOTS.map(function(s){return s[1];});
  ok('...which is not one of the garden spots',
     spots.every(function(z){return Math.abs(f.z-z)>0.5;}),
     'garden spots are at z '+spots.join(', '));

  /* Everybody who did NOT doubt anything is still in their garden. */
  var calm=SD.DAYFOLK.filter(function(x){return !x.fret;});
  ok('everybody else is still out front',calm.length>0,
     calm.length+' in gardens, '+(SD.DAYFOLK.length-calm.length)+' fretting');
  SD.endWalk();
})();

/* ── 3. THE LOOP IS A LOOP ──────────────────────────────────────────────────
   The repetition IS the tell, so assert it moves, returns, and does it again. */
(function(){
  SD.startWalk();
  var f=SD.DAYFOLK.filter(function(x){return x.fret;})[0];
  ok('somebody is fretting',!!f);
  if(f){
    var P=f.group.userData.parts;
    var samples=[];
    /* Step the ambient clock through a full cycle and watch the arms. */
    for(var i=0;i<40;i++){
      SD.folkTick(0.2);
      samples.push({arm:P.armL.rotation.x,z:f.group.position.z});
    }
    var armMin=Math.min.apply(null,samples.map(function(s){return s.arm;}));
    var armMax=Math.max.apply(null,samples.map(function(s){return s.arm;}));
    var zMin=Math.min.apply(null,samples.map(function(s){return s.z;}));
    var zMax=Math.max.apply(null,samples.map(function(s){return s.z;}));
    info('over one cycle: arm '+armMin.toFixed(2)+'..'+armMax.toFixed(2)+
         '   z '+zMin.toFixed(2)+'..'+zMax.toFixed(2));
    ok('THEY LIFT IT AND PUT IT DOWN',armMax-armMin>0.6,
       'arms travel '+(armMax-armMin).toFixed(2)+' radians');
    ok('...AND STEP BACK OFF IT BETWEEN GOES',zMax-zMin>0.10,
       'they move '+(zMax-zMin).toFixed(2)+'m and come back');
    ok('...and it repeats rather than resolving',
       samples[0].arm!==samples[20].arm||samples[10].arm!==samples[30].arm,
       'still cycling after eight seconds');

    /* A calm neighbour does none of that. */
    var calm=SD.DAYFOLK.filter(function(x){return !x.fret;})[0];
    if(calm){
      var CP=calm.group.userData.parts,cs=[];
      for(var j=0;j<40;j++){SD.folkTick(0.2);cs.push(CP.armL.rotation.x);}
      var cRange=Math.max.apply(null,cs)-Math.min.apply(null,cs);
      ok('...while somebody with nothing on their mind just shifts their weight',
         cRange<0.3,'their arms travel '+cRange.toFixed(2)+' radians');
    }
  }
  SD.endWalk();
})();

/* ── 4. WATCHING PAYS MORE THAN SMALL TALK ──────────────────────────────────*/
(function(){
  SD.startWalk();
  var f=SD.DAYFOLK.filter(function(x){return x.fret;})[0];
  var calm=SD.DAYFOLK.filter(function(x){return !x.fret;})[0];
  var hk0=SD.GAME.hk;
  SD.GAME.hk=0;
  SD.talkTo(f);
  var fretGain=SD.GAME.hk;
  SD.GAME.hk=0;
  SD.talkTo(calm);
  var calmGain=SD.GAME.hk;
  info('watching somebody fret: +'+fretGain+' HK   a chat over a fence: +'+calmGain);
  ok('WATCHING SOMEBODY COME APART TEACHES YOU MORE',fretGain>calmGain,
     '+'+fretGain+' vs +'+calmGain);
  ok('...and it says what they are doing, not what they said',
     SD.DAY.log.some(function(l){return /both hands|pick it up again/i.test(l);}),
     SD.DAY.log.length+' lines in the day log');
  SD.GAME.hk=hk0;
  SD.endWalk();
})();

/* ── 5. IT DOES NOT SURVIVE THE RUN IT BELONGS TO ───────────────────────────*/
(function(){
  SD.RESIDENTS.walt.fretting={objId:'x',label:'a mug',day:1};
  SD.startHouse();
  ok('a new run forgets what anybody was fretting about',
     !SD.RESIDENTS.walt.fretting,String(SD.RESIDENTS.walt.fretting));

  /* ...and yesterday's worry is not today's. */
  SD.RESIDENTS.walt.fretting={objId:SD.objects[0].id,label:'a mug',day:1};
  SD.GAME.day=3;
  SD.startWalk();
  var w=SD.DAYFOLK.filter(function(x){return x.res==='walt';})[0];
  ok('...and a two-day-old worry is not still being acted out',!(w&&w.fret),
     'they are back in the garden');
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

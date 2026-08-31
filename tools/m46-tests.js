/* M46 — READING A PERSON.

   The first thing off the GDD roadmap proper (Phase 3: "person-scanning and trait
   reveal"), and the one that pays for the rest of the game.

   Human Knowledge has been an ABSTRACT NUMBER since M6: a single global counter that
   unlocks the forecast for everybody at once. That is backwards for a game about
   people. Knowing that Walt forgets things should not teach you anything about
   Marisol, who photographs her rooms before bed.

   So the scanner reads PEOPLE now, in the afternoon, when they are out. Three
   readings gives you their whole curve, and what you learn is exactly what the Doubt
   Curve runs on — how closely they look, and how far past that they will go before
   they stop blaming themselves. predict() gets sharp for THEIR things and stays vague
   for everybody else's.

   It costs the afternoon, which is the resource M20 built, M25 gave a job, and M40
   made worth watching. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}

try{
var SD=window.__SD,C=SD.CONST;
SD.stopLoop();

/* ── 1. THREE READINGS GIVE YOU A PERSON ────────────────────────────────────*/
(function(){
  SD.startHouse();
  ok('nobody is known at the start of a run',
     SD.activeResidents().every(function(r){return !r.read;}),
     'read = 0 for all seven');

  SD.startWalk();
  var f=SD.DAYFOLK[0],r=SD.RESIDENTS[f.res];
  info('reading '+f.name+' - attention '+r.attention+', floor '+r.noticeFloor+
       ', band '+r.doubtBand);

  ok('the first reading lands',SD.readPerson(f)===1,'read 1');
  f.readToday=false;
  ok('the second',SD.readPerson(f)===2);
  f.readToday=false;
  ok('the third finishes them',SD.readPerson(f)===3);
  f.readToday=false;
  ok('...and there is no fourth',SD.readPerson(f)===null,
     'they hold no more surprises');

  /* ...and it says something different each time, about the real numbers. */
  SD.startHouse();SD.startWalk();
  var g=SD.DAYFOLK[0],gr=SD.RESIDENTS[g.res];
  SD.DAY.log.length=0;
  SD.readPerson(g);g.readToday=false;
  SD.readPerson(g);g.readToday=false;
  SD.readPerson(g);
  ok('EACH READING TELLS YOU SOMETHING NEW',
     SD.DAY.log.length===3&&SD.DAY.log[0]!==SD.DAY.log[1]&&SD.DAY.log[1]!==SD.DAY.log[2],
     SD.DAY.log.length+' distinct lines');
  ok('...and they are THEIR numbers, not a description',
     SD.DAY.log[1].indexOf(String(gr.noticeFloor))>=0&&
     SD.DAY.log[2].indexOf(String(gr.doubtBand))>=0,
     'floor '+gr.noticeFloor+' and band '+gr.doubtBand+' both quoted back');
  SD.endWalk();
})();

/* ── 2. ONE PERSON A DAY, AND ONLY IN THE AFTERNOON ─────────────────────────*/
(function(){
  SD.startHouse();SD.startWalk();
  var f=SD.DAYFOLK[0];
  ok('you can read somebody',SD.readPerson(f)===1);
  ok('...but not twice in one afternoon',SD.readPerson(f)===null,
     'the afternoon is the cost');
  SD.endWalk();

  /* a new afternoon, a new reading */
  SD.startWalk();
  var f2=SD.DAYFOLK.filter(function(x){return x.res===f.res;})[0];
  ok('...and tomorrow you can look again',SD.readPerson(f2)===2,
     'read 1 -> 2 across two afternoons');
  SD.endWalk();
})();

/* ── 3. WHAT YOU LEARN IS ABOUT THAT PERSON ONLY ────────────────────────────
   The whole point. This is what a global counter could never do. */
(function(){
  SD.startHouse();
  SD.GAME.hk=0;                       // know nothing about people in general
  SD.startWalk();
  var f=SD.DAYFOLK[0],who=f.res;
  SD.readPerson(f);f.readToday=false;
  SD.readPerson(f);f.readToday=false;
  SD.readPerson(f);
  SD.endWalk();

  var theirs=SD.objects.filter(function(o){return o.owner===who;})[0];
  var others=SD.objects.filter(function(o){
    return SD.RESIDENTS[o.owner]&&o.owner!==who;})[0];
  ok('they own something and so does somebody else',!!theirs&&!!others,
     who+' vs '+(others?others.owner:'-'));

  SD.GAME.bank=100000;
  SD.scanObject(theirs);SD.scanObject(others);
  var pT=SD.predict(theirs.id,(SD.shopStock(theirs.id,'bulwark')||[])[0]);
  var pO=SD.predict(others.id,(SD.shopStock(others.id,'bulwark')||[])[0]);
  info('at HK 0, having read '+who+' three times:');
  info('  their object  -> "'+(pT?pT.text:'?')+'"');
  info('  somebody else -> "'+(pO?pO.text:'?')+'"');
  ok('READING SOMEBODY SHARPENS THE FORECAST FOR THEIR THINGS',
     pT&&/MISSED|DOUBT|CERTAINTY/.test(pT.text),
     '"'+(pT?pT.text:'?')+'" at Human Knowledge 0');
  ok('...AND TELLS YOU NOTHING ABOUT ANYBODY ELSE',
     pO&&pO.text==='???',
     '"'+(pO?pO.text:'?')+'" - a global counter could never do this');

  /* ...and general knowledge still works for people you have not studied. */
  SD.GAME.hk=40;
  var pO2=SD.predict(others.id,(SD.shopStock(others.id,'bulwark')||[])[0]);
  ok('general knowledge still reads a stranger',
     pO2&&/MISSED|DOUBT|CERTAINTY/.test(pO2.text),
     'HK 40 -> "'+(pO2?pO2.text:'?')+'"');
  ok('...so the two ladders take whichever is better',
     SD.readTier(who)>=3&&SD.readTier(others.owner)>=2,
     'read('+who+')='+SD.readTier(who)+'  read('+others.owner+')='+
     SD.readTier(others.owner));
})();

/* ── 4. IT IS THE AFTERNOON'S JOB ───────────────────────────────────────────*/
(function(){
  SD.startHouse();
  ok('there is nobody to read at night',SD.readNearest()===null,
     'DAYFOLK is empty until the afternoon');

  SD.startWalk();
  var f=SD.DAYFOLK[0];
  SD.player.position.set(f.x+40,0,f.z);SD.S.py=0;
  ok('...and standing across the street is not reading them',
     SD.readNearest()===null,'40m away');
  SD.player.position.set(f.x+0.8,0,f.z);SD.S.py=0;
  ok('STANDING NEXT TO SOMEBODY READS THEM',SD.readNearest()===1,
     'from 0.8m');
  SD.endWalk();
})();

/* ── 5. THE RUN COUNTS IT, AND A NEW RUN FORGETS ────────────────────────────*/
(function(){
  SD.startHouse();
  ok('a new run has read nobody',SD.GAME.stats.readPeople===0);
  SD.startWalk();
  SD.readPerson(SD.DAYFOLK[0]);
  ok('reading is counted',SD.GAME.stats.readPeople===1);
  SD.endWalk();

  SD.RESIDENTS.walt.read=3;
  SD.startHouse();
  ok('A NEW RUN KNOWS NOBODY AGAIN',!SD.RESIDENTS.walt.read,
     'you have to learn this street from scratch');
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

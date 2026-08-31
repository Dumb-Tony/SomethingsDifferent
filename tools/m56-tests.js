/* M56 — THE AFTERNOON TELLS YOU WHERE YOU ARE.

   A screenshot of the walk showed the objective card reading "Search the planters by
   the porch - E" over a sunlit lawn with three neighbours standing on it, and a HUD
   containing the words MODE WALK and nothing else whatsoever.

   Both are the same fault. GUIDE_STEPS is a rail about the NIGHT: every step in it
   asserts a night state, none can be satisfied while the sun is up, so in the
   afternoon the card sat there giving an order the player could not carry out for the
   whole of the half of the game it does not describe. And in daylight the clock, the
   noise meter and the sightings counter are all hidden - correctly, there is no clock
   and nothing to hear - which left no readout at all in the half of the game that is
   entirely about spending a limited number of days.

   The afternoon gets its own card, and it is NOT a rail step: there is no ordering
   and nothing to complete, because an afternoon is not a sequence, it is a thing you
   do as much of as you have time for. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}

try{
var SD=window.__SD,C=SD.CONST;
SD.stopLoop();
function el(id){return document.getElementById(id);}
function hud(){SD.updateHUD(1);}     // dt of 1 clears the 10Hz throttle
function card(){
  return {lbl:el('guide-lbl').textContent,
          step:el('guide-step').textContent,
          on:el('guide').classList.contains('on')};
}

/* ── 1. THE NIGHT RAIL STILL RUNS AT NIGHT ──────────────────────────────────*/
(function(){
  SD.startHouse();SD.beginNight();
  SD.GUIDE.setOn(true);
  hud();
  var c=card();
  info('at night: "'+c.lbl+' / '+c.step+'"');
  ok('the guide is showing at night',c.on,'on');
  ok('...and it is the night rail',/OBJECTIVE/.test(c.lbl),c.lbl);
})();

/* ── 2. AND IT IS NOT THE NIGHT RAIL IN DAYLIGHT ────────────────────────────*/
(function(){
  SD.startHouse();SD.startWalk();
  hud();
  var c=card();
  info('in the afternoon: "'+c.lbl+' / '+c.step+'"');
  ok('the guide is still showing in the afternoon',c.on,'on');
  ok('THE AFTERNOON DOES NOT GET A NIGHT ORDER',!/OBJECTIVE/.test(c.lbl),c.lbl);
  ok('...it names the afternoon',/AFTERNOON/.test(c.lbl),c.lbl);
  ok('...and asks for the thing the afternoon is for',
     /stand near/i.test(c.step),c.step);
  ok('...and does not tell you to search a planter in daylight',
     !/planter/i.test(c.step),c.step);
  var why=el('guide-why').textContent;
  ok('...and says why standing about in daylight is worth anything',
     /familiar/i.test(why),why.slice(0,60));
  ok('...and mentions reading somebody',/\bQ\b/.test(why),'Q is the other verb');
  SD.endWalk();
})();

/* ── 3. AND THE EVENING GETS ITS OWN ────────────────────────────────────────*/
(function(){
  SD.startHouse();SD.startEvening();
  hud();
  var c=card();
  info('in the evening: "'+c.lbl+' / '+c.step+'"');
  ok('THE EVENING GETS ITS OWN CARD',/EVENING/.test(c.lbl),c.lbl);
  ok('...and it is about Dana',/dana/i.test(c.step)||/dana/i.test(el('guide-why').textContent),
     c.step);
  SD.endEvening();
})();

/* ── 4. THE HUD SAYS WHICH DAY IT IS ────────────────────────────────────────*/
(function(){
  SD.startHouse();SD.beginNight();
  hud();
  ok('the day pill is hidden at night',el('day-pill').style.display==='none',
     'the clock is the readout at night');

  SD.startWalk();
  SD.GAME.day=3;SD.DAY.block=3;
  hud();
  var v=el('day-v').textContent;
  info('day pill in the afternoon: "'+v+'"');
  ok('THE AFTERNOON HUD SAYS WHICH DAY IT IS',
     el('day-pill').style.display!=='none',
     'display "'+el('day-pill').style.display+'"');
  ok('...and which day of how many',
     v.indexOf('3')===0&&v.indexOf(String(C.SLICE_NIGHTS))>0,v);
  ok('...and which block of it',/AFTERNOON/.test(v),v);
  /* the separator is a real character, not the text of an escape that got eaten */
  ok('...and the separator is a middot, not the string 00b7',
     v.indexOf('00b7')<0&&v.indexOf(String.fromCharCode(92)+'u')<0,v);
  ok('...and it is actually the middot',v.indexOf(String.fromCharCode(183))>0,
     'char 183 present');
  SD.endWalk();
})();

/* ── 5. THE NIGHT PILLS STAY OUT OF THE DAY ─────────────────────────────────
   Pinned, because the day pill exists precisely BECAUSE these are hidden. */
(function(){
  SD.startHouse();SD.startWalk();
  hud();
  var hiddenInDay=['noise-pill','seen-pill','clock'].filter(function(id){
    return getComputedStyle(el(id)).display==='none';});
  info('hidden in daylight: '+hiddenInDay.join(', '));
  ok('THE CLOCK AND THE NOISE METER STAY OFF IN DAYLIGHT',hiddenInDay.length===3,
     hiddenInDay.join(', ')+' - there is no clock in an afternoon and nothing to hear');
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

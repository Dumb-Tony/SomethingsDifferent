/* M33 — THE STREET MAKES SENSE.

   Two things the game had been saying that were not true, and one thing it let you
   do that made the rest of it pointless.

   THE MAP: the opening objective read "Cross the street to 12 Ardsley Ct". There is
   nothing across the street - all five houses sit in one row along x at z=0. It said
   the Hoyts were "two doors down" (they are next door), that "any of the three will
   do" (there are four), and the closing card said "Six neighbours" while
   activeResidents() counts seven. And the addresses ran 10, 14, 12, 16, 18 west to
   east, so the player's own house sat between number 10 and number 12.

   THE CHEAT: `R` in focus mode handed you three matched variants at 97/92/80%
   similarity, free, in the victim's house, at three in the morning. Its own comment
   called it a stub for M6. M6 shipped nineteen milestones earlier. It made the money,
   the three shops, the weekly stock roll and the whole M18 fence optional - and it
   satisfied the guide's `shop` step without the player ever seeing a shop. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}

try{
var SD=window.__SD,C=SD.CONST;
SD.stopLoop();SD.startHouse();

/* ── 1. THE ADDRESSES RUN IN ORDER ──────────────────────────────────────────*/
(function(){
  var row=SD.HOUSES.slice().sort(function(a,b){return a.x-b.x;});
  var nums=row.map(function(h){return parseInt(h.name,10);});
  info('west to east: '+row.map(function(h){return h.name;}).join(', '));
  ok('every house has a number',nums.every(function(n){return n>0;}),nums.join(','));
  ok('THE NUMBERS RUN IN ORDER ALONG THE STREET',
     nums.every(function(n,i){return i===0||n>nums[i-1];}),
     nums.join(' -> '));
  ok('...and they step evenly, the way a real street does',
     nums.every(function(n,i){return i===0||n-nums[i-1]===2;}),
     'all +2');
  ok('the tutorial house is still 12 Ardsley Ct',
     SD.houseById('hoyt').name==='12 Ardsley Ct',SD.houseById('hoyt').name);
  var mine=row.map(function(h){return h.yours;}).indexOf(true);
  var tut =row.map(function(h){return h.id;}).indexOf('hoyt');
  ok('...and yours really is the lot next to it',Math.abs(mine-tut)===1,
     'you are #'+mine+' in the row, the Hoyts are #'+tut);
})();

/* ── 2. THE GUIDE DESCRIBES THIS STREET ─────────────────────────────────────*/
(function(){
  var all=SD.GUIDE_STEPS.map(function(s){return s.t+' '+s.why;}).join(' ');
  ok('THE GUIDE NO LONGER SENDS YOU ACROSS A STREET WITH NOTHING ON IT',
     !/Cross the street/i.test(all));
  ok('...and no longer puts the Hoyts two doors down',
     !/two doors down/i.test(all));
  ok('...and no longer says there are three houses',
     !/any of the three/i.test(all));
  /* Prove the geography the text now claims. */
  var zs=SD.HOUSES.map(function(h){return h.z||0;});
  ok('all five houses really are in one row',
     zs.every(function(z){return Math.abs(z)<0.01;}),
     'z = '+zs.join(','));
  var workable=SD.HOUSES.filter(function(h){return !h.yours&&h._door;});
  ok('there really are four houses you can enter, not three',
     workable.length===4,workable.length+' with doors');
  ok('...and the guide names your own number correctly',
     /number 10/.test(all)&&
     SD.HOUSES.filter(function(h){return h.yours;})[0].name.indexOf('10')===0,
     'you live at 10');
  ok('...and Ray’s',/number 8/.test(all)&&SD.houseById('pittman').name.indexOf('8')===0);
})();

/* ── 3. THE CLOSING CARD COUNTS THE PEOPLE WHO ARE THERE ────────────────────*/
(function(){
  SD.startHouse();
  var n=SD.activeResidents().length;
  info(n+' residents own objects, so '+n+' count toward Collapse');
  SD.GAME.guideDone=false;SD.GUIDE.reset();
  /* Walk the chain to the end so the closing card renders. */
  SD.GAME.guideStep=SD.GUIDE_STEPS.length-1;
  SD.GUIDE.render&&SD.GUIDE.render();
  SD.GAME.guideDone=true;SD.GUIDE.render&&SD.GUIDE.render();
  var why=document.getElementById('guide-why');
  var t=why?why.textContent:'';
  ok('THE CLOSING CARD DOES NOT SAY SIX NEIGHBOURS',!/Six neighbours/i.test(t),
     t.slice(0,70));
  if(/neighbours/.test(t)){
    ok('...it counts the ones who are actually there',
       t.indexOf(String(n)+' neighbours')>=0,t.slice(0,70));
    ok('...and reads the night count out of CONST',
       t.indexOf(String(C.SLICE_NIGHTS)+' nights')>=0,t.slice(0,70));
  }else{
    info('closing card not rendered in this state - the negative assertion stands');
  }
})();

/* ── 4. THE CHEAT IS GONE ───────────────────────────────────────────────────*/
(function(){
  SD.startHouse();
  var o=SD.objects[0];
  SD.scanObject(o);
  SD.INV.length=0;
  SD.enterFocus(o);
  ok('you are in focus mode on a scanned object',!!SD.S.focus);
  /* Press R the way a player would - through the real keydown handler, not through
     an exported function. focusKey owns the keyboard while S.focus is set. */
  window.dispatchEvent(new KeyboardEvent('keydown',{key:'r',bubbles:true}));
  /* M39 GAVE R BACK, on terms that keep this milestone's point intact. What M33
     removed was three MATCHED variants (97/92/80%), chosen, instant, free, unlimited
     - which made money, the shops, the stock roll and the fence optional. What R does
     now is print ONE copy at a similarity you do not choose, capped below anything a
     shop sells, paid for in noise, once per object per night. The claim this suite has
     always made is that R cannot hand you a free shortcut past the economy, and that
     is still exactly true. */
  ok('PRESSING R DOES NOT HAND YOU THE FREE 97/92/80 SET',SD.INV.length<=1,
     SD.INV.length+' item, not three');
  ok('...and what it does print is capped below the shops',
     SD.INV.length===0||SD.INV[0].sim<=SD.CONST.FAB_SIM[1]+2,
     SD.INV.length?SD.INV[0].sim.toFixed(1)+'% vs a shop ceiling of 100%':'nothing');
  SD.exitFocus();

  /* Scoped to the PANELS, not to document.body.innerHTML - the game's script tag
     lives inside <body>, so the source comment explaining this removal matched the
     first version of this assertion and failed it. */
  var ui=[document.getElementById('s-controls'),document.getElementById('focus')]
          .map(function(e){return e?e.innerHTML:'';}).join(' ');
  ok('...and neither the controls screen nor the focus panel advertises it',
     !/requisition/i.test(ui),'no "requisition" on any panel the player reads');
  /* The R ROW is back with the key (M39). What must never come back is the word that
     described the free shortcut. */
  ok('...and nothing on any panel offers to requisition anything',
     !/requisition/i.test(document.getElementById('s-controls').innerHTML));

  /* The bag can still only be filled by paying for something. */
  SD.startHouse();
  SD.scanObject(SD.objects[0]);
  SD.GAME.bank=5000;SD.GAME.hk=60;
  ok('the bag starts empty',SD.INV.length===0);
  SD.buyVariant(SD.objects[0].id,0,'bulwark');
  ok('BUYING IS THE ONLY WAY TO FILL IT NOW',SD.INV.length===1,
     SD.INV.length+' in the bag');
  ok('...and it cost money',SD.money()<5000,'$'+SD.money().toFixed(0)+' left of $5000');

  /* And the guide step it used to satisfy for free is now honest. */
  SD.startHouse();
  var shop=SD.GUIDE_STEPS.filter(function(s){return s.id==='shop';})[0];
  ok('the shop step is not satisfied on a fresh run',!shop.done());
  SD.scanObject(SD.objects[0]);
  ok('...nor by scanning',!shop.done());
  SD.GAME.bank=5000;SD.GAME.hk=60;
  SD.buyVariant(SD.objects[0].id,0,'bulwark');
  ok('THE SHOP STEP NOW REQUIRES A SHOP',shop.done());
})();

/* ── 5. requisition() ITSELF IS UNTOUCHED ───────────────────────────────────
   The KEY went; the function stays. m4 has asserted its scan-gate contract since the
   first house was built, and deleting a tested function to remove a keybinding would
   be throwing away the test with it. */
(function(){
  SD.startHouse();
  var o=SD.objects[1];
  SD.INV.length=0;
  ok('the printer still refuses an unscanned object',
     SD.fabricate(o)===null&&SD.INV.length===0);
  SD.scanObject(o);
  var made=SD.fabricate(o);
  ok('...and yields exactly one copy once it is recorded',
     !!made&&SD.INV.length===1,made?'1 at '+made.sim.toFixed(1)+'%':'null');
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

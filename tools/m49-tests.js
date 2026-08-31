/* M49 — THE SCREENS FIT, AND THE TOOLS STILL WORK.

   I screenshotted the morning report - the screen you read EVERY night - and got a
   crash banner: "SD.requisition is not a function". M33 deleted requisition() sixteen
   milestones ago, and three of shot.ps1's scenes have thrown ever since. Nobody
   noticed because nobody looked at those scenes, which is the same disease as the
   forty-one milestones shipped without a rendered frame.

   Under the banner, the report itself ran off the bottom of the screen: the last swap
   of the night cut in half with CONTINUE sitting on top of it. #report-body capped at
   58vh, but the heading, the band glosses and M34's second button push the column past
   the viewport - and a CENTRED flex column clips at both ends when it overflows, so
   the cap alone could never have saved it.

   Both are the same failure at different scales: something the player sees constantly,
   that no assertion was looking at. So this suite watches the screens for size, and
   watches the API surface the TOOLS depend on - which is what would have caught the
   crash the day M33 landed. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}

try{
var SD=window.__SD,C=SD.CONST;
function el(id){return document.getElementById(id);}

/* ── 1. THE API THE TOOLS CALL STILL EXISTS ─────────────────────────────────
   Harvested from every SD.<name> in tools/*.js and tools/*.ps1. If a milestone
   removes an export, this goes red HERE rather than in a screenshot nobody takes.
   requisition is deliberately absent (M39 replaced it) and m39 asserts that. */
(function(){
  var needed=('ACTIONS BAND_GLOSS BEACON BLOCKS BODY CAR CATALOG CONST DANA DAY '+
    'DAYFOLK DOGS DOORS DOUBT EVENTS FOLK_SPOTS FRACTURES GAME GUIDE GUIDE_STEPS '+
    'HARDEN HAUL HIDES HOME HOUSES INV LIGHTS MARKS NIGHT NIGHT_HOURS OPT PENDING '+
    'PHYS PLANTERS PLAY PROP_KINDS RESIDENTS ROOM S SAVE_KEY SCENES SFX SLEEPERS '+
    'SPEC STEVE_LOOK STORES TOPS WIFE WINDOW PANES MX MR hardenNight '+
    'activeResidents applyChange audibleNight beaconTarget beaconTick beginNight '+
    'buyVariant camera canSee ceilAt checkEnding collapseIndex colliders doAction '+
    'doMorning emitNoise endEvening endNight endWalk enterFocus enterHide envMeshes '+
    'exitFocus exitHide fabricate famAdd familiar findTarget fireEvent fireFractures '+
    'fireHardening folkTick fracturedCount hardenAt hkTier houseById interact invFor '+
    'isHidden litAt loadGame money mulberry32 nightReset nudgeObject objectById '+
    'objects personLook player predict promptAnchor promptWorldPos readNearest '+
    'readPerson readTier relocate renderer respawnObject rotateObject saveGame '+
    'scanObject scanPulse scene searchPlanter sellItem setLighting shopStock showDay '+
    'showEnding showReport startDay startEvening startHouse startWalk stopLoop '+
    'streetAlert streetSuspicion swapWith talkTo tick toTitle updateHUD updatePrompt '+
    'useDoor wifeAdd wifeNightTick wifeTier winBar').split(/\s+/);
  var missing=needed.filter(function(n){return SD[n]===undefined;});
  info(needed.length+' names checked against the export surface');
  ok('EVERY API THE TOOLS CALL STILL EXISTS',missing.length===0,
     missing.length?('MISSING: '+missing.join(', ')):'none missing');
  ok('...and requisition really is gone',SD.requisition===undefined,
     'M39 replaced it with fabricate; three shot.ps1 scenes threw for sixteen '+
     'milestones because nobody re-ran them');
})();

/* ── 2. THE SCREENS CAN SCROLL RATHER THAN CLIP ─────────────────────────────*/
(function(){
  var scr=document.querySelector('.screen');
  var cs=getComputedStyle(scr);
  ok('A SCREEN THAT OVERFLOWS SCROLLS',
     cs.overflowY==='auto'||cs.overflowY==='scroll',
     'overflow-y: '+cs.overflowY+' - a centred flex column clips at BOTH ends');
})();

/* ── 3. THE MORNING REPORT LEAVES ROOM FOR ITS OWN BUTTON ───────────────────
   The real bug: at the four-a-night pace the game is balanced around, the report is
   always this long, so this was every night of every run. */
(function(){
  SD.stopLoop();SD.startHouse();
  SD.GAME.bank=100000;SD.GAME.hk=99;
  /* Do a full night's work so the report is a REAL one, not a stub. */
  var did=0;
  for(var i=0;i<SD.objects.length&&did<4;i++){
    var o=SD.objects[i];
    if(!SD.RESIDENTS[o.owner])continue;
    SD.scanObject(o);
    if(!SD.fabricate(o))continue;
    var bag=SD.invFor(o.id);
    if(!bag.length)continue;
    SD.swapWith(o,bag.length-1);did++;
  }
  ok('a full night of work was done',did===4,did+' swaps');
  SD.showReport('home','You are back before anyone stirs.');

  var body=el('report-body'),btn=el('btn-report-ok');
  var br=body.getBoundingClientRect(),cr=btn.getBoundingClientRect();
  info('report body '+br.height.toFixed(0)+'px, button top at '+cr.top.toFixed(0)+
       'px, viewport '+innerHeight+'px');
  ok('THE REPORT BODY DOES NOT SWALLOW THE BUTTON',br.bottom<=cr.top+1,
     'body ends at '+br.bottom.toFixed(0)+', button starts at '+cr.top.toFixed(0));
  ok('...and the button is on the screen',cr.bottom<=innerHeight+1&&cr.top>=0,
     'button '+cr.top.toFixed(0)+'-'+cr.bottom.toFixed(0)+' of '+innerHeight);
  ok('...and the body is capped rather than unbounded',
     br.height<innerHeight,
     br.height.toFixed(0)+'px of '+innerHeight);
  ok('...and it scrolls when there is more than fits',
     getComputedStyle(body).overflowY==='auto',
     'overflow-y: '+getComputedStyle(body).overflowY);
})();

/* ── 4. SO DOES THE DAY SCREEN ──────────────────────────────────────────────*/
(function(){
  SD.startHouse();SD.startDay();
  SD.DAY.block=3;SD.DAY.actions=2;
  SD.DAY.log.push('A long line of the sort the day log fills up with, several times '+
                  'over, once the afternoon has had things happen in it.');
  SD.DAY.log.push('And another, because a block with two actions in it produces two.');
  SD.showDay();
  var body=el('day-body'),btn=el('btn-day-next');
  var br=body.getBoundingClientRect(),cr=btn.getBoundingClientRect();
  ok('THE DAY SCREEN LEAVES ROOM FOR ITS BUTTON',br.bottom<=cr.top+1,
     'body ends '+br.bottom.toFixed(0)+', button starts '+cr.top.toFixed(0));
  ok('...and that button is on screen',cr.bottom<=innerHeight+1,
     cr.bottom.toFixed(0)+' of '+innerHeight);
})();

/* -- 5. NO KEY ROW IS MALFORMED --------------------------------------------
   M39 wrote `<b>F</b> / <b>R</b>` on the title grid, and the two-column layout read
   the stray slash as its own cell - so the screen showed a key called "F" whose
   description was "/", and a key called "R" underneath it. Caught by screenshot.

   Two false alarms had to be designed out before this measured anything real:

     * querySelectorAll('b') swept up the <b> tags the DESCRIPTIONS use for emphasis
       ("...at a wardrobe, hide"). A key cell is a DIRECT CHILD of the grid.
     * a label does not have to contain a letter - the nudge row is four arrows - so
       the rule is not "has no alphanumerics", it is "is nothing but a connector",
       which is the shape the F/R bug actually had. (The arrows printed as blanks in
       the failure message, because the harness reads its output as ANSI.) */
(function(){
  var bad=[],CONNECTORS={};
  '/ , - | & + : ; .'.split(' ').forEach(function(c){CONNECTORS[c]=1;});
  function isConnector(s){
    if(!s)return false;
    for(var i=0;i<s.length;i++){
      var c=s.charAt(i);
      if(c!==' '&&!CONNECTORS[c])return false;
    }
    return true;
  }
  document.querySelectorAll('#s-title .keys, #s-controls .keys').forEach(function(grid){
    Array.prototype.forEach.call(grid.children,function(b){
      if(b.tagName!=='B')return;
      var label=b.textContent.trim(),desc=b.nextElementSibling;
      if(!label||isConnector(label))bad.push('a key cell reading "'+label+'"');
      else if(!desc||desc.tagName==='B'||!desc.textContent.trim()||
              isConnector(desc.textContent.trim()))
        bad.push(label+' -> "'+(desc?desc.textContent.trim():'nothing')+'"');
    });
  });
  var rows=0;
  document.querySelectorAll('#s-title .keys, #s-controls .keys').forEach(function(g){
    Array.prototype.forEach.call(g.children,function(e){if(e.tagName==='B')rows++;});
  });
  info(rows+' key rows across the title and controls screens');
  ok('EVERY KEY ROW HAS A KEY AND A DESCRIPTION',bad.length===0,
     bad.length?bad.join('; '):'all '+rows+' rows well formed');

  /* and the row that started it is one row, not two */
  var titles=[];
  document.querySelectorAll('#s-title .keys > b').forEach(function(b){
    titles.push(b.textContent.trim());
  });
  ok('...and F / R is a single row',titles.indexOf('F / R')>=0,
     'title screen keys: '+titles.join(', '));
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

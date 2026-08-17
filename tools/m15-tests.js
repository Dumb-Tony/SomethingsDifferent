/* ─────────────────────────────────────────────────────────────────────────────
   Milestone 15 — a run you can read, and difficulty you can turn.

   M14 shipped a street that escalates against you and I could not verify the curve:
   the balance sweep drives the systems directly and never walks the world, so it is
   never actually caught by the watchman or lit up on a porch. Two responses, both
   tested here:

     1. THE DIFFICULTY IS A DIAL, not a constant. A brutal street is now a menu change
        rather than a code change — and STANDARD is byte-for-byte the shipped numbers,
        so nothing that came before is silently retuned.
     2. THE RUN IS LEGIBLE. Every number needed to answer "am I winning?" already
        existed; none of it was ever shown during play.
   ───────────────────────────────────────────────────────────────────────────── */
(function(){
var out=[],pass=0,fail=0;
function ok(name,cond,detail){
  if(cond){pass++;out.push('PASS  '+name+(detail?'   ('+detail+')':''));}
  else    {fail++;out.push('FAIL  '+name+(detail?'   ('+detail+')':''));}
}
function info(s){out.push('      '+s);}
function near(a,b,t){return Math.abs(a-b)<=t;}

try{
  var SD=window.__SD;
  ok('__SD present',!!SD); if(!SD)throw new Error('no __SD');
  var C=SD.CONST;
  SD.stopLoop();
  var was=SD.OPT.diff;

  /* ── 1. presets ────────────────────────────────────────────────────────────*/
  ok('there are three difficulties',SD.DIFFS.length===3,
     SD.DIFFS.map(function(d){return d.name;}).join(' / '));
  ok('the default is standard',SD.OPT.setDiff('standard')==='standard');
  ok('STANDARD IS EXACTLY WHAT SHIPPED',
     near(SD.winBar(),C.SLICE_WIN_COLLAPSE,1e-9)&&
     C.HARDEN_AT.every(function(v,i){return near(SD.hardenAt(i),v,1e-9);}),
     'win '+SD.winBar().toFixed(0)+', ladder '+
     C.HARDEN_AT.map(function(v,i){return SD.hardenAt(i).toFixed(0);}).join('/'));
  info('so every number measured in M12 and M14 still describes the default game');

  SD.OPT.setDiff('gentle');
  var gWin=SD.winBar(),gH=SD.hardenAt(0);
  SD.OPT.setDiff('harsh');
  var hWin=SD.winBar(),hH=SD.hardenAt(0);
  SD.OPT.setDiff('standard');
  ok('GENTLE lowers the bar you have to clear',gWin<C.SLICE_WIN_COLLAPSE,
     gWin.toFixed(0)+' vs '+C.SLICE_WIN_COLLAPSE);
  ok('...and makes the street slower to react',gH>C.HARDEN_AT[0],
     'first tier at '+gH.toFixed(0)+' vs '+C.HARDEN_AT[0]);
  ok('HARSH raises the bar',hWin>C.SLICE_WIN_COLLAPSE,
     hWin.toFixed(0)+' vs '+C.SLICE_WIN_COLLAPSE);
  ok('...and makes it react sooner',hH<C.HARDEN_AT[0],
     'first tier at '+hH.toFixed(0)+' vs '+C.HARDEN_AT[0]);
  ok('the ladder still ascends on every preset',
     SD.DIFFS.every(function(d){
       SD.OPT.setDiff(d.id);
       for(var i=1;i<C.HARDEN_AT.length;i++)
         if(SD.hardenAt(i)<=SD.hardenAt(i-1))return false;
       return true;}));
  SD.OPT.setDiff('standard');

  /* ── 2. NOTHING MUTATES CONST ──────────────────────────────────────────────
     The whole reason difficulty is a multiplier and not an assignment: CONST is the
     contract every other suite asserts against, and quietly rewriting it would make
     those assertions describe a game nobody is playing. */
  var beforeWin=C.SLICE_WIN_COLLAPSE,beforeLadder=C.HARDEN_AT.join(',');
  SD.OPT.setDiff('harsh');SD.winBar();SD.hardenAt(0);
  SD.OPT.setDiff('gentle');SD.winBar();SD.hardenAt(0);
  SD.OPT.setDiff('standard');
  ok('CHANGING DIFFICULTY NEVER REWRITES CONST',
     C.SLICE_WIN_COLLAPSE===beforeWin&&C.HARDEN_AT.join(',')===beforeLadder,
     'win '+C.SLICE_WIN_COLLAPSE+', ladder '+C.HARDEN_AT.join(','));

  /* ── 3. the dial actually reaches the game ─────────────────────────────────*/
  function collapseTo(v){
    SD.startHouse();
    Object.keys(SD.RESIDENTS).forEach(function(id){
      if(SD.objects.some(function(o){return o.owner===id;}))SD.RESIDENTS[id].doubt=v;});
  }
  SD.OPT.setDiff('standard');
  collapseTo(36);
  ok('36 collapse does not win at STANDARD',SD.checkEnding()===null,
     'bar '+SD.winBar().toFixed(0));
  SD.OPT.setDiff('gentle');
  collapseTo(36);
  var g=SD.checkEnding();
  ok('...but it DOES at GENTLE',!!g&&g.kind==='win',
     'bar '+SD.winBar().toFixed(0)+' -> '+(g?g.kind:'none'));
  SD.OPT.setDiff('harsh');
  collapseTo(44);
  ok('...and 44 is not enough at HARSH',SD.checkEnding()===null,
     'bar '+SD.winBar().toFixed(0));
  SD.OPT.setDiff('standard');
  collapseTo(44);
  var st=SD.checkEnding();
  ok('...though it wins at STANDARD',!!st&&st.kind==='win');

  // and the hardening ladder moves with it
  SD.OPT.setDiff('harsh');
  SD.startHouse();
  Object.keys(SD.RESIDENTS).forEach(function(id){
    if(SD.objects.some(function(o){return o.owner===id;}))SD.RESIDENTS[id].doubt=10;});
  var hardHarsh=SD.fireHardening().length;
  SD.OPT.setDiff('gentle');
  SD.startHouse();
  Object.keys(SD.RESIDENTS).forEach(function(id){
    if(SD.objects.some(function(o){return o.owner===id;}))SD.RESIDENTS[id].doubt=10;});
  var hardGentle=SD.fireHardening().length;
  SD.OPT.setDiff('standard');
  ok('THE SAME STREET HARDENS ON HARSH AND NOT ON GENTLE',
     hardHarsh===1&&hardGentle===0,
     'at collapse 10: harsh fired '+hardHarsh+', gentle fired '+hardGentle);

  /* ── 4. preferences persist, and separately from the save ──────────────────*/
  SD.OPT.setDiff('harsh');SD.OPT.setSens(1.8);
  var raw=null;try{raw=JSON.parse(localStorage.getItem(SD.DIFF_KEY)||'null');}catch(e){}
  ok('the choice persists',raw&&raw.diff==='harsh'&&near(raw.sens,1.8,1e-9),
     SD.DIFF_KEY+' = '+JSON.stringify(raw));
  ok('...in its own key, not the save file',
     SD.DIFF_KEY!==SD.SAVE_KEY&&SD.DIFF_KEY!==SD.AUDIO_KEY&&SD.DIFF_KEY!==SD.GUIDE_KEY,
     SD.DIFF_KEY);
  info('a preference must outlive any single run, and a corrupt save must not reset it');
  ok('sensitivity is clamped to something usable',
     SD.OPT.setSens(99)<=2.5&&SD.OPT.setSens(-4)>=0.35,
     'clamped to '+SD.OPT.setSens(-4)+' .. '+SD.OPT.setSens(99));
  SD.OPT.setSens(1);SD.OPT.setDiff('standard');
  ok('cycling walks all three and comes home',(function(){
     var seen={},start=SD.OPT.diff;
     for(var i=0;i<3;i++){seen[SD.OPT.cycle()]=1;}
     return Object.keys(seen).length===3&&SD.OPT.diff===start;})(),
     SD.OPT.diff);

  /* ── 5. sensitivity reaches the camera ─────────────────────────────────────*/
  SD.startHouse();SD.S.menuOpen=false;SD.S.focus=null;
  SD.OPT.setSens(1.0);
  var y0=SD.S.yaw;
  SD.look(100,0,C.LOOK_SENS*SD.OPT.sens,C.LOOK_SENS*SD.OPT.sens*C.LOOK_PITCH);
  var d1=Math.abs(SD.S.yaw-y0);
  SD.OPT.setSens(2.0);
  y0=SD.S.yaw;
  SD.look(100,0,C.LOOK_SENS*SD.OPT.sens,C.LOOK_SENS*SD.OPT.sens*C.LOOK_PITCH);
  var d2=Math.abs(SD.S.yaw-y0);
  ok('DOUBLING THE SLIDER DOUBLES THE TURN',near(d2,d1*2,1e-9),
     d1.toFixed(4)+' -> '+d2.toFixed(4)+' rad for the same mouse movement');
  SD.OPT.setSens(1.0);
  ok('there is a slider for it',!!document.getElementById('mx-sens'));
  ok('...and the panel it lives in is no longer just about sound',
     /OPTIONS/.test(document.getElementById('s-sound').textContent));

  /* ── 6. THE RUN IS LEGIBLE ─────────────────────────────────────────────────*/
  SD.startHouse();
  SD.RESIDENTS.walt.doubt=50;SD.RESIDENTS.june.doubt=30;
  SD.GAME.hardened=['lights','dogs'];
  SD.GAME.day=4;
  SD.showDay();
  var day=document.getElementById('day-body').innerHTML;
  ok('THE DAY SCREEN SHOWS HOW CLOSE YOU ARE TO WINNING',/dy-prog/.test(day)&&
     day.indexOf(SD.collapseIndex().toFixed(1))>=0,
     'collapse '+SD.collapseIndex().toFixed(1)+' / '+SD.winBar().toFixed(0));
  ok('...and how many nights are left',/night/.test(day)&&
     day.indexOf('>'+(C.SLICE_NIGHTS-SD.GAME.day+1)+'<')>=0,
     (C.SLICE_NIGHTS-SD.GAME.day+1)+' of '+C.SLICE_NIGHTS);
  ok('...and how close the two LOSING meters are',
     /seen/.test(day)&&/street/.test(day));
  ok('...and what the street has installed against you',
     /dy-hard/.test(day)&&/MOTION LIGHTS/.test(day),
     'the two live tiers are named');
  SD.GAME.hardened=[];
  SD.showDay();
  ok('a soft street says nothing about installations',
     !/dy-hard/.test(document.getElementById('day-body').innerHTML));
  info('every number here already existed - none of it had ever been shown mid-run');

  /* ── 7. the ending agrees with the dial ────────────────────────────────────*/
  SD.OPT.setDiff('gentle');
  SD.startHouse();SD.GAME.over=null;
  Object.keys(SD.RESIDENTS).forEach(function(id){
    if(SD.objects.some(function(o){return o.owner===id;}))SD.RESIDENTS[id].doubt=90;});
  SD.checkEnding();SD.showEnding();
  var end=document.getElementById('end-body').innerHTML;
  ok('the ending screen quotes the bar you actually played against',
     end.indexOf(SD.winBar().toFixed(0))>=0,
     'gentle bar '+SD.winBar().toFixed(0));
  SD.OPT.setDiff(was||'standard');

  var eb=document.getElementById('err-banner');
  ok('no crash banner',!eb,eb?eb.textContent.slice(0,200):'');

}catch(e){
  fail++;
  out.push('FAIL  harness threw: '+(e&&e.message)+'  @ '+
    String((e&&e.stack)||'').split('\n').slice(0,3).join(' | '));
}

var summary='SDTEST '+(fail===0?'ALL-PASS':'FAILURES')+' pass='+pass+' fail='+fail;
var pre=document.createElement('pre');
pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\n'+summary+'\n'+out.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);
document.title=summary;
})();

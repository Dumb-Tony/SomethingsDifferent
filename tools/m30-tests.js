/* M30 — THE DAY SCREEN KEEPS ITS PROMISES.

   Twenty-nine milestones of tests called SD.openShop() and SD.buyVariant() and
   ACTIONS.shop.run() DIRECTLY, and every one of them passed, while the actual button
   on the actual screen did this:

       doAction(id){ ... a.run();            // openShop -> go('s-shop')
                     if(S.phase==='house')showDay(); }   // go('s-day') - covers it

   The shop, the afternoon walk (M20) and the evening with Dana (M28) were each
   opened and then buried one statement later by the screen you clicked them from.
   Five milestones of content sat behind a button that undid itself.

   So this suite touches NOTHING through the API. It dispatches real click events on
   real elements and asks what the player would be looking at. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}

try{
var SD=window.__SD,C=SD.CONST;

/* ── the player's eyes: what is actually on screen ──────────────────────────*/
function onScreens(){
  return Array.prototype.slice.call(document.querySelectorAll('.screen.on'))
              .map(function(s){return s.id;});
}
function screenOn(){var a=onScreens();return a.length?a[a.length-1]:null;}
/* A button the player cannot SEE is not a button the player can press. The first
   version of this suite clicked .sh-buy elements that were sitting in the DOM
   underneath the day screen and reported the shop as reachable - which is the same
   mistake the game was making. Anything clicked here has to be on screen. */
function visible(el){
  if(!el||!el.offsetParent)return false;
  var r=el.getBoundingClientRect();
  return r.width>0&&r.height>0;
}
function click(el){
  if(!visible(el))return false;
  el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));
  return true;
}
function esc(){
  window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
}
function act(id){return document.querySelector('#day-body .dy-act[data-a="'+id+'"]');}
/* Put the day screen up on a chosen block, the way the game does. */
function day(block){
  SD.stopLoop();SD.startHouse();SD.startDay();
  SD.DAY.block=block;SD.DAY.actions=3;SD.DAY.log.length=0;
  SD.showDay();
}

/* ── 1. EVERY ACTION LEAVES THE FRAME ITS LABEL PROMISED ────────────────────*/
(function(){
  day(2);                                    // MIDDAY - the shops are open
  ok('the day screen is up to begin with',screenOn()==='s-day',String(screenOn()));
  ok('...and its buttons exist to be clicked',!!act('shop'),
     document.querySelectorAll('#day-body .dy-act').length+' actions offered');

  click(act('shop'));
  ok('CLICKING "DRIVE TO BULWARK MART" LEAVES YOU IN THE SHOP',
     screenOn()==='s-shop',
     'looking at '+String(screenOn())+(screenOn()==='s-day'?' - the day screen covered it':''));

  day(2);click(act('antique'));
  ok('...and the antique shop, too',screenOn()==='s-shop',String(screenOn()));

  day(2);click(act('thrift'));
  ok('...and the fence two towns over',screenOn()==='s-shop',String(screenOn()));

  /* The afternoon and the evening are the opposite case: they take you OUT of the
     menus into the 3D world, so the correct frame is no screen at all. */
  day(3);click(act('walk'));
  ok('CLICKING "WALK THE STREET" PUTS YOU OUTSIDE',
     screenOn()===null&&SD.S.daytime===true,
     'screen='+String(screenOn())+' daytime='+SD.S.daytime);
  ok('...with people out on it',SD.DAYFOLK&&SD.DAYFOLK.length>0,
     (SD.DAYFOLK?SD.DAYFOLK.length:0)+' neighbours out');
  SD.endWalk();

  day(4);click(act('talk'));
  ok('CLICKING "GO AND SIT WITH HER" PUTS YOU IN THE LOUNGE',
     screenOn()===null&&SD.S.evening===true,
     'screen='+String(screenOn())+' evening='+SD.S.evening);
  ok('...with her in it',!!SD.DANA,SD.DANA?'Dana is there':'the room is empty');
  SD.endEvening();

  /* ...and the ones that are just a line of text still repaint the day. */
  day(3);var before=SD.DAY.actions;click(act('lawn'));
  ok('an action that opens nothing still repaints the day screen',
     screenOn()==='s-day'&&SD.DAY.actions===before-1,
     'screen='+String(screenOn())+' actions '+before+'->'+SD.DAY.actions);
  ok('...and its result is written into the log',SD.DAY.log.length>0);
})();

/* ── 2. NEVER TWO SCREENS AT ONCE, NEVER A DEAD WORLD ───────────────────────*/
(function(){
  day(2);
  ok('exactly one screen is lit at a time',onScreens().length===1,onScreens().join('+'));
  click(act('shop'));
  ok('...still exactly one after an action',onScreens().length===1,onScreens().join('+'));
})();

/* ── 3. ESCAPE CANNOT THROW A RUN AWAY ──────────────────────────────────────
   The Escape handler special-cased s-sound, s-controls and s-intro; s-day, s-shop,
   s-report and s-end fell through to closeMenu(), which is go(null). One keypress
   on the final ending card left the player standing in a frozen street at 4am with
   M inert, no report, no day and no ending - the run gone, with the only exit being
   BACK TO TITLE. */
(function(){
  day(2);esc();
  ok('ESCAPE ON THE DAY SCREEN DOES NOT DISMISS IT INTO A DEAD WORLD',
     screenOn()==='s-day',String(screenOn()));

  day(2);click(act('shop'));esc();
  ok('...escaping the shop puts you back on the day, not nowhere',
     screenOn()==='s-day',String(screenOn()));

  SD.startHouse();SD.showReport();
  ok('the morning report is up',screenOn()==='s-report',String(screenOn()));
  esc();
  ok('ESCAPE ON THE MORNING REPORT DOES NOT DISMISS IT',
     screenOn()==='s-report',String(screenOn()));

  SD.startHouse();
  SD.GAME.over={kind:'win',title:'UNEXPLAINED EVENT',
                text:'Your species logs the method as viable.',ci:45,ss:0};
  SD.showEnding();
  ok('the ending card is up',screenOn()==='s-end',String(screenOn()));
  esc();
  ok('ESCAPE ON THE ENDING CARD DOES NOT EAT THE RUN',
     screenOn()==='s-end',String(screenOn()));
  esc();esc();
  ok('...not even if you lean on the key',screenOn()==='s-end',String(screenOn()));
})();

/* ── 4. A RUN OF PURE CLICKS ENDS WITH SOMETHING IN THE BAG ─────────────────
   The reachability proof. No SD.buyVariant, no SD.openShop - a mouse only. If this
   passes, the shop is genuinely playable; the guide's `shop` step
   (done:()=>INV.length>0) can be satisfied without the R cheat. */
(function(){
  SD.stopLoop();SD.startHouse();
  var o=SD.objects[0];SD.scanObject(o);         // you have to have seen it to buy a copy
  SD.GAME.bank=5000;SD.GAME.hk=60;
  SD.startDay();SD.DAY.block=2;SD.DAY.actions=3;SD.showDay();
  var invBefore=SD.INV.length;
  ok('the shop button is visible to be clicked',visible(act('shop')));
  click(act('shop'));
  var buys=Array.prototype.slice.call(
    document.querySelectorAll('#shop-body .sh-buy:not([disabled])')).filter(visible);
  info('the shop is showing '+buys.length+' visible things you could buy');
  ok('the shop has stock you can afford, ON SCREEN',buys.length>0);
  click(buys[0]);
  ok('BUYING WITH THE MOUSE PUTS IT IN YOUR BAG',SD.INV.length>invBefore,
     'INV '+invBefore+' -> '+SD.INV.length);
  ok('...and the shop is still open afterwards',screenOn()==='s-shop',String(screenOn()));
  var shopStep=SD.GUIDE_STEPS.filter(function(s){return s.id==='shop';})[0];
  ok('...which satisfies the guide step that had no other honest route',
     shopStep.done());
  click(document.getElementById('btn-shop-close'));
  ok('LEAVE goes back to the day',screenOn()==='s-day',String(screenOn()));
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

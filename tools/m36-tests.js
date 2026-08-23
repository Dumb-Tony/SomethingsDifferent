/* M36 — THE GAME EXPLAINS ITSELF.

   The screens a first-time player reads were teaching them to lose.

   The intro's one-line statement of the rules said "change ONE thing in somebody's
   house" — which CONST records, from its own measurement, as the losing line: one
   object a night reaches Collapse 19.3 against a bar of 40. Two lines later it
   promised that the scanner "will tell you which one you are about to cause, before
   you buy it. It does not lie" — while predict() returns `???` below Human Knowledge
   20, and every run starts at 0. So the first shop trip a new player takes shows them
   nothing but ??? immediately after being told the instrument does not lie.

   And two CSS classes were written but never defined: `rp-row` on the fence's one
   moment of consequence, and `.hot` on the pill that says Dana is outside looking for
   you right now — the most urgent thing the HUD can say, rendering in the calm
   colour. The last section here is a permanent drift detector for exactly that. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}

try{
var SD=window.__SD,C=SD.CONST;
SD.stopLoop();
function el(id){return document.getElementById(id);}

/* ── 1. THE INTRO TEACHES THE GAME THAT IS BALANCED ─────────────────────────*/
(function(){
  var intro=el('s-intro').textContent.replace(/\s+/g,' ');
  ok('THE INTRO NO LONGER TEACHES ONE-A-NIGHT',
     !/change one thing/i.test(intro),
     'CONST measures 1/night at Collapse 19.3 against a bar of '+C.SLICE_WIN_COLLAPSE);
  ok('...it asks for several, spread out',
     /a few things/i.test(intro)&&/different houses/i.test(intro),
     'which is the 4-a-night-across-the-street pace CONST is set against');
  ok('...and it still states the three bands',
     /TOO SIMILAR/i.test(intro)&&/TOO DIFFERENT/i.test(intro)&&/IN BETWEEN/i.test(intro));
})();

/* ── 2. ...AND DOES NOT PROMISE A FORECAST IT WITHHOLDS ─────────────────────*/
(function(){
  var intro=el('s-intro').textContent.replace(/\s+/g,' ');
  ok('the intro no longer claims the scanner simply does not lie',
     !/It does not lie/i.test(intro));
  ok('THE INTRO ADMITS THE FORECAST NEEDS CALIBRATING',
     /\?\?\?/.test(intro)&&/calibrat/i.test(intro),
     'and names watching them as what does it');

  /* ...and prove the gate it is now honest about. */
  SD.startHouse();
  var o=SD.objects[0];
  SD.scanObject(o);
  SD.GAME.bank=100000;
  var stock=SD.shopStock(o.id,'bulwark')||[];
  ok('there is stock to forecast against',stock.length>0,stock.length+' rungs');
  SD.GAME.hk=0;
  var p0=SD.predict(o.id,stock[0]);
  ok('a fresh run really does read ??? — which is what the intro now says',
     p0&&p0.text==='???','hk 0 -> "'+(p0?p0.text:'null')+'"');
  SD.GAME.hk=60;
  var p60=SD.predict(o.id,stock[0]);
  ok('...and it names a band once you know them',
     p60&&/MISSED|DOUBT|CERTAINTY/.test(p60.text),
     'hk 60 -> "'+(p60?p60.text:'null')+'"');
})();

/* ── 3. THE HUD ADMITS YOU ARE IN A WARDROBE ────────────────────────────────*/
(function(){
  SD.startHouse();SD.nightReset();
  SD.updateHUD&&SD.updateHUD();
  var before=el('mode-v').textContent;
  ok('the mode pill says how you are moving',/WALK|SNEAK|RUN/i.test(before),before);

  var hd=SD.HIDES[0];
  SD.player.position.set(hd.pos[0],0,hd.pos[2]+0.5);SD.S.py=0;
  SD.enterHide(hd);
  SD.updateHUD&&SD.updateHUD();
  ok('THE PILL SAYS YOU ARE HIDING, not WALK',
     /HIDING|HIDDEN/i.test(el('mode-v').textContent),
     '"'+el('mode-v').textContent+'" — it used to read WALK with movement forced to 0');
  ok('...and the pill is marked urgent',
     el('mode-pill').classList.contains('warn'));

  SD.S.hideT=0;
  SD.updateHUD&&SD.updateHUD();
  ok('...and settles to HIDDEN once you are in',
     el('mode-v').textContent==='HIDDEN',el('mode-v').textContent);

  SD.exitHide();
  SD.updateHUD&&SD.updateHUD();
  ok('...and goes back to normal when you come out',
     /WALK|SNEAK|RUN/i.test(el('mode-v').textContent)&&
     !el('mode-pill').classList.contains('warn'),
     el('mode-v').textContent);
})();

/* ── 4. THE SEEN PILL READS ITS OWN LIMIT ───────────────────────────────────*/
(function(){
  SD.startHouse();
  SD.updateHUD&&SD.updateHUD();
  ok('the seen pill agrees with CONST',
     el('seen-max').textContent===String(C.SEEN_LIMIT),
     '/'+el('seen-max').textContent+' vs SEEN_LIMIT '+C.SEEN_LIMIT);
  var real=C.SEEN_LIMIT;
  C.SEEN_LIMIT=5;
  SD.updateHUD&&SD.updateHUD();
  ok('...because it is WRITTEN from it, not typed into the markup',
     el('seen-max').textContent==='5','moved the constant, the pill followed');
  C.SEEN_LIMIT=real;
  SD.updateHUD&&SD.updateHUD();
})();

/* ── 5. THE CONTROLS SCREEN DESCRIBES THE GAME ──────────────────────────────*/
(function(){
  var ctl=el('s-controls');
  var t=ctl.textContent.replace(/\s+/g,' ');
  ok('THE CONTROLS SCREEN MENTIONS HIDING',/hide/i.test(t),
     'M27 shipped the only counterplay in the game and never put it here');
  ok('...and says Esc is more than pause',
     /Esc/.test(t)&&/afternoon|evening/i.test(t));
  ok('...AND THAT A SWAP LEAVES YOU HOLDING THEIR ORIGINAL',
     /keep\s+their original/i.test(t),
     'the fence is not affordable to discover by accident');

  /* No key may be listed twice with different text - M33 added a second Z / X row
     when it removed the R key, four lines from the original. */
  /* Per .keys BLOCK, not across the screen: this panel has two sections, and E is
     legitimately in both - "examine / open / hide" out in the world, and "step back"
     while you are holding something. Within one list, though, a key appearing twice
     is always an editing accident. */
  function dupesIn(root){
    var seen={},d=[];
    Array.prototype.forEach.call(root.querySelectorAll('b'),function(b){
      var k=b.textContent.trim();
      if(seen[k])d.push(k);else seen[k]=1;
    });
    return d;
  }
  var blocks=document.querySelectorAll('#s-controls .keys, #s-title .keys');
  var allDupes=[];
  Array.prototype.forEach.call(blocks,function(bl){
    dupesIn(bl).forEach(function(k){allDupes.push(k);});
  });
  ok('NO KEY IS LISTED TWICE IN THE SAME LIST',allDupes.length===0,
     allDupes.length?('duplicated: '+allDupes.join(', '))
                    :blocks.length+' key lists checked, none repeats itself');
})();

/* ── 6. EVERY CLASS THE PAGE USES IS A CLASS THE PAGE DEFINES ───────────────
   The drift detector. `rp-row` was written on the fence's one moment of consequence
   and defined nowhere, so it rendered as flush unpadded text; `.hot` was toggled on
   #wife-pill since M6 with only a #noise-pill rule to match it, so "Dana is outside
   looking for you" rendered in the calm colour. Both are the same bug, and neither
   throws. This catches the next one. */
(function(){
  var css='';
  Array.prototype.forEach.call(document.querySelectorAll('style'),function(s){
    css+=s.textContent;});
  /* Every class name that appears anywhere in a selector. */
  var defined={};
  (css.match(/\.[A-Za-z][\w-]*/g)||[]).forEach(function(m){defined[m.slice(1)]=1;});

  /* ...and every class the markup actually puts on an element. */
  var used={};
  Array.prototype.forEach.call(document.querySelectorAll('[class]'),function(e){
    Array.prototype.forEach.call(e.classList,function(c){used[c]=1;});
  });
  /* ...plus the ones only ever added from script, which the DOM cannot show us. */
  ['hot','warn','late','on','sh-good','sh-bad','sh-dim','rp-doubt','rp-cert','rp-miss']
    .forEach(function(c){used[c]=1;});

  var orphans=Object.keys(used).filter(function(c){return !defined[c];});
  info(Object.keys(used).length+' classes in use, '+
       Object.keys(defined).length+' defined in the stylesheet');
  ok('EVERY CLASS IN USE HAS A RULE BEHIND IT',orphans.length===0,
     orphans.length?('undefined: '+orphans.join(', ')):'no orphans');

  /* And the two specific ones this milestone fixed. */
  ok('.hot is keyed to any pill, not just the noise one',
     /\.pill\.hot/.test(css),
     'so DANA · OUTSIDE finally renders as urgent');
  ok('the fence window row uses a class that exists',
     !/class="rp-row/.test(document.body.innerHTML),'rp-row is gone');
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

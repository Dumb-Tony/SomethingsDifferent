/* M18 — THE FENCE, AND A NIGHT WITH THINGS IN IT.
   The playtest note was "it's still a pretty bare and unplayable game". The second
   word turned out to be literal: MEASURED with the till open, a whole ten-night
   slice affords 15 swaps and reaches collapse 32.0 against a bar of 40. The game
   could not be won. Every balance measurement ever taken here opens with
   bank=1000000 (_balance.js:20, _escalate.js:21), so nobody had ever asked.

   This suite defends the fix and, above all, defends the QUESTION — the economy
   gate in section 6 is the thing that must never drift unmeasured again. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}
function n0(x){return Math.round(x);}

try{
var SD=window.__SD,C=SD.CONST;
SD.stopLoop();SD.startHouse();SD.S.menuOpen=false;

/* The opening balance, stated once. startHouse() rebuilds the world but does NOT
   reset the wallet, so a measurement that forgets this reads the leftovers of the
   run before it — which would make two strategies look identical when they are not. */
function freshWallet(){
  SD.GAME.bank=140;SD.GAME.cash=0;
  SD.GAME.week=1;SD.GAME.weekday=0;SD.GAME.bought={};
}

/* ── 1. YOU KEEP WHAT YOU TOOK ──────────────────────────────────────────────
   swapWith() used to overwrite the original and let it cease to exist, while the
   line it printed said "the mark goes in your pocket with the old one". */
(function(){
  SD.startHouse();SD.GAME.hk=99;SD.GAME.bank=100000;
  var o=SD.objects[0];
  SD.scanObject(o);
  var before=JSON.stringify(o.spec);
  var stock=SD.shopStock(o.id,'bulwark');
  ok('there is something to buy',stock.length>0);
  SD.buyVariant(o.id,0,'bulwark');
  var mine=SD.invFor(o.id);
  var n=SD.HAUL.length;
  SD.swapWith(o,mine.length-1);
  ok('THE ORIGINAL GOES IN THE BAG',SD.HAUL.length===n+1,SD.HAUL.length+' in the haul');
  var it=SD.HAUL[SD.HAUL.length-1];
  ok('...as the OLD spec, not the copy that replaced it',
     JSON.stringify(it.spec)===before);
  ok('...and it remembers whose it was',it.owner===o.owner&&it.label===o.label,
     it.label+' / '+it.owner);
  ok('...and what it is worth',it.value>0&&it.value===SD.itemValue(it.kind,it.spec),
     '$'+it.value);
})();

/* ── 2. VALUE IS STABLE, AND SO IS THE OFFER ────────────────────────────────*/
(function(){
  var it=SD.HAUL[0];
  var a=SD.itemValue(it.kind,it.spec),b=SD.itemValue(it.kind,it.spec);
  ok('an item is worth the same every time you look at it',a===b,'$'+a);
  ok('THE SUPERMARKET DOES NOT BUY YOUR MUG',SD.offerFor(it,'bulwark')===0);
  var th=SD.offerFor(it,'thrift'),an=SD.offerFor(it,'antique');
  ok('both specialists do',th>0&&an>0,'thrift $'+th+'  antique $'+an);
  ok('...and the one ON THIS STREET pays more',an>th,
     'antique '+Math.round(C.FENCE_ANTIQUE*100)+'% vs thrift '+
     Math.round(C.FENCE_THRIFT*100)+'%');
  ok('nobody pays you more than the thing is worth',an<=a,'$'+an+' of $'+a);
})();

/* ── 3. THE GOOD MONEY AND THE REAL RISK ARE THE SAME ITEM ──────────────────*/
(function(){
  var hi={kind:'pictureFrame',spec:{},owner:'june',label:'family photo',attach:1.9};
  var lo={kind:'doormat',spec:{},owner:'june',label:'the doormat',attach:0.7};
  ok('a thing they are attached to would be RECOGNISED',SD.isRecognisable(hi));
  ok('...and a doormat would not',!SD.isRecognisable(lo));
  ok('the line is attachment, and it is knowable before you sell',
     C.FENCE_REC_ATTACH>0.7&&C.FENCE_REC_ATTACH<1.9,'attach >= '+C.FENCE_REC_ATTACH);
})();

/* ── 4. SELLING PAYS, AND SELLING LOCALLY CAN COME BACK ─────────────────────*/
(function(){
  SD.startHouse();SD.GAME.hk=99;SD.GAME.bank=100000;SD.GAME.cash=0;
  SD.WINDOW.length=0;
  function take(pred){
    var o=SD.objects.filter(pred)[0];
    if(!o)return null;
    SD.scanObject(o);SD.buyVariant(o.id,0,'bulwark');
    var m=SD.invFor(o.id);
    if(!m.length)return null;
    SD.swapWith(o,m.length-1);
    return SD.HAUL[SD.HAUL.length-1];
  }
  var lowItem=take(function(o){return o.attach<C.FENCE_REC_ATTACH;});
  ok('took something anonymous',!!lowItem,lowItem?lowItem.label:'none');
  var cash0=SD.GAME.cash,want=SD.offerFor(lowItem,'antique');
  var r=SD.sellItem(SD.HAUL.indexOf(lowItem),'antique');
  ok('SELLING PAYS, IN CASH',/^sold/.test(r)&&SD.GAME.cash===cash0+want,
     'cash +$'+(SD.GAME.cash-cash0));
  ok('...and it leaves the bag',SD.HAUL.indexOf(lowItem)<0);
  ok('an anonymous thing sold locally is not noticed',SD.WINDOW.length===0);

  var hiItem=take(function(o){return o.attach>=C.FENCE_REC_ATTACH;});
  ok('took something they would know',!!hiItem,hiItem?hiItem.label:'none');
  SD.sellItem(SD.HAUL.indexOf(hiItem),'antique');
  ok('SOMETHING THEY WOULD KNOW GOES IN THE WINDOW',SD.WINDOW.length===1,
     hiItem?hiItem.label:'');

  SD.WINDOW.length=0;
  var hi2=take(function(o){return o.attach>=C.FENCE_REC_ATTACH&&
                                  o.owner!==(hiItem&&hiItem.owner);});
  if(hi2)SD.sellItem(SD.HAUL.indexOf(hi2),'thrift');
  ok('...but two towns over it is not',SD.WINDOW.length===0,
     'Second Chances is not on Ardsley Court');
})();

/* ── 5. THE WINDOW LANDS IN THE MORNING, AND REPORTS WHAT LANDED ────────────*/
(function(){
  SD.startHouse();SD.GAME.hk=99;SD.GAME.bank=100000;
  SD.WINDOW.length=0;
  var R=SD.RESIDENTS;
  Object.keys(R).forEach(function(id){R[id].suspicion=0;R[id].collapsed=false;});
  var o=SD.objects.filter(function(x){return x.attach>=C.FENCE_REC_ATTACH;})[0];
  SD.scanObject(o);SD.buyVariant(o.id,0,'bulwark');
  var m=SD.invFor(o.id);SD.swapWith(o,m.length-1);
  SD.sellItem(SD.HAUL.length-1,'antique');
  var before=R[o.owner].suspicion;
  var said=SD.windowTick([]);
  ok('THEY WALK PAST AND SEE IT',said.length===1&&said[0].name===R[o.owner].name,
     said.length?said[0].name+' saw '+said[0].label:'nobody');
  ok('...and it costs them Suspicion',R[o.owner].suspicion>before,
     '+'+(R[o.owner].suspicion-before).toFixed(1));
  ok('...and the figure reported is what LANDED, not what was charged',
     Math.abs(said[0].amt-(R[o.owner].suspicion-before))<1e-9);
  R[o.owner].suspicion=99;
  SD.WINDOW.push({owner:o.owner,label:'x',store:'antique',paid:1});
  var s2=SD.windowTick([]);
  ok('...even when they are already pinned at the ceiling',
     s2.length===1&&s2[0].amt<=1.0001,
     '+'+s2[0].amt.toFixed(2)+' rather than the full +'+C.FENCE_REC_SUSP);
  ok('the window empties once it has been paid for',SD.WINDOW.length===0);
})();

/* ── 6. THE GATE. CAN A COMPETENT PLAYER AFFORD TO WIN? ─────────────────────
   THE ASSERTION THIS WHOLE MILESTONE EXISTS FOR. */
(function(){
  function slice(fence){
    SD.startHouse();
    freshWallet();
    SD.GAME.hk=99;                          // legibility, never money
    var swaps=0,broke=0;
    for(var n=0;n<C.SLICE_NIGHTS&&!SD.GAME.over;n++){
      var byOwner={};
      SD.objects.forEach(function(o){(byOwner[o.owner]=byOwner[o.owner]||[]).push(o);});
      var owners=Object.keys(byOwner),order=[],oi=0;
      while(order.length<SD.objects.length){
        var any=false;
        for(var w=0;w<owners.length;w++){
          var l=byOwner[owners[w]];
          if(oi<l.length){order.push(l[oi]);any=true;}
        }
        if(!any)break;
        oi++;
      }
      for(var i=0;i<order.length;i++){
        var o=order[i];
        SD.scanObject(o);
        var pick=null,bestD=-1;
        SD.STORES.forEach(function(st){
          if(!SD.storeHas(o.id,st.id))return;
          SD.shopStock(o.id,st.id).forEach(function(it,idx){
            var p=SD.predict(o.id,it);
            if(p&&p.text==='DOUBT'&&p.delta>bestD){
              bestD=p.delta;pick={s:st.id,i:idx,price:it.price};}
          });
        });
        if(!pick)continue;
        if((SD.GAME.bank+SD.GAME.cash)<pick.price){broke++;continue;}
        if(SD.buyVariant(o.id,pick.i,pick.s)==='poor'){broke++;continue;}
        var mine=SD.invFor(o.id);
        if(!mine.length)continue;
        SD.swapWith(o,mine.length-1);swaps++;
        if(fence&&SD.HAUL.length){
          var hix=SD.HAUL.length-1;
          /* A careful fence: anonymous things go to the shop on this street for the
             good price, anything they would recognise takes the bad price two towns
             over. That is the decision the milestone adds. */
          SD.sellItem(hix,SD.isRecognisable(SD.HAUL[hix])?'thrift':'antique');
        }
      }
      SD.doMorning();SD.checkEnding();
      SD.GAME.weekday=(SD.GAME.weekday+1)%7;
      if(SD.GAME.weekday===0){SD.GAME.week++;SD.GAME.bought={};}
      if(SD.GAME.weekday===5)SD.GAME.bank+=C.WAGE-C.BILLS;
    }
    return {ci:SD.collapseIndex(),swaps:swaps,broke:broke,
            left:SD.GAME.bank+SD.GAME.cash};
  }
  var bar=C.SLICE_WIN_COLLAPSE;
  var without=slice(false),with_=slice(true);
  info('without fencing: collapse '+without.ci.toFixed(1)+'   swaps '+without.swaps+
       '   broke '+without.broke+'x');
  info('with fencing:    collapse '+with_.ci.toFixed(1)+'   swaps '+with_.swaps+
       '   broke '+with_.broke+'x   ends with $'+n0(with_.left));
  ok('A COMPETENT RUN IS WINNABLE ON REAL MONEY',with_.ci>=bar,
     'collapse '+with_.ci.toFixed(1)+' against a bar of '+bar);
  ok('...and it was NOT before the fence, which is why this gate exists',
     without.ci<bar,'without selling it reaches '+without.ci.toFixed(1)+
     ', short of '+bar);
  ok('SELLING FUNDS THE OPERATION, IT DOES NOT FUND A LIFESTYLE',with_.left<900,
     'ends the slice with $'+n0(with_.left));
  ok('...and you still have to stretch for it',with_.broke>0,
     'stood in a shop unable to afford it '+with_.broke+' times');
})();

/* ── 7. THE NIGHT HAS THINGS IN IT ──────────────────────────────────────────*/
(function(){
  SD.startHouse();SD.S.menuOpen=false;
  ok('a night is planned, not left to chance',
     SD.EVENTS.length>=C.EVENT_COUNT[0]&&SD.EVENTS.length<=C.EVENT_COUNT[1],
     SD.EVENTS.length+' events tonight');
  var t=SD.EVENTS.map(function(e){return e.at;});
  var sorted=t.slice().sort(function(a,b){return a-b;});
  var kinds=SD.EVENTS.map(function(e){return e.kind;});
  ok('NO EVENT REPEATS BACK TO BACK',
     kinds.every(function(k,i){return i===0||k!==kinds[i-1];}),kinds.join(' -> '));
  ok('...spread through the night rather than stacked',
     JSON.stringify(t)===JSON.stringify(sorted)&&
     t.every(function(v,i){return i===0||v-t[i-1]>=C.EVENT_GAP-1e-9;}),
     t.map(function(v){return v.toFixed(2);}).join(', '));
  ok('...and all of them inside the night you actually have',
     t.every(function(v){return v<(SD.NIGHT.budget||6.5);}),
     'budget '+(SD.NIGHT.budget||0).toFixed(2)+'h');
  var first=SD.EVENTS.map(function(e){return e.kind+'@'+e.at.toFixed(3);}).join(',');
  SD.planNightEvents();
  var again=SD.EVENTS.map(function(e){return e.kind+'@'+e.at.toFixed(3);}).join(',');
  ok('THE SAME NIGHT IS THE SAME NIGHT',first===again,first.slice(0,58)+'…');
})();

/* ── 8. AND THEY ARE WORLD CHANGES, NOT CUTSCENES ───────────────────────────*/
(function(){
  SD.startHouse();SD.S.menuOpen=false;
  SD.SLEEPERS.forEach(function(s){s.noise=0;});
  SD.fireEvent({kind:'phone',seed:11});
  ok('THE PHONE IS REAL NOISE, IN SOMEBODY ELSE\'S HOUSE',
     SD.SLEEPERS.some(function(x){return x.noise>0;}),'a sleeper heard it');

  /* Driven through the REAL scheduler: eventTick() only manages events that are in
     EVENTS, so a hand-fired one leaks its light forever. The first version of this
     block fired it directly and then asserted the cleanup that could never run. */
  SD.startHouse();SD.S.menuOpen=false;
  var nL=SD.LIGHTS.length;
  SD.EVENTS.length=0;
  var e={kind:'light',seed:5,at:0.05,done:false};
  SD.EVENTS.push(e);
  SD.NIGHT.t=0.10;SD.eventTick(1/30);
  ok('A LIGHT GOING ON IS A REAL LIGHT ZONE',SD.LIGHTS.length===nL+1&&!!e.zone,
     'litAt() reads it, so every seeing check does');
  var lit=SD.litAt(e.zone.x,e.zone.z);
  ok('...and you can be standing in it',lit>C.LIT_SEEN_MIN,lit.toFixed(2));
  SD.NIGHT.t=e.until+0.01;SD.eventTick(1/30);
  ok('...and then it goes off again',SD.LIGHTS.length===nL&&!e.zone,
     'the zone leaves LIGHTS, so you stop being visible in it');

  SD.startHouse();SD.S.menuOpen=false;
  var e2={kind:'water',seed:3};SD.fireEvent(e2);
  var w=SD.SLEEPERS.filter(function(x){return x.up;})[0];
  ok('SOMEBODY GETS UP',!!w,w?w.name+' is out of bed':'nobody');
  if(w){
    var x0=w.x,z0=w.z;
    for(var i=0;i<160;i++)SD.walkSleepers(1/30);
    ok('...and walks',Math.hypot(w.x-x0,w.z-z0)>0.8,
       'moved '+Math.hypot(w.x-x0,w.z-z0).toFixed(1)+'m from the bed');
    ok('...and can see, from where they now are',
       SD.canSee(w,w.x+Math.cos(w.look)*1.2,w.z+Math.sin(w.look)*1.2),
       'canSee reads their own x/z, so getting up makes them a roving threat');
    for(var j=0;j<4000&&w.up;j++)SD.walkSleepers(1/30);
    ok('...AND GOES BACK TO BED',!w.up&&w.state==='asleep',
       'back at '+w.x.toFixed(1)+', '+w.z.toFixed(1));
    ok('...lying down again, not standing over it',
       Math.abs(w.group.position.y-0.54)<0.01,w.group.position.y.toFixed(2));
  }
})();

/* ── 9. THE HAUL SURVIVES A SAVE ────────────────────────────────────────────*/
(function(){
  SD.startHouse();SD.GAME.hk=99;SD.GAME.bank=100000;
  var o=SD.objects[3];
  SD.scanObject(o);SD.buyVariant(o.id,0,'bulwark');
  var m=SD.invFor(o.id);SD.swapWith(o,m.length-1);
  var n=SD.HAUL.length,label=SD.HAUL[n-1].label;
  ok('there is something in the bag to save',n>0);
  ok('the game saves',SD.saveGame()===true);
  SD.HAUL.length=0;
  ok('the game loads',SD.loadGame()===true);
  ok('THE HAUL SURVIVES IT',SD.HAUL.length===n&&SD.HAUL[n-1].label===label,
     SD.HAUL.length+' back in the bag');
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


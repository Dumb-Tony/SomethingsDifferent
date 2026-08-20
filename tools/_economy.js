/* DIAGNOSTIC: CAN YOU AFFORD TO PLAY THE GAME?
   Every balance measurement this project has ever made set GAME.bank=1000000 first
   (_balance.js:20, _escalate.js:21), so "four a night wins on night 5" has only
   ever been proven for a player with infinite money. The real one starts with $140
   and nets $335 a week. This measures the run WITH THE TILL OPEN.

   Two strategies, because they cost wildly different amounts:
     GREEDY   — the biggest delta still inside the doubt band, any shop. What
                _balance.js plays, and what the win threshold was tuned against.
     THRIFTY  — the CHEAPEST rung the scanner forecasts as DOUBT. Doubt paid is
                K_DOUBT * delta, so this buys less collapse per swap, but a player
                who cannot pay has no strategy at all. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}
function n0(x){return Math.round(x);}

try{
  var SD=window.__SD,C=SD.CONST;
  SD.stopLoop();

  /* What a DOUBT rung actually costs, per store, across the whole street. */
  SD.startHouse();SD.GAME.hk=99;
  (function(){
    var per={},all=[];
    SD.STORES.forEach(function(st){per[st.id]=[];});
    SD.objects.forEach(function(o){
      SD.scanObject(o);
      SD.STORES.forEach(function(st){
        if(!SD.storeHas(o.id,st.id))return;
        SD.shopStock(o.id,st.id).forEach(function(it){
          var p=SD.predict(o.id,it);
          if(p&&p.text==='DOUBT'){per[st.id].push(it.price);all.push(it.price);}
        });
      });
    });
    function med(a){if(!a.length)return 0;a=a.slice().sort(function(x,y){return x-y;});
                    return a[Math.floor(a.length/2)];}
    function mn(a){return a.length?Math.min.apply(null,a):0;}
    info('=== WHAT A DOUBT RUNG COSTS ===');
    SD.STORES.forEach(function(st){
      info('  '+(st.short+'        ').slice(0,10)+per[st.id].length+' rungs   '+
           'cheapest $'+n0(mn(per[st.id]))+'   median $'+n0(med(per[st.id])));
    });
    info('  ALL       median $'+n0(med(all))+'   cheapest $'+n0(mn(all)));
    info('');
  })();

  /* One full slice, real money, real payday. */
  function run(mode){
    SD.startHouse();
    SD.GAME.hk=99;                       // legibility, not money
    var spent=0,swaps=0,broke=0,earned=0,earnedFence=0;
    var startMoney=SD.GAME.bank+SD.GAME.cash;
    for(var n=0;n<C.SLICE_NIGHTS&&!SD.GAME.over;n++){
      // round-robin by owner: Collapse is a MEAN, so spreading beats hammering
      var byOwner={};
      SD.objects.forEach(function(o){(byOwner[o.owner]=byOwner[o.owner]||[]).push(o);});
      var owners=Object.keys(byOwner),order=[],oi=0;
      while(order.length<SD.objects.length){
        var any=false;
        for(var w=0;w<owners.length;w++){
          var list=byOwner[owners[w]];
          if(oi<list.length){order.push(list[oi]);any=true;}
        }
        if(!any)break;
        oi++;
      }
      for(var i=0;i<order.length;i++){
        var o=order[i];
        SD.scanObject(o);
        var pick=null,bestD=-1,bestP=1e9;
        SD.STORES.forEach(function(st){
          if(!SD.storeHas(o.id,st.id))return;
          SD.shopStock(o.id,st.id).forEach(function(it,idx){
            var p=SD.predict(o.id,it);
            if(!p||p.text!=='DOUBT')return;
            if(mode==='greedy'){ if(p.delta>bestD){bestD=p.delta;pick={s:st.id,i:idx,price:it.price};} }
            else               { if(it.price<bestP){bestP=it.price;pick={s:st.id,i:idx,price:it.price};} }
          });
        });
        if(!pick)continue;
        if((SD.GAME.bank+SD.GAME.cash)<pick.price){broke++;continue;}
        var r=SD.buyVariant(o.id,pick.i,pick.s);
        if(r==='poor'){broke++;continue;}
        if(r==='already')continue;
        spent+=pick.price;
        var mine=SD.invFor(o.id);
        if(mine.length){
          SD.swapWith(o,mine.length-1);swaps++;
          /* M18: fence the original. WHICH shop is the decision - the local one pays
             more than twice as much and puts it in a window on this street. Model a
             careful player: sell anonymous things locally, take the bad price two
             towns over for anything they would recognise. */
          if(SD.HAUL.length){
            var hi=SD.HAUL.length-1,item=SD.HAUL[hi];
            var to=SD.isRecognisable(item)?'thrift':'antique';
            var got=SD.offerFor(item,to);
            SD.sellItem(hi,to);earnedFence+=got;
          }
        }
      }
      SD.doMorning();SD.checkEnding();
      // the real weekly ledger, from the real day loop (showDay/nextBlock)
      SD.GAME.weekday=(SD.GAME.weekday+1)%7;
      if(SD.GAME.weekday===0){SD.GAME.week++;SD.GAME.bought={};}
      if(SD.GAME.weekday===5){SD.GAME.bank+=C.WAGE-C.BILLS;earned+=C.WAGE-C.BILLS;}
    }
    return {mode:mode,ci:SD.collapseIndex(),swaps:swaps,spent:spent,broke:broke,
            left:SD.GAME.bank+SD.GAME.cash,start:startMoney,earned:earned,fence:earnedFence,
            over:SD.GAME.over?SD.GAME.over.kind:'none'};
  }

  var bar=C.SLICE_WIN_COLLAPSE;
  info('=== A WHOLE SLICE WITH THE TILL OPEN ($'+140+' to start, +$'+
       (C.WAGE-C.BILLS)+'/week) ===');
  var rows=[run('greedy'),run('thrifty')];
  rows.forEach(function(r){
    info('  '+(r.mode+'        ').slice(0,9)+
         'collapse '+r.ci.toFixed(1)+'/'+bar+
         '   swaps '+r.swaps+
         '   spent $'+n0(r.spent)+
         '   wages $'+n0(r.earned)+'   fenced $'+n0(r.fence)+
         '   could not afford '+r.broke+
         '   -> '+(r.ci>=bar?'WIN':'LOSE'));
  });
  info('');
  var best=Math.max(rows[0].ci,rows[1].ci);
  var cheapWins=rows[1].ci>=bar, greedyWins=rows[0].ci>=bar;
  ok('A RUN IS WINNABLE WITHOUT CHEATING THE BANK',best>=bar,
     'best reachable collapse on real money is '+best.toFixed(1)+' against a bar of '+bar);
  ok('...and the strategy the win bar was tuned against is affordable',greedyWins,
     'greedy reaches '+rows[0].ci.toFixed(1)+', wanting $'+n0(rows[0].spent)+
     ' and short '+rows[0].broke+' times');
  info(cheapWins?'buying cheap is a viable line'
                :'buying cheap alone does NOT win — the money is a real constraint');

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


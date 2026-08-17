/* DIAGNOSTIC: what do the street-wide meters ACTUALLY do over a ten-night run?
   GDD 5.8 keys hardening to Neighbourhood Suspicion at 25/40/55/70/85, but
   LOSE_STREET is 70 - so the top two tiers could never fire - and a careful player
   may generate almost no suspicion at all. Before designing an escalation ladder,
   find out which meter actually moves, and how far. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}

try{
  var SD=window.__SD,C=SD.CONST;
  SD.stopLoop();

  /* Play the street round-robin by owner (Collapse is a mean, so spreading is the
     strategy the game is balanced against - see GDD 15). `sloppy` deliberately picks
     the biggest delta regardless of band, i.e. a player who overshoots constantly. */
  function run(perNight,sloppy){
    SD.startHouse();
    SD.GAME.hk=99;SD.GAME.bank=1000000;
    var byOwner={};
    SD.objects.forEach(function(o){(byOwner[o.owner]=byOwner[o.owner]||[]).push(o);});
    var owners=Object.keys(byOwner),order=[],oi=0;
    while(order.length<SD.objects.length){
      var any=false;
      for(var w=0;w<owners.length;w++){var L=byOwner[owners[w]];
        if(oi<L.length){order.push(L[oi]);any=true;}}
      if(!any)break; oi++;
    }
    var rows=[];
    for(var n=0;n<C.SLICE_NIGHTS&&!SD.GAME.over;n++){
      SD.GAME.bought={};
      var did=0;
      for(var i=0;i<order.length&&did<perNight;i++){
        var o=order[i];
        SD.scanObject(o);
        var best=null,bd=-1;
        SD.STORES.forEach(function(st){
          SD.shopStock(o.id,st.id).forEach(function(it,idx){
            var p=SD.predict(o.id,it);
            if(!p)return;
            var want=sloppy?(p.text!=='MISSED'):(p.text==='DOUBT');
            if(want&&p.delta>bd){bd=p.delta;best={s:st.id,i:idx};}
          });
        });
        if(!best)continue;
        SD.buyVariant(o.id,best.i,best.s);
        var mine=SD.invFor(o.id);
        if(mine.length){SD.swapWith(o,mine.length-1);did++;}
      }
      SD.doMorning();SD.checkEnding();
      SD.GAME.weekday=(SD.GAME.weekday+1)%7;
      if(SD.GAME.weekday===0)SD.GAME.week++;
      var maxS=0,maxD=0;
      Object.keys(SD.RESIDENTS).forEach(function(id){
        var r=SD.RESIDENTS[id];
        if(!SD.objects.some(function(o){return o.owner===id;}))return;
        if((r.suspicion||0)>maxS)maxS=r.suspicion;
        if((r.doubt||0)>maxD)maxD=r.doubt;
      });
      rows.push({n:n+1,ci:SD.collapseIndex(),ss:SD.streetSuspicion(),
                 maxS:maxS,maxD:maxD,over:SD.GAME.over?SD.GAME.over.kind:''});
    }
    return rows;
  }

  function show(label,rows){
    info('');
    info('=== '+label+' ===');
    info('  night   collapse   streetSusp   worstSusp   worstDoubt');
    rows.forEach(function(r){
      info('   '+('  '+r.n).slice(-3)+'     '+('     '+r.ci.toFixed(1)).slice(-6)+
           '     '+('     '+r.ss.toFixed(1)).slice(-6)+
           '      '+('     '+r.maxS.toFixed(1)).slice(-6)+
           '      '+('     '+r.maxD.toFixed(1)).slice(-6)+
           (r.over?('   -> '+r.over):''));
    });
    return rows;
  }

  var careful=show('CAREFUL: 4 a night, only rungs the scanner calls DOUBT',run(4,false));
  var sloppy =show('SLOPPY: 4 a night, biggest delta regardless of band',run(4,true));

  var cMaxSS=Math.max.apply(null,careful.map(function(r){return r.ss;}));
  var sMaxSS=Math.max.apply(null,sloppy.map(function(r){return r.ss;}));
  var cMaxCI=Math.max.apply(null,careful.map(function(r){return r.ci;}));

  info('');
  info('LOSE_STREET (run ends) = '+C.LOSE_STREET);
  info('GDD 5.8 proposes hardening at 25 / 40 / 55 / 70 / 85 of Neighbourhood Suspicion');
  ok('a CAREFUL player barely raises street suspicion at all',cMaxSS<12,
     'peak '+cMaxSS.toFixed(1)+' over '+C.SLICE_NIGHTS+' nights');
  info('=> hardening keyed to SUSPICION would never fire for a good player: dead content.');
  ok('...while the doubt-side meter moves a long way',cMaxCI>25,
     'collapse peaks at '+cMaxCI.toFixed(1));
  info('=> a street that hardens as it DOUBTS punishes success, which is the loop we want.');
  info('sloppy play peaks at street suspicion '+sMaxSS.toFixed(1)+
       ' - so suspicion should still COUNT, just not be the only input.');

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

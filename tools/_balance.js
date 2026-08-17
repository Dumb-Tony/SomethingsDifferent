/* DIAGNOSTIC: where should SLICE_WIN_COLLAPSE sit now?
   The run went 7 nights -> 10 AND 18 objects -> 30. Both changes push the same way, so
   leaving the win threshold at 40 would quietly turn a target into a formality.
   Auto-plays the real systems at three effort levels and reports what each reaches. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}

try{
  var SD=window.__SD,C=SD.CONST;
  SD.stopLoop();

  /* Play `perNight` objects a night for the whole run, always choosing the best rung
     the scanner FORECASTS as DOUBT — i.e. exactly what a competent player does, using
     the same predict() the shelf shows them. */
  function run(perNight,label){
    SD.startHouse();
    SD.GAME.hk=99;SD.GAME.bank=1000000;
    var nights=0,worked=0;
    for(var n=0;n<C.SLICE_NIGHTS&&!SD.GAME.over;n++){
      nights++;
      SD.GAME.bought={};
      /* Work the street ROUND-ROBIN BY OWNER, not in array order. The Collapse Index
         is a MEAN over residents, so spreading is strictly better than hammering one
         house — and taking objects in array order means the first four all belong to
         the Hoyts, which pins four of the six residents at zero forever. Measuring
         that way reported a hard ceiling that was an artefact of the measurement. */
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
      var did=0;
      for(var i=0;i<order.length&&did<perNight;i++){
        var o=order[i];
        SD.scanObject(o);
        /* Take the BIGGEST delta still inside the doubt band, across all three shops —
           doubt paid is K_DOUBT * delta, so the first DOUBT rung found is not the play.
           Measuring against a weak strategy would set the difficulty against a player
           who does not exist. */
        var best=null,bestD=-1;
        SD.STORES.forEach(function(st){
          SD.shopStock(o.id,st.id).forEach(function(it,idx){
            var p=SD.predict(o.id,it);
            if(p&&p.text==='DOUBT'&&p.delta>bestD){bestD=p.delta;best={store:st.id,idx:idx};}
          });
        });
        if(!best)continue;
        SD.buyVariant(o.id,best.idx,best.store);
        var mine=SD.invFor(o.id);
        if(mine.length){SD.swapWith(o,mine.length-1);did++;worked++;}
      }
      SD.doMorning();SD.checkEnding();
      GAMEWEEK();
    }
    var ci=SD.collapseIndex();
    var frac=0,past75=0;
    Object.keys(SD.RESIDENTS).forEach(function(id){
      var r=SD.RESIDENTS[id];
      if(!SD.objects.some(function(o){return o.owner===id;}))return;
      frac+=Object.keys(r.fired||{}).length;
      if(r.doubt>=75)past75++;
    });
    return {label:label,per:perNight,ci:ci,nights:nights,worked:worked,
            over:SD.GAME.over?SD.GAME.over.kind:'none',
            ss:SD.streetSuspicion(),frac:frac,past75:past75};
  }
  function GAMEWEEK(){ SD.GAME.weekday=(SD.GAME.weekday+1)%7;
                       if(SD.GAME.weekday===0)SD.GAME.week++; }

  /* The cap and the header both read the ACTUAL object count. It was hard-coded to
     30 and M17 took the street to 80, so 'everything' was quietly capped at 30 and
     the header claimed a number that had not been true for two milestones. A
     diagnostic that misreports its own inputs is worse than no diagnostic. */
  SD.startHouse();                    // objects[] is empty until the street is built
  var nObj=SD.objects.length;
  var rows=[run(nObj,'everything'),run(4,'four a night'),run(2,'two a night'),run(1,'one a night')];
  info('=== '+C.SLICE_NIGHTS+' nights x '+nObj+' objects, playing only rungs the scanner calls DOUBT ===');
  rows.forEach(function(r){
    info('  '+(r.label+'              ').slice(0,15)+
         'collapse '+('    '+r.ci.toFixed(1)).slice(-6)+
         '   after '+r.nights+' nights'+
         '   swaps '+('  '+r.worked).slice(-3)+
         '   fractures '+('  '+r.frac).slice(-3)+
         '   past75 '+r.past75+
         '   street susp '+r.ss.toFixed(1)+
         '   -> '+r.over);
  });
  info('');
  info('current SLICE_WIN_COLLAPSE = '+C.SLICE_WIN_COLLAPSE);
  info('a threshold is only a target if the LAZY strategies fall short of it');

  ok('a maximal run still reaches the current threshold',
     rows[0].ci>=C.SLICE_WIN_COLLAPSE,rows[0].ci.toFixed(1));
  ok('THE LAZIEST STRATEGY SHOULD NOT WIN',
     rows[3].ci<C.SLICE_WIN_COLLAPSE,
     'one-a-night reaches '+rows[3].ci.toFixed(1)+' vs threshold '+C.SLICE_WIN_COLLAPSE);

  var eb=document.getElementById('err-banner');
  ok('no crash banner',!eb,eb?eb.textContent.slice(0,200):'');
}catch(e){
  fail++;out.push('FAIL  threw: '+(e&&e.message)+' @ '+
    String((e&&e.stack)||'').split('\n').slice(0,3).join(' | '));
}
var summary='SDTEST '+(fail===0?'ALL-PASS':'FAILURES')+' pass='+pass+' fail='+fail;
var pre=document.createElement('pre');pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\n'+summary+'\n'+out.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);document.title=summary;
})();

/* ─────────────────────────────────────────────────────────────────────────────
   Milestone 16 — Ray Pittman, and gossip.

   Ray has been a set of numbers in RESIDENTS since M2 with nowhere to live. He is the
   design's argument that a personality is a TUPLE and never a special case: nothing
   in the code knows he is the conspiracy theorist. His doubt band is THREE POINTS
   wide, which is what makes him nearly un-gaslightable, and his credibility is 0.1,
   which is what makes him survivable — and turns him into the cheap place to be
   sloppy. Both of those have to be true in play, not just in the table.

   Gossip is the other half: a CERTAINTY event travels one hop along RELATIONS and
   lands scaled by the SPEAKER'S credibility. The same mistake made in Marisol's house
   costs the street a great deal, and in Ray's costs almost nothing.
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
  var C=SD.CONST,R=SD.RESIDENTS;
  SD.stopLoop();
  SD.startHouse();

  /* ── 1. Ray has somewhere to live ──────────────────────────────────────────*/
  var pit=SD.houseById('pittman');
  ok('there is a fifth lot',!!pit,pit?pit.name:'missing');
  ok('...at the far end, next door to yours',
     Math.abs(pit.x-SD.HOME.x)<Math.abs(pit.x-SD.houseById('okonkwo').x),
     'Ray '+pit.x.toFixed(0)+', you '+SD.HOME.x.toFixed(0));
  ok('the lots still do not overlap',(function(){
     var xs=SD.HOUSES.map(function(h){return h.x;}).sort(function(a,b){return a-b;});
     for(var i=1;i<xs.length;i++)if(xs[i]-xs[i-1]<12)return false;
     return true;})(),
     SD.HOUSES.map(function(h){return h.x.toFixed(0);}).sort(function(a,b){return a-b;}).join(', '));
  var rayObjs=SD.objects.filter(function(o){return o.owner==='ray';});
  ok('Ray owns things now',rayObjs.length>=8,rayObjs.length+' objects');
  ok('...so he counts toward the street',
     SD.activeResidents().some(function(r){return r.name.indexOf('Ray')===0;}));
  ok('he sleeps alone',
     SD.SLEEPERS.filter(function(s){return s.house==='pittman';}).length===1);
  ok('his house has a locked door and planters like any other',
     SD.DOORS.some(function(d){return d.house==='pittman'&&d.locked;})&&
     SD.PLANTERS.filter(function(p){return p.house==='pittman';}).length===3);

  /* ── 2. HE IS NEARLY UN-GASLIGHTABLE, and that is pure arithmetic ──────────*/
  ok('his doubt band is the narrowest on the street',
     Object.keys(R).every(function(id){return R[id].doubtBand>=R.ray.doubtBand;}),
     'Ray '+R.ray.doubtBand+' vs next '+Math.min.apply(null,Object.keys(R)
       .filter(function(id){return id!=='ray';}).map(function(id){return R[id].doubtBand;})));
  ok('...and his notice floor the lowest',
     Object.keys(R).every(function(id){return R[id].noticeFloor>=R.ray.noticeFloor;}),
     'floor '+R.ray.noticeFloor);
  info('floor 2 with a 3-point band: he sees everything and is sure about all of it');
  ok('NOTHING IN THE CODE KNOWS HE IS THE CONSPIRACY THEORIST',
     !/conspiracy/i.test(SD.DOUBT.resolve.toString()+SD.DOUBT.perceived.toString()+
                         SD.DOUBT.bands.toString()),
     'the Doubt Curve has no special case for him');

  /* the practical consequence: his window is a sliver, and only the finest shop
     reaches most of it */
  SD.GAME.hk=99;SD.GAME.bank=1000000;
  var byStore={bulwark:0,thrift:0,antique:0},reachable=0,perObj=[];
  rayObjs.forEach(function(o){
    SD.scanObject(o);
    var probe={kind:o.kind,spec:o.spec,attach:o.attach,marked:o.marked,fresh:o.fresh};
    var hits={},any=false;
    SD.STORES.forEach(function(st){
      var n=0;
      for(var w=0;w<8;w++){
        SD.GAME.week=w;
        SD.shopStock(o.id,st.id).forEach(function(it){
          if(SD.DOUBT.resolve(R.ray,probe,it.spec).band==='DOUBT')n++;
        });
      }
      SD.GAME.week=0;
      hits[st.id]=n; if(n)byStore[st.id]++;
      if(n)any=true;
    });
    if(any)reachable++;
    perObj.push(o.label+' [attach '+o.attach+'] '+
      SD.STORES.map(function(st){return st.short.toLowerCase()+' '+hits[st.id];}).join(' '));
  });
  perObj.forEach(function(p){info('  '+p);});
  ok('RAY IS PLAYABLE AT ALL',reachable>0,
     reachable+' of '+rayObjs.length+' of his objects can be made to doubt');
  /* "Hardest" is not "some of him is impossible" — it turns out all ten of his things
     can be reached, given the right shop. It is how THIN the opportunity is: half his
     possessions cannot be touched from the supermarket at all, and his hit density
     across every (shop, week, rung) is the lowest on the street. Measure that. */
  var rayOnlyFine=rayObjs.filter(function(o,i){
    return perObj[i].indexOf('bulwark 0')>=0;}).length;
  /* M17 took Ray from 10 possessions to 20, and the new ones are deliberately LOW
     attachment: perceived delta scales by attachment and his ceiling is 3 points
     wide, so the cheap things are the only reachable ones. That moved his
     antique-only share from 5/10 to 7/20. "Half" was never the property worth
     defending — being the NARROWEST door on the street is — so assert the
     comparative fact, which cannot drift when the object count changes. */
  function antiqueOnlyFrac(resId){
    var objs=SD.objects.filter(function(o){return o.owner===resId;});
    if(!objs.length)return 0;
    var only=0;
    objs.forEach(function(o){
      var bulwark=0,other=0;
      for(var w=1;w<=6;w++){
        SD.GAME.week=w;
        SD.STORES.forEach(function(st){
          if(!SD.storeHas(o.id,st.id))return;
          SD.shopStock(o.id,st.id).forEach(function(it){
            var p=SD.predict(o.id,it);
            if(!p||p.text!=='DOUBT')return;
            if(st.id==='bulwark')bulwark++;else other++;
          });
        });
      }
      if(bulwark===0&&other>0)only++;
    });
    SD.GAME.week=1;
    return only/objs.length;
  }
  var rayFrac=antiqueOnlyFrac('ray');
  var worstOther=Math.max.apply(null,
    ['walt','june','marisol','aaron','dev','grace'].map(antiqueOnlyFrac));
  ok('...and NO DOOR INTO RAY IS AS WIDE AS ANYONE ELSE\'S',
     rayFrac>=worstOther&&rayFrac>=0.25,
     (rayFrac*100).toFixed(0)+'% of Ray is beyond the supermarket; the worst anyone '+
     'else manages is '+(worstOther*100).toFixed(0)+'%  ('+rayOnlyFine+' of '+
     rayObjs.length+' antique-only)');
  function density(resId){
    var objs=SD.objects.filter(function(o){return o.owner===resId;});
    var hits=0,tried=0;
    objs.forEach(function(o){
      SD.scanObject(o);
      var probe={kind:o.kind,spec:o.spec,attach:o.attach,marked:o.marked,fresh:o.fresh};
      SD.STORES.forEach(function(st){
        for(var w=0;w<8;w++){
          SD.GAME.week=w;
          SD.shopStock(o.id,st.id).forEach(function(it){
            tried++;
            if(SD.DOUBT.resolve(R[resId],probe,it.spec).band==='DOUBT')hits++;
          });
        }
      });
    });
    SD.GAME.week=0;
    return tried?hits/tried:0;
  }
  var dRay=density('ray'),dWalt=density('walt'),dJune=density('june');
  ok('HE IS THE HARDEST PERSON ON THE STREET',dRay<dWalt&&dRay<dJune,
     'usable rungs: Ray '+(dRay*100).toFixed(1)+'%, Walt '+(dWalt*100).toFixed(1)+
     '%, June '+(dJune*100).toFixed(1)+'%');
  ok('THE ANTIQUE SHOP IS FINALLY LOAD-BEARING',byStore.antique>0,
     'antique reaches '+byStore.antique+' of his objects, bulwark '+byStore.bulwark+
     ', thrift '+byStore.thrift);
  info('his window sits at the fine end of the spectrum, which is the one shop nobody');
  info('had a reason to drive to before he existed');

  /* ── 3. GOSSIP ─────────────────────────────────────────────────────────────*/
  ok('there is a relationship graph',!!SD.RELATIONS&&Object.keys(SD.RELATIONS).length>=6,
     Object.keys(SD.RELATIONS).length+' people talk to somebody');
  ok('everybody named in it is a real resident',
     Object.keys(SD.RELATIONS).every(function(id){
       return !!R[id]&&SD.RELATIONS[id].every(function(t){return !!R[t];})}),
     'no dangling edges');
  ok('nobody gossips to themselves',
     Object.keys(SD.RELATIONS).every(function(id){
       return SD.RELATIONS[id].indexOf(id)<0;}));

  function certaintyBy(owner,susp){
    return [{owner:owner,label:'thing',r:{band:'CERTAINTY',suspicion:susp}}];
  }
  function clearSusp(){Object.keys(R).forEach(function(id){R[id].suspicion=0;});}

  // a MISSED or DOUBT event is not news
  SD.startHouse();clearSusp();
  var quiet=SD.gossip([{owner:'marisol',label:'x',r:{band:'DOUBT',suspicion:20}},
                       {owner:'marisol',label:'x',r:{band:'MISSED',suspicion:0}}]);
  ok('doubting yourself is not something you tell people',quiet.length===0,
     'nobody spoke');
  info('only CERTAINTY travels - a person who cannot explain it has nothing to report');

  // credibility is the whole mechanic
  SD.startHouse();clearSusp();
  var loud=SD.gossip(certaintyBy('marisol',20));
  var spreadLoud=Object.keys(R).reduce(function(a,id){return a+(R[id].suspicion||0);},0);
  SD.startHouse();clearSusp();
  var quietMan=SD.gossip(certaintyBy('ray',20));
  var spreadRay=Object.keys(R).reduce(function(a,id){return a+(R[id].suspicion||0);},0);
  SD.startHouse();clearSusp();
  ok('a CERTAINTY event travels to the people you talk to',loud.length===1&&
     loud[0].heard.length>=2,loud.length?(loud[0].heard.length+' listeners'):'nobody');
  ok('THE SAME MISTAKE COSTS FAR LESS THROUGH RAY',spreadRay<spreadLoud*0.25,
     'Marisol spread '+spreadLoud.toFixed(1)+', Ray spread '+spreadRay.toFixed(1));
  info('credibility 0.9 vs 0.1 - being caught in HIS house is the cheap mistake, and');
  info('routing your loud work through him is a real strategy, not a joke');
  ok('...and the amount is exactly credibility x GOSSIP_K',(function(){
     SD.startHouse();clearSusp();
     var g=SD.gossip(certaintyBy('marisol',20))[0];
     return near(g.heard[0].amt,20*C.GOSSIP_K*R.marisol.credibility,1e-9);})(),
     'suspicion x '+C.GOSSIP_K+' x credibility');

  // one hop only
  SD.startHouse();clearSusp();
  SD.gossip(certaintyBy('marisol',60));
  var direct=(SD.RELATIONS.marisol||[]).slice();
  var second=Object.keys(R).filter(function(id){
    return direct.indexOf(id)<0&&id!=='marisol'&&(R[id].suspicion||0)>0;});
  ok('GOSSIP TRAVELS ONE HOP, NOT ACROSS THE WHOLE STREET',second.length===0,
     second.length?('leaked to '+second.join(', ')):'only the people she actually talks to');
  info('a cascade would turn one loud night into a street-wide loss');
  clearSusp();

  // a collapsed listener has stopped listening
  SD.startHouse();clearSusp();
  R.june.collapsed=true;
  var g2=SD.gossip(certaintyBy('marisol',30));
  ok('nobody bothers telling somebody who has already come apart',
     g2.length===0||g2[0].heard.every(function(h){return h.to.indexOf('June')<0;}),
     g2.length?g2[0].heard.map(function(h){return h.to;}).join(', '):'nobody');
  R.june.collapsed=false;clearSusp();

  /* ── 4. it reads, and it reads differently depending on who spoke ──────────*/
  var hi=SD.gossipLine({from:'Marisol Vance',cred:0.9,label:'clock',
                        heard:[{to:'June Hoyt',amt:5},{to:'Aaron Vance',amt:5}]});
  var lo=SD.gossipLine({from:'Ray Pittman',cred:0.1,label:'clock',
                        heard:[{to:'Walt Hoyt',amt:1}]});
  ok('a credible person is taken seriously',/seriously/i.test(hi),hi.slice(0,60)+'...');
  ok('RAY IS HUMOURED AND IGNORED',/changed the subject/i.test(lo),lo.slice(0,70)+'...');
  ok('both name who heard it',/June/.test(hi)&&/Walt/.test(lo));

  /* ── 5. it lands in the morning report ─────────────────────────────────────*/
  /* Driven for real: showReport calls doMorning, which RECOMPUTES lastGossip from the
     night's ledger — so setting it by hand first proves nothing, it just gets
     overwritten. Overshoot one of Marisol's things badly enough to be CERTAINTY and
     let the whole chain run. */
  SD.startHouse();clearSusp();
  SD.GAME.hk=99;SD.GAME.bank=1000000;
  var mObj=SD.objects.filter(function(o){return o.owner==='marisol';})[0];
  SD.scanObject(mObj);
  var shelf=SD.shopStock(mObj.id,'thrift'),worst=-1,wi=-1;
  shelf.forEach(function(it,i){
    var p=SD.predict(mObj.id,it);
    if(p&&p.text==='CERTAINTY'&&p.delta>worst){worst=p.delta;wi=i;}
  });
  if(wi<0){ shelf=SD.shopStock(mObj.id,'bulwark');
    shelf.forEach(function(it,i){
      var p=SD.predict(mObj.id,it);
      if(p&&p.text==='CERTAINTY'&&p.delta>worst){worst=p.delta;wi=i;}});
    if(wi>=0)SD.buyVariant(mObj.id,wi,'bulwark');
  } else SD.buyVariant(mObj.id,wi,'thrift');
  var bag=SD.invFor(mObj.id);
  ok('a swap bad enough to make her CERTAIN is buyable',wi>=0&&bag.length>0,
     wi>=0?('delta '+worst.toFixed(1)):'none found');
  if(bag.length)SD.swapWith(mObj,bag.length-1);
  SD.showReport('home','x');
  var body=document.getElementById('report-body').innerHTML;
  ok('THE MORNING TELLS YOU THEY TALKED',/rp-gos/.test(body),
     (SD.GAME.lastGossip||[]).length+' conversation(s) reported');
  ok('...and the talking actually moved somebody else\'s Suspicion',
     (SD.GAME.lastGossip||[]).length>0&&
     (SD.GAME.lastGossip[0].heard||[]).some(function(h){return h.amt>0;}),
     (SD.GAME.lastGossip||[]).length?SD.gossipLine(SD.GAME.lastGossip[0]).slice(0,72)+'...':'silence');
  /* THE REPORT MUST NOT INFLATE ITSELF. Suspicion clamps at 100, so the figure quoted
     has to be what LANDED. The first version summed what was said and cheerfully
     claimed "+408.4 across the street" while its three listeners sat pinned at 100. */
  (function(){
    Object.keys(R).forEach(function(id){R[id].suspicion=98;});
    var g=SD.gossip(certaintyBy('marisol',200));
    var claimed=g.length?g[0].heard.reduce(function(a,h){return a+h.amt;},0):0;
    var real=(SD.RELATIONS.marisol||[]).reduce(function(a,id){
      return a+(R[id]?Math.max(0,R[id].suspicion-98):0);},0);
    ok('THE GOSSIP FIGURE IS WHAT LANDED, NOT WHAT WAS SAID',
       near(claimed,real,1e-9)&&claimed<10,
       'claimed +'+claimed.toFixed(1)+', actually applied +'+real.toFixed(1)+
       ' (everyone was already at 98)');
    clearSusp();
  })();
  clearSusp();

  /* ── 6. Ray fractures, and his ladder is his own ───────────────────────────*/
  ok('Ray has a fracture list like everybody else',!!SD.FRACTURES.ray&&
     SD.FRACTURES.ray.length===4,
     SD.FRACTURES.ray?SD.FRACTURES.ray.map(function(f){return f.at;}).join('/'):'none');
  SD.startHouse();
  R.ray.doubt=80;
  var fired=SD.fireFractures().filter(function(f){return /Ray/.test(f.text);});
  ok('...and it fires',fired.length>=1,fired.length+' of his thresholds crossed');
  ok('HIS 75 MAKES HIM QUIETER, NOT LOUDER',R.ray.credibility<0.1,
     'credibility 0.10 -> '+R.ray.credibility);
  info('everybody else fractures outward; being right is what breaks Ray');
  SD.startHouse();
  ok('a new run gives him his voice back',near(R.ray.credibility,0.10,1e-9),
     'credibility '+R.ray.credibility);

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

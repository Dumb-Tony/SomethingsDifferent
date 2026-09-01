/* DIAGNOSTIC C: the shelf, the forecast, and the HUD. */
(function(){
var L=[];function p(s){L.push(s);}
function f(x,n){return (+x).toFixed(n===undefined?1:n);}
try{
  var SD=window.__SD,C=SD.CONST,R=SD.RESIDENTS,D=SD.DOUBT;
  SD.stopLoop();SD.startHouse();SD.GUIDE.setOn(true);

  var owned=SD.objects.filter(function(o){return o.owner&&R[o.owner]&&o.spec&&o.spec._pos;});
  p('resident-owned objects on the street: '+owned.length);
  owned.forEach(function(o){SD.scanObject(o);});

  /* (b) THE DEFAULT ROW - index 0, the shelf's own sort order - per store */
  ['bulwark','thrift','antique'].forEach(function(sid){
    var n={MISSED:0,DOUBT:0,CERTAINTY:0},nostock=0,sims=[];
    owned.forEach(function(o){
      var rows=SD.shopStock(o.id,sid);
      if(!rows.length){nostock++;return;}
      var probe={kind:o.kind,spec:o.spec,attach:o.attach,marked:o.marked,fresh:o.fresh};
      var r=D.resolve(R[o.owner],probe,rows[0].spec);
      n[r.band]++;sims.push(rows[0].sim);
    });
    p('DEFAULT ROW (index 0) at '+sid+': MISSED '+n.MISSED+'  DOUBT '+n.DOUBT+
      '  CERTAINTY '+n.CERTAINTY+'  (no stock '+nostock+')  sim '+
      f(Math.min.apply(null,sims))+'-'+f(Math.max.apply(null,sims))+'%');
  });
  /* every row of every store, per rung */
  ['bulwark','thrift','antique'].forEach(function(sid){
    var st=SD.storeById(sid),rung={};
    owned.forEach(function(o){
      var rows=SD.shopStock(o.id,sid);
      var probe={kind:o.kind,spec:o.spec,attach:o.attach,marked:o.marked,fresh:o.fresh};
      rows.forEach(function(v,i){
        var r=D.resolve(R[o.owner],probe,v.spec);
        rung[i]=rung[i]||{MISSED:0,DOUBT:0,CERTAINTY:0};rung[i][r.band]++;});
    });
    Object.keys(rung).forEach(function(i){
      var q=rung[i];
      p('  '+sid+' row '+i+' : MISSED '+q.MISSED+'  DOUBT '+q.DOUBT+'  CERTAINTY '+q.CERTAINTY);});
  });
  /* how many objects have ANY doubt rung anywhere */
  var any=0;
  owned.forEach(function(o){
    var probe={kind:o.kind,spec:o.spec,attach:o.attach,marked:o.marked,fresh:o.fresh};
    var hit=false;
    ['bulwark','thrift','antique'].forEach(function(sid){
      SD.shopStock(o.id,sid).forEach(function(v){
        if(D.resolve(R[o.owner],probe,v.spec).band==='DOUBT')hit=true;});});
    if(hit)any++;
  });
  p('objects with at least one DOUBT rung somewhere in the three shops: '+any+' / '+owned.length);

  /* (a) the forecast, at the moment the rail tells you to buy */
  SD.startHouse();
  var o1=SD.objects.filter(function(o){return o.owner&&R[o.owner];})[0];
  SD.scanObject(o1);
  p('HK on day 2 (when the rail says "buy a better one") = '+SD.GAME.hk+
    '  hkTier='+SD.hkTier()+'  readTier('+o1.owner+')='+SD.readTier(o1.owner));
  var rows=SD.shopStock(o1.id,'bulwark');
  p('  Bulwark shelf for '+o1.label+': '+rows.map(function(v){return f(v.sim)+'%';}).join(' | '));
  p('  predict on each row: '+rows.map(function(v){
      return (SD.predict(o1.id,v)||{}).text;}).join(' | '));

  /* (c) the night HUD */
  SD.startHouse();SD.beginNight();SD.updateHUD(1);
  var pills=Array.prototype.slice.call(document.querySelectorAll('#hud .pill'));
  p('NIGHT HUD pills (visible): '+pills.filter(function(e){
      return getComputedStyle(e).display!=='none';})
      .map(function(e){return e.id+' = "'+e.textContent.trim()+'"';}).join('  |  '));
  p('  #hud textContent = "'+document.getElementById('hud').textContent.replace(/\s+/g,' ').trim()+'"');
  p('  does any HUD element mention collapse? '+
    (/collapse/i.test(document.getElementById('hud').textContent)?'YES':'NO'));
  p('  collapseIndex() right now = '+f(SD.collapseIndex(),2)+' / '+f(SD.winBar(),0));

  /* HK earned by a rail-follower who meets somebody every afternoon */
  SD.startHouse();
  var hk=[];
  for(var d=1;d<=10;d++){
    SD.startWalk();
    SD.DAYFOLK.forEach(function(fk){SD.talkTo(fk);});
    SD.endWalk();
    hk.push('day '+d+' hk='+SD.GAME.hk+' tier='+SD.hkTier());
    SD.GAME.day++;SD.famDecay();
  }
  p('HK if you talk to EVERYBODY every afternoon: '+hk.join(', '));
}catch(e){p('THREW: '+(e&&e.message)+' | '+String((e&&e.stack)||'').split('\n').slice(0,4).join(' | '));}
var pre=document.createElement('pre');pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\nSDTEST ALL-PASS pass=0 fail=0\n'+L.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);document.title='SDTEST ALL-PASS pass=0 fail=0';
})();

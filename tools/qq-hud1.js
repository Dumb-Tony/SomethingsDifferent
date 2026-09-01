(function(){
var L=[];function p(s){L.push(String(s));}
function f(x){return (Math.round(x*100)/100).toFixed(2);}
try{
  var SD=window.__SD,C=SD.CONST,R=SD.RESIDENTS,D=SD.DOUBT;
  SD.stopLoop();
  SD.startHouse();SD.beginNight();
  p('GAME.day='+SD.GAME.day+'  GAME.hk='+SD.GAME.hk+'  hkTier='+SD.hkTier());
  p('residents read levels: '+Object.keys(R).map(function(id){return id+'='+(R[id].read||0);}).join(' '));
  p('activeResidents: '+SD.activeResidents().map(function(r){return r.name+'(cred '+r.credibility+')';}).join(', '));
  p('collapseIndex at night start = '+f(SD.collapseIndex()));
  p('');

  /* ── the FORECAST, computed exactly the way doMorning resolves ── */
  function forecastLines(){
    var saved={},out=[];
    Object.keys(R).forEach(function(id){var r=R[id];saved[id]={d:r.doubt,s:r.stress,su:r.suspicion};});
    for(var i=0;i<SD.PENDING.length;i++){
      var pe=SD.PENDING[i],o=SD.objectById(pe.objId);
      if(!o)continue;
      var res=R[o.owner];if(!res)continue;
      var probe={kind:o.kind,spec:pe.before,attach:o.attach,marked:o.marked,fresh:o.fresh};
      var r=D.resolve(res,probe,o.spec);
      /* stress feeds the NEXT resolve via perceived()'s alert term, so mirror
         commit's writes onto the clone without touching the object */
      res.doubt=Math.min(100,Math.max(0,(res.doubt||0)+r.doubt));
      res.stress=Math.min(100,Math.max(0,(res.stress||0)+r.stress));
      res.suspicion=Math.min(100,Math.max(0,(res.suspicion||0)+r.suspicion));
      out.push({owner:o.owner,band:r.band,doubt:r.doubt,delta:r.delta,label:o.label});
    }
    var ci=SD.collapseIndex();
    Object.keys(R).forEach(function(id){var r=R[id],s=saved[id];r.doubt=s.d;r.stress=s.s;r.suspicion=s.su;});
    return {ci:ci,lines:out};
  }

  /* pick one object in each of four different houses */
  var picks=[],seen={};
  for(var i=0;i<SD.objects.length&&picks.length<5;i++){
    var o=SD.objects[i];
    if(!o.owner||o.owner==='steve')continue;
    if(seen[o.owner])continue;
    seen[o.owner]=1;picks.push(o);
  }
  p('picked '+picks.length+' objects: '+picks.map(function(o){return o.owner+'/'+o.label;}).join(', '));
  p('');
  p('  after swap    collapseIndex()   FORECAST(collapse if dawn broke now)   band');
  picks.forEach(function(o,n){
    SD.scanObject(o);
    var it=SD.fabricate(o);
    if(!it){p('  '+o.label+': fabricate returned null');return;}
    SD.swapWith(o,SD.invFor(o.id).length-1);
    var fc=forecastLines();
    var last=fc.lines[fc.lines.length-1];
    p('  '+(n+1)+'. '+(o.owner+'/'+o.label+'                    ').slice(0,26)+
      '  ci='+f(SD.collapseIndex())+'   fc='+f(fc.ci)+'   '+(last?last.band+' d+'+f(last.doubt)+' D='+f(last.delta):'-'));
  });
  p('');
  p('PENDING length before dawn = '+SD.PENDING.length);
  var fcFinal=forecastLines();
  p('FORECAST says collapse would be '+f(fcFinal.ci));
  p('bands forecast: '+fcFinal.lines.map(function(l){return l.owner+':'+l.band;}).join(' '));
  var lines=SD.doMorning();
  p('doMorning resolved '+lines.length+' lines: '+lines.map(function(l){return l.owner+':'+l.r.band;}).join(' '));
  p('ACTUAL collapse after dawn = '+f(SD.collapseIndex()));
  p('forecast error = '+f(SD.collapseIndex()-fcFinal.ci));
}catch(e){p('THREW: '+(e&&e.message)+'\n'+(e&&e.stack));}
var pre=document.createElement('pre');pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\nSDTEST ALL-PASS pass=0 fail=0\n'+L.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);document.title='SDTEST ALL-PASS pass=0 fail=0';
})();

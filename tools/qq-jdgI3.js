/* The case qq-hud5 never tested: TWO objects in ONE house. That is the only case in
   which the clone, the clamp and the ledger ORDER can matter. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}
try{
var SD=window.__SD,C=SD.CONST,R=SD.RESIDENTS,D=SD.DOUBT,O=SD.objects;
SD.stopLoop();
var clamp=function(v,lo,hi){return v<lo?lo:(v>hi?hi:v);};
function nightForecast(){
  var clone={},knew={},n=0,anyD=false,anyC=false,knows=0;
  for(var i=0;i<SD.PENDING.length;i++){
    var p=SD.PENDING[i],o=SD.objectById(p.objId);if(!o)continue;
    var src=R[o.owner];if(!src)continue;
    var c=clone[o.owner]||(clone[o.owner]=Object.assign({},src));
    var r=D.resolve(c,{kind:o.kind,spec:p.before,attach:o.attach,marked:o.marked,fresh:o.fresh},o.spec);
    c.doubt=clamp((c.doubt||0)+r.doubt,0,100);c.stress=clamp((c.stress||0)+r.stress,0,100);
    n++;if(r.band==='DOUBT')anyD=true;
    else if(r.band==='CERTAINTY'){anyC=true;if(!knew[o.owner]){knew[o.owner]=1;knows++;}}
  }
  var num=0,den=0;
  Object.keys(R).forEach(function(id){
    if(!O.some(function(o){return o.owner===id;}))return;
    var rr=clone[id]||R[id];num+=(rr.doubt||0)*rr.credibility;den+=rr.credibility;});
  return {n:n,knows:knows,ci:den?num/den:0,band:anyC?'CERTAINTY':(anyD?'DOUBT':'MISSED')};
}
SD.startHouse();SD.beginNight();
var mine=O.filter(function(o){return o.owner==='walt';});
info('walt owns '+mine.length+' objects');
var did=0;
for(var i=0;i<mine.length&&did<3;i++){
  SD.scanObject(mine[i]);
  SD.rotateObject(mine[i],40);
  did++;
}
info('ledger lines: '+SD.PENDING.length+' , all on walt');
var f=nightForecast();
info('forecast: n='+f.n+' band='+f.band+' knows='+f.knows+' ci='+f.ci.toFixed(6));
SD.doMorning();
var real=SD.collapseIndex();
info('dawn:     ci='+real.toFixed(6)+'   walt.doubt='+R.walt.doubt.toFixed(4)+
     ' walt.stress='+R.walt.stress.toFixed(4));
ok('THREE ledger lines in ONE house: forecast == dawn',Math.abs(f.ci-real)<1e-9,
   'err '+(real-f.ci).toExponential(2));

/* and the naive (pristine-resident) version the spec warns about, for contrast */
SD.startHouse();SD.beginNight();
var mine2=O.filter(function(o){return o.owner==='june';});
var did2=0;for(var i=0;i<mine2.length&&did2<3;i++){SD.scanObject(mine2[i]);SD.rotateObject(mine2[i],40);did2++;}
var naive=0,sum=0,den2=0;
for(var i=0;i<SD.PENDING.length;i++){
  var p=SD.PENDING[i],o=SD.objectById(p.objId);if(!o)continue;var s=R[o.owner];if(!s)continue;
  var r=D.resolve(s,{kind:o.kind,spec:p.before,attach:o.attach,marked:o.marked,fresh:o.fresh},o.spec);
  naive+=r.doubt;
}
var f2=nightForecast();
info('june, 3 lines: clone-accumulating forecast doubt-sum vs pristine-resident sum');
info('  pristine (WRONG) total doubt = '+naive.toFixed(4));
SD.doMorning();
info('  dawn actually wrote june.doubt = '+R.june.doubt.toFixed(4)+
     ' ; forecast ci '+f2.ci.toFixed(6)+' vs dawn ci '+SD.collapseIndex().toFixed(6));
ok('the clone/order/clamp reasoning is load-bearing, not decoration',
   Math.abs(naive-R.june.doubt)>1e-6,'pristine under-reports by '+(R.june.doubt-naive).toFixed(4));
ok('and the specified version is still exact here',Math.abs(f2.ci-SD.collapseIndex())<1e-9);
}catch(e){fail++;out.push('FAIL  THREW: '+(e&&e.message));out.push(String(e&&e.stack));}
var hdr=(fail===0?'SDTEST ALL-PASS':'SDTEST FAILURES')+' pass='+pass+' fail='+fail;
var pre2=document.createElement('pre');pre2.id='test-out';
pre2.textContent='==SDTEST-BEGIN==\n'+hdr+'\n'+out.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre2);document.title=hdr;
})();

/* DIAGNOSTIC: what similarity range can variantNear actually PRODUCE per kind?
   A wider shop ladder is only a fix if the generator can hit the rungs. Measures the
   achieved similarity for a set of targets, per kind, over several seeds. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}

try{
  var SD=window.__SD;
  SD.stopLoop();
  var SPEC=SD.SPEC,kinds=Object.keys(SD.PROP_KINDS);
  var targets=[99.2,98,96,90,80,66,52,40,30,20];

  info('achieved similarity for each requested target, median over 9 seeds:');
  info('kind'+Array(16).join(' ')+targets.map(function(t){
    return ('    '+t).slice(-6);}).join(''));

  var worstFloor=0,floors={};
  kinds.forEach(function(k){
    var row=[],base=SPEC.randomSpec(k,SD.mulberry32(12345));
    targets.forEach(function(t){
      var got=[];
      for(var s=0;s<9;s++){
        var rng=SD.mulberry32(1000+s*77);
        var v=SPEC.variantNear(k,base,rng,t,40);
        got.push(SPEC.specDelta(k,base,v).similarity);
      }
      got.sort(function(a,b){return a-b;});
      row.push(got[4]);
    });
    floors[k]=row[row.length-1];
    if(row[row.length-1]>worstFloor)worstFloor=row[row.length-1];
    info((k+Array(20).join(' ')).slice(0,20)+
         row.map(function(v){return ('     '+v.toFixed(1)).slice(-6);}).join(''));
  });

  info('');
  var t40=[],t99=[];
  kinds.forEach(function(k){
    var base=SPEC.randomSpec(k,SD.mulberry32(999));
    var rng1=SD.mulberry32(4242),rng2=SD.mulberry32(8484);
    t40.push(SPEC.specDelta(k,base,SPEC.variantNear(k,base,rng1,40,40)).similarity);
    t99.push(SPEC.specDelta(k,base,SPEC.variantNear(k,base,rng2,99,40)).similarity);
  });
  var worst40=Math.max.apply(null,t40), best99=Math.min.apply(null,t99);
  ok('a THRIFT rung near 40% is reachable for every kind',worst40<=55,
     'worst kind lands at '+worst40.toFixed(1)+'% when asked for 40%');
  ok('an ANTIQUE rung near 99% is reachable for every kind',best99>=97,
     'worst kind lands at '+best99.toFixed(1)+'% when asked for 99%');
  info('kinds that cannot go low: '+kinds.filter(function(k,i){return t40[i]>55;}).join(',')||'none');

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

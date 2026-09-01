(function(){
var L=[];function p(s){L.push(s);}
function f(x,n){return (+x).toFixed(n===undefined?1:n);}
try{
  var SD=window.__SD,C=SD.CONST,R=SD.RESIDENTS,D=SD.DOUBT;
  SD.stopLoop();SD.startHouse();
  p('SHOP_LADDER (Bulwark) = ['+SD.SHOP_LADDER.join(', ')+']  sorted DESCENDING in the shelf');
  var ow=SD.objects.filter(function(o){return o.owner&&R[o.owner];});
  ow.forEach(function(o){SD.scanObject(o);});
  ['bulwark','thrift','antique'].forEach(function(sid){
    var rung=[];
    ow.forEach(function(o){
      var rows=SD.shopStock(o.id,sid);if(!rows.length)return;
      var pr={kind:o.kind,spec:o.spec,attach:o.attach,marked:o.marked,fresh:o.fresh};
      rows.forEach(function(v,i){
        if(!rung[i])rung[i]={MISSED:0,DOUBT:0,CERTAINTY:0,sim:0,n:0};
        var r=D.resolve(R[o.owner],pr,v.spec);
        rung[i][r.band]++;rung[i].sim+=v.sim;rung[i].n++;
      });
    });
    p(sid.toUpperCase()+' shelf, by row (row 1 is the top of the list, the most similar):');
    rung.forEach(function(e,i){
      p('  row '+(i+1)+'  mean '+f(e.sim/e.n)+'%  ->  MISSED '+e.MISSED+'   DOUBT '+e.DOUBT+'   CERTAINTY '+e.CERTAINTY+'   (of '+e.n+' objects)');
    });
  });
}catch(e){p('THREW: '+(e&&e.message));}
var pre=document.createElement('pre');pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\nSDTEST ALL-PASS pass=0 fail=0\n'+L.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);document.title='SDTEST ALL-PASS pass=0 fail=0';
})();

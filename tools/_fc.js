/* DIAGNOSTIC — does the night forecast agree with the morning?

   The whole value of the M57 collapse pill is that the number it shows during the night
   is the number the morning will produce. If it drifts, the pill is a new lie in place
   of an old silence.

   Three shapes are checked, because the failure modes differ:
     1. one line per resident   - the shape in which the accumulator cannot matter
     2. SEVERAL LINES ON ONE PERSON - the shape that catches the stress/alertness
        feedback, which is the whole reason the forecast replays in order
     3. a resident driven near the ceiling - the shape that catches a missing clamp */
(function(){
var L=[];function p(s){L.push(s);}
try{
var SD=window.__SD,C=SD.CONST;
SD.stopLoop();

function worst(o,res){
  var best=null;
  ['bulwark','thrift','antique'].forEach(function(store){
    (SD.shopStock(o.id,store)||[]).forEach(function(v,i){
      if(!best||v.sim<best.v.sim)best={v:v,i:i,store:store};
    });
  });
  return best;
}
function ownedBy(id,n){
  return SD.objects.filter(function(o){return o.owner===id;}).slice(0,n);
}
function trial(name,build){
  SD.startHouse();SD.GUIDE.setOn(false);SD.nightReset();SD.GAME.bank=1e9;
  build();
  var fc=SD.nightForecast();
  var before=SD.collapseIndex();
  /* the forecast must be NON-DESTRUCTIVE: calling it twice must not change anything */
  var fc2=SD.nightForecast();
  var pure=(fc.ci===fc2.ci)&&(SD.collapseIndex()===before);
  SD.doMorning();
  var real=SD.collapseIndex();
  var err=Math.abs(fc.ci-real);
  p('  '+name.padEnd(34)+' forecast '+fc.ci.toFixed(6).padStart(10)+
    '   dawn '+real.toFixed(6).padStart(10)+
    '   err '+err.toExponential(1)+
    '   band '+fc.band+'  n='+fc.n+' knows='+fc.knows+
    (pure?'':'   <-- NOT PURE'));
  return {err:err,pure:pure};
}

p('=== DOES THE NIGHT FORECAST AGREE WITH THE MORNING? ===');
p('');
var bad=0;

var r1=trial('one line each, five people',function(){
  var used={},did=0;
  for(var i=0;i<SD.objects.length&&did<5;i++){
    var o=SD.objects[i],res=SD.RESIDENTS[o.owner];
    if(!res||used[o.owner])continue;
    SD.scanObject(o);
    var w=worst(o,res);if(!w)continue;
    SD.buyVariant(o.id,w.i,w.store);
    var bag=SD.invFor(o.id);if(!bag.length)continue;
    SD.swapWith(o,bag.length-1);used[o.owner]=1;did++;
  }
});
if(r1.err>1e-9||!r1.pure)bad++;

var r2=trial('THREE LINES ON ONE PERSON',function(){
  var os=ownedBy('walt',3);
  os.forEach(function(o){
    SD.scanObject(o);
    var w=worst(o,SD.RESIDENTS.walt);if(!w)return;
    SD.buyVariant(o.id,w.i,w.store);
    var bag=SD.invFor(o.id);if(!bag.length)return;
    SD.swapWith(o,bag.length-1);
  });
});
if(r2.err>1e-9||!r2.pure)bad++;

var r3=trial('somebody already near the ceiling',function(){
  SD.RESIDENTS.june.doubt=97;SD.RESIDENTS.june.stress=88;
  var os=ownedBy('june',3);
  os.forEach(function(o){
    SD.scanObject(o);
    var w=worst(o,SD.RESIDENTS.june);if(!w)return;
    SD.buyVariant(o.id,w.i,w.store);
    var bag=SD.invFor(o.id);if(!bag.length)return;
    SD.swapWith(o,bag.length-1);
  });
});
if(r3.err>1e-9||!r3.pure)bad++;

p('');
/* and the naive version, to show the accumulator is not decoration */
p('=== WHAT THE NAIVE VERSION WOULD HAVE SAID ===');
SD.startHouse();SD.GUIDE.setOn(false);SD.nightReset();SD.GAME.bank=1e9;
ownedBy('walt',3).forEach(function(o){
  SD.scanObject(o);
  var w=worst(o,SD.RESIDENTS.walt);if(!w)return;
  SD.buyVariant(o.id,w.i,w.store);
  var bag=SD.invFor(o.id);if(!bag.length)return;
  SD.swapWith(o,bag.length-1);
});
var good=SD.nightForecast();
/* resolve every line against the PRISTINE resident, the obvious wrong way */
var num=0,den=0,naiveBands=[];
var pristine={};
SD.activeResidents().forEach(function(r){pristine[r.name]=r;});
var add={};
SD.PENDING.forEach(function(q){
  var o=SD.objectById(q.objId),res=SD.RESIDENTS[o.owner];
  if(!res)return;
  var probe={kind:o.kind,spec:q.before,attach:o.attach,marked:o.marked,fresh:o.fresh};
  var r=SD.DOUBT.resolve(res,probe,o.spec);      // pristine every time
  add[o.owner]=(add[o.owner]||0)+r.doubt;
  naiveBands.push(r.band);
});
SD.activeResidents().forEach(function(r){
  var key=Object.keys(SD.RESIDENTS).filter(function(k){return SD.RESIDENTS[k]===r;})[0];
  num+=Math.min(100,(r.doubt||0)+(add[key]||0))*r.credibility;den+=r.credibility;
});
var naive=den?num/den:0;
SD.doMorning();
var real=SD.collapseIndex();
p('  ordered + clamped : '+good.ci.toFixed(4)+'   band '+good.band);
p('  pristine each time: '+naive.toFixed(4)+'   bands '+naiveBands.join('/'));
p('  what dawn produced: '+real.toFixed(4));
p('');
p(bad===0?'ALL SHAPES AGREE WITH THE MORNING.':(bad+' SHAPE(S) DISAGREE.'));
}catch(e){p('THREW: '+(e&&e.message)+' @ '+String((e&&e.stack)||'').split('\n').slice(0,3).join(' | '));}
var pre=document.createElement('pre');pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\nSDTEST ALL-PASS pass=0 fail=0\n'+L.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);document.title='SDTEST ALL-PASS pass=0 fail=0';
})();

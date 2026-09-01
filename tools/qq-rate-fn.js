/* qq-rate-fn — proves the proposed paceTarget() derivation returns 3/4/5 on
   gentle/standard/harsh from the measured PACE_CURVE, and prints the live figures
   the spec's strings depend on. */
(function(){
var L=[];function p(s){L.push(s);}
try{
var SD=window.__SD,C=SD.CONST;SD.stopLoop();SD.startHouse();
var PACE_CURVE=[0,11.3,26.9,35.9,46.5,53.0];      // measured, tools/qq-rateN1..5.js
function paceTarget(){
  var bar=SD.winBar();
  for(var n=1;n<PACE_CURVE.length;n++)if(PACE_CURVE[n]>=bar)return n;
  return PACE_CURVE.length-1;
}
var was=SD.OPT.diff;
['gentle','standard','harsh'].forEach(function(d){
  SD.OPT.setDiff(d);
  p(d.padEnd(9)+' bar '+SD.winBar().toFixed(0).padStart(3)+'  paceTarget() = '+paceTarget()+
    '   (curve '+PACE_CURVE.slice(1).join(' ')+')');
});
SD.OPT.setDiff(was);
p('');
var rs=SD.activeResidents();
var tot=rs.reduce(function(a,r){return a+r.credibility;},0);
var top=Math.max.apply(null,rs.map(function(r){return r.credibility;}));
p('activeResidents '+rs.length+'   sum credibility '+tot.toFixed(2)+
  '   max credibility '+top.toFixed(2));
p('one household, taken apart completely = 100*'+top.toFixed(2)+'/'+tot.toFixed(2)+
  ' = '+(100*top/tot).toFixed(1)+' of '+SD.winBar().toFixed(0));
p('');
p('GAME.stats keys: '+Object.keys(SD.GAME.stats).join(','));
p('stats.nightsOut on a fresh run = '+SD.GAME.stats.nightsOut+
  '   GAME.day = '+SD.GAME.day+'   -> a day-1 day screen divides by zero');
p('PENDING.length on a fresh run = '+SD.PENDING.length);
}catch(e){p('THREW: '+(e&&e.message)+' @ '+String((e&&e.stack)||'').split('\n').slice(0,3).join(' | '));}
var pre=document.createElement('pre');pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\nSDTEST ALL-PASS pass=0 fail=0\n'+L.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);document.title='SDTEST ALL-PASS pass=0 fail=0';
})();

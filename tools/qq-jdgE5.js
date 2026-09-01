/* qq-jdgE5 - the denominator. paceRate() divides by GAME.stats.nightsOut, which is
   incremented ONLY in beginNight() (line 7137), and beginNight() is called ONLY from
   nextBlock() (7122). NIGHT ONE is entered by startHouse() -> nightReset() (9269),
   which does not touch it. So how far off is the rate on the real entry path? */
(function(){
var L=[];function p(s){L.push(s);}
try{
var SD=window.__SD,C=SD.CONST;SD.stopLoop();
function rate(res){var n=(SD.GAME.stats&&SD.GAME.stats.nightsOut)|0;return n?res/n:0;}
SD.startHouse();SD.GUIDE.setOn(false);SD.GAME.hk=99;SD.GAME.bank=100000;
p('after startHouse(): NIGHT.running '+SD.NIGHT.running+
  '   stats.nightsOut '+SD.GAME.stats.nightsOut+'   GAME.day '+SD.GAME.day);
var RESOLVED=0;
function night(cap){
  var did=0;
  for(var i=0;i<SD.objects.length&&did<cap;i++){
    var o=SD.objects[i];if(!o||!SD.RESIDENTS[o.owner])continue;
    if(SD.PENDING.some(function(q){return q.objId===o.id;}))continue;
    if(!SD.CATALOG[o.id])SD.scanObject(o);
    var stk=SD.shopStock(o.id,'bulwark')||[];if(stk.length<3)continue;
    SD.buyVariant(o.id,2,'bulwark');
    var bag=SD.invFor(o.id);if(!bag.length)continue;
    SD.swapWith(o,bag.length-1);did++;
  }
  return did;
}
var did=night(2);
var lines=SD.doMorning();RESOLVED+=lines.length;
p('NIGHT 1 (the one every run starts in): swapped '+did+', resolved '+lines.length);
p('  the report would say: "That was '+lines.length+' things in one night ... you are '+
  'averaging '+rate(RESOLVED).toFixed(1)+'"   [nightsOut='+SD.GAME.stats.nightsOut+']');
/* now go through a real day into night 2, the way the game does */
SD.startDay();
for(var b=0;b<12&&SD.NIGHT.running===false;b++)SD.nextBlock();
p('  after walking the day blocks: NIGHT.running '+SD.NIGHT.running+
  '   stats.nightsOut '+SD.GAME.stats.nightsOut);
did=night(2);lines=SD.doMorning();RESOLVED+=lines.length;
p('NIGHT 2: resolved '+lines.length+'   total resolved '+RESOLVED+
  '   nightsOut '+SD.GAME.stats.nightsOut+
  '   -> paceRate '+rate(RESOLVED).toFixed(1)+' for a player doing 2 a night');
p('  (two nights of two = 2.0 a night; the counter says '+rate(RESOLVED).toFixed(1)+')');
}catch(e){p('THREW: '+(e&&e.message)+' @ '+String((e&&e.stack)||'').split('\n').slice(0,4).join(' | '));}
var pre=document.createElement('pre');pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\nSDTEST ALL-PASS pass=0 fail=0\n'+L.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);document.title='SDTEST ALL-PASS pass=0 fail=0';
})();

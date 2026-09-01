/* qq-jdgE6 - finish the denominator question: drive the REAL day->night transition. */
(function(){
var L=[];function p(s){L.push(s);}
try{
var SD=window.__SD,C=SD.CONST;SD.stopLoop();
SD.startHouse();SD.GUIDE.setOn(false);SD.GAME.hk=99;SD.GAME.bank=100000;
p('startHouse -> nightsOut '+SD.GAME.stats.nightsOut+'  NIGHT.running '+SD.NIGHT.running);
SD.endNight('home','back before anyone stirs');
p('endNight   -> nightsOut '+SD.GAME.stats.nightsOut+'  NIGHT.running '+SD.NIGHT.running);
SD.startDay();
p('startDay   -> nightsOut '+SD.GAME.stats.nightsOut+'  block '+SD.DAY.block);
SD.DAY.block=SD.BLOCKS.length-1;
SD.nextBlock();
p('nextBlock past the last block -> nightsOut '+SD.GAME.stats.nightsOut+
  '  NIGHT.running '+SD.NIGHT.running+'   (beginNight fired)');
p('');
p('SO: night 1 is free. After N nights played, nightsOut = N-1.');
p('  a player doing exactly 4 a night reads 4/0=guarded 0.0 on morning 1,');
p('  8/1 = 8.0 on morning 2, 12/2 = 6.0 on morning 3, 40/9 = 4.4 on morning 10.');
}catch(e){p('THREW: '+(e&&e.message)+' @ '+String((e&&e.stack)||'').split('\n').slice(0,4).join(' | '));}
var pre=document.createElement('pre');pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\nSDTEST ALL-PASS pass=0 fail=0\n'+L.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);document.title='SDTEST ALL-PASS pass=0 fail=0';
})();

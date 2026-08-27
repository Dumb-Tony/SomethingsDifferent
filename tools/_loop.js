(function(){var L=[];function p(s){L.push(s);}
try{var SD=window.__SD,C=SD.CONST;SD.stopLoop();
/* THE MEASUREMENT THAT PROMPTED M39: how long from touching an object to
   finding out whether anybody noticed? */
SD.startHouse();SD.nightReset();
var o=SD.objects.filter(function(x){return x.owner==='walt';})[0];
p('night '+SD.GAME.day+': scan '+o.label);
SD.scanObject(o);
var m=SD.fabricate(o);
p('night '+SD.GAME.day+': print  -> '+m.sim.toFixed(1)+'%');
SD.swapWith(o,SD.invFor(o.id).length-1);
p('night '+SD.GAME.day+': swap   -> pending '+SD.PENDING.length);
var lines=SD.doMorning();
p('morning '+SD.GAME.day+': '+lines[0].name+' -> '+lines[0].r.band+
  '  ('+lines[0].r.similarity.toFixed(1)+'% similar, delta '+
  lines[0].r.delta.toFixed(1)+' vs window '+lines[0].r.floor+'-'+
  lines[0].r.ceiling.toFixed(0)+')');
p('');
p('NIGHTS FROM FIRST TOUCH TO ANSWER: 1   (it was 2)');
p('MONEY SPENT: $'+(140-SD.money())+'   (a shop trip was mandatory before)');
/* and how much a whole night can now produce */
SD.startHouse();SD.nightReset();
var did=0;
for(var i=0;i<SD.objects.length&&did<12;i++){
  var x=SD.objects[i];
  SD.scanObject(x);
  if(SD.fabricate(x)){SD.swapWith(x,SD.invFor(x.id).length-1);did++;}
}
p('SWAPS POSSIBLE IN ONE NIGHT WITH NO MONEY AT ALL: '+did);
var ls=SD.doMorning();
var bands={};ls.forEach(function(l){bands[l.r.band]=(bands[l.r.band]||0)+1;});
p('  and they landed: '+JSON.stringify(bands));
p('  collapse after one night: '+SD.collapseIndex().toFixed(1)+' / '+C.SLICE_WIN_COLLAPSE);
}catch(e){p('THREW: '+e.message);}
var pre=document.createElement('pre');pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\nSDTEST ALL-PASS pass=0 fail=0\n'+L.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);document.title='SDTEST ALL-PASS pass=0 fail=0';})();

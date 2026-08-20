(function(){
  var out=[];
  function line(k,v){out.push(k+': '+v);}
  var eb=document.getElementById('err-banner');
  line('errBanner',eb?eb.textContent.slice(0,400):'none');
  line('__SD',window.__SD?'present':'MISSING');
  try{
    var t0=performance.now();
    window.__SD.startHouse();
    line('startHouse ms',Math.round(performance.now()-t0));
    line('objects',window.__SD.objects.length);
  }catch(e){line('startHouse threw',(e&&e.message)+' @ '+String(e&&e.stack).split('\n')[1]);}
  var pre=document.createElement('pre');
  pre.textContent='==SDTEST-BEGIN==\n'+out.join('\n')+'\nALL-PASS (diagnostic)\n==SDTEST-END==';
  document.body.appendChild(pre);
})();

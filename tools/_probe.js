/* Scratch load-probe used by tools/syntax check. Loaded as an EXTERNAL script on
   purpose: an inline probe's own source appears in --dump-dom output ahead of the
   result it appends, so the sentinel regex matches the source instead of the answer. */
(function(){
  var out=[];
  function line(k,v){out.push(k+': '+v);}
  var eb=document.getElementById('err-banner');
  line('errBanner',eb?eb.textContent.slice(0,300):'none');
  line('__SD',window.__SD?'present':'MISSING');
  var X=window.__SD&&window.__SD.SFX;
  line('SFX',X?'present':'MISSING');
  if(X){
    line('ctx-before-gesture',X.ctx?'CREATED (BAD)':'null (good)');
    line('voices',X.voiceNames().join(','));
    line('cues',X.cueNames().join(','));
    line('settings',JSON.stringify(X.settings));
    var c=X.arm();
    line('arm()',c?('ok state='+c.state):'FAILED');
    line('buses',Object.keys(X.buses).join(','));
    line('master',X.master?'present':'MISSING');
    line('world(step) far',String(X.world('step',999,999,1)));
    line('world(step) near',String(X.world('step',0,0,1.3)));
    line('cue(day)',String(X.cue('day')));
    line('setHeat(1)',String(X.setHeat(1).toFixed(4)));
    line('drone',X.drone?'built':'MISSING');
  }
  var pre=document.createElement('pre');
  pre.textContent='==SDTEST-BEGIN==\n'+out.join('\n')+'\n==SDTEST-END==';
  document.body.appendChild(pre);
})();

(function(){
  var L=[];function p(s){L.push(s);}
  function f(n){return (Math.round(n*100)/100);}
  function lum(hex){
    hex=hex.trim().replace('#','');
    if(hex.length===3)hex=hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    var c=[0,1,2].map(function(i){var v=parseInt(hex.substr(i*2,2),16)/255;
      return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);});
    return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2];
  }
  function ratio(a,b){var la=lum(a),lb=lum(b);var hi=Math.max(la,lb),lo=Math.min(la,lb);
    return (hi+0.05)/(lo+0.05);}
  try{
    var SD=window.__SD,C=SD.CONST;
    SD.stopLoop(); SD.startHouse();
    var cs=getComputedStyle(document.documentElement);
    ['--dim','--coral','--alien','--warm','--paper','--text','--line','--panel','--panel2','--bg']
      .forEach(function(v){p('VAR '+v+'='+cs.getPropertyValue(v).trim());});
    var dim=cs.getPropertyValue('--dim').trim(),panel=cs.getPropertyValue('--panel').trim();
    p('CONTRAST dim/panel      = '+f(ratio(dim,panel)));
    p('CONTRAST #8a8478/#12101a= '+f(ratio('#8a8478','#12101a')));
    p('CONTRAST #8a8478/'+panel+' = '+f(ratio('#8a8478',panel)));
    p('CONTRAST #a9a396/#12101a= '+f(ratio('#a9a396','#12101a')));
    p('CONTRAST #4fa9ad/'+panel+' = '+f(ratio('#4fa9ad',panel)));
    p('CONTRAST #e0a95e/#12101a= '+f(ratio('#e0a95e','#12101a')));
    p('CONTRAST #e0a95e/'+panel+' = '+f(ratio('#e0a95e',panel)));
    p('CONTRAST paper/#12101a  = '+f(ratio(cs.getPropertyValue('--paper').trim(),'#12101a')));

    /* ---- reproduce the shot.ps1 'report' scene exactly ---- */
    SD.GAME.hasSpareKey=true; SD.useDoor(SD.frontDoor);
    var by=function(k){return SD.objects.filter(function(o){return o.kind===k;})[0];};
    var keys=by('keyring'), cereal=by('cerealBox'), mug=by('coffeeMug');
    p('OWNERS keyring='+keys.owner+' cereal='+cereal.owner+' mug='+mug.owner);
    p('FRESH before cereal='+cereal.fresh+' keys='+keys.fresh+' mug='+mug.fresh);
    SD.scanObject(keys);   SD.fabricate(keys);   SD.swapWith(keys,0);
    SD.scanObject(cereal); SD.fabricate(cereal); SD.swapWith(cereal,0);
    for(var i=0;i<7;i++) SD.nudgeObject(mug,0.03,0);
    var stk=SD.shopStock(keys.id,'bulwark');
    p('KEYRING bulwark price0='+stk[0].price+' sim0='+f(stk[0].sim));
    /* peek at what doMorning WOULD produce, without consuming PENDING */
    SD.PENDING.forEach(function(pp){
      var o=SD.objects.filter(function(x){return x.id===pp.objId;})[0];
      var res=SD.RESIDENTS[o.owner];
      var probe={kind:o.kind,spec:pp.before,attach:o.attach,marked:o.marked,fresh:o.fresh};
      var r=SD.DOUBT.resolve(res,probe,o.spec);
      p('PRE-ROW '+o.label+' owner='+res.name+' band='+r.band+' sim='+r.similarity.toFixed(1)+
        ' D='+r.delta.toFixed(1)+' floor='+r.floor.toFixed(0)+' ceil='+r.ceiling.toFixed(1)+
        ' fresh='+o.fresh+' needed='+f(r.floor/Math.max(0.01,r.delta))+'x');
    });
    SD.endNight('home','You are back before anyone stirs.');
    p('FRESH after cereal='+cereal.fresh+' keys='+keys.fresh+' mug='+mug.fresh);
    var body=document.getElementById('report-body');
    var items=body.querySelectorAll('.rp-item');
    for(var j=0;j<items.length;j++){
      var it=items[j],b=it.querySelector('.rp-band'),say=it.querySelector('.rp-say');
      p('ROW'+j+' cls="'+it.className+'" band="'+(b?b.textContent:'-')+'" say="'+
        (say?say.textContent:'-')+'"');
    }
  }catch(e){p('THREW: '+(e&&e.message)+' | '+(e&&e.stack||'').split('\n')[1]);}
  var pre=document.createElement('pre');pre.id='test-out';
  pre.textContent='==SDTEST-BEGIN==\nSDTEST ALL-PASS pass=0 fail=0\n'+L.join('\n')+'\n==SDTEST-END==';
  document.body.appendChild(pre);document.title='SDTEST ALL-PASS pass=0 fail=0';
})();

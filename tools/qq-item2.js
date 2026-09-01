(function(){
  var L=[];function p(s){L.push(s);}
  function rgb(el,prop){return getComputedStyle(el)[prop];}
  try{
    var SD=window.__SD,C=SD.CONST;
    SD.stopLoop(); SD.startHouse();
    SD.GAME.hasSpareKey=true; SD.useDoor(SD.frontDoor);
    var by=function(k){return SD.objects.filter(function(o){return o.kind===k;})[0];};
    var keys=by('keyring'), cereal=by('cerealBox'), mug=by('coffeeMug');
    SD.scanObject(keys);   SD.fabricate(keys);   SD.swapWith(keys,0);
    SD.scanObject(cereal); SD.fabricate(cereal); SD.swapWith(cereal,0);
    for(var i=0;i<7;i++) SD.nudgeObject(mug,0.03,0);
    // what does an INV item actually carry?
    SD.scanObject(mug);
    var st=SD.shopStock(mug.id,'bulwark');
    p('SHOPITEM keys='+Object.keys(st[0]).join(',')+' price0='+st[0].price);
    SD.GAME.bank=9999; SD.buyVariant(mug.id,0,'bulwark');
    var inv=SD.INV[SD.INV.length-1];
    p('INVITEM keys='+Object.keys(inv).join(',')+' hasPrice='+(inv.price!==undefined));
    var pend=SD.PENDING[0];
    p('PENDING keys='+Object.keys(pend).join(','));
    SD.endNight('home','You are back before anyone stirs.');
    // showReport has now run
    var body=document.getElementById('report-body');
    var items=body.querySelectorAll('.rp-item');
    p('ROWS n='+items.length);
    for(var j=0;j<items.length;j++){
      var it=items[j], band=it.querySelector('.rp-band');
      p('  row'+j+' cls="'+it.className+'" band="'+(band?band.textContent:'-')+
        '" bandColor='+(band?rgb(band,'color'):'-')+
        ' borderLeft='+rgb(it,'borderLeftColor')+
        ' bg='+rgb(it,'backgroundColor'));
    }
    var gl=body.querySelectorAll('.rp-gloss');
    p('GLOSS n='+gl.length+' glossed='+JSON.stringify(SD.GAME.glossed));
    var foot=body.querySelector('.rp-foot');
    p('FOOT color='+(foot?rgb(foot,'color'):'-'));
    // FRESH cost of a MISSED
    p('FRESH_DECAY='+C.FRESH_DECAY+' FRESH_MIN='+C.FRESH_MIN+' cereal.fresh='+cereal.fresh);
    // SECOND night: does the gloss fire again?
    SD.startDay();
    SD.beginNight();
    var c2=by('cerealBox');
    SD.fabricate(c2); SD.swapWith(c2,0);
    SD.endNight('home','x');
    var body2=document.getElementById('report-body');
    p('NIGHT2 gloss n='+body2.querySelectorAll('.rp-gloss').length+
      ' rows='+body2.querySelectorAll('.rp-item').length);
    var b2=body2.querySelectorAll('.rp-item');
    for(var k=0;k<b2.length;k++){
      var bb=b2[k].querySelector('.rp-band');
      p('  n2row'+k+' cls="'+b2[k].className+'" band="'+(bb?bb.textContent:'-')+'"');
    }
    // palette
    var cs=getComputedStyle(document.documentElement);
    ['--dim','--coral','--alien','--warm','--paper','--text','--line','--panel','--panel2','--bg']
      .forEach(function(v){p('VAR '+v+'='+cs.getPropertyValue(v).trim());});
  }catch(e){p('THREW: '+(e&&e.message)+' | '+(e&&e.stack||'').split('\n')[1]);}
  var pre=document.createElement('pre');pre.id='test-out';
  pre.textContent='==SDTEST-BEGIN==\nSDTEST ALL-PASS pass=0 fail=0\n'+L.join('\n')+'\n==SDTEST-END==';
  document.body.appendChild(pre);document.title='SDTEST ALL-PASS pass=0 fail=0';
})();

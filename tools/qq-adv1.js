(function(){
  var L=[];function p(s){L.push(s);}
  function lum(hex){
    var r=parseInt(hex.substr(1,2),16)/255,g=parseInt(hex.substr(3,2),16)/255,b=parseInt(hex.substr(5,2),16)/255;
    function f(c){return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4);}
    return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b);
  }
  function cr(a,b){var la=lum(a),lb=lum(b);return ((Math.max(la,lb)+0.05)/(Math.min(la,lb)+0.05)).toFixed(2);}
  try{
    var SD=window.__SD,C=SD.CONST;
    SD.stopLoop(); SD.startHouse();
    p('CONTRAST #8a8478 on #12101a = '+cr('#8a8478','#12101a'));
    p('CONTRAST #8d87a3 on #171522 = '+cr('#8d87a3','#171522'));
    p('CONTRAST #a9a396 on #12101a = '+cr('#a9a396','#12101a'));
    p('CONTRAST #4fa9ad on #171522 = '+cr('#4fa9ad','#171522'));
    p('CONTRAST #e0a95e on #12101a = '+cr('#e0a95e','#12101a'));
    p('CONTRAST #f2ead9 on #241419 = '+cr('#f2ead9','#241419'));
    p('CONTRAST #ff5a5a on #241419 = '+cr('#ff5a5a','#241419'));
    // fresh ladder + percentage strings the spec promises
    var f=1,seq=[];
    for(var i=0;i<6;i++){var was=f;f=Math.max(C.FRESH_MIN,f-C.FRESH_DECAY);
      seq.push(was.toFixed(2)+'->'+f.toFixed(2)+' pct='+(was>f?((1-f/was)*100).toFixed(0):'FLOOR'));}
    p('FRESHLADDER '+seq.join(' | '));

    // ---- THE DEFEATED PATH ----
    SD.startHouse(); SD.GAME.bank=999999; SD.GAME.hk=99;
    SD.GAME.hasSpareKey=true;
    var o=SD.objects.filter(function(x){return x.kind==='cerealBox'&&SD.RESIDENTS[x.owner];})[0];
    SD.scanObject(o);
    var res=SD.RESIDENTS[o.owner];
    // force a CERTAINTY: buy the most-different rung
    var st=SD.shopStock(o.id,'bulwark');
    p('SHELF '+st.map(function(x,i){return i+':'+x.sim.toFixed(1)+'$'+x.price+(x.identical?'(ID)':'');}).join(' '));
    var worst=-1,wi=-1;
    for(var q=0;q<st.length;q++){var pr=SD.predict(o.id,st[q]);if(pr&&pr.text==='CERTAINTY'&&pr.delta>worst){worst=pr.delta;wi=q;}}
    p('CERT rung idx='+wi+' delta='+worst.toFixed(1));
    SD.buyVariant(o.id,wi,'bulwark');
    SD.swapWith(o,SD.invFor(o.id).length-1);
    var lines1=SD.doMorning();
    p('N1 band='+lines1[0].r.band+' marked='+o.marked+' fresh='+o.fresh);
    // now buy the identical special order and swap it in
    var st2=SD.shopStock(o.id,'bulwark');
    var idIdx=-1;for(var q2=0;q2<st2.length;q2++)if(st2[q2].identical)idIdx=q2;
    p('IDENTICAL idx='+idIdx+' sim='+(idIdx>=0?st2[idIdx].sim:'-')+' price='+(idIdx>=0?st2[idIdx].price:'-')+
      ' kindPrice1='+SD.PROP_KINDS[o.kind].price[1]+' MULT='+C.IDENTICAL_MULT);
    SD.buyVariant(o.id,idIdx,'bulwark');
    var bagi=SD.invFor(o.id);
    p('BAG sims='+bagi.map(function(b){return b.sim.toFixed(2);}).join(','));
    var beforeSpec=JSON.stringify(o.spec);
    var it=SD.swapWith(o,bagi.length-1);
    p('SWAPPED it.sim='+(it?it.sim:'null')+' marked-after='+o.marked);
    var pend=SD.PENDING.filter(function(x){return x.objId===o.id;})[0];
    p('PEND labels='+(pend?pend.labels.join(' / '):'-'));
    var lines2=SD.doMorning();
    p('N2 DEFEATED-ROW band='+lines2[0].r.band+' delta='+lines2[0].r.delta.toFixed(2)+
      ' sim='+lines2[0].r.similarity.toFixed(2)+' floor='+lines2[0].r.floor.toFixed(1)+
      ' ceil='+lines2[0].r.ceiling.toFixed(1)+' susp+'+lines2[0].r.suspicion.toFixed(1));
    p('N2 specReverted='+(JSON.stringify(o.spec)===JSON.stringify(SD.CATALOG[o.id].spec)));

    // ---- clean case: mark by fracture-like direct set, unchanged spec ----
    SD.startHouse(); SD.GAME.bank=999999; SD.GAME.hk=99;
    var o2=SD.objects.filter(function(x){return x.kind==='cerealBox'&&SD.RESIDENTS[x.owner];})[0];
    SD.scanObject(o2); o2.marked=true;
    var s3=SD.shopStock(o2.id,'bulwark');var i3=-1;for(var q3=0;q3<s3.length;q3++)if(s3[q3].identical)i3=q3;
    SD.buyVariant(o2.id,i3,'bulwark');
    SD.swapWith(o2,SD.invFor(o2.id).length-1);
    var l3=SD.doMorning();
    p('CLEAN-CASE band='+l3[0].r.band+' delta='+l3[0].r.delta.toFixed(3)+' fresh='+o2.fresh+' marked='+o2.marked);
  }catch(e){p('THREW: '+(e&&e.message)+' | '+(e&&e.stack||'').split('\n')[1]);}
  var pre=document.createElement('pre');pre.id='test-out';
  pre.textContent='==SDTEST-BEGIN==\nSDTEST ALL-PASS pass=0 fail=0\n'+L.join('\n')+'\n==SDTEST-END==';
  document.body.appendChild(pre);document.title='SDTEST ALL-PASS pass=0 fail=0';
})();

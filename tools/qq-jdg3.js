(function(){
  var L=[];function p(s){L.push(s);}
  try{
    var SD=window.__SD,C=SD.CONST;
    SD.stopLoop(); SD.startHouse(); SD.GAME.hk=99; SD.GAME.bank=999999;
    var by=function(k){return SD.objects.filter(function(o){return o.kind===k;})[0];};
    var mug=by('coffeeMug');
    SD.scanObject(mug);
    var st=SD.shopStock(mug.id,'bulwark');
    p('MUG bulwark price0='+st[0].price+' sim0='+st[0].sim.toFixed(2)+
      ' rows='+st.length+' lastSim='+st[st.length-1].sim+' lastPrice='+st[st.length-1].price);

    /* ---- CAN A "DEFEATED" ROW RESOLVE NON-MISSED? ---- */
    mug.marked=true;
    var idx=-1;for(var i=0;i<st.length;i++)if(st[i].identical)idx=i;
    p('IDENTICAL row idx='+idx+' sim='+st[idx].sim+' price='+st[idx].price);
    SD.buyVariant(mug.id,idx,'bulwark');
    var got=SD.swapWith(mug,SD.invFor(mug.id).length-1);
    p('after identical swap: marked='+mug.marked+' swapped sim='+(got?got.sim:'-'));
    for(var n=0;n<7;n++) SD.nudgeObject(mug,0.03,0);
    var pp=SD.PENDING.filter(function(x){return x.objId===mug.id;})[0];
    var res=SD.RESIDENTS[mug.owner];
    var probe={kind:mug.kind,spec:pp.before,attach:mug.attach,marked:mug.marked,fresh:mug.fresh};
    var r=SD.DOUBT.resolve(res,probe,mug.spec);
    p('DEFEATED+NUDGE band='+r.band+' D='+r.delta.toFixed(1)+' floor='+r.floor.toFixed(0)+
      ' ceil='+r.ceiling.toFixed(1)+' doubt='+r.doubt.toFixed(1)+' susp='+r.suspicion.toFixed(1)+
      ' mark='+r.mark);
    p('  -> spec would print cls=rp-clean band="MARK CLEARED" say="does not register it"');

    /* also: identical swap ALONE (no nudge) on a marked object */
    SD.startHouse(); SD.GAME.hk=99; SD.GAME.bank=999999;
    var m2=by('coffeeMug'); m2.marked=true; SD.scanObject(m2);
    var st2=SD.shopStock(m2.id,'bulwark');
    var j=-1;for(var q=0;q<st2.length;q++)if(st2[q].identical)j=q;
    SD.buyVariant(m2.id,j,'bulwark'); SD.swapWith(m2,SD.invFor(m2.id).length-1);
    var p2=SD.PENDING.filter(function(x){return x.objId===m2.id;})[0];
    var r2=SD.DOUBT.resolve(SD.RESIDENTS[m2.owner],
      {kind:m2.kind,spec:p2.before,attach:m2.attach,marked:m2.marked,fresh:m2.fresh},m2.spec);
    p('DEFEATED ALONE band='+r2.band+' D='+r2.delta+' freshDelta='+r2.freshDelta+
      ' fresh(before)='+m2.fresh);

    /* ---- IS "BUY FURTHER DOWN" ALWAYS TRUE? per object, does ANY bulwark row DOUBT ---- */
    SD.startHouse(); SD.GAME.hk=99;
    var tot=0,anyD=0,noD=0,worstIsCert=0,rowsNeeded=[];
    SD.objects.forEach(function(o){
      if(!SD.RESIDENTS[o.owner])return;
      SD.scanObject(o);
      var s=SD.shopStock(o.id,'bulwark'); if(!s.length)return;
      tot++;
      var res=SD.RESIDENTS[o.owner],found=-1,lastBand='';
      for(var k=0;k<s.length;k++){
        if(s[k].identical)continue;
        var rr=SD.DOUBT.resolve(res,{kind:o.kind,spec:o.spec,attach:o.attach,marked:o.marked,fresh:o.fresh},s[k].spec);
        lastBand=rr.band;
        if(rr.band==='DOUBT'&&found<0)found=k;
      }
      if(found>=0){anyD++;rowsNeeded.push(found);}else{noD++;if(lastBand==='CERTAINTY')worstIsCert++;}
    });
    rowsNeeded.sort(function(a,b){return a-b;});
    p('SHELF objects='+tot+'  someRowDoubts='+anyD+'  NO row doubts='+noD+
      ' (of those, bottom row is CERTAINTY on '+worstIsCert+')');
    p('  first DOUBT row index: median='+rowsNeeded[Math.floor(rowsNeeded.length/2)]+
      ' min='+rowsNeeded[0]+' max='+rowsNeeded[rowsNeeded.length-1]);
    /* how many rows does Bulwark show? */
    var s0=SD.shopStock(SD.objects[0].id,'bulwark');
    p('  bulwark rows per object='+s0.length);
  }catch(e){p('THREW: '+(e&&e.message)+' | '+(e&&e.stack||'').split('\n')[1]);}
  var pre=document.createElement('pre');pre.id='test-out';
  pre.textContent='==SDTEST-BEGIN==\nSDTEST ALL-PASS pass=0 fail=0\n'+L.join('\n')+'\n==SDTEST-END==';
  document.body.appendChild(pre);document.title='SDTEST ALL-PASS pass=0 fail=0';
})();

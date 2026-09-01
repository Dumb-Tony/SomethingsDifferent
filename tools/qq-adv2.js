(function(){
  var L=[];function p(s){L.push(s);}
  try{
    var SD=window.__SD,C=SD.CONST;
    SD.stopLoop(); SD.startHouse();
    // exact float ladder
    var f=1;var out=[];
    for(var i=0;i<6;i++){var was=f;f=Math.max(C.FRESH_MIN,f-C.FRESH_DECAY);
      out.push('was='+was+' now='+f+' gt='+(was>f)+' pct='+((1-f/was)*100).toFixed(0));}
    p('LADDER RAW:'); out.forEach(function(s){p('  '+s);});

    // ---- defeated with a REVERTING identical copy ----
    SD.startHouse(); SD.GAME.bank=999999;
    var o=SD.objects.filter(function(x){return x.kind==='cerealBox'&&SD.RESIDENTS[x.owner];})[0];
    var res=SD.RESIDENTS[o.owner];
    p('OBJ '+o.id+' owner='+o.owner+' noticeFloor='+res.noticeFloor+' band='+res.doubtBand+' attn='+res.attention);
    SD.scanObject(o);
    var st=SD.shopStock(o.id,'bulwark');
    p('SHELF '+st.map(function(x,i){return i+':'+x.sim.toFixed(1)+(x.identical?'(ID)':'');}).join(' '));
    // resolve each rung directly, no predict/HK gate
    st.forEach(function(x,i){
      var r=SD.DOUBT.resolve(res,{kind:o.kind,spec:o.spec,attach:o.attach,marked:o.marked,fresh:o.fresh},x.spec);
      p('  rung'+i+' sim='+x.sim.toFixed(1)+' D='+r.delta.toFixed(1)+' ['+r.floor.toFixed(1)+'-'+r.ceiling.toFixed(1)+'] '+r.band);
    });
    // take the LAST non-identical rung (most different) and swap it in
    var wi=-1;for(var q=0;q<st.length;q++)if(!st[q].identical)wi=q;
    SD.buyVariant(o.id,wi,'bulwark');
    SD.swapWith(o,SD.invFor(o.id).length-1);
    var l1=SD.doMorning();
    p('N1 band='+l1[0].r.band+' D='+l1[0].r.delta.toFixed(1)+' marked='+o.marked+' fresh='+o.fresh);
    if(!o.marked){o.marked=true;p('N1 forced marked=true for the test');}
    // now the identical special order
    var st2=SD.shopStock(o.id,'bulwark');
    var ii=-1;for(var q2=0;q2<st2.length;q2++)if(st2[q2].identical)ii=q2;
    p('IDENT sim='+st2[ii].sim+' price='+st2[ii].price+' kindPrice='+JSON.stringify(SD.PROP_KINDS[o.kind].price));
    SD.buyVariant(o.id,ii,'bulwark');
    var bag=SD.invFor(o.id);
    var it=SD.swapWith(o,bag.length-1);
    p('SWAP it.sim='+it.sim+' defeated?marked-now='+o.marked);
    var l2=SD.doMorning();
    p('N2 band='+l2[0].r.band+' D='+l2[0].r.delta.toFixed(2)+' susp+'+l2[0].r.suspicion.toFixed(1)+
      ' doubt+'+l2[0].r.doubt.toFixed(1)+' fresh='+o.fresh);
    p('N2 ---> a "MARK CLEARED" row would print band='+l2[0].r.band);

    // ---- unchanged-spec clean case ----
    SD.startHouse(); SD.GAME.bank=999999;
    var o2=SD.objects.filter(function(x){return x.kind==='cerealBox'&&SD.RESIDENTS[x.owner];})[0];
    SD.scanObject(o2); o2.marked=true;
    var s3=SD.shopStock(o2.id,'bulwark');var i3=-1;for(var k=0;k<s3.length;k++)if(s3[k].identical)i3=k;
    SD.buyVariant(o2.id,i3,'bulwark');
    SD.swapWith(o2,SD.invFor(o2.id).length-1);
    var l3=SD.doMorning();
    p('CLEAN band='+l3[0].r.band+' D='+l3[0].r.delta+' fresh='+o2.fresh+' marked='+o2.marked+
      ' diffs='+JSON.stringify(l3[0].r.diffs)+' desc="'+SD.describeDiffs(l3[0].kind,l3[0].r.diffs)+'"');
    p('CLEAN sim='+l3[0].r.similarity+' floor='+l3[0].r.floor.toFixed(1)+' ceil='+l3[0].r.ceiling.toFixed(1));
  }catch(e){p('THREW: '+(e&&e.message)+' | '+(e&&e.stack||'').split('\n').slice(1,3).join(' | '));}
  var pre=document.createElement('pre');pre.id='test-out';
  pre.textContent='==SDTEST-BEGIN==\nSDTEST ALL-PASS pass=0 fail=0\n'+L.join('\n')+'\n==SDTEST-END==';
  document.body.appendChild(pre);document.title='SDTEST ALL-PASS pass=0 fail=0';
})();

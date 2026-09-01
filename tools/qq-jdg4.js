(function(){
  var L=[];function p(s){L.push(s);}
  try{
    var SD=window.__SD,C=SD.CONST;
    SD.stopLoop(); SD.startHouse();
    /* simulate the exact clamp arithmetic in DOUBT.commit (line 2601) */
    var f=1;
    for(var i=1;i<=7;i++){
      var was=f;
      f=Math.max(C.FRESH_MIN,f+(-C.FRESH_DECAY));
      p('decay '+i+': was='+was+' -> now='+f+
        '  was.toFixed(2)='+was.toFixed(2)+' now.toFixed(2)='+f.toFixed(2)+
        '  was>now? '+(was>f)+
        '  pct='+((1-f/was)*100).toFixed(0)+'%');
    }
    /* and the same through the real object, five nights of MISSED */
    SD.startHouse();
    var o=SD.objects.filter(function(x){return x.kind==='cerealBox';})[0];
    var res=SD.RESIDENTS[o.owner];
    var out=[];
    for(var n=0;n<6;n++){
      var was=(o.fresh===undefined?1:o.fresh);
      var r={band:'MISSED',doubt:0,stress:0,suspicion:0,mark:false,freshDelta:-C.FRESH_DECAY};
      SD.DOUBT.commit(res,o,o.spec,r);
      out.push(was.toFixed(2)+'->'+o.fresh.toFixed(2)+(was>o.fresh?' MOVED':' FLOOR')+
        ' raw('+was+' , '+o.fresh+')');
    }
    out.forEach(function(s,i){p('night '+(i+1)+': '+s);});
  }catch(e){p('THREW: '+(e&&e.message));}
  var pre=document.createElement('pre');pre.id='test-out';
  pre.textContent='==SDTEST-BEGIN==\nSDTEST ALL-PASS pass=0 fail=0\n'+L.join('\n')+'\n==SDTEST-END==';
  document.body.appendChild(pre);document.title='SDTEST ALL-PASS pass=0 fail=0';
})();

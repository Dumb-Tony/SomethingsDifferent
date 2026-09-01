/* qq-vfy2 - perf, the rail case, and the wrap threshold. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}
function el(id){return document.getElementById(id);}
try{
var SD=window.__SD,R=SD.RESIDENTS,D=SD.DOUBT,O=SD.objects;
SD.stopLoop();
var clamp=function(v,lo,hi){return v<lo?lo:(v>hi?hi:v);};
function nightForecast(){
  var clone={},knew={},n=0,anyD=false,anyC=false,knows=0;
  for(var i=0;i<SD.PENDING.length;i++){
    var p=SD.PENDING[i],o=SD.objectById(p.objId);if(!o)continue;
    var src=R[o.owner];if(!src)continue;
    var c=clone[o.owner]||(clone[o.owner]=Object.assign({},src));
    var r=D.resolve(c,{kind:o.kind,spec:p.before,attach:o.attach,marked:o.marked,fresh:o.fresh},o.spec);
    c.doubt=clamp((c.doubt||0)+r.doubt,0,100);c.stress=clamp((c.stress||0)+r.stress,0,100);
    n++;if(r.band==='DOUBT')anyD=true;
    else if(r.band==='CERTAINTY'){anyC=true;if(!knew[o.owner]){knew[o.owner]=1;knows++;}}
  }
  var num=0,den=0;
  Object.keys(R).forEach(function(id){
    if(!O.some(function(o){return o.owner===id;}))return;
    var rr=clone[id]||R[id];num+=(rr.doubt||0)*rr.credibility;den+=rr.credibility;});
  return {n:n,knows:knows,ci:den?num/den:0,band:anyC?'CERTAINTY':(anyD?'DOUBT':'MISSED')};
}

/* 1. THE RAIL CASE at night 1 */
SD.startHouse();SD.beginNight();
info('night 1: GAME.hk='+SD.GAME.hk+'  hkTier='+SD.hkTier());
var walt=O.filter(function(o){return o.owner==='walt';})[0];
SD.scanObject(walt);
var stock=SD.shopStock(walt.id,'bulwark');
info('bulwark rows for "'+walt.label+'": '+stock.slice(0,4).map(function(s){
  return s.sim.toFixed(1)+'%';}).join(' / '));
var pr=SD.predict(walt.id,stock[0]);
info('predict() at tier '+SD.hkTier()+' for the top row: "'+pr.text+'"');
SD.INV.push({kind:stock[0].kind,spec:stock[0].spec,forId:walt.id,label:stock[0].label,sim:stock[0].sim});
SD.swapWith(walt,SD.invFor(walt.id).length-1);
var f=nightForecast();
info('RAIL CASE forecast: ci='+f.ci.toFixed(4)+'  band='+f.band+'  n='+f.n+
     '   standing collapse='+SD.collapseIndex().toFixed(4));
ok('the rail swap forecasts an unchanged collapse in the MISSED band',
   f.band==='MISSED'&&Math.abs(f.ci-SD.collapseIndex())<1e-9,
   f.band+'  '+f.ci.toFixed(4));

/* 2. PERF at three ledger sizes */
(function(){
  [5,20,40].forEach(function(target){
    SD.startHouse();SD.beginNight();
    var done=0;
    for(var i=0;i<O.length&&done<target;i++){
      var o=O[i];if(!o.owner||!R[o.owner])continue;
      SD.scanObject(o);if(!SD.fabricate(o))continue;
      SD.swapWith(o,SD.invFor(o.id).length-1);done++;
    }
    nightForecast();
    var t0=performance.now();for(var k=0;k<200;k++)nightForecast();
    var ms=(performance.now()-t0)/200;
    info('ledger '+SD.PENDING.length+' entries -> nightForecast '+ms.toFixed(4)+
         ' ms/call ('+(ms*10).toFixed(3)+' ms/s at the 10Hz HUD throttle)');
  });
})();

/* 3. THE WRAP THRESHOLD with the widest pill */
(function(){
  var hud=el('hud');
  var st=document.createElement('style');
  st.textContent='#hud{position:fixed;top:12px;left:0;right:0;z-index:20;gap:8px;'+
    'justify-content:center;flex-wrap:wrap;row-gap:8px;padding:0 10px;box-sizing:border-box;'+
    'transform:none}.pill{white-space:nowrap}';
  document.head.appendChild(st);
  var host=document.createElement('div');
  host.innerHTML='<div class="pill" id="collapse-pill">COLLAPSE <b>38.9</b>'+
    '<span class="k-doubt">'+String.fromCharCode(32,8594,32)+'41.2</span>'+
    '<span class="ds-dim"> / 48</span>'+
    '<span class="k-cert">'+String.fromCharCode(32,183,32)+'3 WILL KNOW</span></div>';
  hud.insertBefore(host.firstElementChild,hud.firstElementChild);
  SD.startHouse();SD.beginNight();
  SD.WIFE.following=true;SD.WIFE.followT=0.4;SD.S.freeze=3.2;SD.updateHUD(1);
  var kids=[].slice.call(hud.children).filter(function(x){return x.offsetWidth>0;});
  var w=kids.map(function(x){return x.getBoundingClientRect().width;});
  var sum=w.reduce(function(a,b){return a+b;},0)+8*(w.length-1);
  info('WIDEST worst state: '+kids.map(function(x,i){return x.id+'='+Math.round(w[i]);}).join(' ')+
       '   sum+gaps='+Math.round(sum)+'  +20 padding = '+Math.round(sum+20));
  info('so the HUD goes to two rows below a viewport of '+Math.ceil(sum+20)+'px');
  ok('one row at '+innerWidth+'px',hud.getBoundingClientRect().height<40,
     Math.round(hud.getBoundingClientRect().height)+'px');
})();

var eb=document.getElementById('err-banner');
ok('no crash banner',!eb,eb?eb.textContent.slice(0,160):'');
}catch(e){fail++;out.push('FAIL  THREW: '+(e&&e.message));out.push(String(e&&e.stack).split('\n').slice(0,4).join(' | '));}
var hdr=(fail===0?'SDTEST ALL-PASS':'SDTEST FAILURES')+' pass='+pass+' fail='+fail;
var pre2=document.createElement('pre');pre2.id='test-out';
pre2.textContent='==SDTEST-BEGIN==\n'+hdr+'\n'+out.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre2);document.title=hdr;
})();

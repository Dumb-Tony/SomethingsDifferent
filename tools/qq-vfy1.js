/* INDEPENDENT VERIFICATION of the ITEM-1 (M57 collapse pill) spec. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}
function el(id){return document.getElementById(id);}
try{
var SD=window.__SD,C=SD.CONST,R=SD.RESIDENTS,D=SD.DOUBT,O=SD.objects;
SD.stopLoop();
var clamp=function(v,lo,hi){return v<lo?lo:(v>hi?hi:v);};
info('innerWidth='+window.innerWidth+'  innerHeight='+window.innerHeight);

/* THE FUNCTION, transcribed from the spec */
function nightForecast(){
  var clone={},knew={};
  var n=0,anyD=false,anyC=false,knows=0;
  for(var i=0;i<SD.PENDING.length;i++){
    var p=SD.PENDING[i],o=SD.objectById(p.objId);
    if(!o)continue;
    var src=R[o.owner];if(!src)continue;
    var c=clone[o.owner]||(clone[o.owner]=Object.assign({},src));
    var r=D.resolve(c,{kind:o.kind,spec:p.before,attach:o.attach,marked:o.marked,fresh:o.fresh},o.spec);
    c.doubt =clamp((c.doubt ||0)+r.doubt ,0,100);
    c.stress=clamp((c.stress||0)+r.stress,0,100);
    n++;
    if(r.band==='DOUBT')anyD=true;
    else if(r.band==='CERTAINTY'){anyC=true;if(!knew[o.owner]){knew[o.owner]=1;knows++;}}
  }
  var num=0,den=0;
  Object.keys(R).forEach(function(id){
    if(!O.some(function(o){return o.owner===id;}))return;
    var rr=clone[id]||R[id];
    num+=(rr.doubt||0)*rr.credibility;den+=rr.credibility;
  });
  return {n:n,knows:knows,ci:den?num/den:0,band:anyC?'CERTAINTY':(anyD?'DOUBT':'MISSED')};
}

/* THE MARKUP, exactly the string in the spec */
var hud=el('hud');
var host=document.createElement('div');
host.innerHTML='<div class="pill" id="collapse-pill" style="display:none">COLLAPSE <b id="collapse-v">0.0</b><span id="collapse-fc"></span><span class="ds-dim" id="collapse-bar"> / 40</span><span id="collapse-know"></span></div>';
var pill=host.firstElementChild;
hud.insertBefore(pill,hud.firstElementChild);
ok('the new pill is the FIRST child of #hud',hud.children[0].id==='collapse-pill',
   'clock is now child #'+[].indexOf.call(hud.children,el('clock')));

/* THE CSS EDITS */
var st=document.createElement('style');
st.textContent=
 '#hud{position:fixed;top:12px;left:0;right:0;z-index:20;display:none;gap:8px;'+
 'justify-content:center;flex-wrap:wrap;row-gap:8px;padding:0 10px;box-sizing:border-box;'+
 'transform:none}'+
 '.pill{white-space:nowrap}';
document.head.appendChild(st);

function paint(){
  var p=el('collapse-pill');
  if(SD.S.phase!=='house'){p.style.display='none';return;}
  p.style.display='';
  el('collapse-v').textContent=SD.collapseIndex().toFixed(1);
  el('collapse-bar').textContent=String.fromCharCode(32,47,32)+SD.winBar().toFixed(0);
  var fc=nightForecast();
  if(!fc.n){el('collapse-fc').textContent='';el('collapse-know').textContent='';return;}
  el('collapse-fc').className=fc.band==='CERTAINTY'?'k-cert':(fc.band==='DOUBT'?'k-doubt':'k-miss');
  el('collapse-fc').textContent=String.fromCharCode(32,8594,32)+fc.ci.toFixed(1);
  el('collapse-know').className=fc.knows?'k-cert':'';
  el('collapse-know').textContent=fc.knows?(String.fromCharCode(32,183,32)+fc.knows+' WILL KNOW'):'';
}
function txt(){return el('collapse-pill').textContent;}
function W(){return Math.round(el('collapse-pill').getBoundingClientRect().width);}
function H(){return Math.round(el('collapse-pill').getBoundingClientRect().height);}

/* A. GREYBOX PHASE */
SD.startHouse();var savedPhase=SD.S.phase;SD.S.phase='greybox';paint();
ok('hidden in the greybox phase',el('collapse-pill').style.display==='none');
SD.S.phase=savedPhase;

/* B. EMPTY LEDGER */
SD.startHouse();SD.beginNight();paint();
info('empty ledger: "'+txt()+'"  '+W()+'x'+H());
ok('empty-ledger string',txt()==='COLLAPSE 0.0 / 40',txt());

/* C. FORECAST vs doMorning */
(function(){
  SD.startHouse();SD.beginNight();
  var picks=[],seen={};
  for(var i=0;i<O.length&&picks.length<6;i++){
    var q=O[i];if(!q.owner||!R[q.owner])continue;
    seen[q.owner]=(seen[q.owner]||0)+1;
    if(seen[q.owner]<=2)picks.push(q);
  }
  var did=0;
  picks.forEach(function(o){SD.scanObject(o);if(!SD.fabricate(o))return;
    SD.swapWith(o,SD.invFor(o.id).length-1);did++;});
  info('ledger of '+SD.PENDING.length+' across '+Object.keys(seen).length+' owners, '+did+' swaps');
  var f=nightForecast();
  var b=R.walt.doubt;nightForecast();nightForecast();
  ok('nightForecast writes nothing',R.walt.doubt===b,'walt.doubt '+b);
  SD.doMorning();
  var real=SD.collapseIndex();
  info('forecast '+f.ci.toFixed(9)+'   dawn '+real.toFixed(9));
  ok('FORECAST == doMorning (ordered+clamped)',Math.abs(f.ci-real)<1e-9,
     'err '+(real-f.ci).toExponential(2));
})();

/* D. NAIVE forecast differs */
(function(){
  SD.startHouse();SD.beginNight();
  var picks=[],cnt={};
  for(var i=0;i<O.length;i++){var q=O[i];if(!q.owner||!R[q.owner])continue;
    cnt[q.owner]=(cnt[q.owner]||0)+1;if(cnt[q.owner]<=3)picks.push(q);
    if(picks.length>=9)break;}
  picks.forEach(function(o){SD.scanObject(o);if(!SD.fabricate(o))return;
    SD.swapWith(o,SD.invFor(o.id).length-1);});
  var good=nightForecast();
  var num=0,den=0,acc={};
  SD.PENDING.forEach(function(p){var o=SD.objectById(p.objId);if(!o)return;
    var src=R[o.owner];if(!src)return;
    var r=D.resolve(src,{kind:o.kind,spec:p.before,attach:o.attach,marked:o.marked,fresh:o.fresh},o.spec);
    acc[o.owner]=(acc[o.owner]||0)+r.doubt;});
  Object.keys(R).forEach(function(id){
    if(!O.some(function(o){return o.owner===id;}))return;
    num+=((R[id].doubt||0)+(acc[id]||0))*R[id].credibility;den+=R[id].credibility;});
  var naive=den?num/den:0;
  SD.doMorning();var real=SD.collapseIndex();
  info('ordered '+good.ci.toFixed(4)+'  naive '+naive.toFixed(4)+'  dawn '+real.toFixed(4));
  ok('ordered forecast is exact',Math.abs(good.ci-real)<1e-9);
  info('naive error vs dawn: '+(naive-real).toFixed(4));
})();

/* E. OWN-HOUSE OBJECTS */
(function(){
  var owners={};O.forEach(function(o){owners[o.owner]=(owners[o.owner]||0)+1;});
  var noRes=Object.keys(owners).filter(function(k){return !R[k];});
  info('object owners: '+JSON.stringify(owners));
  info('owners with NO resident record: '+(noRes.join(', ')||'none'));
  var noObj=Object.keys(R).filter(function(id){return !O.some(function(o){return o.owner===id;});});
  info('residents with NO objects (excluded from collapseIndex): '+(noObj.join(', ')||'none'));
})();

/* F. AFTERNOON / EVENING */
(function(){
  SD.startHouse();SD.beginNight();SD.startWalk();
  info('startWalk -> S.phase='+SD.S.phase+' PENDING='+SD.PENDING.length+
       ' daytime='+SD.S.daytime+' evening='+SD.S.evening);
  paint();ok('visible in the afternoon',el('collapse-pill').style.display==='');
  ok('no forecast segment in the afternoon',el('collapse-fc').textContent==='');
  SD.endWalk();
  SD.startEvening();info('startEvening -> S.phase='+SD.S.phase);
  paint();ok('visible in the evening',el('collapse-pill').style.display==='');
  SD.endEvening();
})();

/* G. M36 CLASS-DRIFT DETECTOR replayed */
(function(){
  el('collapse-fc').className='k-miss';el('collapse-know').className='k-cert';
  var css='';[].forEach.call(document.querySelectorAll('style'),function(s){css+=s.textContent;});
  var defined={};(css.match(/\.[A-Za-z][\w-]*/g)||[]).forEach(function(m){defined[m.slice(1)]=1;});
  var used={};[].forEach.call(document.querySelectorAll('[class]'),function(e){
    [].forEach.call(e.classList,function(c){used[c]=1;});});
  ['hot','warn','late','on','sh-good','sh-bad','sh-dim','rp-doubt','rp-cert','rp-miss']
    .forEach(function(c){used[c]=1;});
  var orphans=Object.keys(used).filter(function(c){return !defined[c];});
  ok('M36 class-drift detector still green with the new pill',orphans.length===0,
     orphans.join(', ')||'no orphans');
})();

/* H. POINTER-EVENTS + optical centring */
(function(){
  SD.startHouse();SD.beginNight();SD.updateHUD(1);paint();
  var r=hud.getBoundingClientRect();
  info('#hud box after the CSS edit: '+Math.round(r.left)+','+Math.round(r.top)+
       ' '+Math.round(r.width)+'x'+Math.round(r.height)+
       '  pointer-events='+getComputedStyle(hud).pointerEvents);
  var probeY=Math.round(r.top+r.height/2);
  var hitL=document.elementFromPoint(6,probeY), hitR=document.elementFromPoint(innerWidth-6,probeY);
  info('elementFromPoint(6,'+probeY+') = '+(hitL?(hitL.id||hitL.tagName)+' ['+hitL.className+']':'null'));
  info('elementFromPoint('+(innerWidth-6)+','+probeY+') = '+(hitR?(hitR.id||hitR.tagName)+' ['+hitR.className+']':'null'));
  var kids=[].slice.call(hud.children).filter(function(x){return x.offsetWidth>0;});
  var L=Math.min.apply(null,kids.map(function(x){return x.getBoundingClientRect().left;}));
  var Rr=Math.max.apply(null,kids.map(function(x){return x.getBoundingClientRect().right;}));
  info('visible pill group '+Math.round(L)+'-'+Math.round(Rr)+', centre '+
       ((L+Rr)/2).toFixed(1)+' vs viewport centre '+(innerWidth/2));
  ok('pill group still optically centred',Math.abs((L+Rr)/2-innerWidth/2)<1,
     'off by '+Math.abs((L+Rr)/2-innerWidth/2).toFixed(2)+'px');
})();

/* I. THE EXACT STATES the spec tabulates */
(function(){
  function force(v,fc,cls,know,bar){
    el('collapse-pill').style.display='';
    el('collapse-v').textContent=v;
    el('collapse-fc').className=cls||'';el('collapse-fc').textContent=fc||'';
    el('collapse-bar').textContent=String.fromCharCode(32,47,32)+(bar||'40');
    el('collapse-know').className=know?'k-cert':'';
    el('collapse-know').textContent=know?(String.fromCharCode(32,183,32)+know):'';
    return '"'+txt()+'"  '+W()+'x'+H();
  }
  var A=String.fromCharCode(32,8594,32);
  info('empty          '+force('0.0','',''));
  info('rail case      '+force('0.0',A+'0.0','k-miss'));
  info('doubt landed   '+force('0.0',A+'3.0','k-doubt'));
  info('will know      '+force('0.0',A+'3.7','k-cert','1 WILL KNOW'));
  info('widest         '+force('38.9',A+'41.2','k-doubt','3 WILL KNOW','48'));
})();

/* J. WORST HUD STATE */
(function(){
  SD.startHouse();SD.beginNight();
  var picks=[],seen={};
  for(var i=0;i<O.length&&picks.length<4;i++){var q=O[i];
    if(!q.owner||!R[q.owner]||seen[q.owner])continue;seen[q.owner]=1;picks.push(q);}
  picks.forEach(function(o){SD.scanObject(o);if(SD.fabricate(o))SD.swapWith(o,SD.invFor(o.id).length-1);});
  SD.WIFE.following=true;SD.WIFE.followT=0.4;SD.S.freeze=3.2;SD.updateHUD(1);paint();
  var kids=[].slice.call(hud.children).filter(function(x){return x.offsetWidth>0;});
  var r=hud.getBoundingClientRect();
  info('WORST @'+innerWidth+'px  hud '+Math.round(r.width)+'x'+Math.round(r.height)+
       '  pills: '+kids.map(function(x){return x.id+'='+Math.round(x.getBoundingClientRect().width)+
       'x'+Math.round(x.getBoundingClientRect().height);}).join('  '));
  var span=kids.reduce(function(a,x){return a+x.getBoundingClientRect().width;},0)+8*(kids.length-1);
  info('sum of pill widths + gaps = '+Math.round(span)+' of '+innerWidth);
  ok('no pill wraps in the worst state',kids.every(function(x){return x.getBoundingClientRect().height<32;}),
     kids.map(function(x){return Math.round(x.getBoundingClientRect().height);}).join(','));
  var st2=document.createElement('style');
  st2.textContent='#hud{left:50%;right:auto;transform:translateX(-50%);flex-wrap:nowrap;padding:0}'+
                  '.pill{white-space:normal}';
  document.head.appendChild(st2);
  var r2=hud.getBoundingClientRect();
  info('SAME STATE with the ORIGINAL css: hud '+Math.round(r2.width)+'x'+Math.round(r2.height));
  st2.remove();
})();

/* K. THE ARROW GLYPH */
(function(){
  var cv=document.createElement('canvas').getContext('2d');
  var ff=getComputedStyle(el('collapse-pill')).fontFamily;
  cv.font='700 12px '+ff;
  info('font-family = '+ff);
  info('U+2192 advance '+cv.measureText(String.fromCharCode(8594)).width.toFixed(2)+
       '  U+00B7 '+cv.measureText(String.fromCharCode(183)).width.toFixed(2)+
       '  U+FFFF '+cv.measureText(String.fromCharCode(0xFFFF)).width.toFixed(2));
  var allcss='';[].forEach.call(document.querySelectorAll('style'),function(s){allcss+=s.textContent;});
  info('@font-face anywhere: '+(/@font-face/.test(allcss)?'yes':'no')+
       '   <link> tags: '+document.querySelectorAll('link').length);
})();

/* L. winBar per preset */
(function(){
  var s=[];['gentle','standard','harsh'].forEach(function(d){SD.OPT.setDiff(d);
    s.push(d+'='+SD.winBar());});
  SD.OPT.setDiff('standard');info('winBar: '+s.join('  '));
})();

/* M. CERTAINTY RAISES THE FORECAST */
(function(){
  SD.startHouse();SD.beginNight();
  var o=O.filter(function(x){return x.owner&&R[x.owner];})[0];
  SD.scanObject(o);
  var before=nightForecast();
  SD.INV.push({kind:o.kind,spec:JSON.parse(JSON.stringify(o.spec)),forId:o.id,label:o.label,sim:1});
  var sp=SD.INV[SD.INV.length-1].spec;
  Object.keys(sp).forEach(function(key){if(typeof sp[key]==='number')sp[key]=sp[key]*0.2;});
  SD.swapWith(o,SD.invFor(o.id).length-1);
  var after=nightForecast();
  info('owner '+o.owner+': forecast '+before.ci.toFixed(2)+' -> '+after.ci.toFixed(2)+
       '  band '+after.band+'  knows '+after.knows);
  ok('a CERTAINTY still RAISES the forecast number',after.ci>=before.ci&&after.band==='CERTAINTY',
     before.ci.toFixed(2)+' -> '+after.ci.toFixed(2)+' band '+after.band);
})();

var eb=document.getElementById('err-banner');
ok('no crash banner',!eb,eb?eb.textContent.slice(0,160):'');
}catch(e){fail++;out.push('FAIL  THREW: '+(e&&e.message));out.push(String(e&&e.stack).split('\n').slice(0,4).join(' | '));}
var hdr=(fail===0?'SDTEST ALL-PASS':'SDTEST FAILURES')+' pass='+pass+' fail='+fail;
var pre2=document.createElement('pre');pre2.id='test-out';
pre2.textContent='==SDTEST-BEGIN==\n'+hdr+'\n'+out.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre2);document.title=hdr;
})();

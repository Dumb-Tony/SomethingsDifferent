/* FINAL VERIFICATION of the ITEM-1 spec, run exactly as written. */
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

/* -- THE FUNCTION, exactly as specified -- */
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
  return {n:n,knows:knows,ci:den?num/den:0,
          band:anyC?'CERTAINTY':(anyD?'DOUBT':'MISSED')};
}

/* -- THE MARKUP, exactly as specified -- */
var hud=el('hud');
var pill=document.createElement('div');
pill.className='pill';pill.id='collapse-pill';pill.style.display='none';
pill.innerHTML='COLLAPSE <b id="collapse-v">0.0</b><span id="collapse-fc"></span>'+
               '<span class="ds-dim" id="collapse-bar"> / 40</span>'+
               '<span id="collapse-know"></span>';
hud.insertBefore(pill,hud.firstElementChild);
/* -- THE CSS EDITS, exactly as specified -- */
var st=document.createElement('style');
st.textContent='#hud{left:0;right:0;transform:none;justify-content:center;flex-wrap:wrap;'+
               'row-gap:8px;padding:0 10px;box-sizing:border-box}.pill{white-space:nowrap}';
document.head.appendChild(st);

/* -- THE updateHUD BLOCK, exactly as specified -- */
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
  el('collapse-know').textContent=fc.knows
    ?(String.fromCharCode(32,183,32)+fc.knows+' WILL KNOW'):'';
}
function txt(){return el('collapse-pill').textContent;}
function hh(){return Math.round(el('collapse-pill').getBoundingClientRect().height);}
function ww(){return Math.round(el('collapse-pill').getBoundingClientRect().width);}

/* 1. HIDDEN OFF THE STREET */
SD.toTitle();paint();
ok('hidden on the title screen',el('collapse-pill').style.display==='none',SD.S.phase);

/* 2. NIGHT, NOTHING DONE */
SD.startHouse();SD.beginNight();paint();
info('night, empty ledger: "'+txt()+'"  '+ww()+'x'+hh());
ok('shows the score and the bar',txt()==='COLLAPSE 0.0 / 40',txt());
ok('no forecast segment with an empty ledger',el('collapse-fc').textContent==='');
ok('single line',hh()<32,hh()+'px');

/* 3. THE RAIL CASE - one shop-top-row swap */
var walt=O.filter(function(o){return o.owner==='walt';})[0];
SD.scanObject(walt);
var top=SD.shopStock(walt.id,'bulwark')[0];
info('bulwark top row for '+walt.label+' = '+top.sim.toFixed(1)+'%');
SD.INV.push({kind:top.kind,spec:top.spec,forId:walt.id,label:top.label,sim:top.sim});
SD.swapWith(walt,SD.invFor(walt.id).length-1);
paint();
info('after ONE top-row swap: "'+txt()+'"  '+ww()+'x'+hh()+'  fc class='+el('collapse-fc').className);
ok('THE RAIL CASE READS AS WORTHLESS',/COLLAPSE 0\.0 . 0\.0 \/ 40/.test(txt()),txt());
ok('...in the MISSED grey',el('collapse-fc').className==='k-miss');
ok('...and the arrow proves the ledger is not empty',el('collapse-fc').textContent.length>0);

/* 4. A REAL NIGHT - four fabricator swaps across four houses */
SD.startHouse();SD.beginNight();
var picks=[],seen={};
for(var i=0;i<O.length&&picks.length<4;i++){
  var q=O[i];if(!q.owner||!R[q.owner]||seen[q.owner])continue;seen[q.owner]=1;picks.push(q);}
var moved=[];
picks.forEach(function(o){
  SD.scanObject(o);if(!SD.fabricate(o))return;
  SD.swapWith(o,SD.invFor(o.id).length-1);
  paint();moved.push(txt()+'   ['+el('collapse-fc').className+'] '+ww()+'x'+hh());
});
moved.forEach(function(s,k){info('swap '+(k+1)+': '+s);});
ok('THE PILL MOVED DURING THE NIGHT',moved[0]!==moved[moved.length-1]);
ok('a CERTAINTY in the ledger is named, not just coloured',
   /WILL KNOW/.test(txt())&&el('collapse-know').className==='k-cert',txt());
ok('...and every state is still one line',hh()<32,hh()+'px');
var fcSaid=nightForecast();

/* 5. THE FORECAST IS THE TRUTH */
SD.doMorning();
info('forecast said '+fcSaid.ci.toFixed(6)+', dawn produced '+SD.collapseIndex().toFixed(6));
ok('FORECAST == what doMorning actually writes',
   Math.abs(fcSaid.ci-SD.collapseIndex())<1e-9,
   'err '+(SD.collapseIndex()-fcSaid.ci).toExponential(2));
ok('the forecast does not mutate anybody',
   (function(){var b=R.walt.doubt;nightForecast();nightForecast();return R.walt.doubt===b;})());

/* 6. AFTERNOON + EVENING */
SD.startWalk();paint();
info('afternoon: "'+txt()+'"  S.phase='+SD.S.phase+' PENDING='+SD.PENDING.length);
ok('the pill survives into daylight',el('collapse-pill').style.display==='');
ok('...and drops the forecast, because the ledger is empty',
   el('collapse-fc').textContent===''&&el('collapse-know').textContent==='',txt());
SD.endWalk();SD.startEvening();paint();
info('evening: "'+txt()+'"');
ok('the pill survives the evening',el('collapse-pill').style.display==='');
SD.endEvening();

/* 7. THE DAY SCREEN AGREES */
SD.showDay();
var dp=document.querySelector('.dy-prog').textContent.replace(/\s+/g,' ');
info('day screen .dy-prog: '+dp.substring(0,90));
info('pill:               '+txt());
ok('same number, same bar, same word',
   dp.indexOf('COLLAPSE'+SD.collapseIndex().toFixed(1)+' / '+SD.winBar().toFixed(0))>=0,
   dp.substring(0,40));

/* 8. THE BAR FOLLOWS THE DIFFICULTY PRESET */
['gentle','standard','harsh'].forEach(function(d){
  SD.OPT.setDiff(d);paint();
  info(d+': winBar='+SD.winBar()+'  pill="'+txt()+'"');
});
SD.OPT.setDiff('standard');

/* 9. GEOMETRY IN THE WORST STATE */
SD.startHouse();SD.beginNight();
picks.forEach(function(o){var f=SD.fabricate(o);if(f)SD.swapWith(o,SD.invFor(o.id).length-1);});
SD.WIFE.following=true;SD.WIFE.followT=0.4;SD.S.freeze=3.2;SD.updateHUD(1);paint();
var kids=[].slice.call(hud.children).filter(function(x){return x.offsetWidth>0;});
info('worst state at '+window.innerWidth+'px: hud='+Math.round(hud.getBoundingClientRect().width)+
     'x'+Math.round(hud.getBoundingClientRect().height)+'  '+
     kids.map(function(x){return x.id+'='+Math.round(x.getBoundingClientRect().width);}).join(' '));
ok('NO PILL WRAPS with Dana out, freeze held and a full ledger',
   kids.every(function(x){return x.getBoundingClientRect().height<32;}));
SD.WIFE.following=false;SD.S.freeze=0;

/* 10. THE ARROW GLYPH IS NOT TOFU */
var cv=document.createElement('canvas').getContext('2d');
var ff=getComputedStyle(el('collapse-pill')).fontFamily;
cv.font='700 12px '+ff;
var aw=cv.measureText(String.fromCharCode(8594)).width;
var tw=cv.measureText(String.fromCharCode(0xFFFF)).width;
info('font='+ff);
info('advance U+2192 = '+aw.toFixed(2)+'px ; guaranteed-missing glyph = '+tw.toFixed(2)+'px');
ok('the arrow is a real glyph, not the notdef box',aw>0&&Math.abs(aw-tw)>0.01);

}catch(e){fail++;out.push('FAIL  THREW: '+(e&&e.message));out.push(String(e&&e.stack));}
var hdr=(fail===0?'SDTEST ALL-PASS':'SDTEST FAILURES')+' pass='+pass+' fail='+fail;
var pre2=document.createElement('pre');pre2.id='test-out';
pre2.textContent='==SDTEST-BEGIN==\n'+hdr+'\n'+out.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre2);document.title=hdr;
})();

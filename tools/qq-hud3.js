(function(){
var L=[];function p(s){L.push(String(s));}
function f1(x){return (Math.round(x*10)/10).toFixed(1);}
function el(id){return document.getElementById(id);}
try{
  var SD=window.__SD,C=SD.CONST,R=SD.RESIDENTS,D=SD.DOUBT,O=SD.objects;
  SD.stopLoop();
  function clamp(v,a,b){return v<a?a:(v>b?b:v);}

  /* ===== THE PROPOSED FUNCTION, verbatim ===== */
  function nightForecast(){
    var clone={},n=0,anyD=false,anyC=false;
    for(var i=0;i<SD.PENDING.length;i++){
      var pe=SD.PENDING[i],o=SD.objectById(pe.objId);
      if(!o)continue;
      var src=R[o.owner];if(!src)continue;
      var c=clone[o.owner]||(clone[o.owner]=Object.assign({},src));
      var r=D.resolve(c,{kind:o.kind,spec:pe.before,attach:o.attach,marked:o.marked,fresh:o.fresh},o.spec);
      c.doubt =clamp((c.doubt ||0)+r.doubt ,0,100);
      c.stress=clamp((c.stress||0)+r.stress,0,100);
      n++;
      if(r.band==='DOUBT')anyD=true;else if(r.band==='CERTAINTY')anyC=true;
    }
    var num=0,den=0;
    Object.keys(R).forEach(function(id){
      if(!O.some(function(o){return o.owner===id;}))return;
      var r=clone[id]||R[id];
      num+=(r.doubt||0)*r.credibility;den+=r.credibility;
    });
    return {n:n,ci:den?num/den:0,band:anyC?'CERTAINTY':(anyD?'DOUBT':'MISSED')};
  }

  /* ===== 1. the rail case: ONE 97% swap a night, ten nights ===== */
  SD.startHouse();SD.beginNight();
  var hoyt=O.filter(function(o){return o.owner==='walt'||o.owner==='june';});
  p('== THE RAIL CASE: one shop-top-row (97%) swap per night, 5 nights ==');
  for(var night=0;night<5;night++){
    var o=hoyt[night%hoyt.length];
    SD.scanObject(o);
    var stock=SD.shopStock(o.id,'bulwark');
    var top=stock[0];
    SD.INV.push({kind:top.kind,spec:top.spec,forId:o.id,label:top.label,sim:top.sim});
    SD.swapWith(o,SD.invFor(o.id).length-1);
    var fc=nightForecast();
    p('  night '+SD.GAME.day+'  bought '+f1(top.sim)+'%  ->  PILL: COLLAPSE '+
      f1(SD.collapseIndex())+' -> '+f1(fc.ci)+' / '+SD.winBar()+
      '   ('+fc.n+' touched, worst band '+fc.band+')');
    SD.doMorning();
    p('           after dawn collapseIndex = '+f1(SD.collapseIndex()));
    SD.nightReset&&SD.nightReset();
  }

  /* ===== 2. the good case: 4 objects across the street ===== */
  p('');
  p('== THE INTENDED CASE: 4 objects, different houses, fabricator prints ==');
  SD.startHouse();SD.beginNight();
  var picks=[],seen={};
  for(var i=0;i<O.length&&picks.length<4;i++){
    var q=O[i];if(!q.owner||!R[q.owner]||seen[q.owner])continue;seen[q.owner]=1;picks.push(q);
  }
  p('  before any swap: forecast n='+nightForecast().n+' ci='+f1(nightForecast().ci));
  picks.forEach(function(o,k){
    SD.scanObject(o);
    if(!SD.fabricate(o))return;
    SD.swapWith(o,SD.invFor(o.id).length-1);
    var fc=nightForecast();
    p('  swap '+(k+1)+' ('+o.owner+'/'+o.label+')  PILL: COLLAPSE '+f1(SD.collapseIndex())+
      ' -> '+f1(fc.ci)+' / 40   n='+fc.n+'  band='+fc.band);
  });
  var pre=nightForecast();
  SD.doMorning();
  p('  ACTUAL after dawn = '+f1(SD.collapseIndex())+'   forecast said '+f1(pre.ci)+
    '   error='+f1(SD.collapseIndex()-pre.ci));
  p('  RESIDENTS untouched by the forecast? walt.doubt='+f1(R.walt.doubt)+
    ' (forecast ran '+ (nightForecast().n) +' times since)');

  /* ===== 3. pill widths, real strings, and WRAPPING ===== */
  p('');
  p('== PILL GEOMETRY at '+window.innerWidth+'px ==');
  SD.startHouse();SD.beginNight();SD.updateHUD(1);
  var hud=el('hud');
  var pill=document.createElement('div');
  pill.className='pill';pill.id='collapse-pill';
  hud.insertBefore(pill,el('mode-pill'));
  function W(html){pill.innerHTML=html;var r=pill.getBoundingClientRect();
    return Math.round(r.width)+'x'+Math.round(r.height);}
  p('  A  COLLAPSE 0.0 / 40                        '+W('COLLAPSE <b>0.0</b><span class="ds-dim"> / 40</span>'));
  p('  B  COLLAPSE 0.0 -> 0.0 / 40                 '+W('COLLAPSE <b>0.0</b> <span class="k-miss">&rarr; 0.0</span><span class="ds-dim"> / 40</span>'));
  p('  C  COLLAPSE 12.4 -> 24.2 / 40               '+W('COLLAPSE <b>12.4</b> <span class="k-doubt">&rarr; 24.2</span><span class="ds-dim"> / 40</span>'));
  p('  D  C + " . 1 MISSED"                        '+W('COLLAPSE <b>0.0</b> <span class="k-miss">&rarr; 0.0</span><span class="ds-dim"> / 40</span><span class="ds-dim"> &middot; </span><span class="k-miss">1 MISSED</span>'));
  p('  E  C + " . 2 DOUBT 1 CERTAINTY"             '+W('COLLAPSE <b>12.4</b> <span class="k-cert">&rarr; 24.2</span><span class="ds-dim"> / 40</span><span class="ds-dim"> &middot; </span><span class="k-doubt">2 DOUBT</span> <span class="k-cert">1 CERTAINTY</span>'));
  p('  F  C + " . 2D 1C 3M"                        '+W('COLLAPSE <b>12.4</b> <span class="k-cert">&rarr; 24.2</span><span class="ds-dim"> / 40</span><span class="ds-dim"> &middot; </span><span class="k-doubt">2D</span> <span class="k-cert">1C</span> <span class="k-miss">3M</span>'));
  p('  G  C + " . 4 TOUCHED"                       '+W('COLLAPSE <b>12.4</b> <span class="k-doubt">&rarr; 24.2</span><span class="ds-dim"> / 40</span><span class="ds-dim"> &middot; 4 TOUCHED</span>'));

  function row(tag){
    var kids=[].slice.call(hud.children).filter(function(k){return k.offsetWidth>0;});
    p('  '+tag+' hudW='+Math.round(hud.getBoundingClientRect().width)+
      ' hudH='+Math.round(hud.getBoundingClientRect().height)+
      '  '+kids.map(function(k){return k.id+'='+Math.round(k.getBoundingClientRect().width)+
        'x'+Math.round(k.getBoundingClientRect().height);}).join(' '));
  }
  pill.innerHTML='COLLAPSE <b>12.4</b> <span class="k-doubt">&rarr; 24.2</span><span class="ds-dim"> / 40</span>';
  SD.updateHUD(1);row('night+pill       ');
  SD.WIFE.following=true;SD.WIFE.followT=0.4;SD.S.freeze=3.2;SD.updateHUD(1);
  row('night+pill+dana+fz');
  p('  (a pill taller than ~29px has WRAPPED)');
  SD.WIFE.following=false;SD.S.freeze=0;

  /* what the clamp is: #hud is left:50% + translateX(-50%) */
  var cs=getComputedStyle(hud);
  p('  #hud computed: left='+cs.left+' transform='+cs.transform+' flexWrap='+cs.flexWrap+
    ' gap='+cs.gap+'  available='+(window.innerWidth/2)+'px');
}catch(e){p('THREW: '+(e&&e.message)+'\n'+(e&&e.stack));}
var pre2=document.createElement('pre');pre2.id='test-out';
pre2.textContent='==SDTEST-BEGIN==\nSDTEST ALL-PASS pass=0 fail=0\n'+L.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre2);document.title='SDTEST ALL-PASS pass=0 fail=0';
})();

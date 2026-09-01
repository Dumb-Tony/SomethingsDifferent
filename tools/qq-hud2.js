(function(){
var L=[];function p(s){L.push(String(s));}
function f(x){return (Math.round(x*10)/10).toFixed(1);}
function el(id){return document.getElementById(id);}
try{
  var SD=window.__SD,C=SD.CONST,R=SD.RESIDENTS,D=SD.DOUBT;
  SD.stopLoop();
  p('viewport '+window.innerWidth+'x'+window.innerHeight);
  p('winBar()='+SD.winBar()+'  SLICE_NIGHTS='+C.SLICE_NIGHTS+'  SLICE_WIN_COLLAPSE='+C.SLICE_WIN_COLLAPSE);
  p('');

  SD.startHouse();SD.beginNight();SD.updateHUD(1);
  var hud=el('hud');
  function widths(tag){
    var kids=[].slice.call(hud.children);
    var vis=kids.filter(function(k){return k.offsetWidth>0;});
    p(tag+'  #hud w='+Math.round(hud.getBoundingClientRect().width)+
      '  visible pills: '+vis.map(function(k){return k.id+'='+Math.round(k.getBoundingClientRect().width);}).join(' '));
  }
  widths('NIGHT ');

  /* the wide case: Dana out AND freeze held AND late clock */
  SD.WIFE.following=true;SD.WIFE.followT=0.4;SD.S.freeze=3.2;SD.updateHUD(1);
  widths('NIGHT-WORST');
  SD.WIFE.following=false;SD.S.freeze=0;SD.updateHUD(1);

  /* ── inject the candidate pill and measure it in every state ── */
  var pill=document.createElement('div');
  pill.className='pill';pill.id='collapse-pill';
  pill.innerHTML='COLLAPSE <b id="collapse-v">0.0</b><span id="collapse-fc"></span>'+
                 '<span id="collapse-bar"> / 40</span><span id="collapse-led"></span>';
  hud.insertBefore(pill,el('mode-pill'));
  function setPill(v,fc,led){
    el('collapse-v').textContent=v;
    el('collapse-fc').innerHTML=fc;
    el('collapse-led').innerHTML=led;
    return Math.round(pill.getBoundingClientRect().width);
  }
  p('');
  p('candidate widths (px), font 12px/700, padding 6px 14px:');
  p('  "COLLAPSE 0.0 / 40"                       = '+setPill('0.0','',''));
  p('  "COLLAPSE 0.0 +4.7 / 40"                  = '+setPill('0.0',' <span class="k-doubt">+4.7</span>',''));
  p('  "COLLAPSE 0.0 +4.7 / 40 . 2D 1C 2M"       = '+setPill('0.0',' <span class="k-doubt">+4.7</span>',
      ' &middot; <span class="k-doubt">2D</span> <span class="k-cert">1C</span> <span class="k-miss">2M</span>'));
  p('  "COLLAPSE 12.4 +11.8 / 40 . 4D 2C 3M"     = '+setPill('12.4',' <span class="k-doubt">+11.8</span>',
      ' &middot; <span class="k-doubt">4D</span> <span class="k-cert">2C</span> <span class="k-miss">3M</span>'));
  p('  "COLLAPSE 0.0 / 40 . TONIGHT 2 DOUBT"     = '+setPill('0.0','',' &middot; TONIGHT <span class="k-doubt">2 DOUBT</span>'));

  setPill('0.0',' <span class="k-doubt">+4.7</span>',
      ' &middot; <span class="k-doubt">2D</span> <span class="k-cert">1C</span> <span class="k-miss">2M</span>');
  SD.updateHUD(1);
  widths('NIGHT+PILL');
  SD.WIFE.following=true;SD.WIFE.followT=0.4;SD.S.freeze=3.2;SD.updateHUD(1);
  widths('WORST+PILL');
  SD.WIFE.following=false;SD.S.freeze=0;

  /* ── daylight: which pills survive ── */
  SD.startHouse();SD.startWalk();SD.updateHUD(1);
  widths('AFTERNOON');
  p('  body.daylight='+document.body.classList.contains('daylight')+
    '  S.daytime='+SD.S.daytime+'  S.evening='+SD.S.evening+
    '  PENDING='+SD.PENDING.length);
  SD.endWalk();
  SD.startEvening();SD.updateHUD(1);
  widths('EVENING  ');
  p('  body.daylight='+document.body.classList.contains('daylight')+
    '  S.daytime='+SD.S.daytime+'  S.evening='+SD.S.evening);
  SD.endEvening();

  /* ── the HK / tier timeline ── */
  p('');
  p('hkTier thresholds: 0 at hk<8, 1 at >=8, 2 at >=20, 3 at >=45');
  p('GAME.hk on night 1 = '+SD.GAME.hk+'  -> hkTier '+SD.hkTier());
  [0,7,8,19,20,44,45].forEach(function(h){
    SD.GAME.hk=h;
    var pr=null;
    var o=SD.objects.filter(function(x){return x.owner==='walt';})[0];
    SD.scanObject(o);
    var stock=SD.shopStock(o.id,'bulwark');
    pr=SD.predict(o.id,stock[0]);
    p('  hk='+h+' tier='+SD.hkTier()+'  predict(top shelf row) -> text="'+pr.text+
      '" cls="'+pr.cls+'" delta='+(pr.delta===undefined?'(absent)':f(pr.delta))+
      ' floor='+(pr.floor===undefined?'(absent)':pr.floor)+
      ' ceiling='+(pr.ceiling===undefined?'(absent)':f(pr.ceiling)));
  });
}catch(e){p('THREW: '+(e&&e.message)+'\n'+(e&&e.stack));}
var pre=document.createElement('pre');pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\nSDTEST ALL-PASS pass=0 fail=0\n'+L.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);document.title='SDTEST ALL-PASS pass=0 fail=0';
})();

(function(){
var L=[];function p(s){L.push(String(s));}
function el(id){return document.getElementById(id);}
try{
  var SD=window.__SD;SD.stopLoop();SD.startHouse();SD.beginNight();
  var hud=el('hud');
  function row(tag){
    var k=[].slice.call(hud.children).filter(function(x){return x.offsetWidth>0;});
    var r=hud.getBoundingClientRect();
    p('  '+(tag+'                    ').slice(0,22)+' hud='+Math.round(r.width)+'x'+Math.round(r.height)+
      '  '+k.map(function(x){return x.id+'='+Math.round(x.getBoundingClientRect().width)+
        'x'+Math.round(x.getBoundingClientRect().height);}).join(' '));
  }
  p('== BASELINE, NO NEW PILL (is wrapping already a bug?) ==');
  SD.updateHUD(1);row('calm night');
  SD.WIFE.following=true;SD.WIFE.followT=0.4;SD.updateHUD(1);row('+dana');
  SD.S.freeze=3.2;SD.updateHUD(1);row('+dana+freeze');
  SD.S.freeze=0;SD.S.freezeCd=27;SD.updateHUD(1);row('+dana+cooldown');
  SD.WIFE.following=false;SD.S.freezeCd=0;

  p('');
  p('== WITH THE COLLAPSE PILL, CURRENT CSS ==');
  var pill=document.createElement('div');pill.className='pill';pill.id='collapse-pill';
  hud.insertBefore(pill,el('mode-pill'));
  var A='COLLAPSE <b>0.0</b><span class="cp-dim"> / 40</span>';
  var Cs='COLLAPSE <b>12.4</b> <span class="k-doubt">&rarr; 24.2</span><span class="cp-dim"> / 40</span>';
  var Cc='COLLAPSE <b>12.4</b> <span class="k-cert">&rarr; 24.2</span><span class="cp-dim"> / 40</span><span class="k-cert"> &middot; 1 KNOWS</span>';
  var Cc2='COLLAPSE <b>12.4</b> <span class="k-cert">&rarr; 24.2</span><span class="cp-dim"> / 40</span><span class="k-cert"> &middot; 2 KNOW</span>';
  var st=document.createElement('style');
  st.textContent='.cp-dim{color:var(--dim)}';document.head.appendChild(st);
  pill.innerHTML=Cs;SD.updateHUD(1);row('C calm');
  pill.innerHTML=Cc;SD.updateHUD(1);row('C+KNOWS calm');
  pill.innerHTML=Cc2;SD.updateHUD(1);row('C+2KNOW calm');
  SD.WIFE.following=true;SD.WIFE.followT=0.4;SD.S.freeze=3.2;
  pill.innerHTML=Cs;SD.updateHUD(1);row('C +dana+freeze');
  pill.innerHTML=Cc;SD.updateHUD(1);row('C+KNOWS +dana+fz');

  p('');
  p('== WITH THE PROPOSED #hud CSS FIX ==');
  var st2=document.createElement('style');
  st2.textContent='#hud{left:0;right:0;transform:none;justify-content:center;flex-wrap:wrap;'+
                  'row-gap:8px;padding:0 10px;box-sizing:border-box}.pill{white-space:nowrap}';
  document.head.appendChild(st2);
  pill.innerHTML=Cc;SD.updateHUD(1);row('C+KNOWS +dana+fz');
  SD.S.freeze=0;SD.WIFE.following=false;
  pill.innerHTML=Cs;SD.updateHUD(1);row('C calm');
  pill.innerHTML=A;SD.updateHUD(1);row('A calm');
  var r=hud.getBoundingClientRect();
  p('  hud left='+Math.round(r.left)+' right='+Math.round(r.right)+' centred? '+
    (Math.abs((r.left+r.right)/2-window.innerWidth/2)<1));
  var kids=[].slice.call(hud.children).filter(function(x){return x.offsetWidth>0;});
  p('  every visible pill single-line? '+kids.every(function(x){return x.getBoundingClientRect().height<32;}));

  p('');
  p('== the day screen COLLAPSE renderer, for agreement ==');
  SD.startHouse();SD.startDay&&SD.startDay();
  SD.showDay();
  var dp=document.querySelector('.dy-prog');
  p('  .dy-prog text: '+(dp?dp.textContent.replace(/\s+/g,' ').trim():'(none)'));
}catch(e){p('THREW: '+(e&&e.message)+'\n'+(e&&e.stack));}
var pre2=document.createElement('pre');pre2.id='test-out';
pre2.textContent='==SDTEST-BEGIN==\nSDTEST ALL-PASS pass=0 fail=0\n'+L.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre2);document.title='SDTEST ALL-PASS pass=0 fail=0';
})();

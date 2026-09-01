/* Geometry of the WIDEST pill state in the WORST HUD state, before and after the CSS edit. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}
function el(id){return document.getElementById(id);}
try{
var SD=window.__SD;SD.stopLoop();SD.startHouse();SD.beginNight();
var hud=el('hud');
var pill=document.createElement('div');
pill.className='pill';pill.id='collapse-pill';
pill.innerHTML='COLLAPSE <b>38.9</b><span class="k-cert">'+String.fromCharCode(32,8594,32)+
  '41.2</span><span class="ds-dim"> / 48</span><span class="k-cert">'+
  String.fromCharCode(32,183,32)+'3 WILL KNOW</span>';
hud.insertBefore(pill,hud.firstElementChild);
function row(tag){
  var k=[].slice.call(hud.children).filter(function(x){return x.offsetWidth>0;});
  var r=hud.getBoundingClientRect();
  info((tag+'                  ').substring(0,20)+' hud='+Math.round(r.width)+'x'+Math.round(r.height)+
       '   '+k.map(function(x){return x.id+'='+Math.round(x.getBoundingClientRect().width)+
         'x'+Math.round(x.getBoundingClientRect().height);}).join(' '));
  return k;
}
info('widest pill string: "'+pill.textContent+'"');
SD.WIFE.following=true;SD.WIFE.followT=0.4;SD.S.freeze=3.2;SD.updateHUD(1);
var before=row('BEFORE css edit');
ok('WITHOUT the CSS edit the HUD wraps text inside pills (the trap)',
   before.some(function(x){return x.getBoundingClientRect().height>=32;}),
   'tallest '+Math.max.apply(null,before.map(function(x){return Math.round(x.getBoundingClientRect().height);}))+'px');
var st=document.createElement('style');
st.textContent='#hud{left:0;right:0;transform:none;justify-content:center;flex-wrap:wrap;'+
               'row-gap:8px;padding:0 10px;box-sizing:border-box}.pill{white-space:nowrap}';
document.head.appendChild(st);
SD.updateHUD(1);
var after=row('AFTER css edit');
var sum=after.reduce(function(a,x){return a+x.getBoundingClientRect().width;},0);
info('pill widths sum='+Math.round(sum)+'  + gaps '+((after.length-1)*8)+
    ' = '+Math.round(sum+(after.length-1)*8)+'px of '+window.innerWidth+'px available');
ok('every pill single-line after the edit',
   after.every(function(x){return x.getBoundingClientRect().height<32;}),
   'tallest '+Math.max.apply(null,after.map(function(x){return Math.round(x.getBoundingClientRect().height);}))+'px');
ok('the whole HUD still fits on ONE row at 1262px',
   Math.round(hud.getBoundingClientRect().height)<32,
   Math.round(hud.getBoundingClientRect().height)+'px');
var r=hud.getBoundingClientRect();
ok('and it is still centred',Math.abs((r.left+r.right)/2-window.innerWidth/2)<1);
}catch(e){fail++;out.push('FAIL  THREW: '+(e&&e.message));out.push(String(e&&e.stack));}
var hdr=(fail===0?'SDTEST ALL-PASS':'SDTEST FAILURES')+' pass='+pass+' fail='+fail;
var pre2=document.createElement('pre');pre2.id='test-out';
pre2.textContent='==SDTEST-BEGIN==\n'+hdr+'\n'+out.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre2);document.title=hdr;
})();

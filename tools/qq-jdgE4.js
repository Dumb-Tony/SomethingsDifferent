/* qq-jdgE4 - the same placement question, measured with getBoundingClientRect so the
   offsetParent cannot flatter either answer. */
(function(){
var L=[];function p(s){L.push(s);}
try{
var SD=window.__SD,C=SD.CONST;
SD.stopLoop();
var st=document.createElement('style');
st.textContent='.rp-pace{color:var(--dim);font-size:13px;line-height:1.5;margin-top:10px;'+
'padding-top:9px;border-top:1px solid var(--line)}.rp-pace b{color:var(--text)}';
document.head.appendChild(st);
p('viewport '+innerWidth+'x'+innerHeight);
SD.startHouse();SD.GUIDE.setOn(false);SD.GAME.hk=99;SD.GAME.bank=100000;
var did=0;
for(var i=0;i<SD.objects.length&&did<4;i++){
  var o=SD.objects[i];if(!o||!SD.RESIDENTS[o.owner])continue;
  SD.scanObject(o);
  var stk=SD.shopStock(o.id,'bulwark')||[];
  if(stk.length<3)continue;
  SD.buyVariant(o.id,2,'bulwark');
  var bag=SD.invFor(o.id);if(!bag.length)continue;
  SD.swapWith(o,bag.length-1);did++;
}
SD.showReport('home','You are back before anyone stirs.');
var body=document.getElementById('report-body');
var br=body.getBoundingClientRect();
p('swaps '+did+'   report body rect top '+br.top.toFixed(0)+' bottom '+br.bottom.toFixed(0)+
  '  (visible '+body.clientHeight+'px of '+body.scrollHeight+'px content)');
var pace=document.createElement('div');
pace.className='rp-pace';
pace.innerHTML='That was <b>'+did+'</b> things in one night. <b>4</b> a night is the '+
  'pace that reaches 40 by night 10 &mdash; you are averaging <b>4.0</b>.';
function where(tag){
  var r=pace.getBoundingClientRect();
  p('  '+tag+': pace rect top '+r.top.toFixed(0)+' bottom '+r.bottom.toFixed(0)+
    '  -> '+(r.top>=br.top-1&&r.bottom<=br.bottom+1?'INSIDE the visible window'
      :'OUTSIDE - '+(r.bottom-br.bottom).toFixed(0)+'px below the cut, needs scrolling'));
}
body.insertBefore(pace,body.querySelector('.rp-foot'));
where('EDIT 8 as written (last, before rp-foot)');
var first=body.querySelector('.rp-item');
body.insertBefore(pace,first.nextSibling);
where('after the HOME BEFORE DAWN header card');
/* and how bad does it get on a 2-swap night, the rail-follower default? */
p('  rp-foot rect bottom '+document.querySelector('.rp-foot').getBoundingClientRect()
  .bottom.toFixed(0)+' vs body bottom '+br.bottom.toFixed(0)+
  '  (the existing Day/sightings footer is itself below the fold)');
}catch(e){p('THREW: '+(e&&e.message)+' @ '+String((e&&e.stack)||'').split('\n').slice(0,4).join(' | '));}
var pre=document.createElement('pre');pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\nSDTEST ALL-PASS pass=0 fail=0\n'+L.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);document.title='SDTEST ALL-PASS pass=0 fail=0';
})();

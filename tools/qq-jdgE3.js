/* qq-jdgE3 - WHERE DOES THE PACE LINE LAND? EDIT 8 appends .rp-pace at the very end
   of the report body, after every result card, every gloss, fractures, gossip and
   hardening. #report-body is capped at calc(100vh - 300px) with overflow:auto, so
   "at the end" may mean "below the fold on the nights that matter". Measure it. */
(function(){
var L=[];function p(s){L.push(s);}
try{
var SD=window.__SD,C=SD.CONST;
SD.stopLoop();
var st=document.createElement('style');
st.textContent=
'.dy-pace{margin-top:8px;padding-top:7px;border-top:1px solid var(--line);'+
'font-size:12px;line-height:1.5;color:var(--dim)}'+
'.dy-pace .dy-pk{font-family:var(--font-mono);font-size:10px;letter-spacing:1.2px;'+
'color:var(--dim);margin-right:8px}'+
'.dy-pace b{color:var(--text)}'+
'.dy-pace b.dy-pt,.rp-pace b.dy-pt{color:var(--warm)}'+
'.rp-pace{color:var(--dim);font-size:13px;line-height:1.5;margin-top:10px;'+
'padding-top:9px;border-top:1px solid var(--line)}'+
'.rp-pace b{color:var(--text)}';
document.head.appendChild(st);
p('viewport '+innerWidth+'x'+innerHeight);

/* ── a four-swap night, the pace the spec tells you to hit ── */
SD.startHouse();SD.GUIDE.setOn(false);
SD.GAME.hk=99;SD.GAME.bank=100000;
var did=0;
for(var i=0;i<SD.objects.length&&did<4;i++){
  var o=SD.objects[i];if(!o||!SD.RESIDENTS[o.owner])continue;
  SD.scanObject(o);
  var stk=SD.shopStock(o.id,'bulwark')||[];
  if(stk.length<3)continue;
  SD.buyVariant(o.id,2,'bulwark');            // a middling rung, so bands vary
  var bag=SD.invFor(o.id);if(!bag.length)continue;
  SD.swapWith(o,bag.length-1);did++;
}
p('swaps staged: '+did);
SD.showReport('home','You are back before anyone stirs.');
var body=document.getElementById('report-body');
/* EDIT 8, as written: appended at the end, before rp-foot */
var foot=body.querySelector('.rp-foot');
var pace=document.createElement('div');
pace.className='rp-pace';
pace.innerHTML='That was <b>'+did+'</b> things in one night. <b class="dy-pt">4</b> '+
  'a night is the pace that reaches 40 by night 10 &mdash; you are averaging <b>4.0</b>.';
body.insertBefore(pace,foot);
var vis=body.clientHeight,tot=body.scrollHeight;
p('report body: visible '+vis+'px of '+tot+'px content   (overflow '+
  getComputedStyle(body).overflowY+', scrollTop '+body.scrollTop+')');
p('  cards in the report: '+body.querySelectorAll('.rp-item').length+
  '   glosses: '+body.querySelectorAll('.rp-gloss').length);
p('  AS SPECIFIED (appended last): .rp-pace top at '+pace.offsetTop+'px, bottom '+
  (pace.offsetTop+pace.offsetHeight)+'px  -> '+
  ((pace.offsetTop+pace.offsetHeight)<=vis?'VISIBLE without scrolling'
    :'BELOW THE FOLD - '+((pace.offsetTop+pace.offsetHeight)-vis)+'px past the cut'));
/* the alternative: straight after the HOME BEFORE DAWN header row */
var first=body.querySelector('.rp-item');
body.insertBefore(pace,first.nextSibling);
p('  AT THE TOP (after the header card): .rp-pace top at '+pace.offsetTop+'px, bottom '+
  (pace.offsetTop+pace.offsetHeight)+'px  -> '+
  ((pace.offsetTop+pace.offsetHeight)<=vis?'VISIBLE without scrolling':'below the fold'));

/* ── and the day screen strip ── */
SD.startHouse();SD.startDay();
SD.GAME.day=5;SD.WIFE.susp=38;SD.GAME.sightings=1;SD.GAME.hardened=['lights','dogs'];
SD.RESIDENTS.walt.doubt=48;SD.RESIDENTS.june.doubt=31;SD.RESIDENTS.marisol.doubt=27;
SD.DAY.block=3;SD.DAY.actions=2;
SD.showDay();
var db=document.getElementById('day-body');
var prog=db.querySelector('.dy-prog'),hard=db.querySelector('.dy-hard');
var dp=document.createElement('div');
dp.className='dy-pace';
dp.innerHTML='<span class="dy-pk">PACE</span><b>1.0</b> a night so far. '+
  '<b class="dy-pt">4</b> a night is what reaches 40 by night 10; 3 a night does not. '+
  '<span class="ds-dim">In different houses &mdash; collapse is their average, so one '+
  'household taken apart completely is worth 22 of 40.</span>';
prog.insertBefore(dp,hard);
p('day body: visible '+db.clientHeight+'px of '+db.scrollHeight+'px content');
p('  .dy-pace top '+dp.offsetTop+'px, bottom '+(dp.offsetTop+dp.offsetHeight)+'px  -> '+
  ((dp.offsetTop+dp.offsetHeight)<=db.clientHeight?'VISIBLE without scrolling'
    :'below the fold'));
var btn=document.getElementById('btn-day-next');
p('  CONTINUE button top '+btn.getBoundingClientRect().top.toFixed(0)+
  ', day body bottom '+db.getBoundingClientRect().bottom.toFixed(0)+
  '  -> '+(db.getBoundingClientRect().bottom<=btn.getBoundingClientRect().top+1
           ?'button clear':'BUTTON SWALLOWED'));
}catch(e){p('THREW: '+(e&&e.message)+' @ '+String((e&&e.stack)||'').split('\n').slice(0,4).join(' | '));}
var pre=document.createElement('pre');pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\nSDTEST ALL-PASS pass=0 fail=0\n'+L.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);document.title='SDTEST ALL-PASS pass=0 fail=0';
})();

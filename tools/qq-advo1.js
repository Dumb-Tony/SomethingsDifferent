/* qq-advo1 - verify the numbers the M57 spec's strings will print, against live state. */
(function(){
var L=[];function p(s){L.push(s);}
try{
var SD=window.__SD,C=SD.CONST;
SD.stopLoop();SD.startHouse();
var CURVE=[0,11.3,26.9,35.9,46.5,53.0];
function paceTarget(){var bar=SD.winBar();
  for(var n=1;n<CURVE.length;n++)if(CURVE[n]>=bar)return n;return CURVE.length-1;}
function oneHouseCeiling(){var rs=SD.activeResidents(),tot=0,top=0;
  rs.forEach(function(r){tot+=r.credibility;if(r.credibility>top)top=r.credibility;});
  return tot?100*top/tot:0;}
var was=SD.OPT.diff;
['gentle','standard','harsh'].forEach(function(d){
  SD.OPT.setDiff(d);
  p(d+': winBar '+SD.winBar().toFixed(0)+'  paceTarget '+paceTarget()+
    '  tgt-1 curve '+CURVE[paceTarget()-1]+' < bar? '+(CURVE[paceTarget()-1]<SD.winBar())+
    '  tgt curve '+CURVE[paceTarget()]+' >= bar? '+(CURVE[paceTarget()]>=SD.winBar()));
});
SD.OPT.setDiff(was);
var rs=SD.activeResidents(),tot=0,top=0,names=[];
rs.forEach(function(r){tot+=r.credibility;names.push(r.name+' '+r.credibility);
  if(r.credibility>top)top=r.credibility;});
p('activeResidents '+rs.length+'  credSum '+tot.toFixed(2)+'  top '+top.toFixed(2));
p('  '+names.join(' | '));
p('oneHouseCeiling '+oneHouseCeiling().toFixed(3)+'  toFixed(0)="'+oneHouseCeiling().toFixed(0)+'"');
p('SLICE_NIGHTS '+C.SLICE_NIGHTS+'  SLICE_WIN_COLLAPSE '+C.SLICE_WIN_COLLAPSE);
p('CONST.PACE_CURVE already defined? '+(C.PACE_CURVE!==undefined));
p('GAME.stats keys: '+Object.keys(SD.GAME.stats).join(','));
p('GAME.stats.resolved is '+SD.GAME.stats.resolved+'  |0 -> '+((SD.GAME.stats.resolved)|0));
/* the m36 assertion, against today's intro and against the spec's replacement */
var el=document.getElementById('s-intro');
var now=el.textContent.replace(/\s+/g,' ');
p('m36:35 TODAY  /a few things/i -> '+/a few things/i.test(now)+
  '   /different houses/i -> '+/different houses/i.test(now));
var after=now.replace('change a few things','change four things');
p('m36:35 AFTER  /a few things/i -> '+/a few things/i.test(after)+
  '   /different houses/i -> '+/different houses/i.test(after)+
  '   /four things/i -> '+/four things/i.test(after));
p('m36:31 AFTER  !/change one thing/i -> '+!/change one thing/i.test(after));
p('intro-pace node exists today? '+!!document.getElementById('intro-pace'));
/* guide step blob, with out.t/out.why as functions, against the negative regexes */
var steps=SD.GUIDE_STEPS.slice();
var outIdx=steps.map(function(s){return s.id;}).indexOf('out');
var fakeT=function(){var left=paceTarget()-SD.PENDING.length;
  return left>0?('Do <b>'+left+'</b> more, then home &mdash; <b>M</b>')
               :'Get home before dawn &mdash; <b>M</b>';};
var fakeWhy=function(){return '<b>'+SD.PENDING.length+'</b> of <b>'+paceTarget()+
  '</b> tonight. Four a night, in different houses, is what reaches '+
  SD.winBar().toFixed(0)+' by night '+C.SLICE_NIGHTS+' &mdash; one a night finishes on '+
  CURVE[1].toFixed(0)+'. Then read the morning report: that is where you find out what '+
  'they made of it.';};
steps[outIdx]={id:'out',t:fakeT,why:fakeWhy,done:function(){return true;}};
var all=steps.map(function(s){return s.t+' '+s.why;}).join(' ');
p('blob: !/upstairs/i '+!/upstairs/i.test(all)+
  '  !/Cross the street/i '+!/Cross the street/i.test(all)+
  '  !/two doors down/i '+!/two doors down/i.test(all)+
  '  !/any of the three/i '+!/any of the three/i.test(all)+
  '  /number 10/ '+/number 10/.test(all)+'  /number 8/ '+/number 8/.test(all));
p('m55: /\bG\b/ on new out.t -> '+/\bG\b/.test(fakeT)+
  '   /hold time/i -> '+/hold time/i.test(fakeT));
p('m11/m29/m39 truthiness: t '+(!!fakeT)+'  why '+(!!fakeWhy));
/* closing-card copy against m33 s3 */
var t33='0 of 4 tonight. '+C.SLICE_NIGHTS+' nights, '+rs.length+
  ' neighbours, and collapse is their average - one household taken apart completely '+
  'is worth '+oneHouseCeiling().toFixed(0)+' of '+SD.winBar().toFixed(0)+
  '. Get caught being certain too often and you lose anyway.';
p('m33 closing: !/Six neighbours/i '+!/Six neighbours/i.test(t33)+
  '  indexOf("'+rs.length+' neighbours") '+(t33.indexOf(rs.length+' neighbours')>=0)+
  '  indexOf("'+C.SLICE_NIGHTS+' nights") '+(t33.indexOf(C.SLICE_NIGHTS+' nights')>=0));
/* report/day container caps */
var rb=getComputedStyle(document.getElementById('report-body'));
var db=getComputedStyle(document.getElementById('day-body'));
p('#report-body max-height '+rb.maxHeight+' overflowY '+rb.overflowY+' display '+rb.display);
p('#day-body max-height '+db.maxHeight+' overflowY '+db.overflowY);
p('--warm = '+getComputedStyle(document.documentElement).getPropertyValue('--warm').trim());
/* export line target */
p('SD.winBar exported '+(typeof SD.winBar)+'  SD.syncDiffBtn '+(typeof SD.syncDiffBtn));
}catch(e){p('THREW: '+(e&&e.message)+' @ '+String((e&&e.stack)||'').split('\n').slice(0,3).join(' | '));}
var pre=document.createElement('pre');pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\nSDTEST ALL-PASS pass=0 fail=0\n'+L.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);document.title='SDTEST ALL-PASS pass=0 fail=0';
})();

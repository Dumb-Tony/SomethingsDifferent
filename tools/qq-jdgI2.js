/* Does the pill complete a solver on top of the similarity readout the focus panel
   ALREADY prints live (renderFocus line 8673, recalled after every nudge/rotate)? */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}
try{
var SD=window.__SD,C=SD.CONST,R=SD.RESIDENTS,D=SD.DOUBT,O=SD.objects;
SD.stopLoop();
var clamp=function(v,lo,hi){return v<lo?lo:(v>hi?hi:v);};
function fc(){
  var clone={},n=0,anyD=false,anyC=false;
  for(var i=0;i<SD.PENDING.length;i++){
    var p=SD.PENDING[i],o=SD.objectById(p.objId);if(!o)continue;
    var src=R[o.owner];if(!src)continue;
    var c=clone[o.owner]||(clone[o.owner]=Object.assign({},src));
    var r=D.resolve(c,{kind:o.kind,spec:p.before,attach:o.attach,marked:o.marked,fresh:o.fresh},o.spec);
    c.doubt=clamp((c.doubt||0)+r.doubt,0,100);c.stress=clamp((c.stress||0)+r.stress,0,100);
    n++;if(r.band==='DOUBT')anyD=true;else if(r.band==='CERTAINTY')anyC=true;
  }
  var num=0,den=0;
  Object.keys(R).forEach(function(id){
    if(!O.some(function(o){return o.owner===id;}))return;
    var rr=clone[id]||R[id];num+=(rr.doubt||0)*rr.credibility;den+=rr.credibility;});
  return {n:n,ci:den?num/den:0,band:anyC?'CERTAINTY':(anyD?'DOUBT':'MISSED')};
}
SD.startHouse();SD.beginNight();
var w=O.filter(function(o){return o.owner==='walt';})[0];
SD.scanObject(w);
SD.enterFocus(w);
info('HK='+SD.GAME.hk+'  hkTier='+SD.hkTier()+'  readTier(walt)='+SD.readTier('walt')+
     '   predict() at this tier = '+JSON.stringify(SD.predict(w.id,{spec:w.spec})));
info('');
info('  press X (turn 8 deg) and read the two things ALREADY on screen:');
info('  turn   focus panel says          pill would say');
var flipAt=null,prevSim=null;
for(var k=1;k<=7;k++){
  SD.rotateObject(w,8);
  var c=SD.CATALOG[w.id];
  SD.enterFocus(w);   // forces renderFocus(), exactly as focusKey does
  var fxt=document.getElementById("focus").textContent;
  var m=/Currently ([0-9.]+)% of the recorded state/.exec(fxt);
  var d={similarity:m?parseFloat(m[1]):-1};
  var f=fc();
  info('  '+(k*8)+'deg   '+d.similarity.toFixed(1)+'% of the recorded state    COLLAPSE 0.0 -> '+
       f.ci.toFixed(1)+'  ['+f.band+']');
  if(!flipAt&&f.band==='DOUBT')flipAt={sim:d.similarity,prev:prevSim,deg:k*8};
  prevSim=d.similarity;
}
info('');
if(flipAt)info('  SOLVED, at Human Knowledge 0: Walt stops walking past this object '+
               'somewhere between '+flipAt.prev.toFixed(1)+'% and '+flipAt.sim.toFixed(1)+
               '% similar. That is his notice floor, read off the HUD in '+(flipAt.deg/8)+' keypresses.');
info('  (Walt noticeFloor='+R.walt.noticeFloor+' doubtBand='+R.walt.doubtBand+
     ' attention='+R.walt.attention+' - none of which the player is ever shown.)');
ok('the pill + the existing similarity readout = a threshold solver at tier 0',!!flipAt);
info('');
info('  noise cost: N_HANDLE='+C.N_HANDLE+' per press, NOISE_DECAY='+C.NOISE_DECAY+
     ' per second per sleeper -> one press per second is net zero.');
ok('dialling is free at one press per second',C.N_HANDLE<=C.NOISE_DECAY,
   C.N_HANDLE+' <= '+C.NOISE_DECAY);
}catch(e){fail++;out.push('FAIL  THREW: '+(e&&e.message));out.push(String(e&&e.stack));}
var hdr=(fail===0?'SDTEST ALL-PASS':'SDTEST FAILURES')+' pass='+pass+' fail='+fail;
var pre2=document.createElement('pre');pre2.id='test-out';
pre2.textContent='==SDTEST-BEGIN==\n'+hdr+'\n'+out.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre2);document.title=hdr;
})();

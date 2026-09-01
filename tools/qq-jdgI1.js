/* ITEM-1 design probe: is the forecast an oracle you can dial? */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}
try{
var SD=window.__SD,C=SD.CONST,R=SD.RESIDENTS,D=SD.DOUBT,O=SD.objects;
SD.stopLoop();
var clamp=function(v,lo,hi){return v<lo?lo:(v>hi?hi:v);};
function nightForecast(){
  var clone={},knew={},n=0,anyD=false,anyC=false,knows=0;
  for(var i=0;i<SD.PENDING.length;i++){
    var p=SD.PENDING[i],o=SD.objectById(p.objId);
    if(!o)continue;
    var src=R[o.owner];if(!src)continue;
    var c=clone[o.owner]||(clone[o.owner]=Object.assign({},src));
    var r=D.resolve(c,{kind:o.kind,spec:p.before,attach:o.attach,marked:o.marked,fresh:o.fresh},o.spec);
    c.doubt=clamp((c.doubt||0)+r.doubt,0,100);
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
function pillStr(){var f=nightForecast();
  var s='COLLAPSE '+SD.collapseIndex().toFixed(1);
  if(f.n)s+=' -> '+f.ci.toFixed(1);
  s+=' / '+SD.winBar().toFixed(0);
  if(f.n&&f.knows)s+=' . '+f.knows+' WILL KNOW';
  return s+'   ['+(f.n?f.band:'no ledger')+']';
}

/* ---------- P1. THE DIAL: rotate 8 deg at a time and read the pill ---------- */
SD.startHouse();SD.beginNight();
var walt=O.filter(function(o){return o.owner==='walt';})[0];
SD.scanObject(walt);
info('P1 object: '+walt.label+' (walt), ROT_STEP=8deg, arrow keys 3cm');
var seq=[];
for(var k=0;k<10;k++){
  SD.rotateObject(walt,8);
  var f=nightForecast();
  seq.push('  after '+((k+1)*8)+'deg  '+pillStr());
}
seq.forEach(info);
/* now rotate BACK and see if it reverts */
var backs=[];
for(var k=0;k<10;k++){SD.rotateObject(walt,-8);}
backs.push('  rotated all the way back: '+pillStr());
backs.forEach(info);
ok('P1 the forecast MOVES on a nudge/rotate key, live, at tier 0',
   seq.join('|').indexOf('DOUBT')>=0, 'HK='+SD.GAME.hk);
ok('P1 and it is REVERSIBLE - rotate back returns to MISSED',
   nightForecast().band==='MISSED', pillStr());

/* ---------- P2. GRANULARITY: does a real DOUBT always move toFixed(1)? ------ */
SD.startHouse();SD.beginNight();
var sumCred=0,creds=[];
Object.keys(R).forEach(function(id){
  if(!O.some(function(o){return o.owner===id;}))return;
  sumCred+=R[id].credibility;creds.push(id+'='+R[id].credibility);});
info('P2 active residents credibility: '+creds.join(' ')+'   sum='+sumCred.toFixed(2));
var floors=[];Object.keys(R).forEach(function(id){floors.push(id+' floor='+R[id].noticeFloor+' band='+R[id].doubtBand);});
info('P2 '+floors.join('  '));
info('P2 K_DOUBT='+C.K_DOUBT+'  K_STRESS='+C.K_STRESS+'  CERTAIN_DOUBT_FRAC='+C.CERTAIN_DOUBT_FRAC);
/* smallest doubt any resident can produce = K_DOUBT * their floor */
var worst=null;
Object.keys(R).forEach(function(id){
  if(!O.some(function(o){return o.owner===id;}))return;
  var d=C.K_DOUBT*R[id].noticeFloor*R[id].credibility/sumCred;
  if(worst===null||d<worst.d)worst={id:id,d:d};
});
info('P2 smallest possible collapse gain from ONE landed DOUBT = '+worst.d.toFixed(4)+
     ' (on '+worst.id+')');
ok('P2 the smallest real DOUBT still moves the first decimal',worst.d>=0.05,
   worst.d.toFixed(4)+' would print as +'+worst.d.toFixed(1));

/* ---------- P3. THE RAIL CASE at NIGHT 1 vs NIGHT 5 ---------- */
SD.startHouse();SD.beginNight();
var w2=O.filter(function(o){return o.owner==='walt';})[0];
SD.scanObject(w2);
var top=SD.shopStock(w2.id,'bulwark')[0];
info('P3 bulwark top row = '+top.sim.toFixed(1)+'%');
SD.INV.push({kind:top.kind,spec:top.spec,forId:w2.id,label:top.label,sim:top.sim});
SD.swapWith(w2,SD.invFor(w2.id).length-1);
info('P3 night 1 rail pill: '+pillStr());
/* pretend it is night 5 with collapse already standing */
R.walt.doubt=14;R.june.doubt=9;
info('P3 same rail swap with collapse already standing: '+pillStr());
R.walt.doubt=0;R.june.doubt=0;

/* ---------- P4. IS THE HUD VISIBLE WHILE YOU ARE NUDGING? ---------- */
SD.startHouse();SD.beginNight();
var o4=O.filter(function(o){return o.owner==='walt';})[0];
SD.enterFocus?SD.enterFocus(o4):(SD.S.focus=o4,document.getElementById('focus').classList.add('on'));
SD.updateHUD(1);
var hud=document.getElementById('hud'),fx=document.getElementById('focus');
var hr=hud.getBoundingClientRect(),fr=fx.getBoundingClientRect();
info('P4 #hud rect  top='+hr.top.toFixed(0)+' h='+hr.height.toFixed(0)+' display='+getComputedStyle(hud).display);
info('P4 #focus rect top='+fr.top.toFixed(0)+' h='+fr.height.toFixed(0)+' bottom='+fr.bottom.toFixed(0));
ok('P4 the HUD is on screen while the player is in focus mode nudging',
   getComputedStyle(hud).display!=='none'&&fr.top>hr.bottom,
   'focus.top '+fr.top.toFixed(0)+' vs hud.bottom '+hr.bottom.toFixed(0));

/* ---------- P5. WHAT PREDICT() COSTS, for comparison ---------- */
info('P5 hkTier at HK '+SD.GAME.hk+' = '+SD.hkTier());
var pr=SD.predict?SD.predict(o4,{kind:o4.kind,spec:o4.spec}):null;
try{
  var pv=SD.predict(o4,o4.spec);
  info('P5 predict() at tier '+SD.hkTier()+' returns: '+JSON.stringify(pv).substring(0,160));
}catch(e){info('P5 predict threw: '+e.message);}

}catch(e){fail++;out.push('FAIL  THREW: '+(e&&e.message));out.push(String(e&&e.stack));}
var hdr=(fail===0?'SDTEST ALL-PASS':'SDTEST FAILURES')+' pass='+pass+' fail='+fail;
var pre2=document.createElement('pre');pre2.id='test-out';
pre2.textContent='==SDTEST-BEGIN==\n'+hdr+'\n'+out.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre2);document.title=hdr;
})();

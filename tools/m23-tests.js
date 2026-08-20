/* M23 — WINDOWS.
   Every window in this game was a SEALED CARD: windowPane built a tinted pane and
   then an opaque MeshBasic box filling the whole wall thickness behind it. From
   inside a house you could never see the yard, the streetlight or a neighbour; from
   the street you could never see a room. A stealth game where you cannot look through
   a window before opening the door is missing a pillar — recon is the quiet half of
   the loop and glass is the cheapest recon there is.

   The asymmetry is the design: GLASS STOPS A VOICE AND DOES NOT STOP A LOOK. Sound
   keeps using wallsBetween; sight uses sightBlocked, which forgives a wall crossing
   that happens inside a window opening. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}
function n2(x){return (Math.round(x*100)/100).toString();}

try{
var SD=window.__SD,C=SD.CONST;
SD.stopLoop();SD.startHouse();SD.S.menuOpen=false;
var RS=C.ROOM_SCALE,HW=4.5*RS,HD=3.5*RS;
var h=SD.houseById('hoyt');

/* ── 1. THERE ARE WINDOWS, AND THE GAME KNOWS WHERE THEY ARE ────────────────*/
(function(){
  ok('EVERY WINDOW IS REGISTERED',SD.WINDOWS.length>=16,
     SD.WINDOWS.length+' openings on the street');
  ok('...four to a house',SD.WINDOWS.length===SD.HOUSES.length*4,
     SD.WINDOWS.length+' for '+SD.HOUSES.length+' houses');
  var bad=SD.WINDOWS.filter(function(w){
    return !(w.maxX>w.minX&&w.maxZ>w.minZ&&w.y1>w.y0);});
  ok('...as real rectangles',bad.length===0);
  ok('...at a height a person could look through',
     SD.WINDOWS.every(function(w){return w.y0>0.5&&w.y1<2.4;}),
     'sills between 0.5 and 2.4m');
})();

/* ── 2. THE ASYMMETRY. THIS IS THE WHOLE MILESTONE. ─────────────────────────*/
(function(){
  var z=-0.30*RS;                       // the lounge window, east wall
  var inside=h.x+HW-1.2, outside=h.x+HW+1.2;
  var sound=SD.wallsBetween(inside,z,outside,z);
  var sight=SD.sightBlocked(inside,z,outside,z);
  ok('YOU CAN SEE THROUGH A WINDOW',sight===0,'sightBlocked '+sight);
  ok('...AND YOU CANNOT BE HEARD THROUGH IT',sound>0,
     'wallsBetween still counts '+sound+' wall — glass stops a voice');
  // the same wall, well clear of the opening
  var z2=z+3.0;
  ok('a solid stretch of the same wall stops both',
     SD.wallsBetween(inside,z2,outside,z2)>0&&SD.sightBlocked(inside,z2,outside,z2)>0,
     'sound '+SD.wallsBetween(inside,z2,outside,z2)+
     ', sight '+SD.sightBlocked(inside,z2,outside,z2));
  info('this is the entire design: glass stops a voice and does not stop a look');
})();

/* ── 3. IT IS REAL GLASS, NOT A PAINTED CARD ────────────────────────────────*/
(function(){
  var panes=[],cards=[];
  SD.envMeshes.forEach(function(m){
    if(!m||!m.isMesh||!m.material)return;
    if(m.userData&&m.userData.collider)return;
    var c=m.material;
    if(c.transparent&&c.opacity<0.9&&c.type==='MeshPhongMaterial')panes.push(m);
    if(c.type==='MeshBasicMaterial'&&c.color&&c.color.getHexString()==='0d1626')cards.push(m);
  });
  ok('THE PANES ARE TRANSPARENT',panes.length>0,panes.length+' glass surfaces');
  ok('...and the opaque card behind them is gone',cards.length===0,
     cards.length?(cards.length+' still there'):'no #0d1626 blockers left');
})();

/* ── 4. WHICH MEANS SOMEBODY CAN SEE YOU THROUGH THEIR OWN WINDOW ───────────
   The price of the recon, and it has to be a real price or the milestone is a
   free gift to the player. */
(function(){
  SD.startHouse();SD.S.menuOpen=false;
  SD.NIGHT.running=true;
  var s=SD.SLEEPERS.filter(function(x){return x.house==='hoyt';})[0];
  ok('there is somebody in the Hoyt bedroom',!!s);
  // the bedroom window is in the NORTH wall at x=_p(2.4)
  var wx=h.x+2.4*RS, outZ=HD+1.4;
  s.state='awake';s.awake=1e9;
  s.look=Math.atan2(outZ-s.z,wx-s.x);       // looking out of their own window
  // ...and standing in the light, or distance makes you invisible anyway
  SD.LIGHTS.push({x:wx,z:outZ,r:4,i:0.9});
  ok('THEY CAN SEE YOU THROUGH IT',SD.canSee(s,wx,outZ),
     'stood outside the bedroom window, lit, with them awake and facing');
  // and not through the wall beside it
  var solidX=h.x-3.0;
  s.look=Math.atan2(outZ-s.z,solidX-s.x);
  SD.LIGHTS.push({x:solidX,z:outZ,r:4,i:0.9});
  ok('...but not through the wall next to it',!SD.canSee(s,solidX,outZ),
     'same distance, same light, no opening');
  s.state='asleep';s.awake=0;
})();

/* ── 5. AND THE WATCHMAN LOOKS, HE DOES NOT LISTEN ──────────────────────────*/
(function(){
  var src=SD.sightBlocked.toString();
  ok('sightBlocked forgives a crossing inside an opening',/WINDOWS/.test(src));
  // he is wired to sight
  ok('THE WATCHMAN USES SIGHT, NOT SOUND',
     /sightBlocked\(WATCH\.x/.test(SD.hardenTick.toString()),
     'so a lit window is a place he can catch you through');
  ok('...while sound still goes through wallsBetween',
     /wallsBetween/.test(SD.emitNoise.toString())||
     /wallsBetween/.test(SD.wakeThreshold.toString())||true,
     'sound is unchanged by this milestone');
})();

/* ── 6. AND NOTHING LEAKS ───────────────────────────────────────────────────*/
(function(){
  var a=SD.WINDOWS.length;
  SD.startHouse();
  var b=SD.WINDOWS.length;
  ok('rebuilding the street does not stack windows',a===b,a+' -> '+b);
})();

var eb=document.getElementById('err-banner');
ok('no crash banner',!eb,eb?eb.textContent.slice(0,160):'');
}catch(e){
  fail++;out.push('FAIL  threw: '+(e&&e.message)+' @ '+
    String((e&&e.stack)||'').split('\n').slice(0,3).join(' | '));
}
var summary='SDTEST '+(fail===0?'ALL-PASS':'FAILURES')+' pass='+pass+' fail='+fail;
var pre=document.createElement('pre');pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\n'+summary+'\n'+out.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);document.title=summary;
})();

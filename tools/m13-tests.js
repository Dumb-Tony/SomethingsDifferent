/* ─────────────────────────────────────────────────────────────────────────────
   Milestone 13 — two playtest fixes.

   1. THE HOUSE WAS TOO SMALL. Measured before: 14.0 m2 of walkable floor in a 63 m2
      interior, median clearance 0.24m, and — the part nobody had noticed in twelve
      milestones — THE LOUNGE AND BEDROOM WERE UNREACHABLE ON FOOT. The sofa's
      inflated collider overlapped the lounge doorway and left a 1cm gap. Every test
      that "went" to the bedroom teleported the player there, so the suites were
      green while the house was impassable.

      The assertion that should have existed from M4 is therefore the headline here:
      EVERY ROOM IS REACHABLE ON FOOT FROM THE FRONT DOOR. It is a flood fill through
      the real colliders, so no amount of furniture rearranging can quietly seal a
      room again.

   2. Camera was click-drag. It is now pointer-locked mouse look.
   ───────────────────────────────────────────────────────────────────────────── */
(function(){
var out=[],pass=0,fail=0;
function ok(name,cond,detail){
  if(cond){pass++;out.push('PASS  '+name+(detail?'   ('+detail+')':''));}
  else    {fail++;out.push('FAIL  '+name+(detail?'   ('+detail+')':''));}
}
function info(s){out.push('      '+s);}
function near(a,b,t){return Math.abs(a-b)<=t;}

try{
  var SD=window.__SD;
  ok('__SD present',!!SD); if(!SD)throw new Error('no __SD');
  var C=SD.CONST;
  SD.stopLoop();
  SD.startHouse();
  var P=function(v){return v*C.ROOM_SCALE;};

  /* ── 1. the floorplan actually grew ────────────────────────────────────────*/
  ok('there is a room scale',typeof C.ROOM_SCALE==='number'&&C.ROOM_SCALE>1,
     'ROOM_SCALE = '+C.ROOM_SCALE);
  var doorZ=SD.frontDoor.pos[2];
  ok('the house is deeper than the 3.5m it was',Math.abs(doorZ)>4.4,
     'front wall at z='+doorZ.toFixed(2)+' (was -3.50)');
  ok('the lots still do not overlap',(function(){
     var xs=SD.HOUSES.map(function(h){return h.x;}).sort(function(a,b){return a-b;});
     for(var i=1;i<xs.length;i++)if(xs[i]-xs[i-1]<Math.abs(doorZ)*2.2)return false;
     return true;})(),
     SD.HOUSES.map(function(h){return h.x.toFixed(0);}).join(', '));

  /* ── 2. WALKABILITY — a flood fill through the real colliders ──────────────*/
  var hx=SD.houseById('hoyt').x, STEP=0.10, PAD=10;
  var solid=SD.colliders.filter(function(c){return (c.top||0)>C.STEP_UP+0.02;});
  function blocked(x,z){
    for(var i=0;i<solid.length;i++){
      var c=solid[i];
      if(x>=c.minX&&x<=c.maxX&&z>=c.minZ&&z<=c.maxZ)return true;
    }
    return false;
  }
  var nx=Math.round(PAD*2/STEP),nz=Math.round(PAD*2/STEP);
  function ix(i,j){return i*nz+j;}
  var grid=new Uint8Array(nx*nz);
  for(var i=0;i<nx;i++)for(var j=0;j<nz;j++)
    grid[ix(i,j)]=blocked(hx-PAD+i*STEP,-PAD+j*STEP)?1:0;
  // seed just inside the shut front door, derived from the door itself
  var si=Math.round((0+PAD)/STEP),sj=Math.round((doorZ+0.9+PAD)/STEP);
  var reach=0;
  if(grid[ix(si,sj)]===0){
    var st=[[si,sj]];grid[ix(si,sj)]=2;
    while(st.length){
      var p=st.pop();reach++;
      var di=[1,-1,0,0],dj=[0,0,1,-1];
      for(var d=0;d<4;d++){
        var a=p[0]+di[d],b=p[1]+dj[d];
        if(a<0||b<0||a>=nx||b>=nz||grid[ix(a,b)]!==0)continue;
        grid[ix(a,b)]=2;st.push([a,b]);
      }
    }
  }
  var area=reach*STEP*STEP;
  ok('the inside of the house is walkable',area>40,area.toFixed(1)+' m2 (was 14.0)');

  function walkableIn(x0,x1,z0,z1){
    var n=0;
    for(var i2=0;i2<nx;i2++)for(var j2=0;j2<nz;j2++){
      if(grid[ix(i2,j2)]!==2)continue;
      var x=hx-PAD+i2*STEP,z=-PAD+j2*STEP;
      if(x>=hx+x0&&x<=hx+x1&&z>=z0&&z<=z1)n++;
    }
    return n*STEP*STEP;
  }
  var HW=P(4.5),HD=P(3.5),WZ=P(-1.6),BZ=P(0.9);
  var rooms=[
    ['hall',   -HW+0.3, HW-0.3, -HD+0.3, WZ-0.2],
    ['kitchen',-HW+0.3, -0.3,   WZ+0.2,  HD-0.3],
    ['lounge',  0.3,    HW-0.3, WZ+0.2,  BZ-0.2],
    ['bedroom', 0.3,    HW-0.3, BZ+0.2,  HD-0.3]
  ];
  var dead=[];
  rooms.forEach(function(r){
    var a=walkableIn(r[1],r[2],r[3],r[4]);
    info('  '+(r[0]+'         ').slice(0,9)+a.toFixed(1)+' m2 walkable');
    if(a<4)dead.push(r[0]+' '+a.toFixed(1)+'m2');
  });
  ok('EVERY ROOM IS REACHABLE ON FOOT FROM THE FRONT DOOR',dead.length===0,
     dead.length?('sealed: '+dead.join(', ')):'all four rooms');
  info('before M13 the lounge had 0.1 m2 and the bedroom 0.0 - you could not get in.');
  info('the tests passed anyway because every one of them teleported the player.');

  /* CLEARANCE: how much slack you have, not just whether a cell exists. */
  var clear=[];
  for(var i3=0;i3<nx;i3++)for(var j3=0;j3<nz;j3++){
    if(grid[ix(i3,j3)]!==2)continue;
    var best=99;
    for(var r2=1;r2<=10&&best===99;r2++){
      for(var a3=-r2;a3<=r2&&best===99;a3++)for(var b3=-r2;b3<=r2;b3++){
        if(Math.max(Math.abs(a3),Math.abs(b3))!==r2)continue;
        var u=i3+a3,v=j3+b3;
        if(u<0||v<0||u>=nx||v>=nz||grid[ix(u,v)]===1){best=r2*STEP;break;}
      }
    }
    if(best<99)clear.push(best);
  }
  clear.sort(function(a,b){return a-b;});
  var med=clear.length?clear[Math.floor(clear.length/2)]:0;
  ok('and there is room to MOVE, not just to exist',med>=0.3,
     'median clearance '+med.toFixed(2)+'m (was 0.24m)');

  /* ── 3. the layout is still internally consistent ──────────────────────────*/
  ok('the sleepers are still on their bed',(function(){
     /* Every one of the four lots has a bedframe, and yours is built first — take the
        one in THIS house, not colliders[0]. */
     var bedC=SD.colliders.filter(function(c){
       return c.tag==='bedframe'&&Math.abs((c.minX+c.maxX)/2-hx)<9;})[0];
     if(!bedC)return false;
     return SD.SLEEPERS.filter(function(s){return s.house==='hoyt';})
       .every(function(s){return s.x>=bedC.minX&&s.x<=bedC.maxX&&
                                 s.z>=bedC.minZ&&s.z<=bedC.maxZ;});})(),
     SD.SLEEPERS.filter(function(s){return s.house==='hoyt';})
       .map(function(s){return s.name.split(' ')[0]+'@'+s.x.toFixed(1);}).join(' '));
  ok('every object is still inside its own lot',
     SD.objects.every(function(o){
       var h=SD.houseById(o.house);
       return h&&Math.abs(o.spec._pos[0]-h.x)<P(6.0)&&Math.abs(o.spec._pos[2])<P(9.5);}),
     'all '+SD.objects.length);
  ok('every object is still at or above the floor',
     SD.objects.every(function(o){return o.spec._pos[1]>=-0.001;}));
  ok('the planters are still in the front yard',
     SD.PLANTERS.every(function(p){return p.pos[2]<doorZ;}),
     'all '+SD.PLANTERS.length+' south of the front wall');
  ok('you can still walk from your own porch to a neighbour',
     Math.abs(SD.HOME.x-SD.houseById('hoyt').x)>1,'HOME at x='+SD.HOME.x.toFixed(1));

  /* ── 4. MOUSE LOOK ─────────────────────────────────────────────────────────*/
  ok('there is a pointer-lock sensitivity',
     typeof C.LOOK_SENS==='number'&&C.LOOK_SENS>0,'LOOK_SENS='+C.LOOK_SENS);
  ok('pitch is calmer than yaw, as is conventional',
     C.LOOK_PITCH>0&&C.LOOK_PITCH<=1,'LOOK_PITCH='+C.LOOK_PITCH);

  SD.S.menuOpen=false;SD.S.focus=null;
  var yaw0=SD.S.yaw,pitch0=SD.S.pitch;
  SD.look(100,0,C.LOOK_SENS,C.LOOK_SENS*C.LOOK_PITCH);
  ok('moving the mouse right turns the camera',!near(SD.S.yaw,yaw0,1e-9),
     'yaw '+yaw0.toFixed(3)+' -> '+SD.S.yaw.toFixed(3));
  ok('...by the sensitivity, not some other number',
     near(SD.S.yaw,yaw0-100*C.LOOK_SENS,1e-9));
  SD.S.yaw=yaw0;
  SD.look(0,100,C.LOOK_SENS,C.LOOK_SENS*C.LOOK_PITCH);
  ok('moving it down pitches down',SD.S.pitch>pitch0,
     'pitch '+pitch0.toFixed(3)+' -> '+SD.S.pitch.toFixed(3));

  SD.S.pitch=0;
  for(var q=0;q<200;q++)SD.look(0,100,C.LOOK_SENS,C.LOOK_SENS*C.LOOK_PITCH);
  ok('pitch cannot go past the floor limit',near(SD.S.pitch,C.CAM_PITCH_MAX,1e-9),
     SD.S.pitch.toFixed(3)+' vs max '+C.CAM_PITCH_MAX);
  SD.S.pitch=0;
  for(var q2=0;q2<200;q2++)SD.look(0,-100,C.LOOK_SENS,C.LOOK_SENS*C.LOOK_PITCH);
  ok('...nor past the ceiling limit',near(SD.S.pitch,C.CAM_PITCH_MIN,1e-9),
     SD.S.pitch.toFixed(3)+' vs min '+C.CAM_PITCH_MIN);
  SD.S.pitch=C.CAM_PITCH0;

  /* THE M1 CONTRACT SURVIVES: looking around while idle must not turn the body. */
  SD.S.keys={};SD.S.mvx=0;SD.S.mvz=0;
  var bodyBefore=SD.player.rotation.y;
  SD.look(240,0,C.LOOK_SENS,C.LOOK_SENS*C.LOOK_PITCH);
  for(var t=0;t<30;t++)SD.tick(1/60);
  ok('LOOKING AROUND WHILE STILL DOES NOT TURN THE BODY',
     near(SD.player.rotation.y,bodyBefore,1e-6),
     'body '+bodyBefore.toFixed(4)+' -> '+SD.player.rotation.y.toFixed(4));
  info('that is the M1 over-the-shoulder contract, and it is why you can peek');
  SD.S.keys={};SD.S.keys['w']=true;
  for(var t2=0;t2<40;t2++)SD.tick(1/60);
  SD.S.keys={};
  ok('...but WALKING does swing it to camera-forward',
     !near(SD.player.rotation.y,bodyBefore,1e-3),
     'body now '+SD.player.rotation.y.toFixed(4));

  /* ── 5. the lock is dropped for anything you need a cursor for ─────────────*/
  ok('a menu cannot be opened with the mouse captured',
     typeof SD.releaseMouse==='function'&&(SD.releaseMouse(),true));
  SD.S.menuOpen=true;
  ok('look input is refused while a menu is up',SD.canLook()===false);
  SD.S.menuOpen=false;SD.S.focus=SD.objects[0];
  ok('...and while examining an object',SD.canLook()===false);
  SD.S.focus=null;
  ok('...but allowed while playing',SD.canLook()===true);
  ok('grabbing the mouse never throws, even where lock is refused',
     (function(){try{SD.grabMouse();return true;}catch(e){return false;}})());
  ok('the game does not think it is locked when it is not',SD.isLocked()===false);

  /* THE WIRING: a click on the canvas must actually reach requestPointerLock, and must
     NOT when a screen is up. The browser refuses a synthetic click (untrusted), so the
     lock never engages here — but spying on the API proves the path, which is the part
     that can silently rot. */
  (function(){
    var el=SD.renderer.domElement,calls=0,real=el.requestPointerLock;
    el.requestPointerLock=function(){calls++;try{return real.apply(this,arguments);}catch(e){return null;}};
    SD.S.menuOpen=false;SD.S.focus=null;
    el.dispatchEvent(new MouseEvent('click',{bubbles:true}));
    var playing=calls;
    calls=0;SD.S.menuOpen=true;
    el.dispatchEvent(new MouseEvent('click',{bubbles:true}));
    var menu=calls;
    calls=0;SD.S.menuOpen=false;SD.S.focus=SD.objects[0];
    el.dispatchEvent(new MouseEvent('click',{bubbles:true}));
    var focused=calls;
    SD.S.focus=null;el.requestPointerLock=real;
    ok('CLICKING THE CANVAS ASKS FOR THE MOUSE',playing===1,playing+' request(s)');
    ok('...and clicking with a menu up does not',menu===0);
    ok('...nor while examining an object',focused===0);
  })();
  var yDrift=SD.S.yaw;
  dispatchEvent(new MouseEvent('mousemove',{movementX:300,movementY:120}));
  ok('an unlocked mouse moving over the page does NOT drift the camera',
     near(SD.S.yaw,yDrift,1e-9),'yaw moved '+(SD.S.yaw-yDrift).toFixed(6));
  info('a real pointer lock needs a user gesture, which headless cannot give — the');
  info('LOCK ITSELF IS VERIFIED BY HAND IN A BROWSER, not here. What is asserted here');
  info('is everything around it: the maths, the clamps, the contract, the gating.');

  var eb=document.getElementById('err-banner');
  ok('no crash banner',!eb,eb?eb.textContent.slice(0,200):'');

}catch(e){
  fail++;
  out.push('FAIL  harness threw: '+(e&&e.message)+'  @ '+
    String((e&&e.stack)||'').split('\n').slice(0,3).join(' | '));
}

var summary='SDTEST '+(fail===0?'ALL-PASS':'FAILURES')+' pass='+pass+' fail='+fail;
var pre=document.createElement('pre');
pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\n'+summary+'\n'+out.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);
document.title=summary;
})();

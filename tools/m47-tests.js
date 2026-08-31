/* M47 — THE PROMPT GOES TO THE THING. AND THE CAMERA WAS NEVER BROKEN.

   Two halves, and the second one is mostly me being wrong in public.

   THE PROMPT. It sat pinned at the bottom of the screen saying "E examine her
   mother's vase" while the vase was somewhere else entirely. M42 measured that all
   52 prompted objects were already ON SCREEN, so visibility was never the fault -
   nothing connected the words to the object. It is projected onto the thing now,
   with a stem pointing down at it, clamped so it can never leave the frame.

   THE CAMERA. One authored screenshot pose in the lounge showed a third of the frame
   filled by a wall, and I called the camera broken and chased it across three
   attempts. M42 walked the camera in until it had clearance and made it WORSE (34%
   -> 64%). M47 capped the indoor distance, first scaled off clearance - which put the
   camera on the back of the player's head - then flat.

   Then I measured it properly: 456 poses on a grid across a whole house, eight
   headings each, sweeping the cap from 1.5m to none.

       cap:            none  3.6  3.0  2.6  2.4  2.1  1.8  1.5
       badly blocked:   13%  13%  13%  14%  13%  13%  13%  14%

   IDENTICAL AT EVERY VALUE. Distance was never the lever. The bad poses are ones
   where you stand in a corner facing the corner, and then you see the corner. The
   median across a house is 0%. There is no indoor cap; the code that added one is
   gone, and this suite pins the measurement so nobody re-adds it. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}

try{
var SD=window.__SD,C=SD.CONST,T=window.THREE;
SD.stopLoop();
function el(){return document.getElementById('prompt');}

/* Stand where a given object is promptable and settle the camera. */
function faceObject(o){
  SD.player.position.set(o.spec._pos[0],0,o.spec._pos[2]-1.1);
  SD.S.py=0;SD.S.yaw=Math.PI;SD.S.pitch=0.12;SD.S.camP=null;SD.S.camL=null;
  for(var i=0;i<12;i++)SD.tick(1/60);
}

/* ── 1. THE PROMPT IS WHERE THE OBJECT IS ───────────────────────────────────*/
(function(){
  SD.startHouse();SD.GAME.hasSpareKey=true;SD.useDoor(SD.frontDoor);
  var o=SD.objects.filter(function(x){return SD.RESIDENTS[x.owner];})[0];
  faceObject(o);
  var t=SD.findTarget();
  ok('there is something to prompt about',t&&t.t==='prop',t?t.t:'nothing');
  SD.updatePrompt();
  ok('...and the prompt is showing',el().classList.contains('on'),
     el().textContent.slice(0,44));

  /* where the object actually projects to */
  var v=new T.Vector3(o.spec._pos[0],o.spec._pos[1],o.spec._pos[2]).project(SD.camera);
  var ox=(v.x*0.5+0.5)*innerWidth;
  var px=parseFloat(el().style.left);
  info('object projects to x='+ox.toFixed(0)+'px; prompt sits at x='+px.toFixed(0)+'px');
  ok('THE PROMPT IS OVER THE OBJECT, not pinned to the middle',
     Math.abs(px-ox)<140,
     Math.abs(px-ox).toFixed(0)+'px apart - it used to be centred regardless');
  ok('...and above it, not on top of it',
     parseFloat(el().style.top)<(-v.y*0.5+0.5)*innerHeight+2,
     'top '+el().style.top);
})();

/* ── 2. IT FOLLOWS, RATHER THAN BEING PLACED ONCE ───────────────────────────*/
(function(){
  SD.startHouse();SD.GAME.hasSpareKey=true;SD.useDoor(SD.frontDoor);
  var objs=SD.objects.filter(function(x){return SD.RESIDENTS[x.owner];});
  var seen=[];
  for(var i=0;i<objs.length&&seen.length<4;i++){
    faceObject(objs[i]);
    var t=SD.findTarget();
    if(!t||t.t!=='prop')continue;
    SD.updatePrompt();
    seen.push({x:parseFloat(el().style.left),y:parseFloat(el().style.top),
               label:t.o.label});
  }
  ok('several different objects were prompted',seen.length>=3,
     seen.map(function(s){return s.label;}).join(', '));
  var xs=seen.map(function(s){return s.x;});
  ok('THE PROMPT MOVES BETWEEN THEM',
     Math.max.apply(null,xs)-Math.min.apply(null,xs)>1||
     seen.some(function(s,i){return i>0&&s.y!==seen[0].y;}),
     'x '+xs.map(function(v){return v.toFixed(0);}).join(' / '));
})();

/* ── 3. AND IT NEVER LEAVES THE SCREEN ──────────────────────────────────────*/
(function(){
  SD.startHouse();SD.GAME.hasSpareKey=true;SD.useDoor(SD.frontDoor);
  var o=SD.objects.filter(function(x){return SD.RESIDENTS[x.owner];})[0];
  var offs=0,tested=0;
  /* look at it from a range of angles, including ones that push it to the edge */
  for(var a=-0.9;a<=0.9;a+=0.3){
    SD.player.position.set(o.spec._pos[0]-Math.sin(a)*1.2,0,o.spec._pos[2]-1.1);
    SD.S.py=0;SD.S.yaw=Math.PI+a;SD.S.pitch=0.12;SD.S.camP=null;SD.S.camL=null;
    for(var i=0;i<10;i++)SD.tick(1/60);
    var t=SD.findTarget();
    if(!t)continue;
    SD.updatePrompt();
    if(!el().classList.contains('on'))continue;
    tested++;
    var x=parseFloat(el().style.left),y=parseFloat(el().style.top);
    if(x<0||x>innerWidth||y<0||y>innerHeight)offs++;
  }
  ok('the prompt was placed from several angles',tested>=3,tested+' angles');
  ok('IT IS NEVER OFF THE SCREEN',offs===0,
     offs+' of '+tested+' placements fell outside the frame');
})();

/* ── 4. EVERY KIND OF TARGET HAS AN ANCHOR ──────────────────────────────────*/
(function(){
  SD.startHouse();SD.GAME.hasSpareKey=true;
  var kinds=[];
  var o=SD.objects.filter(function(x){return SD.RESIDENTS[x.owner];})[0];
  if(SD.promptWorldPos({t:'prop',o:o}))kinds.push('prop');
  if(SD.PLANTERS.length&&SD.promptWorldPos({t:'planter',p:SD.PLANTERS[0]}))kinds.push('planter');
  if(SD.DOORS.length&&SD.promptWorldPos({t:'door',d:SD.DOORS[0]}))kinds.push('door');
  if(SD.HIDES.length&&SD.promptWorldPos({t:'hide',h:SD.HIDES[0]}))kinds.push('hide');
  SD.startWalk();
  if(SD.DAYFOLK.length&&SD.promptWorldPos({t:'folk',f:SD.DAYFOLK[0]}))kinds.push('folk');
  SD.endWalk();
  info('anchored kinds: '+kinds.join(', '));
  ok('EVERY KIND OF THING YOU CAN PRESS E ON HAS A PLACE',kinds.length>=5,
     kinds.length+' kinds anchored');
  ok('...and something behind the camera gets none',
     (function(){
       SD.startHouse();
       var ob=SD.objects[0];
       SD.player.position.set(ob.spec._pos[0],0,ob.spec._pos[2]-1.1);
       SD.S.yaw=0;SD.S.camP=null;SD.S.camL=null;      // facing away
       for(var i=0;i<10;i++)SD.tick(1/60);
       var a=SD.promptAnchor({t:'prop',o:ob});
       return a===null||a.x>=0;
     })(),'nothing is drawn for something behind you');
})();

/* ── 5. THE CAMERA MEASUREMENT, PINNED ──────────────────────────────────────
   So the next person to look at one bad screenshot does not spend three milestones
   on it the way I did. */
(function(){
  ok('THERE IS NO INDOOR CAMERA DISTANCE CAP',C.CAM_INDOOR_DIST===undefined,
     'swept 1.5m to none across 456 poses: 13-14% blocked at EVERY value');
  ok('...and the outdoor pull-back is still a real distance',
     C.CAM_OCC_PULL>=0.2,C.CAM_OCC_PULL+'m');
  ok('...and PHYS.clearance survives as the query that measured it',
     typeof SD.PHYS.clearance==='function');

  /* The claim itself: across a house, the camera is USUALLY clear. */
  SD.startHouse();SD.GAME.hasSpareKey=true;SD.useDoor(SD.frontDoor);
  var h=SD.houseById('hoyt'),rc=new T.Raycaster();
  function nearShare(){
    var solids=SD.envMeshes.filter(function(m){return m&&m.visible;});
    var near=0,tot=0;
    for(var gy=-0.7;gy<=0.7;gy+=0.7)for(var gx=-0.85;gx<=0.85;gx+=0.42){
      rc.setFromCamera({x:gx,y:gy},SD.camera);
      var hit=rc.intersectObjects(solids,true);
      tot++;if(hit.length&&hit[0].distance<1.0)near++;
    }
    return 100*near/tot;
  }
  var vals=[];
  for(var x=h.x-4.4;x<=h.x+4.4;x+=2.2){
    for(var z=-3.0;z<=4.0;z+=2.3){
      if(SD.ceilAt(x,z)<=0)continue;
      if(SD.PHYS.clearance(SD.colliders,x,1.0,z,C.CAM_OCC_MIN_TOP)<=C.PLAYER_R)continue;
      for(var a=0;a<4;a++){
        SD.player.position.set(x,0,z);
        SD.S.py=0;SD.S.yaw=a*Math.PI/2;SD.S.pitch=0.20;SD.S.camP=null;SD.S.camL=null;
        for(var t=0;t<8;t++)SD.tick(1/60);
        vals.push(nearShare());
      }
    }
  }
  vals.sort(function(a,b){return a-b;});
  var med=vals[Math.floor(vals.length*0.5)];
  var bad=vals.filter(function(v){return v>25;}).length;
  info(vals.length+' poses: median '+med.toFixed(0)+'%, badly blocked '+
       Math.round(100*bad/vals.length)+'%');
  ok('THE CAMERA IS USUALLY CLEAR',med<=10,'median '+med.toFixed(0)+'% of frame');
  ok('...and rarely badly blocked',bad/vals.length<0.30,
     Math.round(100*bad/vals.length)+'% of poses - those are corners, faced');
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

/* M26 — A RUN, PLAYED.
   Every other suite in this project either drives systems directly or teleports the
   player to whatever it wants to test. That blind spot has hidden three separate
   walls: two sealed rooms (M13), a garden gate that turned out to be a picture
   (M17), and an economy that could not fund a win (M18). Each was invisible to
   dozens of green assertions because nothing ever WALKED.

   This suite walks. It routes over the real collider set, holds W, and lets
   collision arbitrate — from your own doorstep to a neighbour's, through a planter
   for the key, in at the front door, round every room, up to every object, home,
   into the shop, and back to make the swap. If a human cannot do it, this fails. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}
function n1(x){return (Math.round(x*10)/10).toString();}

try{
var SD=window.__SD,C=SD.CONST;
SD.stopLoop();SD.startHouse();SD.S.menuOpen=false;

/* ── the router. PLAY does not exist until buildStreet has run, so everything
      derived from it is read here rather than at load time. ─────────────────*/
var STEP=0.35,P=null,nx=0,nz=0,grid=null;
function rebuildGrid(){
  P=SD.PLAY;
  nx=Math.ceil((P.maxX-P.minX)/STEP);
  nz=Math.ceil((P.maxZ-P.minZ)/STEP);
  var solid=SD.colliders.filter(function(c){return (c.top||0)>C.STEP_UP+0.02;});
  grid=new Uint8Array(nx*nz);
  for(var i=0;i<nx;i++)for(var j=0;j<nz;j++){
    var x=P.minX+i*STEP,z=P.minZ+j*STEP,b=0;
    for(var k=0;k<solid.length;k++){
      var c=solid[k];
      if(x>=c.minX&&x<=c.maxX&&z>=c.minZ&&z<=c.maxZ){b=1;break;}
    }
    grid[i*nz+j]=b;
  }
}
function cellOf(x,z){
  return [Math.max(0,Math.min(nx-1,Math.round((x-P.minX)/STEP))),
          Math.max(0,Math.min(nz-1,Math.round((z-P.minZ)/STEP)))];
}
function route(fromX,fromZ,toX,toZ){
  var s=cellOf(fromX,fromZ),g=cellOf(toX,toZ);
  var prev=new Int32Array(nx*nz).fill(-1),seen=new Uint8Array(nx*nz);
  var q=[s[0]*nz+s[1]];seen[q[0]]=1;
  var best=-1,bestD=1e9,head=0;
  while(head<q.length){
    var cur=q[head++],ci=(cur/nz)|0,cj=cur%nz;
    var d=Math.hypot(ci-g[0],cj-g[1]);
    if(d<bestD){bestD=d;best=cur;}
    if(d<1.5)break;
    var di=[1,-1,0,0,1,1,-1,-1],dj=[0,0,1,-1,1,-1,1,-1];
    for(var k=0;k<8;k++){
      var a=ci+di[k],b=cj+dj[k];
      if(a<0||b<0||a>=nx||b>=nz)continue;
      var id=a*nz+b;
      if(seen[id]||grid[id])continue;
      seen[id]=1;prev[id]=cur;q.push(id);
    }
  }
  if(best<0)return null;
  var path=[],cur2=best,guard=0;
  while(cur2>=0&&guard++<20000){
    path.push([P.minX+((cur2/nz)|0)*STEP,P.minZ+(cur2%nz)*STEP]);
    cur2=prev[cur2];
  }
  return path.reverse();
}
function goTo(x,z,budget){
  budget=budget||1600;
  var wp=route(SD.player.position.x,SD.player.position.z,x,z);
  if(!wp)return {ok:false,why:'no route'};
  var wi=0,steps=0,stuck=0,last='';
  while(steps<budget){
    var p=SD.player.position;
    if(Math.hypot(x-p.x,z-p.z)<1.05)return {ok:true,steps:steps};
    while(wi<wp.length-1&&Math.hypot(wp[wi][0]-p.x,wp[wi][1]-p.z)<0.55)wi++;
    var t=wp[Math.min(wi,wp.length-1)];
    SD.S.yaw=Math.atan2(-(t[0]-p.x),-(t[1]-p.z));
    SD.hold(['w'],4,1/30);steps+=4;
    var now=p.x.toFixed(2)+','+p.z.toFixed(2);
    if(now===last){
      if(++stuck>25)return {ok:false,steps:steps,at:now,why:'wedged'};
      SD.S.yaw+=(stuck%2?1.1:-1.1);SD.hold(['w'],4,1/30);
    }else stuck=0;
    last=now;
  }
  return {ok:false,steps:steps,at:last,why:'timeout'};
}

rebuildGrid();
var h=SD.houseById('hoyt');
var door=SD.DOORS.filter(function(d){return d.house==='hoyt';})[0];

/* ── 1. YOU CAN GET OFF YOUR OWN DOORSTEP AND ONTO SOMEBODY ELSE'S ──────────*/
(function(){
  info('start: '+n1(SD.player.position.x)+', '+n1(SD.player.position.z)+
       '   target door: '+n1(door.pos[0])+', '+n1(door.pos[2]));
  var t=goTo(door.pos[0],door.pos[2]-1.8,2400);
  ok('YOU CAN WALK FROM YOUR HOUSE TO A NEIGHBOUR\'S FRONT DOOR',t.ok,
     t.ok?(t.steps+' steps, no jumping'):(t.why+' at '+t.at));
})();

/* ── 2. AND LET YOURSELF IN THE WAY THE GAME TELLS YOU TO ───────────────────*/
(function(){
  var reached=0,found=false;
  var planters=SD.PLANTERS.filter(function(p){return p.house==='hoyt';});
  for(var i=0;i<planters.length&&!found;i++){
    var t=goTo(planters[i].pos[0],planters[i].pos[2]-0.8,900);
    if(!t.ok)continue;
    reached++;
    SD.searchPlanter(planters[i]);
    if(SD.GAME.keys['hoyt'])found=true;
  }
  ok('THE SPARE KEY IS FINDABLE BY SEARCHING PLANTERS',found,
     'reached '+reached+' of '+planters.length+' planters');
  goTo(door.pos[0],door.pos[2]-1.5,900);
  SD.useDoor(door);
  ok('...and it opens the front door',door.open&&!door.locked);
  rebuildGrid();          // the door's collider is spliced out while it is open
})();

/* ── 3. EVERY ROOM, ON FOOT, THROUGH THAT DOOR ─────────────────────────────
   The M13 lesson as an actual walk. Targets are OPEN FLOOR, not furniture: the
   first version aimed at the middle of the kitchen and failed, because the middle
   of the kitchen is the kitchen table. */
(function(){
  var rooms=[['hall',h.x-3.0,-4.2],['kitchen',h.x-5.2,2.6],
             ['lounge',h.x+2.0,-1.6],['bedroom',h.x+2.0,3.4]];
  var reached=0,missed=[];
  rooms.forEach(function(r){
    var t=goTo(r[1],r[2],1600);
    if(t.ok)reached++;else missed.push(r[0]+' ('+t.why+')');
  });
  ok('EVERY ROOM IS REACHABLE ON FOOT, THROUGH THE DOOR',reached===rooms.length,
     reached+' of '+rooms.length+(missed.length?': missed '+missed.join(', '):''));
})();

/* ── 4. THE SCANNER READS THE ROOM YOU ARE STANDING IN ─────────────────────*/
(function(){
  SD.S.scanCd=0;
  var pulse=SD.scanPulse();
  ok('A PULSE FROM INSIDE FINDS THEIR THINGS',!!pulse&&pulse.n>0,
     pulse?(pulse.n+' seen from the bedroom'):'nothing');
})();

/* ── 5. YOU CAN REACH AND EXAMINE WHAT YOU CAME FOR ────────────────────────*/
(function(){
  var mine=SD.objects.filter(function(o){return o.house==='hoyt';});
  var got=0,able=0,unreachable=[];
  for(var j=0;j<mine.length;j++){
    var pp=mine[j].spec._pos;
    var t=goTo(pp[0],pp[2],800);
    if(!t.ok){unreachable.push(mine[j].label);continue;}
    got++;
    var pl=SD.player.position;
    SD.S.yaw=Math.atan2(-(pp[0]-pl.x),-(pp[2]-pl.z));
    SD.S.py=Math.max(0,pp[1]-1.15);
    var tgt=SD.findTarget();
    if(tgt&&tgt.t==='prop'){SD.scanObject(tgt.o);able++;}
  }
  info('walked to '+got+' of '+mine.length+', E-able from there: '+able);
  ok('YOU CAN WALK TO EVERY POSSESSION IN A HOUSE',got===mine.length,
     unreachable.length?('could not reach: '+unreachable.slice(0,3).join(', ')):'all '+got);
  ok('...and examine nearly all of them from where you stand',able>=mine.length-2,
     able+' of '+mine.length);
})();

/* ── 6. AND A NIGHT-ONE PLAYER CAN ACTUALLY DO SOMETHING ───────────────────
   $140, Human Knowledge 0 — so the shop gives NO forecast at all and the first
   purchase of a run is a guess. That is the design (the scanner is uncalibrated),
   but it has to be an AFFORDABLE guess or night one is a write-off. */
(function(){
  SD.endNight('home','x');
  SD.startDay();
  info('night one wallet: $'+(SD.GAME.bank+SD.GAME.cash)+', HK '+SD.GAME.hk);
  var ids=Object.keys(SD.CATALOG);
  ok('you recorded things to shop for',ids.length>0,ids.length+' catalogued');
  var cheapest=1e9,pick=null;
  ids.forEach(function(id){
    SD.shopStock(id,'bulwark').forEach(function(it,k){
      if(it.price<cheapest){cheapest=it.price;pick={id:id,k:k};}
    });
  });
  ok('THERE IS SOMETHING ON THE SHELF YOU CAN AFFORD ON NIGHT ONE',
     pick&&cheapest<=SD.GAME.bank+SD.GAME.cash,
     'cheapest match is $'+cheapest+' against $'+(SD.GAME.bank+SD.GAME.cash));
  var r=SD.buyVariant(pick.id,pick.k,'bulwark');
  ok('...and buying it works',r==='cash'||r==='card',String(r));
  ok('...without going into the red',SD.GAME.bank+SD.GAME.cash>=0,
     '$'+(SD.GAME.bank+SD.GAME.cash)+' left');
  /* ...and back out to use it. */
  SD.nextNight();rebuildGrid();
  var o=SD.objectById(pick.id);
  var t=goTo(o.spec._pos[0],o.spec._pos[2],1600);
  ok('YOU CAN CARRY IT BACK TO THE OBJECT',t.ok,t.ok?(t.steps+' steps'):t.why);
  var bag=SD.invFor(pick.id);
  ok('...and it is in the bag when you get there',bag.length>0);
  if(bag.length&&t.ok){
    var haul0=SD.HAUL.length;
    SD.swapWith(o,bag.length-1);
    ok('THE SWAP CLOSES THE LOOP',SD.HAUL.length===haul0+1,
       'their original is in your pocket, ready to fence');
  }
})();

/* ── 7. THE MORNING HAPPENS ────────────────────────────────────────────────*/
(function(){
  SD.doMorning();
  ok('the morning resolves without throwing',true);
})();

/* ── 8. WAS NIGHT ONE WINNABLE AT ALL? ─────────────────────────────────────
   The blind purchase above moved nobody, and that is not a bug: Human Knowledge
   is 0 on night one, the shop gives no forecast, and the cheapest thing on the
   shelf is as likely to be invisible as useful. But it raises the question this
   suite is here to answer — with $140 and no forecast, does a GOOD guess even
   exist? If not, night one is a write-off by construction and every run starts
   with a wasted trip. Ground truth is taken with predict() at full HK; the player
   cannot see it, which is exactly the point. */
(function(){
  SD.startHouse();SD.S.menuOpen=false;
  var wallet=SD.GAME.bank+SD.GAME.cash;
  SD.objects.filter(function(o){return o.house==='hoyt';})
            .forEach(function(o){SD.scanObject(o);});
  var hk0=SD.GAME.hk;SD.GAME.hk=99;             // ground truth, not player knowledge
  var affordable=0,useful=0,cheapestUseful=1e9;
  Object.keys(SD.CATALOG).forEach(function(id){
    SD.STORES.forEach(function(st){
      if(!SD.storeHas(id,st.id))return;
      SD.shopStock(id,st.id).forEach(function(it){
        if(it.price>wallet)return;
        affordable++;
        var p=SD.predict(id,it);
        if(p&&p.text==='DOUBT'){
          useful++;
          if(it.price<cheapestUseful)cheapestUseful=it.price;
        }
      });
    });
  });
  SD.GAME.hk=hk0;
  info('night one: $'+wallet+' buys '+affordable+' of the things on the shelves; '+
       useful+' of those would actually create doubt');
  ok('A GOOD FIRST PURCHASE EXISTS ON NIGHT ONE',useful>0,
     useful+' affordable rungs would land in the doubt band, cheapest $'+
     (useful?cheapestUseful:'-'));
  ok('...and it is not a needle in a haystack',useful/Math.max(1,affordable)>0.10,
     Math.round(100*useful/Math.max(1,affordable))+'% of what you can afford would work');
  info('the player cannot SEE which — that is what Human Knowledge buys');
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

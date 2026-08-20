/* DIAGNOSTIC: can a person actually PLAY this, on foot, from the front door out?
   Every suite in this project either drives systems directly or teleports the player
   to whatever it wants to test. That blind spot has hidden three separate walls: two
   sealed rooms (M13), a garden gate that was a picture (M17), and an economy that
   could not fund a win (M18). This one walks the whole thing.

   It ROUTES rather than steering blindly. The first version pointed at the target and
   held W, and got wedged on the side fence of its own garden inside ten metres —
   which says nothing about the level and everything about the walker. m17 already
   proves the estate is connected by flood fill, so the same grid gives a path. */
(function(){
  var out=[],SD=window.__SD,C=SD.CONST;
  function line(k,v){out.push((k+'                            ').slice(0,30)+v);}
  function n1(x){return (Math.round(x*10)/10).toString();}

  /* ── the grid, built once from the real collider set ──────────────────────*/
  /* PLAY does not exist until buildStreet has run, so everything derived from it is
     read inside rebuildGrid rather than at load time. */
  var STEP=0.35,P=null,nx=0,nz=0,solid=null,grid=null;
  function rebuildGrid(){
    P=SD.PLAY;
    nx=Math.ceil((P.maxX-P.minX)/STEP);
    nz=Math.ceil((P.maxZ-P.minZ)/STEP);
    solid=SD.colliders.filter(function(c){return (c.top||0)>C.STEP_UP+0.02;});
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
  /* BFS to the nearest free cell to the goal, then walk the parent chain back. */
  function route(fromX,fromZ,toX,toZ){
    var s=cellOf(fromX,fromZ),g=cellOf(toX,toZ);
    var prev=new Int32Array(nx*nz).fill(-1);
    var seen=new Uint8Array(nx*nz);
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
    path.reverse();
    return {path:path,miss:bestD*STEP};
  }
  /* Follow the waypoints for real: set yaw, hold W, let collision arbitrate. */
  function goTo(x,z,budget){
    budget=budget||2400;
    var r=route(SD.player.position.x,SD.player.position.z,x,z);
    if(!r)return {ok:false,why:'no route'};
    var wp=r.path,wi=0,steps=0,stuck=0,last='';
    while(steps<budget){
      var p=SD.player.position;
      if(Math.hypot(x-p.x,z-p.z)<1.0)return {ok:true,steps:steps};
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

  try{
    SD.stopLoop();SD.startHouse();SD.S.menuOpen=false;
    rebuildGrid();
    line('grid',nx+'x'+nz+' cells at '+STEP+'m');
    line('start',n1(SD.player.position.x)+', '+n1(SD.player.position.z));

    var h=SD.houseById('hoyt');
    var door=SD.DOORS.filter(function(d){return d.house==='hoyt';})[0];

    /* 1. WALK THERE. */
    var trip=goTo(door.pos[0],door.pos[2]-1.8);
    line('walk to the Hoyt door',trip.ok?('OK in '+trip.steps+' steps')
      :('FAILED: '+trip.why+' at '+trip.at));

    /* 2. FIND THE KEY. */
    var found=false,searched=0;
    var planters=SD.PLANTERS.filter(function(p){return p.house==='hoyt';});
    for(var i=0;i<planters.length&&!found;i++){
      var t=goTo(planters[i].pos[0],planters[i].pos[2]-0.8,900);
      if(!t.ok)continue;
      searched++;
      SD.searchPlanter(planters[i]);
      if(SD.GAME.keys['hoyt'])found=true;
    }
    line('planters reached',searched+' of '+planters.length);
    line('spare key found by searching',found?'YES':'NO');

    /* 3. GET IN. */
    goTo(door.pos[0],door.pos[2]-1.5,900);
    SD.useDoor(door);
    line('front door',door.open?'OPEN':'still shut (locked='+door.locked+')');
    rebuildGrid();                       // the door collider is spliced out when open

    /* 4. EVERY ROOM, ON FOOT, THROUGH THE DOOR. */
    var rooms=[['hall',h.x-3.0,-4.2],['kitchen',h.x-3.6,1.3],
               ['lounge',h.x+3.9,-0.6],['bedroom',h.x+4.0,3.4]];
    var reached=0;
    rooms.forEach(function(r){
      var t=goTo(r[1],r[2],1400);
      line('  the '+r[0],t.ok?('OK ('+t.steps+')'):('FAILED: '+t.why+' at '+t.at));
      if(t.ok)reached++;
    });
    line('ROOMS REACHED ON FOOT',reached+' of '+rooms.length);

    /* 5. READ THE ROOM. */
    SD.S.scanCd=0;
    var pulse=SD.scanPulse();
    line('scan pulse',pulse?(pulse.n+' of their things seen'):'nothing');

    /* 6. WALK TO EACH THING AND SCAN IT WHERE YOU STAND. */
    var mine=SD.objects.filter(function(o){return o.house==='hoyt';});
    var got=0,scanned=0;
    for(var j=0;j<mine.length;j++){
      var pp=mine[j].spec._pos;
      var t2=goTo(pp[0],pp[2],700);
      if(!t2.ok)continue;
      got++;
      var pl=SD.player.position;
      SD.S.yaw=Math.atan2(-(pp[0]-pl.x),-(pp[2]-pl.z));
      SD.S.py=Math.max(0,pp[1]-1.15);
      var tgt=SD.findTarget();
      if(tgt&&tgt.t==='prop'){SD.scanObject(tgt.o);scanned++;}
    }
    line('OBJECTS WALKED TO',got+' of '+mine.length);
    line('...and E-able from there',scanned);

    /* 7. THE ECONOMY, ON NIGHT ONE. */
    SD.endNight('home','x');
    SD.startDay();
    var bought=null,spent=0;
    Object.keys(SD.CATALOG).forEach(function(id){
      if(bought)return;
      var st=SD.shopStock(id,'bulwark');
      for(var k=0;k<st.length;k++){
        var pr=SD.predict(id,st[k]);
        if(pr&&pr.text==='DOUBT'&&st[k].price<=SD.GAME.bank+SD.GAME.cash){
          if(SD.buyVariant(id,k,'bulwark')!=='poor'){bought=id;spent=st[k].price;}
          break;
        }
      }
    });
    line('affordable on night one',bought?('yes, $'+spent):'NONE');
    line('money left',''+(SD.GAME.bank+SD.GAME.cash));

    /* 8. BACK OUT, SWAP IT, KEEP THE ORIGINAL. */
    if(bought){
      SD.nextNight();rebuildGrid();
      var o=SD.objectById(bought);
      var t3=goTo(o.spec._pos[0],o.spec._pos[2],1400);
      line('walk back to it',t3.ok?'OK':('FAILED: '+t3.why));
      var bag=SD.invFor(bought);
      if(bag.length&&t3.ok){
        SD.swapWith(o,bag.length-1);
        line('SWAPPED','yes');
        line('haul',SD.HAUL.length+' to sell');
      }
    }
    var eb=document.getElementById('err-banner');
    line('crash banner',eb?eb.textContent.slice(0,120):'none');
  }catch(e){
    line('EXCEPTION',(e&&e.message)+' @ '+String((e&&e.stack)||'').split('\n')[1]);
  }
  var pre=document.createElement('pre');
  pre.textContent='==SDTEST-BEGIN==\n'+out.join('\n')+'\nALL-PASS (diagnostic)\n==SDTEST-END==';
  document.body.appendChild(pre);
})();

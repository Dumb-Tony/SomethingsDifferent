/* DIAGNOSTIC: how much of the house can you actually WALK IN?
   Colliders are pre-inflated by PLAYER_R, so a point inside one is a point the
   player's centre cannot occupy — which makes "is this cell free?" an exact test
   rather than an estimate. Flood-fills the interior from the hall with the front
   door shut, then reports reachable floor area and, more tellingly, CLEARANCE:
   how far you are from the nearest thing you cannot walk through. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}

try{
  var SD=window.__SD;
  SD.stopLoop(); SD.startHouse();
  var hx=SD.houseById('hoyt').x, STEP=0.08, PAD=9;

  // anything taller than a step-up is an obstacle; a 0.28 lip is not
  var solid=SD.colliders.filter(function(c){return (c.top||0)>SD.CONST.STEP_UP+0.02;});
  function blocked(x,z){
    for(var i=0;i<solid.length;i++){
      var c=solid[i];
      if(x>=c.minX&&x<=c.maxX&&z>=c.minZ&&z<=c.maxZ)return true;
    }
    return false;
  }

  var nx=Math.round(PAD*2/STEP), nz=Math.round(PAD*2/STEP);
  function idx(i,j){return i*nz+j;}
  var grid=new Uint8Array(nx*nz);          // 0 free, 1 blocked, 2 reachable
  for(var i=0;i<nx;i++)for(var j=0;j<nz;j++){
    var x=hx-PAD+i*STEP, z=-PAD+j*STEP;
    grid[idx(i,j)]=blocked(x,z)?1:0;
  }
  /* Seed just inside the front door, derived from the door itself rather than a
     hard-coded hall coordinate — the whole point of this tool is to measure layouts
     of different sizes, and a literal seed lands inside a wall the moment one moves. */
  var doorZ=SD.frontDoor.pos[2], HDg=Math.abs(doorZ);
  var seedX=0, seedZ=doorZ+0.85;
  var si=Math.round((seedX+PAD)/STEP), sj=Math.round((seedZ+PAD)/STEP);
  info('fill seed: '+seedX.toFixed(2)+', '+seedZ.toFixed(2)+
       '   (front door at z='+doorZ.toFixed(2)+')');
  var stack=[[si,sj]],reach=0;
  if(grid[idx(si,sj)]===0){
    grid[idx(si,sj)]=2;
    while(stack.length){
      var p=stack.pop();reach++;
      var di=[1,-1,0,0],dj=[0,0,1,-1];
      for(var d=0;d<4;d++){
        var a=p[0]+di[d],b=p[1]+dj[d];
        if(a<0||b<0||a>=nx||b>=nz)continue;
        if(grid[idx(a,b)]!==0)continue;
        grid[idx(a,b)]=2;stack.push([a,b]);
      }
    }
  }
  var area=reach*STEP*STEP;
  ok('the interior is reachable at all',reach>0,reach+' cells');
  info('WALKABLE FLOOR: '+area.toFixed(1)+' m2  ('+reach+' cells at '+STEP+'m)');

  /* CLEARANCE — the number that actually describes "barely room to move".
     For every walkable cell, how far is the nearest blocked cell? A corridor you can
     only just fit through reads as clearance ~= 0. */
  var clear=[],worst=1e9,worstAt=null;
  for(var i2=0;i2<nx;i2++)for(var j2=0;j2<nz;j2++){
    if(grid[idx(i2,j2)]!==2)continue;
    var best=99;
    for(var r=1;r<=14&&best===99;r++){
      for(var a2=-r;a2<=r&&best===99;a2++)for(var b2=-r;b2<=r;b2++){
        if(Math.max(Math.abs(a2),Math.abs(b2))!==r)continue;
        var u=i2+a2,v=j2+b2;
        if(u<0||v<0||u>=nx||v>=nz||grid[idx(u,v)]===1){best=r*STEP;break;}
      }
    }
    if(best<99){clear.push(best);
      if(best<worst){worst=best;worstAt=[(hx-PAD+i2*STEP).toFixed(2),(-PAD+j2*STEP).toFixed(2)];}}
  }
  clear.sort(function(a,b){return a-b;});
  var med=clear.length?clear[Math.floor(clear.length/2)]:0;
  var p90=clear.length?clear[Math.floor(clear.length*0.9)]:0;
  info('CLEARANCE  median '+med.toFixed(2)+'m   90th '+p90.toFixed(2)+
       'm   most open '+(clear.length?clear[clear.length-1].toFixed(2):'0')+'m');
  info('(clearance = distance from a walkable spot to the nearest thing you cannot');
  info(' walk through. The player capsule radius is '+SD.CONST.PLAYER_R+'m and colliders');
  info(' are already inflated by it, so 0.20m of clearance is a genuine squeeze.)');

  /* Per room, so it is obvious WHICH room is the problem. */
  function areaIn(name,x0,x1,z0,z1){
    var n=0,cl=[];
    for(var i3=0;i3<nx;i3++)for(var j3=0;j3<nz;j3++){
      if(grid[idx(i3,j3)]!==2)continue;
      var x=hx-PAD+i3*STEP,z=-PAD+j3*STEP;
      if(x<hx+x0||x>hx+x1||z<z0||z>z1)continue;
      n++;
    }
    info('  '+(name+'          ').slice(0,10)+(n*STEP*STEP).toFixed(1)+' m2 walkable'+
         '   of '+((x1-x0)*(z1-z0)).toFixed(1)+' m2 of room');
    return n*STEP*STEP;
  }
  info('');
  info('=== per room (walkable vs total floor) ===');
  /* Recover the shell size from THIS house's walls only — the street has four lots
     and an unfiltered scan picks up the neighbours, which reported a 57m half-width. */
  var HW=null,HD=null;
  SD.colliders.forEach(function(c){
    if(c.tag!=='wall')return;
    var cx=(c.minX+c.maxX)/2;
    if(Math.abs(cx-hx)>9)return;                 // a different lot
    var w=Math.max(Math.abs(c.minX-hx),Math.abs(c.maxX-hx));
    if(HW===null||w>HW)HW=w;
    var d=Math.max(Math.abs(c.minZ),Math.abs(c.maxZ));
    if(HD===null||d>HD)HD=d;
  });
  info('shell half-extents recovered: HW~'+(HW||0).toFixed(2)+'  HD~'+(HD||0).toFixed(2));
  var W=(HW||4.7)-0.2, D=(HD||3.7)-0.2;
  areaIn('hall',   -W, W, -D, -D*0.45);
  areaIn('kitchen',-W, 0, -D*0.45, D);
  areaIn('lounge',  0, W, -D*0.45, D*0.26);
  areaIn('bedroom', 0, W, D*0.26, D);

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

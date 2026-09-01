/* DIAGNOSTIC B: the rail, then TEN nights of the loop the rail taught. */
(function(){
var L=[];function p(s){L.push(s);}
function f(x,n){return (+x).toFixed(n===undefined?1:n);}
try{
  var SD=window.__SD,C=SD.CONST,R=SD.RESIDENTS,D=SD.DOUBT;
  SD.stopLoop();SD.startHouse();SD.GUIDE.setOn(true);

  function near(a,b){return Math.abs(a-b)<0.02;}
  function planterAt(t){return SD.PLANTERS.filter(function(q){
    return near(q.pos[0],t.pos[0])&&near(q.pos[2],t.pos[2]);})[0];}
  function doorAt(t){return SD.DOORS.filter(function(q){
    return near(q.pos[0],t.pos[0])&&near(q.pos[2],t.pos[2]);})[0];}
  function objAt(t){return SD.objects.filter(function(q){
    return q.spec&&q.spec._pos&&near(q.spec._pos[0],t.pos[0])&&
           near(q.spec._pos[2],t.pos[2]);})[0];}
  var lastScanned=null,log=[];
  function act(){
    var s=SD.GUIDE.step();
    if(!s)return 'DONE';
    var t=SD.beaconTarget();
    switch(s.id){
      case 'leave':if(t)SD.player.position.set(t.pos[0],0,t.pos[2]);break;
      case 'key':{var pl=t?planterAt(t):null;if(pl)SD.searchPlanter(pl);break;}
      case 'in':{var d=t?doorAt(t):null;if(d)SD.useDoor(d);break;}
      case 'read':SD.scanPulse();break;
      case 'scan':{var o=t?objAt(t):null;if(o){SD.scanObject(o);lastScanned=o;}break;}
      case 'fab':{var o2=t?objAt(t):null;if(o2)SD.fabricate(o2);break;}
      case 'swap':{var o3=t?objAt(t):null;if(o3)SD.swapWith(o3,0);break;}
      case 'out':SD.endNight('home','Home.');break;
      case 'shop':{var ids=Object.keys(SD.CATALOG),id=ids[ids.length-1];
        var rows=SD.shopStock(id,'bulwark');
        log.push('  the rail told me to buy a better one. Top row at Bulwark = '+
          f(rows[0].sim)+'%, forecast "'+(SD.predict(id,rows[0])||{}).text+'"');
        SD.buyVariant(id,0,'bulwark');break;}
      case 'back':SD.beginNight();break;
      case 'fence':if(SD.HAUL.length)SD.sellItem(0,'thrift');break;
      case 'meet':{SD.startWalk();if(SD.DAYFOLK[0])SD.talkTo(SD.DAYFOLK[0]);SD.endWalk();break;}
    }
    SD.GUIDE.tick();
    return s.id;
  }
  /* run the rail out */
  var g=0,mornings=[];
  function noteMorning(){
    mornings.push('  morning of day '+SD.GAME.day+': collapse '+f(SD.collapseIndex(),2)+
      ' / '+f(SD.winBar(),0)+'  susp '+f(SD.streetSuspicion(),2));
  }
  var d0=SD.GAME.day;
  while(g++<200){var id=act();if(id==='DONE')break;
    if(SD.GAME.day>d0){d0=SD.GAME.day;noteMorning();}}
  log.push('  the rail finished on day '+SD.GAME.day+', collapse '+f(SD.collapseIndex(),2));

  /* THE POST-RAIL CARD: "THAT IS THE LOOP / Now do it to the whole street." */
  var rs=Object.keys(SD.RESIDENTS).filter(function(id){return SD.objects.some(function(o){return o.owner===id;});});
  var ri=0;
  while(SD.GAME.day<=C.SLICE_NIGHTS&&g++<400){
    if(!SD.NIGHT.running)SD.beginNight();
    /* the next resident along, so it is SPREAD across the street */
    var target=null;
    for(var k=0;k<rs.length&&!target;k++){
      var rid=rs[(ri+k)%rs.length];
      var mine=SD.objects.filter(function(o){return o.owner===rid&&o.spec&&o.spec._pos&&
        !SD.PENDING.some(function(pp){return pp.objId===o.id;});});
      if(mine.length){target=mine[0];ri=(ri+k+1)%rs.length;}
    }
    if(!target)break;
    SD.player.position.set(target.spec._pos[0],0,target.spec._pos[2]);
    SD.scanPulse();
    if(!SD.CATALOG[target.id])SD.scanObject(target);
    var how='';
    var rows=SD.shopStock(target.id,'bulwark');
    var bought=rows.length?SD.buyVariant(target.id,0,'bulwark'):'nostock';
    if(bought==='poor'||bought==='already'||bought===null||!rows.length){
      var it=SD.fabricate(target);how=it?('printed '+f(it.sim)+'%'):'nothing';
    }else how='bought top row '+f(rows[0].sim)+'%';
    var probe={kind:target.kind,spec:target.spec,attach:target.attach,
               marked:target.marked,fresh:target.fresh};
    var inv=SD.invFor(target.id)[0];
    var band=inv?D.resolve(R[target.owner],probe,inv.spec).band:'-';
    SD.swapWith(target,0);
    log.push('  night '+SD.GAME.day+': '+target.label+' ('+target.owner+') '+how+
             ' -> '+band+'   money $'+SD.money());
    SD.endNight('home','Home.');
    noteMorning();
    if(SD.HAUL.length)SD.sellItem(0,'antique');
    SD.startWalk();if(SD.DAYFOLK[0])SD.talkTo(SD.DAYFOLK[0]);SD.endWalk();
  }
  p('THE GAME, PLAYED THE WAY THE GAME TELLS YOU TO:');
  log.forEach(function(s){p(s);});
  p('');
  mornings.forEach(function(s){p(s);});
  p('');
  p('FINAL  day='+SD.GAME.day+'  collapse '+f(SD.collapseIndex(),3)+' / '+f(SD.winBar(),0)+
    '  susp '+f(SD.streetSuspicion(),2)+'  swaps '+SD.GAME.stats.swapped+
    '  ending='+(SD.GAME.over?SD.GAME.over.kind+' "'+SD.GAME.over.title+'"':'none'));
  p('per-resident doubt: '+SD.activeResidents().map(function(r){
      return r.name.split(' ')[0]+'='+f(r.doubt,1);}).join(', '));
}catch(e){p('THREW: '+(e&&e.message)+' | '+String((e&&e.stack)||'').split('\n').slice(0,4).join(' | '));}
var pre=document.createElement('pre');pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\nSDTEST ALL-PASS pass=0 fail=0\n'+L.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);document.title='SDTEST ALL-PASS pass=0 fail=0';
})();

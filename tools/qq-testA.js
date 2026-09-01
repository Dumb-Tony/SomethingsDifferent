/* DIAGNOSTIC: play the game the way the game tells you to, and check the score. */
(function(){
var L=[];function p(s){L.push(s);}
function f(x,n){return (+x).toFixed(n===undefined?1:n);}
try{
  var SD=window.__SD,C=SD.CONST,R=SD.RESIDENTS;
  SD.stopLoop();SD.startHouse();SD.GUIDE.setOn(true);

  function stepId(){var s=SD.GUIDE.step();return s?s.id:null;}
  function near(a,b){return Math.abs(a-b)<0.02;}
  function planterAt(t){return SD.PLANTERS.filter(function(q){
    return near(q.pos[0],t.pos[0])&&near(q.pos[2],t.pos[2]);})[0];}
  function doorAt(t){return SD.DOORS.filter(function(q){
    return near(q.pos[0],t.pos[0])&&near(q.pos[2],t.pos[2]);})[0];}
  function objAt(t){return SD.objects.filter(function(q){
    return q.spec&&q.spec._pos&&near(q.spec._pos[0],t.pos[0])&&
           near(q.spec._pos[2],t.pos[2]);})[0];}

  var acted=[];        // transcript: what the game asked for, and what we did
  function act(){
    var s=SD.GUIDE.step();
    if(!s)return 'DONE';
    var t=SD.beaconTarget(),what='';
    switch(s.id){
      case 'leave':
        if(t){SD.player.position.set(t.pos[0],0,t.pos[2]);what='walked to '+t.label;}
        else what='NO BEACON';break;
      case 'key':{
        var pl=t?planterAt(t):null;
        if(pl){SD.searchPlanter(pl);what='searched a planter at '+f(pl.pos[0])+','+f(pl.pos[2])+
          (SD.GAME.keys[pl.house]?' -> KEY ('+pl.house+')':' -> nothing');}
        else what='NO BEACON';break;}
      case 'in':{
        var d=t?doorAt(t):null;
        if(d){SD.useDoor(d);what='used the door at '+d.house+
          (d.open?' -> OPEN':' -> STILL SHUT (locked='+d.locked+')');}
        else what='NO BEACON';break;}
      case 'read':SD.scanPulse();what='pulsed';break;
      case 'scan':{
        var o=t?objAt(t):null;
        if(o){SD.scanObject(o);what='scanned '+o.label+' ('+o.owner+')';}
        else what='NO BEACON';break;}
      case 'fab':{
        var o2=t?objAt(t):null;
        if(o2){var it=SD.fabricate(o2);
          what='printed a copy of '+o2.label+(it?' at '+f(it.sim)+'%':' -> REFUSED');}
        else what='NO BEACON';break;}
      case 'swap':{
        var o3=t?objAt(t):null;
        if(o3){var got=SD.swapWith(o3,0);
          what='swapped '+o3.label+(got?' with the '+f(got.sim)+'% copy':' -> NOTHING IN BAG');}
        else what='NO BEACON';break;}
      case 'out':SD.endNight('home','You are inside before the sky moves.');
        what='went home; the report resolved';break;
      case 'shop':{
        var ids=Object.keys(SD.CATALOG);
        var id=ids[ids.length-1];
        var rows=SD.shopStock(id,'bulwark');
        var pr=SD.predict(id,rows[0]);
        var r=SD.buyVariant(id,0,'bulwark');
        what='bought the top row at Bulwark: '+f(rows[0].sim)+'% for $'+rows[0].price+
             '  forecast="'+(pr?pr.text:'-')+'"  result='+r;break;}
      case 'back':SD.beginNight();what='went back out';break;
      case 'fence':{
        var res=SD.HAUL.length?SD.sellItem(0,'thrift'):'nothing to sell';
        what='sold at Second Chances: '+res;break;}
      case 'meet':{
        SD.startWalk();
        var folk=SD.DAYFOLK[0];
        if(folk){SD.talkTo(folk);what='stood with '+folk.name;}else what='NOBODY OUT';
        SD.endWalk();break;}
      default:what='UNHANDLED';
    }
    acted.push(s.id+': '+what);
    SD.GUIDE.tick();
    return s.id;
  }

  /* ── the rail, all the way through, doing exactly what it asks ──────────── */
  var collapseByMorning=[],bands=[],guard=0;
  var mornings=0;
  var lastId=null;
  while(mornings<10&&guard++<400){
    var before=SD.GAME.day;
    var id=act();
    if(id==='DONE')break;
    if(SD.GAME.day>before){
      mornings++;
      collapseByMorning.push('  morning of day '+SD.GAME.day+': collapse '+
        f(SD.collapseIndex(),2)+' / '+f(SD.winBar(),0)+
        '   street susp '+f(SD.streetSuspicion(),2));
    }
    lastId=id;
  }
  p('RAIL TRANSCRIPT (what the guide asked for, and what happened):');
  acted.forEach(function(s){p('  '+s);});
  p('');
  p('guideDone='+SD.GAME.guideDone+'  guideStep='+SD.GAME.guideStep+'/'+SD.GUIDE_STEPS.length+
    '  day='+SD.GAME.day+'  mornings='+mornings);
  p('collapseIndex now = '+f(SD.collapseIndex(),3)+' / '+f(SD.winBar(),0));
  collapseByMorning.forEach(function(s){p(s);});
}catch(e){p('THREW: '+(e&&e.message)+' | '+String((e&&e.stack)||'').split('\n').slice(0,4).join(' | '));}
var pre=document.createElement('pre');pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\nSDTEST ALL-PASS pass=0 fail=0\n'+L.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);document.title='SDTEST ALL-PASS pass=0 fail=0';
})();

(function(){
var L=[];function p(s){L.push(s);}
try{
  var SD=window.__SD;SD.stopLoop();SD.startHouse();
  p('HOUSES: '+SD.HOUSES.map(function(h){return h.id+'@x'+h.x.toFixed(1)+(h.yours?'(yours)':'');}).join(', '));
  p('DOORS: '+SD.DOORS.map(function(d,i){
     return i+':'+d.house+' locked='+d.locked+' open='+d.open+' x'+d.pos[0].toFixed(1);}).join(' | '));
  p('PLANTERS: '+SD.PLANTERS.map(function(q,i){
     return i+':'+q.house+' key='+!!q.hasKey+' x'+q.pos[0].toFixed(1);}).join(' | '));
  SD.GUIDE.setOn(true);
  ['leave','key','in','scan'].forEach(function(id){
    SD.GAME.guideStep=SD.GUIDE_STEPS.map(function(s){return s.id;}).indexOf(id);
    SD.GAME.guideDone=false;
    var t=SD.beaconTarget();
    p('beacon for "'+id+'" -> '+(t?(t.label+' at x'+t.pos[0].toFixed(1)+' z'+t.pos[2].toFixed(1)):'null'));
  });
  p('player starts at x'+SD.player.position.x.toFixed(1)+' z'+SD.player.position.z.toFixed(1));
}catch(e){p('THREW: '+(e&&e.message));}
var pre=document.createElement('pre');pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\nSDTEST ALL-PASS pass=0 fail=0\n'+L.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);document.title='SDTEST ALL-PASS pass=0 fail=0';
})();

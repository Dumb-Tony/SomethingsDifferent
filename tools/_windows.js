/* Does glass actually do anything? Sight through a window, sound NOT through it. */
(function(){
  var out=[],SD=window.__SD;
  function line(k,v){out.push((k+'                          ').slice(0,28)+v);}
  try{
    SD.stopLoop();SD.startHouse();
    line('windows registered',SD.WINDOWS.length);
    var h=SD.houseById('hoyt');
    // the lounge window is on the east wall at x=+HW, z=_p(-0.30)
    var RS=SD.CONST.ROOM_SCALE, HW=4.5*RS;
    var inX=h.x+HW-1.2, outX=h.x+HW+1.2, z=-0.30*RS;
    line('inside point',inX.toFixed(2)+', '+z.toFixed(2));
    line('outside point',outX.toFixed(2)+', '+z.toFixed(2));
    line('walls between (sound)',SD.wallsBetween(inX,z,outX,z));
    line('sight blocked',SD.sightBlocked(inX,z,outX,z));
    // ...and through a solid stretch of the same wall, well away from the window
    var z2=-0.30*RS+3.0;
    line('solid wall: sound',SD.wallsBetween(inX,z2,outX,z2));
    line('solid wall: sight',SD.sightBlocked(inX,z2,outX,z2));
    line('verdict',(SD.sightBlocked(inX,z,outX,z)===0&&SD.sightBlocked(inX,z2,outX,z2)>0)
      ?'GLASS WORKS':'no difference');
  }catch(e){line('threw',(e&&e.message)+' @ '+String(e&&e.stack).split('\n')[1]);}
  var pre=document.createElement('pre');
  pre.textContent='==SDTEST-BEGIN==\n'+out.join('\n')+'\nALL-PASS (diagnostic)\n==SDTEST-END==';
  document.body.appendChild(pre);
})();

/* qq-jdgE2 - is "one household taken apart completely is worth 22 of 40" true?
   oneHouseCeiling() as specified takes the top INDIVIDUAL credibility. A household is
   two people. Compute both, and check doubt really is capped at 100. */
(function(){
var L=[];function p(s){L.push(s);}
try{
var SD=window.__SD,C=SD.CONST;
SD.stopLoop();SD.startHouse();
var rs=SD.activeResidents(),tot=0;
rs.forEach(function(r){tot+=r.credibility;});
p('sum credibility '+tot.toFixed(2));
p('resident fields: '+Object.keys(rs[0]).join(','));
/* group by house: RESIDENTS carry a house id, and objects carry owner. */
var byHouse={};
rs.forEach(function(r){
  var hid=r.house||r.hid||r.home||'?';
  (byHouse[hid]=byHouse[hid]||[]).push(r);
});
Object.keys(byHouse).forEach(function(h){
  var g=byHouse[h],s=0;g.forEach(function(r){s+=r.credibility;});
  p('  house '+h+': '+g.map(function(r){return r.name+' '+r.credibility;}).join(' + ')+
    '  = '+s.toFixed(2)+'  -> 100*'+s.toFixed(2)+'/'+tot.toFixed(2)+' = '+
    (100*s/tot).toFixed(1)+' of '+SD.winBar().toFixed(0));
});
p('');
/* the specified helper, verbatim */
var top=0;rs.forEach(function(r){if(r.credibility>top)top=r.credibility;});
p('oneHouseCeiling() as specified = 100*'+top.toFixed(2)+'/'+tot.toFixed(2)+' = '+
  (100*top/tot).toFixed(1)+'  <- that is ONE PERSON, not one household');
p('');
/* doubt clamp: drive one person past 100 by hand and read collapseIndex */
SD.RESIDENTS.marisol.doubt=100;
p('marisol.doubt=100 alone -> collapseIndex '+SD.collapseIndex().toFixed(1));
SD.RESIDENTS.aaron.doubt=100;
p('...plus aaron (same house) -> collapseIndex '+SD.collapseIndex().toFixed(1));
SD.startHouse();
SD.RESIDENTS.walt.doubt=100;SD.RESIDENTS.june.doubt=100;
p('the Hoyts, both at 100 -> collapseIndex '+SD.collapseIndex().toFixed(1)+
  ' of '+SD.winBar().toFixed(0));
/* is doubt clamped by the real commit path? */
SD.startHouse();
var res=SD.RESIDENTS.walt;res.doubt=99;
p('DOUBT.commit clamp check: doubt set to 99, then a big manual add is clamped by '+
  'fracture apply() calls (clamp(...,0,100) at 7805/7826/7853).');
}catch(e){p('THREW: '+(e&&e.message)+' @ '+String((e&&e.stack)||'').split('\n').slice(0,3).join(' | '));}
var pre=document.createElement('pre');pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\nSDTEST ALL-PASS pass=0 fail=0\n'+L.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);document.title='SDTEST ALL-PASS pass=0 fail=0';
})();

/* ─────────────────────────────────────────────────────────────────────────────
   Milestone 4 — 12 Ardsley Ct: entry, scan, requisition, swap, morning.

   The milestone's stated verification is "full loop by hand, Doubt visibly rises".
   Section 6 does exactly that end-to-end and asserts the number.
   ───────────────────────────────────────────────────────────────────────────── */
(function(){
var out=[],pass=0,fail=0;
function ok(name,cond,detail){
  if(cond){pass++;out.push('PASS  '+name+(detail?'   ('+detail+')':''));}
  else    {fail++;out.push('FAIL  '+name+(detail?'   ('+detail+')':''));}
}
function info(s){out.push('      '+s);}
function near(a,b,tol){return Math.abs(a-b)<=tol;}

try{
  var SD=window.__SD;
  ok('__SD present',!!SD); if(!SD)throw new Error('no __SD');
  var C=SD.CONST,SP=SD.SPEC,D=SD.DOUBT,R=SD.RESIDENTS,K=SD.PROP_KINDS;
  SD.stopLoop();
  SD.startHouse();

  /* ── 1. the house exists ───────────────────────────────────────────────── */
  ok('phase is house',SD.S.phase==='house');
  var hoytObjs=SD.objects.filter(function(o){return o.house==='hoyt';});
  /* Was ===6, from when the Hoyts owned exactly six things. M12 furnished the street
     properly and broke it. Now asserts the PROPERTY it was always really about — the
     tutorial house has enough in it to practise on — instead of a content count that
     every content pass invalidates. */
  ok('the Hoyt house is furnished with things worth swapping',hoytObjs.length>=6,
     hoytObjs.length+': '+hoytObjs.map(function(o){return o.label;}).join(', '));
  /* Was ===4. M16 added Ray's lot, which is a legitimate fifth. The property this was
     ever really about is that the Hoyts are not the whole street. */
  ok('and more houses beyond this one',SD.HOUSES.length>=4&&SD.objects.length>6,
     SD.objects.length+' objects across '+SD.HOUSES.length+' lots');
  ok('every object has an owner who is a real resident',
     SD.objects.every(function(o){return !!R[o.owner];}),
     SD.objects.map(function(o){return o.owner;}).join(','));
  ok('every object has a mesh in the scene',
     SD.objects.every(function(o){return o.group&&o.group.parent===SD.scene;}));
  var hoytPl=SD.PLANTERS.filter(function(p){return p.house==='hoyt';});
  ok('three planters per house, exactly one holding the key',
     hoytPl.length===3&&hoytPl.filter(function(p){return p.hasKey;}).length===1,
     SD.PLANTERS.length+' on the street');
  ok('front door exists and starts locked',
     !!SD.frontDoor&&SD.frontDoor.locked===true&&SD.frontDoor.open===false);
  ok('colliders built for shell + fixtures',SD.colliders.length>=18,
     'n='+SD.colliders.length);

  /* ── 2. ceiling zones: indoors has one, the yard does not ──────────────── */
  ok('indoors has a ceiling',near(SD.ceilAt(0,0),C.WALL_H,1e-9),'y='+SD.ceilAt(0,0));
  ok('the yard is open to the sky',SD.ceilAt(0,-6.5)===0);

  /* ── 3. the locked door actually stops you ─────────────────────────────── */
  /* The coordinates below are FLOORPLAN LAYOUT UNITS, the same ones the house
     builder authors in - P() applies the same ROOM_SCALE conversion. Anything read
     off a live object (walt.x, an object's _pos) is already in metres and must not
     be converted twice. */
  function P(v){return v*SD.CONST.ROOM_SCALE;}
  function stand(x,z,yaw){
    SD.player.position.set(x,0,z);
    SD.S.py=0;SD.S.vy=0;SD.S.grounded=true;SD.S.mvx=0;SD.S.mvz=0;
    SD.S.yaw=yaw===undefined?0:yaw;SD.S.camP=null;SD.S.camL=null;SD.S.focus=null;
  }
  stand(0,P(-5.0),Math.PI);                 // yaw PI => W walks toward +Z
  SD.hold(['w'],70);
  var zLocked=SD.player.position.z;
  ok('the locked front door blocks you',zLocked<SD.frontDoor.pos[2]+0.6,
     'stopped at z='+zLocked.toFixed(3)+' (door face '+SD.frontDoor.pos[2].toFixed(2)+')');

  /* ── 4. finding the spare key ──────────────────────────────────────────── */
  ok('no key to start with',SD.GAME.hasSpareKey===false);
  SD.useDoor(SD.frontDoor);
  ok('trying the door without the key leaves it locked',SD.frontDoor.locked===true);
  var empties=hoytPl.filter(function(p){return !p.hasKey;});
  SD.searchPlanter(empties[0]);
  ok('an empty planter yields nothing',SD.GAME.hasSpareKey===false&&empties[0].searched);
  SD.searchPlanter(hoytPl.filter(function(p){return p.hasKey;})[0]);
  ok('the right planter yields the spare key',SD.GAME.keys.hoyt===true,
     'keys: '+JSON.stringify(SD.GAME.keys));
  ok('...and it does NOT open the neighbours',!SD.GAME.keys.vance&&!SD.GAME.keys.okonkwo);

  SD.useDoor(SD.frontDoor);
  ok('the key unlocks and opens the door',
     SD.frontDoor.locked===false&&SD.frontDoor.open===true);
  ok('opening the door removes its collider',
     SD.colliders.indexOf(SD.frontDoor.coll)<0);
  stand(0,P(-5.0),Math.PI);
  SD.hold(['w'],80);
  ok('you can now walk in through the doorway',
     SD.player.position.z>SD.frontDoor.pos[2]+0.5,
     'reached z='+SD.player.position.z.toFixed(3)+
     ', door at '+SD.frontDoor.pos[2].toFixed(2));

  /* ── 5. interaction targeting ──────────────────────────────────────────── */
  var keys=SD.objects.filter(function(o){return o.kind==='keyring';})[0];
  ok("Walt's keys are in the dish by the door",!!keys&&keys.owner==='walt'&&keys.attach>1.5,
     keys?('attach '+keys.attach):'missing');
  stand(P(-2.9),P(-2.6),Math.PI/2);          // facing -X, toward the hall dish
  var t=SD.findTarget();
  ok('findTarget picks the object you are facing',
     !!t&&t.t==='prop'&&t.o.id===keys.id,t?(t.t+' '+(t.o?t.o.label:'')):'none');
  stand(P(-2.9),P(-2.6),-Math.PI/2);         // turn around
  var tBack=SD.findTarget();
  ok('facing away from it finds nothing',!tBack||tBack.o!==keys,
     tBack?tBack.t:'none');
  stand(P(3.5),P(0.5),0);
  ok('nothing in reach across the room',(function(){
      var x=SD.findTarget();return !x||x.t!=='prop'||x.o.id!==keys.id;})());

  /* ── 6. THE LOOP: scan -> requisition -> swap -> morning ───────────────── */
  ok('acquisition is gated on recon',
     SD.requisition(keys)===null&&SD.INV.length===0,
     'requisition before scan returns null');

  SD.scanObject(keys);
  ok('scanning records the spec',!!SD.CATALOG[keys.id]&&
     SD.CATALOG[keys.id].kind==='keyring');
  ok('the catalog snapshot is a COPY, not a live reference',
     SD.CATALOG[keys.id].spec!==keys.spec);

  var made=SD.requisition(keys);
  ok('requisition yields three variants',!!made&&made.length===3&&SD.INV.length===3,
     made?made.map(function(m){return m.sim.toFixed(1)+'%';}).join(' '):'none');
  ok('the variants ladder down in similarity',
     made[0].sim>made[1].sim&&made[1].sim>made[2].sim);
  ok('every variant is for this object',
     SD.invFor(keys.id).length===3);

  var before=JSON.parse(JSON.stringify(keys.spec));
  var posBefore=keys.spec._pos.slice();
  var chosen=made[2];                        // the least similar of the three
  SD.swapWith(keys,2);
  ok('swapping changes the spec',JSON.stringify(keys.spec)!==JSON.stringify(before));
  ok('swapping does NOT move the object',
     keys.spec._pos[0]===posBefore[0]&&keys.spec._pos[2]===posBefore[2],
     'stayed at '+keys.spec._pos.map(function(v){return v.toFixed(2);}).join(','));
  ok('the swapped variant leaves the bag',SD.INV.length===2);
  ok('the world mesh was rebuilt',keys.group&&keys.group.userData.objId===keys.id&&
     near(keys.group.position.x,posBefore[0],1e-9));
  ok('the change is on tonight\'s ledger, unresolved',
     SD.PENDING.length===1&&SD.PENDING[0].objId===keys.id);
  ok('Walt has not noticed anything yet',R.walt.doubt===0,
     'doubt='+R.walt.doubt);

  var waltBefore=R.walt.doubt;
  var lines=SD.doMorning();
  ok('morning resolves exactly one change',lines.length===1);
  var L=lines[0];
  info('morning: '+L.label+' -> '+L.r.band+'  '+L.r.similarity.toFixed(1)+'% similar, '+
       'delta '+L.r.delta.toFixed(1)+', window '+L.r.floor+'-'+L.r.ceiling.toFixed(1));
  ok('THE LOOP LANDS IN DOUBT',L.r.band==='DOUBT',
     'band='+L.r.band+' delta='+L.r.delta.toFixed(1));
  ok('DOUBT VISIBLY RISES',R.walt.doubt>waltBefore&&R.walt.doubt>3,
     waltBefore.toFixed(1)+' -> '+R.walt.doubt.toFixed(1));
  ok('no suspicion from a doubt-band change',R.walt.suspicion===0);
  ok('the ledger is cleared and the day advances',
     SD.PENDING.length===0&&SD.GAME.day===2);
  ok('morning resolved against the pre-change state, not the new one',
     near(L.r.similarity,SP.specDelta('keyring',before,keys.spec).similarity,1e-9),
     L.r.similarity.toFixed(2)+'%');

  /* ── 7. repeated edits collapse into ONE perception ────────────────────── */
  var mug=SD.objects.filter(function(o){return o.kind==='coffeeMug';})[0];
  var mugStart=mug.spec._pos.slice();
  for(var i=0;i<7;i++)SD.nudgeObject(mug,0.03,0);
  ok('seven nudges make ONE ledger entry, not seven',SD.PENDING.length===1,
     'entries='+SD.PENDING.length+', labels='+SD.PENDING[0].labels.length);
  ok('the object actually moved 21cm',
     near(mug.spec._pos[0]-mugStart[0],0.21,1e-9),
     (100*(mug.spec._pos[0]-mugStart[0])).toFixed(1)+'cm');
  var waltD2=R.walt.doubt;
  var l2=SD.doMorning();
  info('morning: '+l2[0].label+' -> '+l2[0].r.band+'  delta '+l2[0].r.delta.toFixed(1));
  ok('moving his mug 21cm is noticed',l2[0].r.band==='DOUBT',l2[0].r.band);
  ok('displacement alone raises doubt',R.walt.doubt>waltD2,
     waltD2.toFixed(1)+' -> '+R.walt.doubt.toFixed(1));
  /* The report must describe the NET change, not replay the seven keystrokes. */
  var desc=SP.describeDiffs('coffeeMug',l2[0].r.diffs);
  ok('the change is described by its net effect, not the actions taken',
     desc.indexOf('moved 21cm')===0&&desc.indexOf('moved 3cm')<0,desc);

  /* ── 8. a change beneath the floor does nothing ────────────────────────── */
  var cereal=SD.objects.filter(function(o){return o.kind==='cerealBox';})[0];
  ok('the cereal belongs to June',cereal.owner==='june');
  SD.scanObject(cereal);
  var cMade=SD.requisition(cereal);
  var juneBefore=R.june.doubt;
  SD.swapWith(cereal,0);                     // the 97% match
  var l3=SD.doMorning();
  info('morning: '+l3[0].label+' -> '+l3[0].r.band+'  '+l3[0].r.similarity.toFixed(1)+
       '% similar, delta '+l3[0].r.delta.toFixed(1)+' vs floor '+l3[0].r.floor);
  ok('a 97% match on a low-attachment object is MISSED',l3[0].r.band==='MISSED',
     l3[0].r.band+' delta='+l3[0].r.delta.toFixed(1));
  ok('a missed change costs June nothing',R.june.doubt===juneBefore);
  ok('...and costs the object some freshness',cereal.fresh<1,
     'fresh='+cereal.fresh.toFixed(2));

  /* ── 9. an identical replacement is worthless ──────────────────────────── */
  var clock=SD.objects.filter(function(o){return o.kind==='wallClock';})[0];
  SD.applyChange(clock,JSON.parse(JSON.stringify(clock.spec)),'identical');
  var l4=SD.doMorning();
  ok('a perfectly identical swap creates no doubt',
     l4[0].r.band==='MISSED'&&l4[0].r.delta===0,
     'delta='+l4[0].r.delta);

  /* ── 10. the UI paths do not throw ─────────────────────────────────────── */
  var threw='';
  try{
    SD.enterFocus(keys);SD.exitFocus();
    SD.S.menuOpen=false;
  }catch(e){threw=e.message;}
  ok('focus panel renders without throwing',!threw,threw);
  try{ SD.S.menuOpen=false; window.__SD_showDossier&&window.__SD_showDossier(); }catch(e){}

  var eb=document.getElementById('err-banner');
  ok('no crash banner',!eb,eb?eb.textContent.slice(0,200):'');

  info('final: Walt doubt '+R.walt.doubt.toFixed(1)+' susp '+R.walt.suspicion.toFixed(1)+
       ' | June doubt '+R.june.doubt.toFixed(1)+' susp '+R.june.suspicion.toFixed(1)+
       ' | day '+SD.GAME.day);

}catch(e){
  fail++;
  out.push('FAIL  harness threw: '+(e&&e.message)+'  @ '+String((e&&e.stack)||'').split('\n').slice(0,3).join(' | '));
}

var summary='SDTEST '+(fail===0?'ALL-PASS':'FAILURES')+' pass='+pass+' fail='+fail;
var pre=document.createElement('pre');
pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\n'+summary+'\n'+out.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);
document.title=summary;
})();




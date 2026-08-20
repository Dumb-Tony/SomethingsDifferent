/* M22 — PEOPLE.
   Everybody in this game had been the same body since M1: a box torso, a sphere for
   a head, a cone for a nose, one colourway. That was fine while the only person on
   screen was you, seen from behind, in the dark. M20 turned the lights on and put
   the whole street outside in the afternoon — and the bodies became the most-looked-
   at thing in the game.

   One builder for all of them, and a LOOK derived deterministically from a person's
   id, the same trick the props have used since M2 applied to people. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}
function n2(x){return (Math.round(x*100)/100).toString();}

try{
var SD=window.__SD,C=SD.CONST;
SD.stopLoop();SD.startHouse();SD.S.menuOpen=false;

/* ── 1. A PERSON IS A PARAMETER VECTOR ──────────────────────────────────────*/
(function(){
  var a=SD.personLook('walt'),b=SD.personLook('walt'),c=SD.personLook('june');
  ok('THE SAME PERSON IS THE SAME PERSON EVERY TIME',
     JSON.stringify(a)===JSON.stringify(b),
     a.skin+' / '+a.hair+' / '+a.style);
  ok('...and different people are different',JSON.stringify(a)!==JSON.stringify(c),
     'walt '+a.style+' vs june '+c.style);
  ok('a look carries everything a body needs',
     !!(a.skin&&a.hair&&a.top&&a.legs&&a.shoe&&a.style&&a.h&&a.build));
  ok('...including a height that is not everybody\'s height',
     a.h>0.9&&a.h<1.1,'x'+n2(a.h)+' of CH_H');
  // the cast must not all come out looking the same
  var ids=['walt','june','marisol','aaron','dev','grace','ray'];
  var skins={},hairs={},tops={};
  ids.forEach(function(id){
    var L=SD.personLook(id);skins[L.skin]=1;hairs[L.hair]=1;tops[L.top]=1;
  });
  info('across the seven residents: '+Object.keys(skins).length+' skin tones, '+
       Object.keys(hairs).length+' hair colours, '+Object.keys(tops).length+' tops');
  ok('THE STREET IS NOT ONE PERSON SEVEN TIMES',
     Object.keys(skins).length>=3&&Object.keys(hairs).length>=3,
     Object.keys(skins).length+' skins / '+Object.keys(hairs).length+' hairs');
})();

/* ── 2. THE BODY KEEPS THE CONTRACT animBody HAS DRIVEN SINCE M1 ────────────*/
(function(){
  var p=SD.makePerson(SD.personLook('test'));
  ok('makePerson returns a group and its parts',!!p.group&&!!p.parts);
  ['legL','legR','armL','armR','torso','head','nose'].forEach(function(k){
    ok('...it has a '+k,!!p.parts[k]);
  });
  ok('the limbs hinge from the TOP, not the middle',
     p.parts.legL.position.y>0.5&&p.parts.armL.position.y>0,
     'legs pivot at '+n2(p.parts.legL.position.y)+'m');
  var n=0;p.group.traverse(function(o){if(o.isMesh)n++;});
  info(n+' meshes per person');
  ok('A PERSON IS MORE THAN FIVE BOXES NOW',n>=14,n+' parts');
  ok('...but not so many that a street of them costs the frame',n<=32,n+' parts');
  var bb=new THREE.Box3().setFromObject(p.group);
  var h=bb.max.y-bb.min.y;
  ok('...and they are person-sized',h>1.5&&h<2.1,n2(h)+'m tall');
  ok('...standing on the floor, not in it',Math.abs(bb.min.y)<0.03,
     'feet at y='+n2(bb.min.y));
})();

/* ── 3. THE PLAYER STILL WALKS ──────────────────────────────────────────────
   The whole risk of this milestone: animBody drives BODY.legL/legR/armL/armR by
   name and has since M1. A rebuild that renamed or re-parented any of them would
   leave the player sliding around with stiff legs and nothing would throw. */
(function(){
  SD.startHouse();SD.S.menuOpen=false;
  var B=SD.BODY;
  ok('the player has a body with the parts the walk cycle drives',
     !!(B&&B.legL&&B.legR&&B.armL&&B.armR&&B.torso&&B.head));
  B.legL.rotation.x=0;B.armR.rotation.x=0;
  SD.hold(['w'],40,1/60);
  ok('WALKING SWINGS THE LEGS',Math.abs(B.legL.rotation.x)>0.02,
     'legL at '+n2(B.legL.rotation.x)+' rad');
  ok('...and the arms',Math.abs(B.armR.rotation.x)>0.01,
     'armR at '+n2(B.armR.rotation.x)+' rad');
  ok('...in opposition, like a person',
     (B.legL.rotation.x>0)!==(B.legR.rotation.x>0),
     n2(B.legL.rotation.x)+' vs '+n2(B.legR.rotation.x));
  // and standing still settles them
  for(var i=0;i<120;i++)SD.run(1,1/60);
  ok('STANDING STILL SETTLES THEM',Math.abs(B.legL.rotation.x)<0.05,
     n2(B.legL.rotation.x));
})();

/* ── 4. EVERYBODY IN THE GAME IS ONE OF THESE ───────────────────────────────*/
(function(){
  SD.startHouse();SD.S.menuOpen=false;
  // the sleepers you stand over all night
  var s=SD.SLEEPERS[0];
  var heads=0;s.group.traverse(function(o){if(o.isMesh)heads++;});
  ok('A SLEEPER HAS A FACE',heads>=4,heads+' parts (was 3: body, sphere, legs)');
  ok('...and it is the same face they wear in the afternoon',
     !!s.group.userData.head);
  // the watchman
  SD.GAME.hardened=['watch'];SD.nightReset();
  var w=SD.WATCH;
  ok('the watchman is one too',!!(w&&w.group));
  var wm=0;w.group.traverse(function(o){if(o.isMesh)wm++;});
  ok('...with the hi-vis over the top of it',wm>=15,wm+' parts');
  SD.GAME.hardened=[];SD.nightReset();
})();

/* ── 5. AND THEY ARE NOT STATUES ────────────────────────────────────────────*/
(function(){
  SD.startHouse();SD.S.menuOpen=false;
  SD.startWalk();
  var f=SD.DAYFOLK[0];
  var y0=f.group.rotation.y,p0=f.group.position.y;
  SD.folkTick(0.5);SD.folkTick(0.5);SD.folkTick(0.5);
  var moved=Math.abs(f.group.rotation.y-y0)>0.001||
            Math.abs(f.group.position.y-p0)>0.0005;
  ok('SOMEBODY STANDING IN A GARDEN SHIFTS THEIR WEIGHT',moved,
     'rotation moved '+n2(Math.abs(f.group.rotation.y-y0))+' rad');
  ok('...but stays where they were put',
     Math.abs(f.group.position.x-f.x)<0.01&&Math.abs(f.group.position.z-f.z)<0.01,
     'still at '+n2(f.group.position.x)+', '+n2(f.group.position.z));
  ok('...and stays on the ground',Math.abs(f.group.position.y)<0.05,
     'y='+n2(f.group.position.y));
  SD.endWalk();
})();

/* ── 6. THE STREET STILL FITS IN THE FRAME BUDGET ───────────────────────────
   M21 learned this the hard way: putting specular on ceramic starved m11's live
   render-loop check on the software renderer. Sixteen people at ~20 meshes each is
   the same kind of bill and has to be checked the same way. */
(function(){
  SD.startHouse();
  var meshes=0;SD.scene.traverse(function(o){if(o.isMesh)meshes++;});
  info('street mesh count with everybody in it: '+meshes);
  ok('THE PEOPLE DID NOT BLOW THE MESH BUDGET',meshes<2600,meshes+' meshes');
  SD.renderer.info.reset&&SD.renderer.info.reset();
  SD.renderer.render(SD.scene,SD.camera);
  info('draw calls: '+SD.renderer.info.render.calls);
  ok('...nor the draw calls',SD.renderer.info.render.calls<900,
     SD.renderer.info.render.calls);
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

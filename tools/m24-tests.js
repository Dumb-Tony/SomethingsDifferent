/* M24 — THE SCANNER.
   Until now the only way to learn anything about a room was to walk within
   INTERACT_RANGE (2.0m) of a thing and face it. A house holds twenty possessions and
   a hundred-odd pieces of scenery, in the dark, so the player swept it with their
   face. The alien has an instrument; it should be able to read a room.

   Two properties make it a mechanic rather than a cheat: it reads only what it can
   SEE (sightBlocked — through glass, never through walls), and it is LOUDER than
   reading one thing by hand, so "walk over and look" stays worth doing when somebody
   is stirring. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}
function n2(x){return (Math.round(x*100)/100).toString();}

try{
var SD=window.__SD,C=SD.CONST;
SD.stopLoop();SD.startHouse();SD.S.menuOpen=false;
var RS=C.ROOM_SCALE,HW=4.5*RS,HD=3.5*RS;
var h=SD.houseById('hoyt');

function standIn(){                    // the middle of the Hoyt lounge
  SD.player.position.set(h.x+3.9,0,-0.6);
  SD.S.py=0;SD.S.scanCd=0;SD.S.scanT=0;
}

/* ── 1. IT READS THE ROOM ───────────────────────────────────────────────────*/
(function(){
  standIn();
  var r=SD.scanPulse();
  ok('A PULSE FINDS THINGS',!!r&&r.n>0,r?r.n+' possessions marked':'nothing');
  ok('...and puts a mark on each of them',SD.MARKS.length===r.n,
     SD.MARKS.length+' marks');
  info('from the middle of the lounge: '+JSON.stringify(r.counts));
  ok('...at least one of which you have never recorded',r.counts.fresh>0,
     r.counts.fresh+' unrecorded');
  ok('the marks float above the things they mark',
     SD.MARKS.every(function(m){return m.position.y>0.1;}));
})();

/* ── 2. IT ONLY READS WHAT IT CAN SEE ───────────────────────────────────────*/
(function(){
  standIn();
  var r=SD.scanPulse();
  var seen={};
  SD.MARKS.forEach(function(m){seen[n2(m.position.x)+','+n2(m.position.z)]=1;});
  // everything it marked must be in range AND unobstructed
  var px=SD.player.position.x,pz=SD.player.position.z;
  var cheated=SD.MARKS.filter(function(m){
    return Math.hypot(m.position.x-px,m.position.z-pz)>C.SCAN_R+0.5||
           SD.sightBlocked(px,pz,m.position.x,m.position.z)>0;
  });
  ok('IT DOES NOT SEE THROUGH WALLS',cheated.length===0,
     cheated.length?(cheated.length+' marks with no line of sight'):'every mark is in view');
  // ...and there IS something it could not see, or that proves nothing
  var hidden=SD.objects.filter(function(o){
    var p=o.spec._pos;
    return Math.hypot(p[0]-px,p[2]-pz)<=C.SCAN_R&&SD.sightBlocked(px,pz,p[0],p[2])>0;
  });
  ok('...and there were things in range it could not see',hidden.length>0,
     hidden.length+' in range but behind a wall');
})();

/* ── 3. GLASS. THE REASON M23 EXISTS. ───────────────────────────────────────*/
(function(){
  // stand in the yard, outside the lounge window, and read the room through it
  SD.player.position.set(h.x+HW+1.4,0,-0.30*RS);
  SD.S.py=0;SD.S.scanCd=0;SD.S.scanT=0;
  var r=SD.scanPulse();
  ok('YOU CAN CASE A ROOM FROM THE GARDEN, THROUGH THE GLASS',!!r&&r.n>0,
     r?(r.n+' of their things read from outside the window'):'nothing');
  info('this is what the windows milestone was for');
})();

/* ── 4. IT COSTS THE ONE CURRENCY THE NIGHT IS MADE OF ──────────────────────*/
(function(){
  SD.startHouse();SD.S.menuOpen=false;
  SD.NIGHT.running=true;
  standIn();
  SD.SLEEPERS.forEach(function(s){s.noise=0;});
  SD.scanPulse();
  var heard=SD.SLEEPERS.filter(function(s){return s.noise>0;});
  ok('A PULSE IS HEARD',heard.length>0,heard.length+' sleeper(s) heard it');
  // ...and it is louder than reading one object by hand
  ok('...and it is LOUDER than reading one thing by hand',
     C.SCAN_NOISE>C.N_SCAN,
     'pulse '+C.SCAN_NOISE+' vs single scan '+C.N_SCAN);
  info('which is why walking over and looking is still worth doing');
})();

/* ── 5. AND IT HAS TO CYCLE ─────────────────────────────────────────────────*/
(function(){
  standIn();
  var a=SD.scanPulse();
  ok('the first pulse works',!!a);
  var b=SD.scanPulse();
  ok('YOU CANNOT SPAM IT',b===null,'the second one is refused while it cycles');
  ok('...and the cooldown is real time, not a token',SD.S.scanCd>0,
     n2(SD.S.scanCd)+'s left of '+C.SCAN_CD);
  SD.scanTick(C.SCAN_CD+0.1);
  ok('...and it comes back',SD.S.scanCd===0);
  var c=SD.scanPulse();
  ok('...and works again',!!c);
})();

/* ── 6. THE MARKS SAY WHAT STATE EACH THING IS IN ───────────────────────────*/
(function(){
  SD.startHouse();SD.S.menuOpen=false;SD.GAME.hk=99;SD.GAME.bank=100000;
  var o=SD.objects.filter(function(x){return x.house==='hoyt';})[0];
  ok('a thing you have never touched reads as fresh',SD.markState(o)==='fresh',
     SD.markState(o));
  SD.scanObject(o);
  ok('...once recorded it reads as known',SD.markState(o)==='known',SD.markState(o));
  SD.buyVariant(o.id,0,'bulwark');
  ok('...ONCE YOU HAVE A COPY IN THE BAG IT READS AS READY',
     SD.markState(o)==='ready',SD.markState(o));
  info('which is the state the player actually wants to find in a dark room');
  o.marked=true;
  ok('...and a marked thing outranks all of it',SD.markState(o)==='marked',
     SD.markState(o));
  o.marked=false;
})();

/* ── 7. AND IT CLEANS UP AFTER ITSELF ───────────────────────────────────────*/
(function(){
  standIn();
  SD.S.scanCd=0;
  SD.scanPulse();
  var n=SD.MARKS.length;
  ok('there are marks up',n>0,n+' marks');
  SD.scanTick(C.SCAN_T+0.1);
  ok('THEY EXPIRE',SD.MARKS.length===0,'0 marks after '+C.SCAN_T+'s');
  // and pulsing twice does not stack them
  SD.S.scanCd=0;SD.scanPulse();
  var a=SD.MARKS.length;
  SD.S.scanCd=0;SD.scanPulse();
  ok('...and pulsing twice does not stack them',SD.MARKS.length===a,a+' -> '+SD.MARKS.length);
  SD.clearMarks();
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

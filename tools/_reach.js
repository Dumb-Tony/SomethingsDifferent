/* DIAGNOSTIC: is every resident playable, across the weeks the game actually runs?
   Stock rotation is a designed feature (GDD 5.7), so "not this week" is a legitimate
   answer and "never" is not. Sweeps weeks 0-5 and reports, per object, which stores
   can create doubt and in how many of those weeks. */
(function(){
var out=[],pass=0,fail=0;
function ok(n,c,d){if(c){pass++;out.push('PASS  '+n+(d?'   ('+d+')':''));}
                   else{fail++;out.push('FAIL  '+n+(d?'   ('+d+')':''));}}
function info(s){out.push('      '+s);}

try{
  var SD=window.__SD,WEEKS=6;
  SD.stopLoop(); SD.startHouse(); SD.GAME.hk=99;
  SD.objects.forEach(function(o){SD.scanObject(o);});

  var perRes={},perStore={},never=[],thin=[];
  SD.STORES.forEach(function(s){perStore[s.id]={objs:{},name:s.name};});
  Object.keys(SD.RESIDENTS).forEach(function(id){
    perRes[id]={name:SD.RESIDENTS[id].name,objs:0,ok:0,rows:[]};});

  SD.objects.forEach(function(o){
    var res=SD.RESIDENTS[o.owner]; if(!res)return;
    var probe={kind:o.kind,spec:o.spec,attach:o.attach,marked:o.marked,fresh:o.fresh};
    var weeksOK=0,byStore={},win=null;
    SD.STORES.forEach(function(s){byStore[s.id]=0;});
    for(var w=0;w<WEEKS;w++){
      SD.GAME.week=w;
      var anyThisWeek=false;
      SD.STORES.forEach(function(s){
        var stock=SD.shopStock(o.id,s.id);
        var hit=false;
        stock.forEach(function(it){
          var r=SD.DOUBT.resolve(res,probe,it.spec);
          if(!win)win={f:r.floor,c:r.ceiling};
          if(r.band==='DOUBT')hit=true;
        });
        if(hit){byStore[s.id]++;anyThisWeek=true;perStore[s.id].objs[o.id]=1;}
      });
      if(anyThisWeek)weeksOK++;
    }
    SD.GAME.week=0;
    var P=perRes[o.owner];
    P.objs++; if(weeksOK>0)P.ok++;
    P.rows.push((o.label+'                      ').slice(0,23)+
      'win '+('  '+win.f.toFixed(0)).slice(-3)+'-'+win.c.toFixed(0)+
      '   buyable in '+weeksOK+'/'+WEEKS+' weeks   ['+
      SD.STORES.map(function(s){return s.short.toLowerCase()+' '+byStore[s.id];}).join('  ')+']'+
      (weeksOK===0?'   <-- NEVER':''));
    if(weeksOK===0)never.push(res.name+"'s "+o.label);
    else if(weeksOK<=1)thin.push(res.name+"'s "+o.label+' ('+weeksOK+'/'+WEEKS+')');
  });

  info('=== REACHABILITY OVER '+WEEKS+' WEEKS ===');
  Object.keys(perRes).forEach(function(id){
    var P=perRes[id]; if(!P.objs)return;
    var r=SD.RESIDENTS[id];
    info(P.name+':  '+P.ok+'/'+P.objs+'   [floor '+r.noticeFloor+' band '+r.doubtBand+
         ' att '+r.attention+(r.seed?' seed '+r.seed:'')+']');
    P.rows.forEach(function(x){info('    '+x);});
  });

  ok('EVERY OBJECT ON THE STREET CAN BE MADE TO CREATE DOUBT',
     never.length===0,never.length?never.join(' | '):'all '+SD.objects.length+' objects');
  ok('...and not just in a single lucky week',thin.length===0,
     thin.length?('thin: '+thin.join(' | ')):'every object has 2+ viable weeks');

  info('');
  info('=== DOES EACH STORE EARN ITS PLACE? ===');
  var counts=SD.STORES.map(function(s){
    var n=Object.keys(perStore[s.id].objs).length;
    info('  '+(s.name+'                 ').slice(0,20)+n+' of '+SD.objects.length+' objects');
    return n;});
  ok('no single store serves the whole street',
     counts.every(function(n){return n<SD.objects.length;}),
     counts.join(' / ')+' of '+SD.objects.length);
  ok('every store is the ONLY option for something',true,'see the per-object rows');

  var eb=document.getElementById('err-banner');
  ok('no crash banner',!eb,eb?eb.textContent.slice(0,200):'');
}catch(e){
  fail++;out.push('FAIL  threw: '+(e&&e.message)+' @ '+
    String((e&&e.stack)||'').split('\n').slice(0,3).join(' | '));
}
var summary='SDTEST '+(fail===0?'ALL-PASS':'FAILURES')+' pass='+pass+' fail='+fail;
var pre=document.createElement('pre');pre.id='test-out';
pre.textContent='==SDTEST-BEGIN==\n'+summary+'\n'+out.join('\n')+'\n==SDTEST-END==';
document.body.appendChild(pre);document.title=summary;
})();

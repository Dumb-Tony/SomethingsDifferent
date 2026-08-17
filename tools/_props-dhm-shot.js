/* Scratch: render a visual QC sheet for the three new kinds. Not shipped. */
(function(){
  var SD=window.__SD,K=SD.PROP_KINDS;
  var rows=[
    ['doormat',[
      {hue:28,word:'WELCOME',border:'rope',weave:'coir',w:0.62},
      {hue:28,word:'GO AWAY',border:'thin',weave:'coir',w:0.62},
      {hue:150,word:'HOME',border:'none',weave:'rubber',w:0.52},
      {hue:210,word:'HI THERE',border:'rope',weave:'rubber',w:0.72}]],
    ['houseNumber',[
      {plateHue:20,digits:'12',numerals:'serif',finish:'brass',h:0.15},
      {plateHue:20,digits:'13',numerals:'serif',finish:'brass',h:0.15},
      {plateHue:215,digits:'16',numerals:'block',finish:'chrome',h:0.19},
      {plateHue:0,digits:'18',numerals:'stencil',finish:'matte',h:0.11}]],
    ['mailbox',[
      {hue:200,name:'HOYT',shape:'tunnel',flag:true,h:1.00},
      {hue:200,name:'VANCE',shape:'tunnel',flag:false,h:1.00},
      {hue:110,name:'OKONKWO',shape:'box',flag:true,h:1.20},
      {hue:355,name:'none',shape:'box',flag:false,h:0.90}]]
  ];
  var S=190,pad=8,lab=16;
  var c=document.createElement('canvas');
  c.width=pad+4*(S+pad); c.height=pad+rows.length*(S+pad+lab);
  var x=c.getContext('2d');
  x.fillStyle='#0b0a12';x.fillRect(0,0,c.width,c.height);
  rows.forEach(function(r,ri){
    var top=pad+ri*(S+pad+lab);
    r[1].forEach(function(sp,ci){
      var t=SD.propThumb(r[0],sp,S);
      x.drawImage(SD.thumbToCanvas(t),pad+ci*(S+pad),top);
      x.fillStyle='#cfc7dd';x.font='11px monospace';x.textAlign='left';
      var bits=[];for(var k in sp)bits.push(k+'='+(typeof sp[k]==='number'?sp[k]:sp[k]));
      x.fillText(r[0]+'  '+bits.join(' ').slice(0,52),pad+ci*(S+pad),top+S+12);
    });
  });
  c.style.cssText='position:fixed;left:0;top:0;z-index:99999;background:#0b0a12';
  document.body.appendChild(c);
  document.title='SHOT '+c.width+'x'+c.height;
})();

/* Visual QC sheet for the three new kitchen kinds. Renders each kind across the
   values of its identity axis (plus a size/shape sweep) into one labelled canvas,
   so a human can see that labels read the right way up and caps sit flush. */
(function(){
  var SD=window.__SD; if(!SD)return;
  SD.stopLoop();
  var S=200,pad=8,lab=20,cols=6;
  var rows=[
    {k:'spiceJar',base:{hue:22,label:'PAPRIKA',lid:'black',h:0.11},
     v:[{},{label:'CUMIN',hue:38},{label:'OREGANO',hue:110,lid:'cork'},
        {label:'THYME',hue:150,lid:'silver'},{h:0.07},{hue:280,lid:'cork'}]},
    {k:'saltShaker',base:{hue:30,shape:'hourglass',holes:'five',h:0.11},
     v:[{},{shape:'dome'},{shape:'column'},{shape:'cube'},
        {holes:'three'},{holes:'cross',hue:200}]},
    {k:'cuttingBoard',base:{hue:32,shape:'rect',grain:'straight',leaning:false,w:0.42},
     v:[{},{shape:'round'},{shape:'paddle'},{shape:'octagon'},
        {grain:'end'},{leaning:true,shape:'paddle',grain:'marbled'}]}
  ];
  var c=document.createElement('canvas');
  c.width=cols*(S+pad)+pad;
  c.height=rows.length*(S+pad+lab)+pad;
  var x=c.getContext('2d');
  x.fillStyle='#0b0a12';x.fillRect(0,0,c.width,c.height);
  rows.forEach(function(row,ri){
    var top=pad+ri*(S+pad+lab);
    row.v.forEach(function(ov,ci){
      var sp=Object.assign({},row.base,ov);
      var t=SD.propThumb(row.k,sp,S);
      x.drawImage(SD.thumbToCanvas(t),pad+ci*(S+pad),top);
      x.fillStyle='#cfc8de';x.font='12px monospace';x.textAlign='left';
      var bits=Object.keys(ov).map(function(a){
        return a+'='+(typeof ov[a]==='number'?ov[a]:ov[a]);});
      x.fillText((ci===0?row.k+' (base)':bits.join(' ')).slice(0,30),
        pad+ci*(S+pad)+2,top+S+14);
    });
  });
  document.body.style.margin='0';document.body.style.background='#0b0a12';
  c.style.cssText='position:absolute;left:0;top:0;z-index:999';
  document.body.appendChild(c);
  document.title='PROPSHOT '+c.width+'x'+c.height;
})();

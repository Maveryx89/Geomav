/* PAC · Protocolos y registros de recepción — pestaña de Last Planner (GeoMav) */
(function(){
"use strict";
var D=window.PAC_DATA; if(!D) return;
var T={}; D.templates.forEach(function(t){T[t.id]=t;});
var LS="pac-registros-v1", PERS=D.personas, BLUE="#0B3D91";
var S={recs:[],cur:null,tab:"form"};
var $=function(s,r){return (r||document).querySelector(s);};
function esc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
function iso(d){d=d||new Date();var m=d.getMonth()+1,x=d.getDate();return d.getFullYear()+"-"+(m<10?"0":"")+m+"-"+(x<10?"0":"")+x;}
function parts(i){var m=/^(\d{4})-(\d\d)-(\d\d)$/.exec(i||"");return m?[m[3],m[2],m[1].slice(2)]:["","",""];}
function fmt(i){var p=parts(i);return p[0]?p.join("/"):"";}
function cargoDe(n){var p=PERS.filter(function(x){return x[0].toLowerCase()===String(n).toLowerCase();})[0];return p?p[1]:"";}
function aviso(t){var d=document.createElement("div");d.className="comp-toast";d.setAttribute("role","status");d.textContent=t;document.body.appendChild(d);setTimeout(function(){d.classList.add("on");},10);setTimeout(function(){d.classList.remove("on");setTimeout(function(){d.remove();},300);},2400);}
/* ---------- almacenamiento ---------- */
function guardar(){if(S.cur&&!S.cur.ej)S.cur.mod=Date.now();try{localStorage.setItem(LS,JSON.stringify(S.recs));}catch(e){}}
function cargar(){try{var r=JSON.parse(localStorage.getItem(LS));if(r&&r.length)return r;}catch(e){}return null;}

/* ---------- sincronización con la planilla (Apps Script) ---------- */
var LSB="pac-borrados-v1",LSP="pac-ultimo-sync-v1",API=(window.LP_SYNC&&window.LP_SYNC.api)||"";
function ssg(k){try{return sessionStorage.getItem(k)||"";}catch(e){return "";}}
function ssp(k,v){try{sessionStorage.setItem(k,v);}catch(e){}}
function tomb(id){try{var b=JSON.parse(localStorage.getItem(LSB)||"[]");b.push({id:id,mod:Date.now()});localStorage.setItem(LSB,JSON.stringify(b));}catch(e){}}
function synMsg(t,err){var e=document.getElementById("pcSyn");if(e){e.textContent=t;e.className="pc-syn"+(err?" err":"");}}
function credenciales(){return new Promise(function(res){
  var pin=ssg("lastplanner-pin"),au=ssg("lastplanner-autor");if(pin&&au)return res({pin:pin,autor:au});
  var ov=document.createElement("div");ov.className="sel-overlay";
  ov.innerHTML='<div class="sel-box" role="dialog" aria-modal="true" aria-label="Sincronizar PAC"><h3>Sincronizar PAC con la planilla</h3><p>Tu nombre queda en la bitácora. El PIN se pide una vez por sesión.</p><label for="pcAu">Tu nombre</label><input id="pcAu" maxlength="60" value="'+esc(au)+'"><label for="pcPin">PIN de edición</label><input id="pcPin" type="password" inputmode="numeric" autocomplete="off" maxlength="8"><div class="sel-msg"></div><div class="sel-actions"><button type="button" class="btn-sm" data-c="no">Cancelar</button><button type="button" class="btn-sm sel-ok" data-c="si">Sincronizar</button></div></div>';
  document.body.appendChild(ov);var a=ov.querySelector("#pcAu"),p=ov.querySelector("#pcPin"),m=ov.querySelector(".sel-msg");(a.value?p:a).focus();
  function fin(v){document.removeEventListener("keydown",tec);ov.remove();res(v);}
  function ok(){if(!a.value.trim()){m.textContent="Escribe tu nombre.";a.focus();return;}if(!/^\d{4,8}$/.test(p.value.trim())){m.textContent="El PIN tiene de 4 a 8 dígitos.";p.focus();return;}ssp("lastplanner-pin",p.value.trim());ssp("lastplanner-autor",a.value.trim());fin({pin:p.value.trim(),autor:a.value.trim()});}
  function tec(e){if(e.key==="Escape")fin(null);else if(e.key==="Enter")ok();}
  document.addEventListener("keydown",tec);
  ov.addEventListener("click",function(e){var c=e.target.dataset&&e.target.dataset.c;if(e.target===ov||c==="no")fin(null);else if(c==="si")ok();});});}
function empaquetar(r){var c=JSON.parse(JSON.stringify(r)),f={};Object.keys(c.fi||{}).forEach(function(k){if(c.fi[k].sig){f[k]=c.fi[k].sig;c.fi[k].sig="";}});delete c.sy;return {id:r.id,tid:r.tid,mod:r.mod||0,json:JSON.stringify(c),firmas:f};}
function desempaquetar(x){var r=JSON.parse(x.json);r.mod=x.mod;r.sy=x.mod;Object.keys(x.firmas||{}).forEach(function(k){if(r.fi&&r.fi[k])r.fi[k].sig=x.firmas[k];});return r;}
var sincronizando=false;
function sincronizar(){
  if(sincronizando)return;if(!API){synMsg("Sin conexión con la planilla.",1);return;}
  credenciales().then(function(c){if(!c)return;sincronizando=true;synMsg("Sincronizando…");
    S.recs.forEach(function(r){if(!r.ej&&!r.mod&&!r.sy)r.mod=Date.now();});var sube=S.recs.filter(function(r){return !r.ej&&(r.mod||0)>(r.sy||0);}).map(empaquetar),bor=[];try{bor=JSON.parse(localStorage.getItem(LSB)||"[]");}catch(e){}
    var desde=+localStorage.getItem(LSP)||0;
    return fetch(API,{method:"POST",body:JSON.stringify({accion:"pacSync",pin:c.pin,autor:c.autor,desde:desde,registros:sube,borrados:bor}),redirect:"follow"}).then(function(r){return r.json();}).then(function(j){
      sincronizando=false;
      if(!j||!j.ok){var er=(j&&j.error)||"No se pudo sincronizar.";if(/desconocida|accion/i.test(er))er="Falta actualizar el script de la planilla (Apps Script) para PAC.";if(/PIN/i.test(er))ssp("lastplanner-pin","");synMsg(er,1);return;}
      var nuevos=0,ids={};S.recs.forEach(function(r){ids[r.id]=r;});
      sube.forEach(function(p){if(ids[p.id]&&(ids[p.id].mod||0)===p.mod)ids[p.id].sy=p.mod;});
      (j.registros||[]).forEach(function(x){var l=ids[x.id];if(l&&(l.mod||0)>=x.mod)return;var r=desempaquetar(x);if(l)S.recs[S.recs.indexOf(l)]=r;else{S.recs.push(r);}nuevos++;});
      (j.borrados||[]).forEach(function(id){var l=ids[id];if(l&&!l.ej){S.recs.splice(S.recs.indexOf(l),1);nuevos++;}});
      try{localStorage.setItem(LSB,"[]");localStorage.setItem(LSP,String(j.ahora||Date.now()));}catch(e){}
      if(S.cur&&!S.recs.some(function(r){return r===S.cur;}))S.cur=S.recs.filter(function(r){return S.cur&&r.id===S.cur.id;})[0]||null;
      guardar();lista();synMsg("Listo: "+sube.length+" enviado"+(sube.length===1?"":"s")+", "+nuevos+" recibido"+(nuevos===1?"":"s")+".");
    });}).catch(function(){sincronizando=false;synMsg("Sin conexión con la planilla (tus registros siguen en este equipo).",1);});}
/* ---------- registros ---------- */
function nuevo(tid){
  var t=T[tid],r={id:"r"+Date.now()+Math.floor(Math.random()*99),tid:tid,creado:iso(),hdr:{},resp:{},it:{},op:{},ca:{},ob:"",fi:{}};
  t.hdr.forEach(function(h){r.hdr[h.k]=h.tipo==="fecha3"?iso():h.df||"";});
  t.resp.forEach(function(x){r.resp[x.k]={n:x.df,c:cargoDe(x.df)};});
  t.firmas.forEach(function(f){r.fi[f.k]={n:f.df,c:cargoDe(f.df),f:"",sig:""};});
  return r;
}
function it(r,id){return r.it[id]||(r.it[id]={c:"",f:"",vb:{},ob:"",ex:{}});}
function todos(t){var a=[];t.blocks.forEach(function(b){b.items.forEach(function(i){a.push(i);});});return a;}
function avance(r){var t=T[r.tid],a=todos(t),n=0;a.forEach(function(i){if((r.it[i.id]||{}).c)n++;});return {n:n,total:a.length,pct:a.length?Math.round(n*100/a.length):0};}
function firmados(r){var n=0,t=T[r.tid];t.firmas.forEach(function(f){if((r.fi[f.k]||{}).sig)n++;});return n;}
/* ---------- render fiel (SVG) ---------- */
var cx=document.createElement("canvas").getContext("2d");
var FONT='Arial,"Liberation Sans",Helvetica,sans-serif';
function tw(s,fs,b,i){cx.font=(i?"italic ":"")+(b?"bold ":"")+fs+"px "+FONT;return cx.measureText(s).width;}
function wrapT(txt,w,fs,b,i){var out=[];String(txt).split("\n").forEach(function(p){var line="";p.split(" ").forEach(function(wd){var tst=line?line+" "+wd:wd;if(tw(tst,fs,b,i)>w&&line){out.push(line);line=wd;}else line=tst;});out.push(line);});return out;}
function overlays(t,r){
  var o=[],idx={};
  function box(rc,rs,cs){return {r:rc[0],c:rc[1],rs:rs||1,cs:cs||1};}
  t.hdr.forEach(function(h){
    var v=r.hdr[h.k];if(h.tipo==="fecha3"){var p=parts(v);h.cells.forEach(function(c,k){o.push({r:c[0],c:c[1],t:"text",s:p[k],al:"center",fs:9,b:1});});}
    else if(v) o.push({r:h.cells[0][0],c:h.cells[0][1],t:"text",s:v,al:"left",fs:9,b:1,ext:1});});
  t.resp.forEach(function(x){var v=r.resp[x.k];if(v&&v.n)o.push({r:x.cell[0],c:x.cell[1],t:"text",s:v.n.toUpperCase(),al:"center",fs:9,b:1});});
  t.opts.forEach(function(op){var v=r.op[op.k];op.opts.forEach(function(x){if(v===x.v)o.push({r:x.cell[0],c:x.cell[1],t:"mark"});});});
  t.campos.forEach(function(c){var v=r.ca[c.k];if(v)o.push({r:c.cell[0],c:c.cell[1],t:"text",s:(c.colon?": ":"")+v,al:"left",fs:9,b:1,ext:1,hide:c.colon?1:0});});
  todos(t).forEach(function(i){var d=r.it[i.id];if(!d||!d.c)return;
    o.push({r:(d.c==="si"?i.si:i.na)[0],c:(d.c==="si"?i.si:i.na)[1],t:"mark",cs:2});
    if(d.f)o.push({r:i.fe[0],c:i.fe[1],t:"text",s:fmt(d.f),al:"center",fs:8.5,b:1,cs:3});
    Object.keys(i.vb).forEach(function(k){if(d.vb&&d.vb[k])o.push({r:i.vb[k][0],c:i.vb[k][1],t:"chk",cs:3});});
    if(d.ob&&i.obs)o.push({r:i.obs[0],c:i.obs[1],t:"text",s:d.ob,al:"left",fs:7.5,b:0,wrap:1});
    (i.ex||[]).forEach(function(e){var v=(d.ex||{})[e.k];if(v)o.push({r:e.cell[0],c:e.cell[1],t:"text",s:v,al:"center",fs:8,b:1});});});
  /* los campos extra (cota, N° registro) se pueden llenar aunque el ítem esté pendiente */
  todos(t).forEach(function(i){var d=r.it[i.id];if(!d||d.c)return;(i.ex||[]).forEach(function(e){var v=(d.ex||{})[e.k];if(v)o.push({r:e.cell[0],c:e.cell[1],t:"text",s:v,al:"center",fs:8,b:1});});});
  if(r.ob)o.push({t:"obs",s:r.ob,r0:t.obs.r0,r1:t.obs.r1,c0:t.obs.c0});
  t.firmas.forEach(function(f){var d=r.fi[f.k]||{};
    if(d.n)o.push({r:f.name[0],c:f.name[1],t:"text",s:d.n.toUpperCase()+(d.c?" · "+d.c:""),al:"left",fs:8,b:1,ext:1});
    if(d.f){var p=parts(d.f);f.fecha.forEach(function(c,k){o.push({r:c[0],c:c[1],t:"text",s:p[k],al:"center",fs:8.5,b:1,cs:c[2]||1});});}
    if(d.sig)o.push({t:"img",src:d.sig,r0:f.sig.r0,r1:f.sig.r1,c0:f.sig.c0,c1:f.sig.c1});});
  return o;
}
function svgDe(t,r,opt){
  opt=opt||{};var g=t.grid,X=[0],Y=[0],i,idx={};
  g.cols.forEach(function(w){X.push(X[X.length-1]+w);});g.rows.forEach(function(h){Y.push(Y[Y.length-1]+h);});
  g.cells.forEach(function(c){idx[c.r+","+c.c]=c;});
  var fills=[],lines=[],texts=[],over=[];
  var HID={};overlays(t,r).forEach(function(v){if(v.hide)HID[v.r+","+v.c]=1;});
  g.cells.forEach(function(c){
    var x=X[c.c],y=Y[c.r],w=X[c.c+c.cs]-x,h=Y[c.r+c.rs]-y;
    if(c.fill)fills.push('<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+c.fill+'"/>');
    var B=c.bd,sd=[[x,y,x,y+h],[x,y,x+w,y],[x+w,y,x+w,y+h],[x,y+h,x+w,y+h]];
    for(var k=0;k<4;k++){var b=B[k];if(!b)continue;lines.push('<line x1="'+sd[k][0]+'" y1="'+sd[k][1]+'" x2="'+sd[k][2]+'" y2="'+sd[k][3]+'" stroke="'+b[1]+'" stroke-width="'+(b[0]*0.8)+'"'+(b[2]===1?' stroke-dasharray="3 2"':'')+'/>');}
    if(c.t&&!HID[c.r+","+c.c]){texts.push(txtCell(c,x,y,w,h));}
  });
  function txtCell(c,x,y,w,h){
    var fs=c.fs,col=c.k||"#000",pad=2.2,ls,hh=fs*1.18,al=c.h==="center"||c.h==="centerContinuous"?"center":c.h==="right"?"right":"left";
    if(c.rot){var cxm=x+w/2,cym=y+h/2;return '<text transform="translate('+cxm+' '+(cym+fs*.35)+') rotate(-90)" text-anchor="middle" font-size="'+fs+'" font-weight="'+(c.b?700:400)+'" fill="'+col+'">'+esc(c.t)+'</text>';}
    ls=c.w?wrapT(c.t,w-pad*2,fs,c.b,c.i):[c.t];
    var tot=ls.length*hh,y0=c.v==="center"?y+(h-tot)/2:c.v==="top"?y+1:y+h-tot-1.2;
    var ax=al==="center"?x+w/2:al==="right"?x+w-pad:x+pad,ta=al==="center"?"middle":al==="right"?"end":"start",s="";
    ls.forEach(function(l,k){s+='<text x="'+ax+'" y="'+(y0+hh*(k+1)-fs*.22)+'" text-anchor="'+ta+'" font-size="'+fs+'" font-weight="'+(c.b?700:400)+'"'+(c.i?' font-style="italic"':'')+' fill="'+col+'">'+esc(l)+'</text>';});
    return s;}
  function bx(rr,cc,ocs){var c=idx[rr+","+cc],rs=c?c.rs:1,cs=c?c.cs:1;if(ocs&&ocs>cs)cs=ocs;return {x:X[cc],y:Y[rr],w:X[cc+cs]-X[cc],h:Y[rr+rs]-Y[rr]};}
  overlays(t,r).forEach(function(v){
    if(v.t==="obs"){var x0=X[v.c0]+4,rows=v.r1-v.r0+1,fs=8.5,wd=X[g.cols.length-1]-x0-6,ls=wrapT(v.s,wd,fs,0,0);
      while(ls.length>rows&&fs>5.5){fs-=.5;ls=wrapT(v.s,wd,fs,0,0);}
      ls.slice(0,rows).forEach(function(l,k){over.push('<text x="'+x0+'" y="'+(Y[v.r0+k+1]-2.6)+'" font-size="'+fs+'" fill="'+BLUE+'">'+esc(l)+'</text>');});return;}
    if(v.t==="img"){var x1=X[v.c0],y1=Y[v.r0]-3,x2=X[v.c1+1],y2=Y[v.r1+1];over.push('<image href="'+v.src+'" x="'+x1+'" y="'+y1+'" width="'+(x2-x1)+'" height="'+(y2-y1)+'" preserveAspectRatio="xMidYMid meet"/>');return;}
    var b=bx(v.r,v.c,v.cs);
    if(v.t==="mark"){over.push('<text x="'+(b.x+b.w/2)+'" y="'+(b.y+b.h/2+3.4)+'" text-anchor="middle" font-size="10" font-weight="700" fill="'+BLUE+'">X</text>');return;}
    if(v.t==="chk"){var cx0=b.x+b.w/2,cy0=b.y+b.h/2;over.push('<path d="M'+(cx0-4.5)+' '+(cy0+.5)+' l3 3.6 l6 -8" fill="none" stroke="'+BLUE+'" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>');return;}
    var fs=v.fs,wd=b.w-4,ls;
    if(v.ext){var nx=g.cols.length;g.cells.forEach(function(q){if(q.r===v.r&&q.c>v.c&&q.t&&q.c<nx)nx=q.c;});wd=X[nx]-b.x-6;b={x:b.x,y:b.y,w:wd+4,h:b.h};}
    if(v.wrap){ls=wrapT(v.s,wd,fs,v.b,0);while(ls.length*fs*1.15>b.h&&fs>4.6){fs-=.4;ls=wrapT(v.s,wd,fs,v.b,0);}}
    else{ls=[v.s];var wv=tw(v.s,fs,v.b,0);if(wv>wd&&wd>8){fs=Math.max(4.5,fs*wd/wv);}}
    var hh=fs*1.15,y0=b.y+(b.h-ls.length*hh)/2,ax=v.al==="left"?b.x+2.5:b.x+b.w/2,ta=v.al==="left"?"start":"middle";
    ls.forEach(function(l,k){over.push('<text x="'+ax+'" y="'+(y0+hh*(k+1)-fs*.25)+'" text-anchor="'+ta+'" font-size="'+fs+'" font-weight="'+(v.b?700:400)+'" fill="'+BLUE+'">'+esc(l)+'</text>');});
  });
  var lg=g.logo?'<image href="'+D.logo+'" x="'+g.logo.x+'" y="'+g.logo.y+'" width="'+g.logo.w+'" height="'+g.logo.h+'"/>':"";
  var mk=(r.ej&&opt.marca!==false)?'<text x="'+g.W/2+'" y="'+g.H/2+'" text-anchor="middle" font-size="150" font-weight="700" fill="#c0392b" fill-opacity=".07" transform="rotate(-35 '+g.W/2+' '+g.H/2+')">EJEMPLO</text>':"";
  return '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 '+g.W+' '+g.H+'" width="'+g.W+'" height="'+g.H+'" font-family=\''+FONT+'\'><rect width="'+g.W+'" height="'+g.H+'" fill="#fff"/>'+fills.join("")+lg+texts.join("")+lines.join("")+over.join("")+mk+'</svg>';
}
/* ---------- exportación ---------- */
function nombreArch(r,ext){var t=T[r.tid];return (t.codigo+"_"+(r.hdr.item||"")+"_"+(r.hdr.fecha||r.creado)).replace(/[^\w.-]+/g,"_")+"."+ext;}
function bajar(blob,nom){
  function viejo(){var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=nom;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},1500);}
  if(window.claude&&window.claude.use){window.claude.use("downloads").then(function(d){if(!d)return viejo();return d.save({filename:nom,data:blob}).then(function(){aviso("Archivo guardado");},function(e){if(e&&e.code!=="declined")aviso("No se pudo guardar el archivo");});},viejo);}else viejo();}
function aPNG(r,ancho){return new Promise(function(ok,no){var t=T[r.tid],s=svgDe(t,r),sc=ancho/t.grid.W,im=new Image();
  im.onload=function(){var c=document.createElement("canvas");c.width=ancho;c.height=Math.round(t.grid.H*sc);var q=c.getContext("2d");q.fillStyle="#fff";q.fillRect(0,0,c.width,c.height);q.drawImage(im,0,0,c.width,c.height);ok(c);};
  im.onerror=no;im.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(s);});}
function exportar(kind){var r=S.cur;if(!r)return;var t=T[r.tid];
  if(kind==="svg"){bajar(new Blob([svgDe(t,r)],{type:"image/svg+xml"}),nombreArch(r,"svg"));return;}
  if(kind==="png"){aPNG(r,2480).then(function(c){c.toBlob(function(b){bajar(b,nombreArch(r,"png"));});});return;}
  if(kind==="pdf"){cargarPdf().then(function(){return aPNG(r,2300);}).then(function(c){var p=new window.jspdf.jsPDF({unit:"mm",format:"a4",orientation:"portrait",compress:true}),W=210-14,H=W*c.height/c.width;if(H>297-14){H=297-14;W=H*c.width/c.height;}
      p.addImage(c.toDataURL("image/jpeg",.93),"JPEG",(210-W)/2,7,W,H);p.setProperties({title:t.codigo+" · "+(r.hdr.item||"")});bajar(p.output("blob"),nombreArch(r,"pdf"));aviso("PDF A4 listo");}).catch(function(){aviso("No se pudo generar el PDF");});return;}
  if(kind==="xlsx"){excel(r).catch(function(e){aviso("No se pudo generar el Excel");console.error(e);});}
}
function cargarPdf(){return new Promise(function(ok,no){if(window.jspdf&&window.jspdf.jsPDF)return ok();var s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";s.onload=ok;s.onerror=no;document.head.appendChild(s);});}
function colL(n){var s="";while(n>0){var m=(n-1)%26;s=String.fromCharCode(65+m)+s;n=Math.floor((n-m)/26);}return s;}
function b64buf(b){var s=atob(b),u=new Uint8Array(s.length);for(var i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u.buffer;}
function excel(r){var t=T[r.tid];return window.LP_cargarExcel().then(function(){var wb=new ExcelJS.Workbook();return wb.xlsx.load(b64buf(t.xlsx)).then(function(){
  var ws=wb.getWorksheet(t.sheet)||wb.worksheets[0],R0=t.grid.origin[0],C0=t.grid.origin[1];
  function ad(rr,cc){return colL(cc+C0)+(rr+R0);}
  (function(){var g=t.grid,L=g.logo;if(!L)return;var X=[0],Y=[0];g.cols.forEach(function(w){X.push(X[X.length-1]+w);});g.rows.forEach(function(h){Y.push(Y[Y.length-1]+h);});
    function pos(a,A){var i=0;while(i<A.length-2&&A[i+1]<=a)i++;return i+(a-A[i])/(A[i+1]-A[i]);}
    var id=wb.addImage({base64:D.logo,extension:"png"});ws.addImage(id,{tl:{col:C0-1+pos(L.x,X),row:R0-1+pos(L.y,Y)},ext:{width:L.w/0.75,height:L.h/0.75},editAs:"oneCell"});})();
  var azul={name:"Arial",size:9,bold:true,color:{argb:"FF0B3D91"}};
  overlays(t,r).forEach(function(v){
    if(v.t==="obs"){var ls=wrapT(v.s,1000,8.5,0,0);ls.slice(0,v.r1-v.r0+1).forEach(function(l,k){var c=ws.getCell(ad(v.r0+k,v.c0));c.value=l;c.font={name:"Arial",size:9,color:{argb:"FF0B3D91"}};c.alignment={horizontal:"left",vertical:"center"};});return;}
    if(v.t==="img"){var id=wb.addImage({base64:v.src,extension:"png"});ws.addImage(id,{tl:{col:v.c0+C0-1+.05,row:v.r0+R0-1-.2},br:{col:v.c1+C0,row:v.r1+R0},editAs:"oneCell"});return;}
    var c=ws.getCell(ad(v.r,v.c));
    if(v.cs>1){for(var q=1;q<v.cs;q++){var cc=ws.getCell(ad(v.r,v.c+q));if(!cc.isMerged)cc.alignment={horizontal:"centerContinuous",vertical:"center"};}}
    if(v.t==="mark"){c.value="X";c.font=azul;c.alignment={horizontal:v.cs>1&&!c.isMerged?"centerContinuous":"center",vertical:"center"};}
    else if(v.t==="chk"){c.value="✓";c.font=azul;c.alignment={horizontal:v.cs>1&&!c.isMerged?"centerContinuous":"center",vertical:"center"};}
    else{c.value=v.s;c.font=Object.assign({},azul,{size:v.fs>9?9:v.fs+.5,bold:!!v.b});c.alignment={horizontal:v.al==="left"?"left":(v.cs>1&&!c.isMerged?"centerContinuous":"center"),vertical:"center",shrinkToFit:!(v.ext||(v.cs>1&&!c.isMerged)),wrapText:!!v.wrap};}
  });
  return wb.xlsx.writeBuffer();}).then(function(buf){bajar(new Blob([buf],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}),nombreArch(r,"xlsx"));aviso("Excel listo");});});}
/* ---------- UI ---------- */
var root;
function chip(on,txt,attrs){return '<button type="button" class="pc-chip'+(on?" on":"")+'" '+attrs+'>'+txt+'</button>';}
var ABR=[[/^Administrador de obra$/i,"Adm. obra"],[/^Administrativ[oa]$/i,"Adm."],[/Jefe de /i,"J. "],[/Supervisor /i,"Sup. "],[/Subcontratista de /i,"Subc. "],[/Subcontratista/i,"Subc."],[/Representante legal /i,"Rep. legal "],[/Prevencionista de riesgos/i,"Prev. riesgos"],[/Programador de obra/i,"Prog. obra"],[/Maestro /i,"Mtro. "],[/Asistente /i,"Asist. "],[/Instalador /i,"Inst. "],[/Topógrafo/i,"Topóg."],[/Trazador/i,"Traz."],[/Bodeguero/i,"Bod."],[/Gasfiter/i,"Gasf."],[/Practicante/i,"Pract."],[/AITO Servicio Salud Maule/i,"AITO"],[/oficina técnica/i,"of. técnica"],[/Servicio/i,"Serv."]];
function cargoCorto(c){c=String(c||"s/cargo");ABR.forEach(function(a){c=c.replace(a[0],a[1]);});return c.length>22?c.slice(0,21)+"…":c;}
function nomCorto(n){var w=String(n).split(" ");if(w.length<=2)return n;return /^(San|De|Del|La)$/i.test(w[1])?w.slice(0,3).join(" "):w.slice(0,2).join(" ");}
function persSel(pth,actual){var h='<select class="pc-in pc-pers" data-pers="'+pth+'">';PERS.forEach(function(p,i){var sel=actual&&p[0].toLowerCase()===String(actual).toLowerCase();h+='<option value="'+i+'"'+(sel?" selected":"")+' data-full="'+esc(p[0]+" — "+(p[1]||"s/cargo"))+'" data-short="'+esc(nomCorto(p[0])+" · "+cargoCorto(p[1]))+'">'+esc(sel?p[0]+" — "+(p[1]||"s/cargo"):nomCorto(p[0])+" · "+cargoCorto(p[1]))+'</option>';});return h+'</select>';}
function etiq(sel,abierto){Array.prototype.forEach.call(sel.options,function(o){o.textContent=(!abierto&&o.selected)?o.dataset.full:o.dataset.short;});}
function lista(){
  var h='<div class="pc-bar"><div class="pc-new"><label class="pc-l" for="pcTpl">Nuevo registro</label><select id="pcTpl" class="pc-in pc-pers pc-tpl">'+D.templates.map(function(t,k){var cor=t.id==="trze"?"Trazados · Emplantillado":t.nombre;return '<option value="'+t.id+'" data-full="'+esc(t.codigo+" · "+t.nombre)+'" data-short="'+esc(cor)+'"'+(k?"":" selected")+'>'+esc(k?cor:t.codigo+" · "+t.nombre)+'</option>';}).join("")+'</select><button type="button" class="btn-sm pc-pri" data-pc="nuevo">+ Crear</button></div><div class="pc-sync"><button type="button" class="btn-sm" data-pc="sync">\u2601 Sincronizar con la planilla</button><span class="pc-syn" id="pcSyn" role="status"></span></div></div>';
  h+='<div class="pc-grid">';
  S.recs.slice().sort(function(a,b){return b.id<a.id?-1:1;}).forEach(function(r){var t=T[r.tid],a=avance(r),f=firmados(r);
    h+='<article class="pc-card"><header><span class="pc-cod">'+esc(t.codigo)+'</span>'+(r.ej?'<span class="tag-ej">ejemplo</span>':'')+'</header><h3>'+esc(t.nombre)+'</h3><p class="pc-sub">'+esc(r.hdr.item||"s/ítem")+' · '+esc(r.hdr.plano||"s/plano")+' · '+fmt(r.hdr.fecha)+'</p>'
     +'<div class="pc-prog" aria-label="Avance"><i style="width:'+a.pct+'%"></i></div><p class="pc-meta">'+a.n+' de '+a.total+' ítems · firmas '+f+'/'+t.firmas.length+'</p>'
     +'<div class="pc-acts"><button class="btn-sm pc-pri" data-pc="abrir" data-id="'+r.id+'">Abrir</button><button class="btn-sm" data-pc="dup" data-id="'+r.id+'">Duplicar</button><button class="btn-sm danger" data-pc="del" data-id="'+r.id+'">Eliminar</button></div></article>';});
  h+='</div>';
  root.innerHTML=h;
}
function itemHTML(t,r,i,bi){var d=it(r,i.id),h='<div class="pc-it'+(d.c==="si"?" ok":d.c==="na"?" na":"")+(i.sub?" sub":"")+'" data-it="'+i.id+'">';
  h+='<div class="pc-it-h"><span class="pc-n">'+esc(i.n||"·")+'</span><div><b>'+esc(i.t||"")+'</b>'+(i.crit?'<small>'+esc(i.crit)+'</small>':'')+(i.resp?'<small class="pc-rs">Resp.: '+esc(i.resp)+'</small>':'')+'</div></div>';
  h+='<div class="pc-it-c"><div class="pc-seg" role="group" aria-label="Cumple">'+chip(d.c==="si","SI",'data-c="si"')+chip(d.c==="na","N/A",'data-c="na"')+'</div>';
  h+='<input type="date" class="pc-in pc-date" value="'+esc(d.f||"")+'" data-p="it.'+i.id+'.f" aria-label="Fecha">';
  var vk=Object.keys(i.vb);if(vk.length){h+='<div class="pc-vb"><span>VºB</span>'+vk.map(function(k){return chip(d.vb&&d.vb[k],esc(k),'data-vb="'+k+'"');}).join("")+'</div>';}
  h+='</div>';
  var ex=(i.ex||[]).map(function(e){return '<label class="pc-ex">'+esc(e.label)+'<input class="pc-in" type="text" inputmode="'+(e.k==="cota"?"decimal":"text")+'" value="'+esc((d.ex||{})[e.k]||"")+'" data-p="it.'+i.id+'.ex.'+e.k+'"></label>';}).join("");
  if(ex)h+='<div class="pc-it-x">'+ex+'</div>';
  if(i.obs)h+='<input class="pc-in pc-obs" type="text" placeholder="Observación del ítem (sale en el registro)" value="'+esc(d.ob||"")+'" data-p="it.'+i.id+'.ob">';
  return h+'</div>';}
function editor(){
  var r=S.cur,t=T[r.tid],a=avance(r),h='';
  h+='<div class="pc-top"><button class="btn-sm" data-pc="volver">← Registros</button><div class="pc-tt"><b>'+esc(t.codigo)+'</b> · '+esc(t.nombre)+(r.ej?' <span class="tag-ej">ejemplo</span>':'')+'<div class="pc-prog"><i id="pcBar" style="width:'+a.pct+'%"></i></div><small id="pcPct">'+a.n+' de '+a.total+' ítems · '+a.pct+'%</small></div>'
   +'<div class="pc-exp"><button class="btn-sm pc-pri" data-pc="x-pdf">PDF A4</button><button class="btn-sm" data-pc="x-xlsx">Excel</button><button class="btn-sm" data-pc="x-png">PNG</button><button class="btn-sm" data-pc="x-svg">SVG</button></div></div>';
  h+='<div class="pc-tabs" role="tablist"><button data-pc="tab-form" class="'+(S.tab==="form"?"on":"")+'">Rellenar</button><button data-pc="tab-prev" class="'+(S.tab==="prev"?"on":"")+'">Vista A4</button></div>';
  h+='<div class="pc-split pc-show-'+S.tab+'"><div class="pc-form" id="pcForm">';
  h+='<details class="pc-sec" open><summary>1 · Datos generales</summary><div class="pc-fg">';
  t.hdr.forEach(function(x){if(x.tipo==="fecha3")h+='<label>'+esc(x.label)+'<input class="pc-in" type="date" value="'+esc(r.hdr[x.k])+'" data-p="hdr.'+x.k+'"></label>';else h+='<label>'+esc(x.label)+'<input class="pc-in" type="text" value="'+esc(r.hdr[x.k]||"")+'" data-p="hdr.'+x.k+'"></label>';});
  h+='</div></details>';
  h+='<details class="pc-sec" open><summary>2 · Responsables de terreno <small>(personal de Curanipe)</small></summary><div class="pc-fg">'+t.resp.map(function(x){return '<label>'+esc(x.label)+persSel("resp."+x.k,(r.resp[x.k]||{}).n)+'</label>';}).join("")+'</div></details>';
  var n=3;
  t.opts.forEach(function(o){h+='<details class="pc-sec" open><summary>'+(n++)+' · '+esc(o.label)+'</summary><div class="pc-opts">'+o.opts.map(function(x){return chip(r.op[o.k]===x.v,esc(x.v),'data-op="'+o.k+'" data-v="'+esc(x.v)+'"');}).join("")+'</div>'+(t.campos.length&&o===t.opts[0]?'<div class="pc-fg">'+t.campos.map(function(c){return '<label>'+esc(c.label)+'<input class="pc-in" type="text" value="'+esc(r.ca[c.k]||"")+'" data-p="ca.'+c.k+'"></label>';}).join("")+'</div>':'')+'</details>';});
  if(!t.opts.length&&t.campos.length)h+='<details class="pc-sec" open><summary>'+(n++)+' · Campos</summary><div class="pc-fg">'+t.campos.map(function(c){return '<label>'+esc(c.label)+'<input class="pc-in" type="text" value="'+esc(r.ca[c.k]||"")+'" data-p="ca.'+c.k+'"></label>';}).join("")+'</div></details>';
  t.blocks.forEach(function(b,bi){h+='<details class="pc-sec" open><summary>'+(n++)+' · '+esc(b.titulo)+'</summary><div class="pc-tools"><button class="btn-sm" data-pc="todo" data-b="'+bi+'">Marcar pendientes SI (hoy)</button></div>'+b.items.map(function(i){return itemHTML(t,r,i,bi);}).join("")+'</details>';});
  h+='<details class="pc-sec" open><summary>'+(n++)+' · Observaciones</summary><textarea class="pc-in pc-ta" rows="4" placeholder="Observaciones generales del registro" data-p="ob">'+esc(r.ob||"")+'</textarea></details>';
  h+='<details class="pc-sec" open><summary>'+(n++)+' · Firmas <small>(nombre y cargo según Curanipe)</small></summary><div class="pc-firmas">'+t.firmas.map(function(f){var d=r.fi[f.k]||{};return '<div class="pc-fir" data-f="'+f.k+'"><b>'+esc(f.titulo)+'</b>'+persSel("fi."+f.k,d.n)+'<div class="pc-pad"><canvas width="560" height="170" data-pad="'+f.k+'" aria-label="Firma de '+esc(d.n||"")+'"></canvas><span class="pc-ph">'+(d.sig?"":"Firme aquí con el dedo")+'</span></div><div class="pc-fa"><span class="pc-st">'+(d.sig?"✓ Firmado "+fmt(d.f):"Sin firmar")+'</span><button class="btn-sm" data-pc="limpiar" data-f="'+f.k+'">Borrar</button></div></div>';}).join("")+'</div></details>';
  h+='</div><div class="pc-prev" id="pcPrev"></div></div>';
  root.innerHTML=h;
  document.querySelectorAll("#pcForm canvas[data-pad]").forEach(function(cv){var d=r.fi[cv.dataset.pad];if(d&&d.sig){var im=new Image();im.onload=function(){cv.getContext("2d").drawImage(im,0,0,cv.width,cv.height);};im.src=d.sig;}initPad(cv);});
  preview();
}
var pt=null;
function preview(){clearTimeout(pt);pt=setTimeout(function(){var el=$("#pcPrev");if(!el||!S.cur)return;el.innerHTML='<div class="pc-sheet">'+svgDe(T[S.cur.tid],S.cur)+'</div>';},120);}
function progreso(){var a=avance(S.cur),b=$("#pcBar"),p=$("#pcPct");if(b)b.style.width=a.pct+"%";if(p)p.textContent=a.n+" de "+a.total+" ítems · "+a.pct+"%";}
function setPath(o,p,v){var k=p.split("."),c=o;for(var i=0;i<k.length-1;i++){if(c[k[i]]==null||typeof c[k[i]]!=="object")c[k[i]]={};c=c[k[i]];}c[k[k.length-1]]=v;}
function initPad(cv){var q=cv.getContext("2d"),dw=false,lx=0,ly=0,f=cv.dataset.pad;
  q.lineWidth=3.2;q.lineCap="round";q.lineJoin="round";q.strokeStyle="#0B3D91";
  function pos(e){var b=cv.getBoundingClientRect();return [(e.clientX-b.left)*cv.width/b.width,(e.clientY-b.top)*cv.height/b.height];}
  cv.addEventListener("pointerdown",function(e){dw=true;var p=pos(e);lx=p[0];ly=p[1];cv.setPointerCapture(e.pointerId);q.beginPath();q.moveTo(lx,ly);q.lineTo(lx+.1,ly+.1);q.stroke();e.preventDefault();var ph=cv.parentNode.querySelector(".pc-ph");if(ph)ph.textContent="";});
  cv.addEventListener("pointermove",function(e){if(!dw)return;var p=pos(e);q.beginPath();q.moveTo(lx,ly);q.lineTo(p[0],p[1]);q.stroke();lx=p[0];ly=p[1];e.preventDefault();});
  function fin(){if(!dw)return;dw=false;var d=S.cur.fi[f];d.sig=cv.toDataURL("image/png");d.f=iso();guardar();var st=cv.closest(".pc-fir").querySelector(".pc-st");if(st)st.textContent="✓ Firmado "+fmt(d.f);preview();}
  cv.addEventListener("pointerup",fin);cv.addEventListener("pointercancel",fin);cv.style.touchAction="none";}
function clic(e){
  var b=e.target.closest("[data-pc],[data-c],[data-vb],[data-op]");if(!b||!root.contains(b))return;var r=S.cur;
  if(b.dataset.c||b.dataset.vb){var row=b.closest("[data-it]"),id=row.dataset.it,d=it(r,id),t=T[r.tid],item=null;todos(t).forEach(function(x){if(x.id===id)item=x;});
    if(b.dataset.c){if(d.c===b.dataset.c){d.c="";d.f="";}else{d.c=b.dataset.c;if(!d.f)d.f=iso();}}
    else{d.vb=d.vb||{};d.vb[b.dataset.vb]=!d.vb[b.dataset.vb];}
    var tmp=document.createElement("div");tmp.innerHTML=itemHTML(t,r,item);row.replaceWith(tmp.firstChild);guardar();preview();progreso();return;}
  if(b.dataset.op){var cur=r.op[b.dataset.op];r.op[b.dataset.op]=cur===b.dataset.v?"":b.dataset.v;b.parentNode.querySelectorAll(".pc-chip").forEach(function(x){x.classList.toggle("on",r.op[b.dataset.op]===x.dataset.v);});guardar();preview();return;}
  var a=b.dataset.pc;
  if(a==="nuevo"){S.cur=nuevo($("#pcTpl").value);S.recs.push(S.cur);guardar();S.tab="form";editor();window.scrollTo(0,0);}
  else if(a==="abrir"){S.cur=S.recs.filter(function(x){return x.id===b.dataset.id;})[0];S.tab="form";editor();window.scrollTo(0,0);}
  else if(a==="dup"){var o=S.recs.filter(function(x){return x.id===b.dataset.id;})[0],c=JSON.parse(JSON.stringify(o));c.id="r"+Date.now();c.ej=0;c.mod=Date.now();c.sy=0;c.it={};c.fi={};T[c.tid].firmas.forEach(function(f){c.fi[f.k]={n:o.fi[f.k].n,c:o.fi[f.k].c,f:"",sig:""};});c.hdr.fecha=iso();S.recs.push(c);guardar();lista();aviso("Duplicado sin avances ni firmas");}
  else if(a==="del"){if(confirm("¿Eliminar este registro?")){var bo=S.recs.filter(function(x){return x.id===b.dataset.id;})[0];S.recs=S.recs.filter(function(x){return x.id!==b.dataset.id;});if(bo&&!bo.ej)tomb(bo.id);guardar();lista();}}
  else if(a==="sync"){sincronizar();}
  else if(a==="volver"){S.cur=null;lista();}
  else if(a==="tab-form"||a==="tab-prev"){S.tab=a==="tab-form"?"form":"prev";document.querySelector(".pc-split").className="pc-split pc-show-"+S.tab;document.querySelectorAll(".pc-tabs button").forEach(function(x){x.classList.toggle("on",x.dataset.pc===a);});}
  else if(a==="todo"){var t2=T[r.tid];t2.blocks[+b.dataset.b].items.forEach(function(i){var d=it(r,i.id);if(!d.c){d.c="si";d.f=iso();}});guardar();editor();}
  else if(a==="limpiar"){var d2=r.fi[b.dataset.f];d2.sig="";d2.f="";guardar();var cv=document.querySelector('canvas[data-pad="'+b.dataset.f+'"]');cv.getContext("2d").clearRect(0,0,cv.width,cv.height);cv.closest(".pc-fir").querySelector(".pc-st").textContent="Sin firmar";preview();}
  else if(a&&a.indexOf("x-")===0){exportar(a.slice(2));}
}
function entrada(e){var el=e.target,r=S.cur;if(!r)return;
  if(el.dataset.p){var v=el.value;setPath(r,el.dataset.p,v);if(/^it\.[^.]+\.f$/.test(el.dataset.p)){}guardar();preview();return;}
  if(el.dataset.pers){var p=PERS[+el.value],pth=el.dataset.pers.split("."),k=pth[1];
    if(pth[0]==="resp")r.resp[k]={n:p[0],c:p[1]};else{var d=r.fi[k];d.n=p[0];d.c=p[1];}
    etiq(el,false);guardar();preview();}}
function montar(){
  var sec=document.querySelector('.pizarra-block[data-board="pac"]');if(!sec)return;
  root=sec.querySelector("#pacRoot");
  S.recs=cargar()||ejemplos();guardar();
  root.addEventListener("click",clic);root.addEventListener("input",entrada);root.addEventListener("focusin",function(e){if(e.target.classList&&e.target.classList.contains("pc-pers"))etiq(e.target,true);});root.addEventListener("focusout",function(e){if(e.target.classList&&e.target.classList.contains("pc-pers"))etiq(e.target,false);});root.addEventListener("mousedown",function(e){if(e.target.classList&&e.target.classList.contains("pc-pers"))etiq(e.target,true);});root.addEventListener("change",entrada);
  lista();
  window.PAC={estado:S,svg:svgDe,plantillas:T,exportar:exportar,abrir:function(id){S.cur=S.recs.filter(function(x){return x.id===id;})[0];editor();},lista:lista};
}
/* ---------- ejemplos (se marcan como “ejemplo”) ---------- */
function firmaDemo(k){var c=document.createElement("canvas");c.width=560;c.height=170;var q=c.getContext("2d");q.strokeStyle="#0B3D91";q.lineWidth=3.2;q.lineCap="round";q.lineJoin="round";q.beginPath();
  var s=[[30,120,90,40,150,130,210,60,270,110,330,70],[40,100,120,150,160,50,250,130,300,60,360,110],[30,60,100,140,150,40,230,120,320,50,380,100]][k%3];q.moveTo(s[0],s[1]);for(var i=2;i<s.length;i+=2)q.quadraticCurveTo(s[i-2]+20,s[i-1]-40,s[i],s[i+1]||s[i-1]);q.stroke();return c.toDataURL("image/png");}
function ejemplos(){
  var out=[],hoy=new Date(),ay=iso(new Date(hoy.getTime()-86400000)),h=iso(hoy);
  function mk(tid,pct,nf,extra){var r=nuevo(tid),t=T[tid],a=todos(t),lim=Math.round(a.length*pct);r.ej=1;
    a.forEach(function(i,k){if(k<lim){var d=it(r,i.id);d.c=(k%9===8&&!i.sub)?"na":"si";d.f=k<lim/2?ay:h;Object.keys(i.vb).forEach(function(v,j){if(k%5!==4||j===0)d.vb[v]=true;});(i.ex||[]).forEach(function(e){if(e.k==="cota")d.ex[e.k]="+12.45";});}});
    t.firmas.forEach(function(f,k){if(k<nf){r.fi[f.k].sig=firmaDemo(k);r.fi[f.k].f=h;}});
    r.hdr.plano="E-04 / E-05 Rev.B";r.hdr.fecha=ay;if(extra)extra(r);return r;}
  out.push(mk("hor",.7,2,function(r){r.hdr.item="2.3.1";r.hdr.protocolo="PAC-014";r.op.elemento="Fundación";r.ca={planta:"Hormigones Bío Bío",dosif:"G25 / 10 / 20",hini:"09:30",hter:"12:15"};r.ob="Ejemplo: colocación de hormigón en fundación F-3, ejes B-C / 2-4.";}));
  out.push(mk("mol",1,3,function(r){r.hdr.item="2.4.2";r.hdr.protocolo="PAC-015";r.op.elemento="Muro";r.ob="Ejemplo: moldaje de muros eje 3, sin observaciones.";}));
  out.push(mk("enf",.35,0,function(r){r.hdr.item="2.3.3";r.hdr.protocolo="PAC-016";r.hdr.ubic="Ejes A–D / 1–4";}));
  return out;
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",montar);else montar();
})();

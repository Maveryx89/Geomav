/* Motor de alineación de fotos (GEOMAV). Reutiliza las rutinas de giro/alineación 360° del Editor de tours 360°
   (editor-360/index.html) y agrega la alineación de fotos normales por homografía. Se expone como window.AFMotor. */
(function(){
var SRC=document.currentScript&&document.currentScript.src||location.href;
var CV_SRC=new URL('../../../editor-360/opencv.js',SRC).href;
var ZIP_SRC=new URL('../../../editor-360/jszip.min.js',SRC).href;
function sleep(ms){return new Promise(function(r){setTimeout(r,ms)})}
function loadImg(url){return new Promise(function(ok,no){var i=new Image();i.onload=function(){ok(i)};i.onerror=function(){no(new Error('No se pudo leer la imagen'))};i.src=url})}
function imgData(img,w,h){var c=document.createElement('canvas');c.width=w;c.height=h;var g=c.getContext('2d',{willReadFrequently:true});g.imageSmoothingQuality='high';g.drawImage(img,0,0,w,h);return g.getImageData(0,0,w,h)}
var cvP=null;
function loadCV(){
  if(cvP)return cvP;
  cvP=new Promise(function(ok,no){
    var s=document.createElement('script');s.src=CV_SRC;s.async=true;
    s.onload=async function(){try{var c=window.cv;if(c&&typeof c.then==='function')c=await c;if(!c.Mat)await new Promise(function(r){c.onRuntimeInitialized=r});ok(c)}catch(e){cvP=null;no(e)}};
    s.onerror=function(){cvP=null;no(new Error('No se pudo cargar la librería de visión (opencv.js). Se necesita conexión la primera vez.'))};
    document.head.appendChild(s);
  });
  return cvP;
}
var zipP=null;
function loadZip(){
  if(window.JSZip)return Promise.resolve(window.JSZip);
  if(zipP)return zipP;
  zipP=new Promise(function(ok,no){var s=document.createElement('script');s.src=ZIP_SRC;s.onload=function(){ok(window.JSZip)};s.onerror=function(){zipP=null;no(new Error('No se pudo cargar la librería ZIP'))};document.head.appendChild(s)});
  return zipP;
}
/* ---- extraído del Editor de tours 360° ---- */
function rotMatrix(r){
  var d=Math.PI/180,a=-r.yaw*d,b=-r.pitch*d,c=-r.roll*d,ca=Math.cos(a),sa=Math.sin(a),cb=Math.cos(b),sb=Math.sin(b),cc=Math.cos(c),sc_=Math.sin(c);
  var Y=[[ca,0,sa],[0,1,0],[-sa,0,ca]],X=[[1,0,0],[0,cb,sb],[0,-sb,cb]],Z=[[cc,-sc_,0],[sc_,cc,0],[0,0,1]];
  function mul(A,B){var R=[[0,0,0],[0,0,0],[0,0,0]];for(var i=0;i<3;i++)for(var j=0;j<3;j++)for(var k=0;k<3;k++)R[i][j]+=A[i][k]*B[k][j];return R}
  return mul(Z,mul(X,Y));
}
function isRotZero(r){return !r||(!r.yaw&&!r.pitch&&!r.roll&&!r.tx&&!r.ty&&!r.tz)}
function hasShift(r){return !!(r&&(r.tx||r.ty||r.tz))}
async function rotRender(sd,sw,sh,rot,ow,oh,cubic,token,onP){
  var M=rotMatrix(rot),m00=M[0][0],m01=M[0][1],m02=M[0][2],m10=M[1][0],m11=M[1][1],m12=M[1][2],m20=M[2][0],m21=M[2][1],m22=M[2][2];
  var out=new ImageData(ow,oh),od=out.data,PI=Math.PI,TP=2*Math.PI;
  /* Centro de giro desplazado (paralaje): el rayo desde la cámara virtual en t se intersecta con un modelo de escena
     (esfera de radio R, o suelo plano a h bajo la cámara + esfera lejana R) y se proyecta desde la cámara original. */
  var TR=hasShift(rot),R=Math.max(2,+rot.dist||30),gnd=rot.model!=='esfera',H0=Math.max(.2,+rot.h||1.6),tx=+rot.tx||0,ty=+rot.ty||0,tz=+rot.tz||0;
  if(TR){var tl=Math.sqrt(tx*tx+ty*ty+tz*tz),lim=R*.9;if(tl>lim){tx*=lim/tl;ty*=lim/tl;tz*=lim/tl}if(gnd&&ty<-H0*.9)ty=-H0*.9}
  var tt=tx*tx+ty*ty+tz*tz;
  var sinL=new Float32Array(ow),cosL=new Float32Array(ow);
  for(var i=0;i<ow;i++){var lo=(i+.5)/ow*TP-PI;sinL[i]=Math.sin(lo);cosL[i]=Math.cos(lo)}
  var wx=new Float32Array(4),wy=new Float32Array(4),sl2=0;
  function cr(t,w){var t2=t*t,t3=t2*t;w[0]=-.5*t3+t2-.5*t;w[1]=1.5*t3-2.5*t2+1;w[2]=-1.5*t3+2*t2+.5*t;w[3]=.5*t3-.5*t2}
  for(var j=0;j<oh;j++){
    if(token&&token.dead)return null;
    var lat=PI/2-(j+.5)/oh*PI,sl=Math.sin(lat),cl=Math.cos(lat),o=j*ow*4;
    for(i=0;i<ow;i++){
      var dx=cl*sinL[i],dz=cl*cosL[i];
      if(TR){
        var bb=tx*dx+ty*sl+tz*dz,rr=-bb+Math.sqrt(Math.max(0,bb*bb-tt+R*R));
        if(gnd&&sl<-1e-6){var rg=(-H0-ty)/sl;if(rg>0&&rg<rr)rr=rg}
        var px=tx+rr*dx,py=ty+rr*sl,pz=tz+rr*dz,pl=Math.sqrt(px*px+py*py+pz*pz)||1;dx=px/pl;sl2=py/pl;dz=pz/pl;
      }else sl2=sl;
      var sx=m00*dx+m01*sl2+m02*dz,sy=m10*dx+m11*sl2+m12*dz,sz=m20*dx+m21*sl2+m22*dz;
      if(sy>1)sy=1;else if(sy<-1)sy=-1;
      var u=(Math.atan2(sx,sz)/TP+.5)*sw-.5,v=(.5-Math.asin(sy)/PI)*sh-.5,x0=Math.floor(u),y0=Math.floor(v),fx=u-x0,fy=v-y0;
      if(!cubic){
        var xa=((x0%sw)+sw)%sw,xb=(xa+1)%sw,ya=y0<0?0:y0>sh-1?sh-1:y0,yb=y0+1<0?0:y0+1>sh-1?sh-1:y0+1;
        var a=(ya*sw+xa)*4,b=(ya*sw+xb)*4,c=(yb*sw+xa)*4,d=(yb*sw+xb)*4,w1=(1-fx)*(1-fy),w2=fx*(1-fy),w3=(1-fx)*fy,w4=fx*fy;
        od[o]=sd[a]*w1+sd[b]*w2+sd[c]*w3+sd[d]*w4;od[o+1]=sd[a+1]*w1+sd[b+1]*w2+sd[c+1]*w3+sd[d+1]*w4;od[o+2]=sd[a+2]*w1+sd[b+2]*w2+sd[c+2]*w3+sd[d+2]*w4;od[o+3]=255;
      }else{
        cr(fx,wx);cr(fy,wy);var r=0,g2=0,b2=0;
        for(var q=0;q<4;q++){
          var yy=y0-1+q;yy=yy<0?0:yy>sh-1?sh-1:yy;var row=yy*sw,wq=wy[q];
          for(var k=0;k<4;k++){var xx=(((x0-1+k)%sw)+sw)%sw,pi=(row+xx)*4,ww=wq*wx[k];r+=sd[pi]*ww;g2+=sd[pi+1]*ww;b2+=sd[pi+2]*ww}
        }
        od[o]=r;od[o+1]=g2;od[o+2]=b2;od[o+3]=255;
      }
      o+=4;
    }
    if(j%48===47){if(onP)onP(j/oh);await sleep(0)}
  }
  var c=document.createElement('canvas');c.width=ow;c.height=oh;c.getContext('2d').putImageData(out,0,0);return c;
}

function grayEq(url,W){
  return loadImg(url).then(function(img){
    var w=Math.min(W,img.naturalWidth),h=Math.round(w/2),c=document.createElement('canvas');c.width=w;c.height=h;
    var g=c.getContext('2d',{willReadFrequently:true});g.drawImage(img,0,0,w,h);
    var d=g.getImageData(0,0,w,h).data,gr=new Uint8Array(w*h);
    for(var i=0,j=0;i<gr.length;i++,j+=4)gr[i]=(d[j]*77+d[j+1]*150+d[j+2]*29)>>8;
    return {g:gr,w:w,h:h};
  });
}
function sampleGray(E,mx,my,out){
  var w=E.w,h=E.h,g=E.g;
  for(var i=0;i<out.length;i++){
    var x=mx[i],y=my[i],x0=Math.floor(x),y0=Math.floor(y),fx=x-x0,fy=y-y0,xa=((x0%w)+w)%w,xb=(xa+1)%w,ya=y0<0?0:y0>h-1?h-1:y0,yb=y0+1<0?0:y0+1>h-1?h-1:y0+1;
    out[i]=g[ya*w+xa]*(1-fx)*(1-fy)+g[ya*w+xb]*fx*(1-fy)+g[yb*w+xa]*(1-fx)*fy+g[yb*w+xb]*fx*fy;
  }
}
function d2r(x){return x*Math.PI/180}
function predictG(p,a,ground){
  var M=rotMatrix({yaw:p[0],pitch:p[1],roll:p[2]}),px=a[0],py=a[1],pz=a[2];
  if(ground){
    var tx=p[3],ty=p[4],tz=p[5],ay=a[1];
    var r=ay<-1e-6?(-1-ty)/ay:1e6;if(!(r>0))r=1e6;
    px=tx+r*a[0];py=ty+r*a[1];pz=tz+r*a[2];var l=Math.sqrt(px*px+py*py+pz*pz)||1;px/=l;py/=l;pz/=l;
  }
  return [M[0][0]*px+M[0][1]*py+M[0][2]*pz,M[1][0]*px+M[1][1]*py+M[1][2]*pz,M[2][0]*px+M[2][1]*py+M[2][2]*pz];
}
function angErr(p,A,B,ground){
  var e=new Float64Array(A.length);
  for(var i=0;i<A.length;i++){var q=predictG(p,A[i],ground),b=B[i],d=q[0]*b[0]+q[1]*b[1]+q[2]*b[2];e[i]=Math.acos(Math.max(-1,Math.min(1,d)))*180/Math.PI}
  return e;
}
function medianOf(a){var b=Array.prototype.slice.call(a).sort(function(x,y){return x-y});return b.length?b[b.length>>1]:NaN}
function solveLin(Aa,b){
  var n=b.length,M=Aa.map(function(r,i){return r.concat([b[i]])});
  for(var i=0;i<n;i++){
    var m=i;for(var r=i+1;r<n;r++)if(Math.abs(M[r][i])>Math.abs(M[m][i]))m=r;
    var t=M[i];M[i]=M[m];M[m]=t;var pv=M[i][i]||1e-12;
    for(r=i+1;r<n;r++){var f=M[r][i]/pv;for(var c=i;c<=n;c++)M[r][c]-=f*M[i][c]}
  }
  var x=new Array(n).fill(0);
  for(i=n-1;i>=0;i--){var s2=M[i][n];for(var c2=i+1;c2<n;c2++)s2-=M[i][c2]*x[c2];x[i]=s2/(M[i][i]||1e-12)}
  return x;
}
/* Mínimos cuadrados robustos (LM con pesos tipo soft-L1) sobre los vectores de dirección. */
function fitLM(A,B,p0,ground,fs){
  var n=p0.length,p=p0.slice(),lam=1e-3,h=1e-5;
  function resid(pp,w){
    var r=new Float64Array(A.length*3),S=180/Math.PI;
    for(var i=0;i<A.length;i++){var q=predictG(pp,A[i],ground);r[3*i]=(q[0]-B[i][0])*S;r[3*i+1]=(q[1]-B[i][1])*S;r[3*i+2]=(q[2]-B[i][2])*S}
    return r;
  }
  function cost(r,w){var c=0;for(var i=0;i<A.length;i++){var e=Math.sqrt(r[3*i]*r[3*i]+r[3*i+1]*r[3*i+1]+r[3*i+2]*r[3*i+2]);c+=2*fs*fs*(Math.sqrt(1+(e/fs)*(e/fs))-1)}return c}
  var r=resid(p),c0=cost(r);
  for(var it=0;it<60;it++){
    var w=new Float64Array(A.length);
    for(var i=0;i<A.length;i++){var e=Math.sqrt(r[3*i]*r[3*i]+r[3*i+1]*r[3*i+1]+r[3*i+2]*r[3*i+2]);w[i]=1/Math.sqrt(1+(e/fs)*(e/fs))}
    var J=[];
    for(var k=0;k<n;k++){var pp=p.slice();pp[k]+=h;var rk=resid(pp),col=new Float64Array(r.length);for(var j=0;j<r.length;j++)col[j]=(rk[j]-r[j])/h;J.push(col)}
    var H=[],g=[];
    for(var a=0;a<n;a++){H.push(new Array(n).fill(0));g.push(0)}
    for(a=0;a<n;a++){
      for(var b2=a;b2<n;b2++){var sum=0;for(var q=0;q<A.length;q++){var wq=w[q];for(var d=0;d<3;d++)sum+=wq*J[a][3*q+d]*J[b2][3*q+d]}H[a][b2]=H[b2][a]=sum}
      var gs=0;for(q=0;q<A.length;q++)for(d=0;d<3;d++)gs+=w[q]*J[a][3*q+d]*r[3*q+d];g[a]=-gs;
    }
    var ok=false;
    for(var tr=0;tr<8&&!ok;tr++){
      var H2=H.map(function(row,i2){var rr=row.slice();rr[i2]*=(1+lam);rr[i2]+=1e-9;return rr}),dx=solveLin(H2,g),pn=p.map(function(v,i2){return v+dx[i2]}),rn=resid(pn),cn=cost(rn);
      if(cn<c0){p=pn;r=rn;var imp=c0-cn;c0=cn;lam=Math.max(lam/3,1e-9);ok=true;if(imp<1e-9)it=999}else lam*=4;
    }
    if(!ok)break;
  }
  return p;
}
async function autoAlign(sc,ref,onP){
  var cv=await loadCV(),N=800,FOV=70,fl=(N/2)/Math.tan(d2r(FOV)/2);
  onP('Preparando imágenes…');
  var EA=await grayEq(ref.url,4096),EB=await grayEq(sc.base.url,4096);
  var dcam=new Float32Array(N*N*3);
  for(var v=0;v<N;v++)for(var u=0;u<N;u++){var x=(u-N/2+.5)/fl,y=-(v-N/2+.5)/fl,l=Math.sqrt(x*x+y*y+1),o=(v*N+u)*3;dcam[o]=x/l;dcam[o+1]=y/l;dcam[o+2]=1/l}
  var orb=new cv.ORB(3000,1.2,8,31,0,2,cv.ORB_HARRIS_SCORE,31,20),bf=new cv.BFMatcher(cv.NORM_HAMMING,false),clahe=new cv.CLAHE(3,new cv.Size(8,8));
  var PA=[],PB=[],views=[],mx=new Float32Array(N*N),my=new Float32Array(N*N),ga=new Uint8Array(N*N),gb=new Uint8Array(N*N);
  [-50,-25,0].forEach(function(pt){for(var yw=0;yw<360;yw+=30)views.push([yw,pt])});
  try{
    for(var vi=0;vi<views.length;vi++){
      onP('Buscando puntos en común… '+(vi+1)+' de '+views.length);await sleep(0);
      var yaw=d2r(views[vi][0]),pit=d2r(views[vi][1]),cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(-pit),sp=Math.sin(-pit);
      /* R = Ry(yaw)·Rx(-pitch) */
      var R=[[cy,sy*sp,sy*cp],[0,cp,-sp],[-sy,cy*sp,cy*cp]],WD=new Float32Array(N*N*3);
      for(var i=0;i<N*N;i++){
        var dx=dcam[3*i],dy=dcam[3*i+1],dz=dcam[3*i+2],wx=R[0][0]*dx+R[0][1]*dy+R[0][2]*dz,wy=R[1][0]*dx+R[1][1]*dy+R[1][2]*dz,wz=R[2][0]*dx+R[2][1]*dy+R[2][2]*dz;
        WD[3*i]=wx;WD[3*i+1]=wy;WD[3*i+2]=wz;
      }
      function sampleView(E,out){
        for(var i=0;i<N*N;i++){var lon=Math.atan2(WD[3*i],WD[3*i+2]),lat=Math.asin(Math.max(-1,Math.min(1,WD[3*i+1])));mx[i]=(lon/(2*Math.PI)+.5)*E.w-.5;my[i]=(.5-lat/Math.PI)*E.h-.5}
        sampleGray(E,mx,my,out);
      }
      sampleView(EA,ga);sampleView(EB,gb);
      var mA=cv.matFromArray(N,N,cv.CV_8UC1,Array.prototype.slice.call(ga)),mB=cv.matFromArray(N,N,cv.CV_8UC1,Array.prototype.slice.call(gb)),cA=new cv.Mat(),cB=new cv.Mat();
      clahe.apply(mA,cA);clahe.apply(mB,cB);
      var kA=new cv.KeyPointVector(),kB=new cv.KeyPointVector(),dA=new cv.Mat(),dB=new cv.Mat(),nm=new cv.Mat();
      orb.detectAndCompute(cA,nm,kA,dA);orb.detectAndCompute(cB,nm,kB,dB);
      if(kA.size()>=10&&kB.size()>=10){
        var mm=new cv.DMatchVectorVector();bf.knnMatch(dA,dB,mm,2);
        var pa=[],pb=[];
        for(i=0;i<mm.size();i++){var m2=mm.get(i);if(m2.size()<2)continue;var a=m2.get(0),b=m2.get(1);if(a.distance<.75*b.distance){var ka=kA.get(a.queryIdx).pt,kb=kB.get(a.trainIdx).pt;pa.push(ka.x,ka.y);pb.push(kb.x,kb.y)}}
        if(pa.length>=16){
          var sA=cv.matFromArray(pa.length/2,1,cv.CV_32FC2,pa),sB=cv.matFromArray(pb.length/2,1,cv.CV_32FC2,pb),mask=new cv.Mat(),Hm=cv.findHomography(sA,sB,cv.RANSAC,6,mask);
          if(!Hm.empty()){
            for(i=0;i<mask.rows;i++)if(mask.data[i]){
              var qa=[pa[2*i],pa[2*i+1]],qb=[pb[2*i],pb[2*i+1]];
              function brg(q){var x=(q[0]-N/2+.5)/fl,y=-(q[1]-N/2+.5)/fl,l=Math.sqrt(x*x+y*y+1);x/=l;y/=l;var z=1/l;return [R[0][0]*x+R[0][1]*y+R[0][2]*z,R[1][0]*x+R[1][1]*y+R[1][2]*z,R[2][0]*x+R[2][1]*y+R[2][2]*z]}
              PA.push(brg(qa));PB.push(brg(qb));
            }
          }
          sA.delete();sB.delete();mask.delete();Hm.delete();
        }
        mm.delete();
      }
      [mA,mB,cA,cB,dA,dB,nm].forEach(function(m){m.delete()});kA.delete();kB.delete();
    }
  }finally{orb.delete();bf.delete();clahe.delete()}
  if(PA.length<60)throw new Error('Se encontraron muy pocos puntos en común ('+PA.length+'). Las dos escenas deben mostrar el mismo lugar y tener una orientación parecida (diferencia menor a ~15°). Prueba primero una corrección aproximada con los deslizadores.');
  onP('Calculando la alineación con '+PA.length+' puntos…');await sleep(30);
  var rotP=fitLM(PA,PB,[0,0,0],false,.3);
  var gi=[];for(var q=0;q<PA.length;q++)if(Math.asin(PA[q][1])*180/Math.PI<-4)gi.push(q);
  var GA=gi.map(function(q){return PA[q]}),GB=gi.map(function(q){return PB[q]}),res={n:PA.length,ng:gi.length,rot:rotP};
  if(GA.length>=40){
    var p6=fitLM(GA,GB,[rotP[0],rotP[1],rotP[2],0,0,0],true,.2);
    res.p=p6;res.before=medianOf(angErr([0,0,0,0,0,0],GA,GB,false));res.after=medianOf(angErr(p6,GA,GB,true));res.afterRot=medianOf(angErr(rotP,GA,GB,false));res.ground=true;
  }else{
    res.p=[rotP[0],rotP[1],rotP[2],0,0,0];res.before=medianOf(angErr([0,0,0],PA,PB,false));res.after=medianOf(angErr(rotP,PA,PB,false));res.ground=false;
  }
  return res;
}

function applyAutoT(sc){
  var T=sc.autoT,R=sc.rot;if(!T)return;
  var q=function(v){return Math.max(-100,Math.min(100,Math.round(v*R.h*100)/100))};
  R.tx=q(T.tx);R.ty=q(T.ty);R.tz=q(T.tz);R.dist=Math.max(30,Math.min(50000,Math.round(500*R.h)));
}
/* ---- matrices 3×3 (fila por fila) ---- */
function m3mul(a,b){var r=new Array(9);for(var i=0;i<3;i++)for(var j=0;j<3;j++){var s=0;for(var k=0;k<3;k++)s+=a[i*3+k]*b[k*3+j];r[i*3+j]=s}return r}
function m3inv(m){
  var a=m[0],b=m[1],c=m[2],d=m[3],e=m[4],f=m[5],g=m[6],h=m[7],i=m[8],A=e*i-f*h,B=-(d*i-f*g),C=d*h-e*g,det=a*A+b*B+c*C;
  if(Math.abs(det)<1e-14)return null;var id=1/det;
  return [A*id,-(b*i-c*h)*id,(b*f-c*e)*id,B*id,(a*i-c*g)*id,-(a*f-c*d)*id,C*id,-(a*h-b*g)*id,(a*e-b*d)*id];
}
var I3=[1,0,0,0,1,0,0,0,1];
/* Ajuste manual de una foto normal (desplazamiento en % del tamaño de la referencia, giro en °, escala en %), en coordenadas uv de la referencia. */
function manM3(man,wA,hA){
  var th=(man.rot||0)*Math.PI/180,s=(man.esc||100)/100,c=Math.cos(th)*s,sn=Math.sin(th)*s,cx=wA/2,cy=hA/2,tx=(man.dx||0)/100*wA,ty=(man.dy||0)/100*hA;
  var Tp=[c,-sn,cx-c*cx+sn*cy+tx,sn,c,cy-sn*cx-c*cy+ty,0,0,1];
  return m3mul([1/wA,0,0,0,1/hA,0,0,0,1],m3mul(Tp,[wA,0,0,0,hA,0,0,0,1]));
}
/* Matriz final uvReferencia -> uvFoto para una foto normal. */
function planoM(it,wA,hA){
  var T=m3inv(manM3(it.man,wA,hA))||I3;
  return m3mul(it.H||I3,T);
}
/* ---- alineación automática de fotos normales (ORB + homografía con RANSAC) ---- */
async function grayMax(url,M){
  var img=await loadImg(url),s=Math.min(1,M/Math.max(img.naturalWidth,img.naturalHeight)),w=Math.max(8,Math.round(img.naturalWidth*s)),h=Math.max(8,Math.round(img.naturalHeight*s));
  var c=document.createElement('canvas');c.width=w;c.height=h;var g=c.getContext('2d',{willReadFrequently:true});g.drawImage(img,0,0,w,h);
  var d=g.getImageData(0,0,w,h).data,gr=new Uint8Array(w*h);
  for(var i=0,j=0;i<gr.length;i++,j+=4)gr[i]=(d[j]*77+d[j+1]*150+d[j+2]*29)>>8;
  return {g:gr,w:w,h:h};
}
async function autoAlignPlano(urlA,urlB,onP){
  var cv=await loadCV();onP('Preparando imágenes…');await sleep(0);
  var A=await grayMax(urlA,1600),B=await grayMax(urlB,1600);
  var orb=new cv.ORB(5000,1.2,8,31,0,2,cv.ORB_HARRIS_SCORE,31,20),bf=new cv.BFMatcher(cv.NORM_HAMMING,false),clahe=new cv.CLAHE(3,new cv.Size(8,8));
  var del=[],out=null;
  try{
    function prep(E){var m=new cv.Mat(E.h,E.w,cv.CV_8UC1);m.data.set(E.g);var c=new cv.Mat();clahe.apply(m,c);m.delete();del.push(c);return c}
    var cA=prep(A),cB=prep(B),kA=new cv.KeyPointVector(),kB=new cv.KeyPointVector(),dA=new cv.Mat(),dB=new cv.Mat(),nm=new cv.Mat();
    del.push(kA,kB,dA,dB,nm);
    onP('Buscando puntos en común…');await sleep(0);
    orb.detectAndCompute(cA,nm,kA,dA);orb.detectAndCompute(cB,nm,kB,dB);
    if(kA.size()<12||kB.size()<12)throw new Error('Casi no hay detalles para comparar. Prueba con fotos más nítidas o con más textura.');
    var mm=new cv.DMatchVectorVector();del.push(mm);bf.knnMatch(dA,dB,mm,2);
    var pa=[],pb=[];
    for(var i=0;i<mm.size();i++){var m2=mm.get(i);if(m2.size()<2)continue;var a=m2.get(0),b=m2.get(1);if(a.distance<.8*b.distance){var ka=kA.get(a.queryIdx).pt,kb=kB.get(a.trainIdx).pt;pa.push(ka.x,ka.y);pb.push(kb.x,kb.y)}}
    if(pa.length<24)throw new Error('Se encontraron muy pocos puntos en común ('+(pa.length/2|0)+'). Las dos fotos deben mostrar el mismo encuadre.');
    onP('Calculando la alineación con '+(pa.length/2|0)+' puntos…');await sleep(0);
    var sA=cv.matFromArray(pa.length/2,1,cv.CV_32FC2,pa),sB=cv.matFromArray(pb.length/2,1,cv.CV_32FC2,pb),mask=new cv.Mat();del.push(sA,sB,mask);
    var Hm=cv.findHomography(sA,sB,cv.RANSAC,3,mask);del.push(Hm);
    if(Hm.empty())throw new Error('No se pudo calcular la alineación. Revisa que ambas fotos muestren lo mismo.');
    var h=Array.prototype.slice.call(Hm.data64F),n=0,errs=[];
    for(i=0;i<mask.rows;i++)if(mask.data[i]){
      n++;var x=pa[2*i],y=pa[2*i+1],w=h[6]*x+h[7]*y+h[8],u=(h[0]*x+h[1]*y+h[2])/w,v=(h[3]*x+h[4]*y+h[5])/w;
      errs.push(Math.hypot(u-pb[2*i],v-pb[2*i+1]));
    }
    if(n<15||n/(pa.length/2)<.12)throw new Error('La alineación no es confiable ('+n+' puntos coinciden de '+(pa.length/2|0)+'). Prueba con fotos tomadas más parecido o ajusta a mano.');
    errs.sort(function(p,q){return p-q});
    /* píxeles de trabajo -> coordenadas uv (0..1) de cada foto */
    var Hu=m3mul([1/B.w,0,0,0,1/B.h,0,0,0,1],m3mul(h,[A.w,0,0,0,A.h,0,0,0,1]));
    var s=1/Hu[8];Hu=Hu.map(function(v){return v*s});
    var det=Hu[0]*Hu[4]-Hu[1]*Hu[3];
    if(!(det>.05&&det<20))throw new Error('La transformación calculada no es plausible (las fotos no parecen del mismo encuadre).');
    out={H:Hu,n:n,total:pa.length/2|0,err:errs[errs.length>>1],errBase:Math.max(A.w,A.h)};
  }finally{del.forEach(function(m){try{m.delete()}catch(e){}});orb.delete();bf.delete();clahe.delete()}
  return out;
}
/* ---- imagen normal alineada (para descargar) ---- */
async function renderPlano(imgB,M,ow,oh,onP){
  var wB=imgB.naturalWidth,hB=imgB.naturalHeight,k=Math.min(1,6000/Math.max(wB,hB)),sw=Math.round(wB*k),sh=Math.round(hB*k),sd=imgData(imgB,sw,sh).data;
  var out=new ImageData(ow,oh),od=out.data;
  for(var y=0;y<oh;y++){
    var v=(y+.5)/oh,o=y*ow*4;
    for(var x=0;x<ow;x++,o+=4){
      var u=(x+.5)/ow,W=M[6]*u+M[7]*v+M[8];
      od[o+3]=255;
      if(Math.abs(W)<1e-9)continue;
      var bx=(M[0]*u+M[1]*v+M[2])/W*sw-.5,by=(M[3]*u+M[4]*v+M[5])/W*sh-.5;
      if(bx<-.5||by<-.5||bx>sw-.5||by>sh-.5)continue;
      var x0=Math.floor(bx),y0=Math.floor(by),fx=bx-x0,fy=by-y0,x1=Math.min(sw-1,x0+1),y1=Math.min(sh-1,y0+1);x0=Math.max(0,x0);y0=Math.max(0,y0);
      var a=(y0*sw+x0)*4,b=(y0*sw+x1)*4,c=(y1*sw+x0)*4,d=(y1*sw+x1)*4,w1=(1-fx)*(1-fy),w2=fx*(1-fy),w3=(1-fx)*fy,w4=fx*fy;
      od[o]=sd[a]*w1+sd[b]*w2+sd[c]*w3+sd[d]*w4;od[o+1]=sd[a+1]*w1+sd[b+1]*w2+sd[c+1]*w3+sd[d+1]*w4;od[o+2]=sd[a+2]*w1+sd[b+2]*w2+sd[c+2]*w3+sd[d+2]*w4;
    }
    if(y%64===63){if(onP)onP(y/oh);await sleep(0)}
  }
  var c=document.createElement('canvas');c.width=ow;c.height=oh;c.getContext('2d').putImageData(out,0,0);return c;
}
window.AFMotor={sleep:sleep,loadImg:loadImg,imgData:imgData,loadCV:loadCV,loadZip:loadZip,rotMatrix:rotMatrix,isRotZero:isRotZero,hasShift:hasShift,rotRender:rotRender,autoAlign:autoAlign,applyAutoT:applyAutoT,
  m3mul:m3mul,m3inv:m3inv,I3:I3,manM3:manM3,planoM:planoM,autoAlignPlano:autoAlignPlano,renderPlano:renderPlano};
})();

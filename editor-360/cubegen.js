/* Generador de teselas de cubo (multiresolución) a partir de una panorama equirectangular. GEOMAV */
window.CubeGen=(function(){
  'use strict';
  /* Dirección 3D de cada píxel de cada cara. u: derecha, v: abajo, ambos en [-1,1]. Mundo: X derecha, Y arriba, Z adelante (yaw 0). */
  var DIRS={
    f:function(u,v){return [u,-v,1]},
    r:function(u,v){return [1,-v,-u]},
    b:function(u,v){return [-u,-v,-1]},
    l:function(u,v){return [-1,-v,u]},
    u:function(u,v){return [u,1,v]},
    d:function(u,v){return [u,-1,-v]}
  };
  var ORDER='bdflru',TILE=512;
  function pow2floor(n){var p=1;while(p*2<=n)p*=2;return p}
  function tick(){return new Promise(function(r){setTimeout(r,0)})}
  function canvasBlob(c,q){return new Promise(function(res){c.toBlob(res,'image/jpeg',q)})}
  function newCanvas(w,h){var c=document.createElement('canvas');c.width=w;c.height=h;return c}

  function renderFace(src,W,H,face,S){
    var out=new Uint8ClampedArray(S*S*4),fn=DIRS[face],PI=Math.PI;
    for(var j=0;j<S;j++){
      var v=2*(j+.5)/S-1;
      for(var i=0;i<S;i++){
        var u=2*(i+.5)/S-1,d=fn(u,v),x=d[0],y=d[1],z=d[2];
        var yaw=Math.atan2(x,z),lat=Math.atan2(y,Math.sqrt(x*x+z*z));
        var fx=(yaw/(2*PI)+.5)*W-.5,fy=(.5-lat/PI)*H-.5;
        var x0=Math.floor(fx),y0=Math.floor(fy),tx=fx-x0,ty=fy-y0;
        var xa=((x0%W)+W)%W,xb=(xa+1)%W,ya=y0<0?0:(y0>=H?H-1:y0),yb=y0+1<0?0:(y0+1>=H?H-1:y0+1);
        var i00=(ya*W+xa)*4,i10=(ya*W+xb)*4,i01=(yb*W+xa)*4,i11=(yb*W+xb)*4,o=(j*S+i)*4;
        var w00=(1-tx)*(1-ty),w10=tx*(1-ty),w01=(1-tx)*ty,w11=tx*ty;
        out[o]=src[i00]*w00+src[i10]*w10+src[i01]*w01+src[i11]*w11;
        out[o+1]=src[i00+1]*w00+src[i10+1]*w10+src[i01+1]*w01+src[i11+1]*w11;
        out[o+2]=src[i00+2]*w00+src[i10+2]*w10+src[i01+2]*w01+src[i11+2]*w11;
        out[o+3]=255;
      }
      if(j%64===63)await_(); 
    }
    return out;
  }
  function await_(){} // marcador (el cedido a la UI se hace entre caras)

  /* img: HTMLImageElement ya cargada. Devuelve {faceSize, levels, files:[{path,blob}]} con rutas relativas a baseDir. */
  async function build(img,baseDir,opts){
    opts=opts||{};
    var W=img.naturalWidth,H=img.naturalHeight,onP=opts.onProgress||function(){};
    var c=newCanvas(W,H),cx=c.getContext('2d',{willReadFrequently:true});cx.drawImage(img,0,0);
    var src=cx.getImageData(0,0,W,H).data;
    var faceMax=Math.max(256,Math.min(4096,pow2floor(Math.floor(W/4))));
    var sizes=[];
    if(faceMax<512)sizes=[faceMax];else for(var s=512;s<=faceMax;s*=2)sizes.push(s);
    var files=[],faceCanvas={},faces='fbrlud'.split('');
    for(var k=0;k<faces.length;k++){
      var f=faces[k];onP('cara '+(k+1)+' de 6');await tick();
      var data=renderFace(src,W,H,f,faceMax),fc=newCanvas(faceMax,faceMax);
      fc.getContext('2d').putImageData(new ImageData(data,faceMax,faceMax),0,0);
      faceCanvas[f]=fc;
    }
    var levels=[{tileSize:256,size:256,fallbackOnly:true}];
    for(var li=0;li<sizes.length;li++){
      var size=sizes[li],ts=Math.min(TILE,size),n=size/ts;
      levels.push({tileSize:ts,size:size});
      for(var fi=0;fi<faces.length;fi++){
        var face=faces[fi],lc=faceCanvas[face];
        if(size!==faceMax){lc=newCanvas(size,size);var g=lc.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(faceCanvas[face],0,0,size,size)}
        for(var ty=0;ty<n;ty++)for(var tx=0;tx<n;tx++){
          var tc=newCanvas(ts,ts);tc.getContext('2d').drawImage(lc,tx*ts,ty*ts,ts,ts,0,0,ts,ts);
          files.push({path:baseDir+'/'+(li+1)+'/'+face+'/'+ty+'/'+tx+'.jpg',blob:await canvasBlob(tc,.88)});
        }
      }
      onP('nivel '+(li+1)+' de '+sizes.length);await tick();
    }
    var pv=newCanvas(256,256*6),pg=pv.getContext('2d');pg.imageSmoothingQuality='high';
    for(var oi=0;oi<6;oi++)pg.drawImage(faceCanvas[ORDER[oi]],0,oi*256,256,256);
    files.push({path:baseDir+'/preview.jpg',blob:await canvasBlob(pv,.85)});
    return {faceSize:faceMax,levels:levels,tiles:baseDir+'/{z}/{f}/{y}/{x}.jpg',preview:baseDir+'/preview.jpg',files:files};
  }
  return {build:build,DIRS:DIRS};
})();

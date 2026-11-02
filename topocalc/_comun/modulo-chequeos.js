"use strict";
/* Módulo compartido del grupo «Chequeos de Instrumentos».
   Generado a partir del index.html monolítico de topocalc. */
const VR_SAVE = ['cliente','rut','operador','lugar'];
function vrDatosHtml(toolId){
  let sv = {}; try{ sv = JSON.parse(localStorage.getItem('topocalc_vr')||'{}'); }catch(e){}
  const t = (id,label)=>`<div class="field-row"><label for="vr_${id}">${label}</label><input type="text" id="vr_${id}" value="${vrEsc(sv[id]||'')}"></div>`;
  const chk = (p,arr)=>arr.map((x,i)=>`<label class="vr-chk"><input type="checkbox" id="vr_${p}${i}"> ${x}</label>`).join('');
  return `<div class="field-card"><details class="vr-datos"><summary>Datos del informe (opcional)</summary>
    <p class="tool-blurb" style="margin:8px 0 0;">Estos datos solo se usan al presionar “Exportar informe”. Lo que dejes en blanco aparece como “—”.</p>
    <div class="vr-sub">Cliente</div>${t('cliente','Otorgado a')}${t('rut','RUT')}
    <div class="vr-sub">Equipo</div>${t('marca','Marca')}${t('modelo','Modelo')}${t('serie','N° de serie')}${t('caract','Características (aumento, precisión…)')}
    <div class="vr-sub">Condiciones</div>${t('lugar','Lugar')}${t('temp','Temperatura (°C)')}${t('hum','Humedad relativa (%)')}${t('operador','Operador / responsable')}
    <div class="vr-sub">Revisión visual (marca lo que está OK)</div>${chk('b',VR_CFG[toolId].base)}${chk('a',VR_APAR)}
  </details></div>`;
}
function vrWire(){
  VR_SAVE.forEach(id=>{
    const el = document.getElementById('vr_'+id);
    if(!el) return;
    el.addEventListener('input', ()=>{
      try{
        const sv = JSON.parse(localStorage.getItem('topocalc_vr')||'{}');
        sv[id] = el.value; localStorage.setItem('topocalc_vr', JSON.stringify(sv));
      }catch(e){}
    });
  });
}
function svgTeodolitoDosCaras(hzFL,hzFR,zFL,zFR,r){
  const K=svgKit(), cb='var(--blueprint)', cs='var(--success)', ca='var(--accent)', ci='var(--ink)';
  const sec=v=>`${fmtNum(v,1)}″`;
  K.list([[{k:'CI',c:cb,v:fmtAngle(hzFL)},{k:'CD',c:cs,v:fmtAngle(hzFR)},{k:'C',c:ca,v:sec(r.Csec)},{k:'Hz medio',c:ci,v:fmtAngle(r.hzMean)}],
    [{k:'ZI',c:cb,v:fmtAngle(zFL)},{k:'ZD',c:cs,v:fmtAngle(zFR)},{k:'i',c:ca,v:sec(r.isec)},{k:'Z medio',c:ci,v:fmtAngle(r.zMean)}]],{perCol:4,gap:14});
  const cy=112, arm=44, sep=24;
  const rad=a=>a*Math.PI/180;
  const panel=(cx,az,err,l1,l2,cl,title,zen)=>{
    const s=err===0?0:(err>0?1:-1), az2=az+s*sep;
    const P=(a,rr)=>[cx+rr*Math.cos(rad(a-90)), cy+rr*Math.sin(rad(a-90))];
    if(zen) K.line(cx,cy-arm,cx,cy+8,'var(--ink-soft)',{sw:0.6,dash:'1.6 1.6',noObs:true});
    const p1=P(az,arm), p2=P(az2,arm);
    K.line(cx,cy,...p1,cb,{sw:1.3}); K.line(cx,cy,...p2,cs,{sw:1.3,dash:s?undefined:'3 2'});
    if(s){ K.arc(cx,cy,arm*0.45,az-90,az2-90,ca,{sw:1});
      const bm=(az+az2)/2, q=P(bm,arm*0.45); K.pointLabel(cl,q[0],q[1],4.5,ca,{dir:[Math.cos(rad(bm-90)),Math.sin(rad(bm-90))],rmin:2.5,rmax:9,omit:false}); }
    K.dot(cx,cy,ci,2.4);
    const d1=[Math.cos(rad(az-90)),Math.sin(rad(az-90))], d2=[Math.cos(rad(az2-90)),Math.sin(rad(az2-90))];
    K.pointLabel(l1,p1[0],p1[1],4.5,cb,{dir:d1,omit:false,rmin:4,rmax:12}); K.pointLabel(l2,p2[0],p2[1],4.5,cs,{dir:d2,omit:false,rmin:4,rmax:12});
    if(zen) K.pointLabel('Cenit',cx,cy-arm-6,3.6,'var(--ink-soft)',{dir:[0,-1],omit:false,rmin:3,rmax:14,full:true});
    K.txt(title,3.6,'var(--ink-soft)',{x:cx,y:183,anchor:'middle'});
  };
  panel(80,hzFL,r.C,'CI','CD','C','Colimación horizontal',false);
  panel(240,zFL,r.i,'ZI','ZD','i','Índice vertical',true);
  K.line(160,44,160,176,'var(--line)',{sw:0.6,noObs:true});
  return K.svg();
}

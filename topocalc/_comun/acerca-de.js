/* GEOMAV · Módulo compartido «Acerca de» (botón ⓘ + ventana de información).
   Uso en cada app:
   <script src="/assets/js/acerca-de.js" data-app="Nombre" data-desc="Descripción corta"
           data-host="header.top, .topbar" defer></script>
   Atributos: data-app (obligatorio), data-desc, data-version (def. 1.0.0), data-host (selectores CSS
   donde insertar el botón; si no existe ninguno, queda un botón flotante arriba a la derecha),
   data-clase="theme-toggle" para reutilizar la clase de botón de la propia app (mismo aspecto que sus otros botones). */
(function () {
  'use strict';
  var s = document.currentScript;
  if (!s || window.__acercaDeListo) return;
  window.__acercaDeListo = true;

  var C = {
    app: s.getAttribute('data-app') || document.title,
    desc: s.getAttribute('data-desc') || '',
    version: s.getAttribute('data-version') || '1.0.0',
    host: s.getAttribute('data-host') || '',
    clase: s.getAttribute('data-clase') || '',
    creador: 'Mario Verdugo A.',
    perfil: ['Técnico en Topografía', 'Perito Topográfico Judicial', 'Estudiante de Ing. en Geomensura'],
    empresa: 'GEOMAV SPA',
    web: 'geomav.me',
    tel: '+56 9 8486 7813',
    telHref: 'tel:+56984867813',
    mail: 'mverdugoa89@gmail.com',
    logo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEgAAABECAMAAAAV8YMOAAABgFBMVEVln6RlnqJXlZ1al56fqprhq5afr6DfrXkrcqrLqoSQpJrWqX3Nq4XYqn3Kq4b//wAAAP80l5n/f383jqLYqn1Ue6O5f3b//3+ooHsNX2f/AADdwJhVVVXl2J0A/wB/v39/f/9///+Ip6AAAABVqal/f381hZhPmKM9f38A//+xqZDKqoX///8Af380fJMse4+pqanRtI9DjJquqJAtfJBTmaKRpZmSpZqvqI9pmZlTmaKPpJquqJCtqJE5g5RLkZ2vqI84g5NTmaJTmaKWmZeuqJA5hJRwpKW+vn7muIktfI9TmaMue45Rl6KPpJmqqlXJq4Y6hJU5hJSSpZkse45RlqgsfI8se445g5SOpJo6iJRVVapIiZRPlZfOrIVFjZoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC3K+fjAAAAYHRSTlMg4VqiEA76FwWjadnSoW4BAQYC/l0HBAIHBwH/AwQBBAICpAAFAvj3BAH1+AECEPQE/vHQL9PR83AJcK+PsZH1UNEvlAowMPQE/VCxz05OA01OrS6rE3KPcY0TAxAMMNMPA5dmAAAJ9UlEQVR42p1YB1vb2BJVcadDCJBNsmV0VWxZ7r03MK7gBjbt//+Ld0YGDJuXsLs3H/mwJB9mzj1zZq4k+nBZlm19/JT0SwgtYIr1r3b897j4b0DiBUPySB57/Ws3/q+BNEaRhsWWKmPlstlSaNThG5/tfwOk4adZ7BvAuLjAf76cDyuXKncOibz2PwUSFolhvybLRqZVVCSJc5uOliWghVN5D6D+GRDCGcqGXOsPtfc34vVy2JcIl7305fBjoCiuqYYhFxll3zQ1IWxbiLj4nVnz1CuJRGTX/jEo6YdwNDVp1Ipz3JLa8Xd02HHeNIYKPtLnXwOZdK4aNXW+5pvT2aP3WIC+iiQiVzT+8gsg4CSNJ4WoQDQNLUMjMPtGOrY4PLShS28QQdF476dAJl0nDfWeTI0Kqq9UKmWz5TYJV5h74+5znn4/0W7kcucVyXv4NyDg6IZqQYxCulA9fGlaSdURVHctae/jo9fPUF2kByQGEF2+8A7ojs51o0pRQYJkFbfaHEs9VXEV3b0KbvPa2trx8zeB9Im88THRtytcsaU3++7iaBYIKmawZy/yLIdT5XIllQpePfq7p95PO5dB4NKny0vWgHd3G7HF30R099AwJmucptG0JFJUVNiIxZMvl/OdTej+7S0/ndKnTzS+CkYuIxE/ZCVtBHRz1FjtR4VGc6OIj+qFooyWuVL7DYvfEMMeMtvZ8oJoz+524jIYTGwd2huONCSmn1PgT9QHcJCdXODrnlIutH7CUy+ntreDu5/Je0pgBcH8Fgl6Xa66GyARGBxV6RhF388M6UHTjCY9uHdG2WxoVM+DpHK987i7vf3oZptKJLZ3H+kqEUGem4hMWugN54Ae+kbRJAi730eQBUXh+6NSNlV5JWnXjyoJ/xauXCHP3UQkseMW3jOQtRro1/iUbN0TDFrqZ+YFki5kVfaN3krW221L+VTYl2LcOONEIo80fgUyqacPNOs4iep4oIeW0XogaW5wrYR8f7E0PZ18haOKeyphXzhcqXMUjJPYJrEpEcsa6D2iqkoFkxSj32T2kZ37xF+5bMlNLl8J53GhDdY5tbobT+KKqX4GClBaj61I0s+jB6TUhoDBthkQgkvSdBQKTd2K6QCJ5XDSyYcZhZf/y5dXIBMauiG6blDUcpBewdIQV1O02LPVV6l5ToHkocN49zPVw1gcUHAd0BpoP+pmdjsBQcoTAhTUrDVJKjbZLi/UUGgJKwjR9zahhuP4at73DPRM9RooSulYzLGoWiUHhWGZXLUKFV6cRpWzpWUolCrtte1Kmb4BJxxOpPLrgD5v/Ij3bIY4EJFD6sRCZ5RqjrCsgtaSVeUls69ZaLxcRkTA8VU8h2Gm2rv9yfU+6ZmiBR0wRybdNgjlhgTZV6By5UItQJmh9u/QuAtEZV/YVyZhBxORbXq83KK9ZyCNZkc9YDjYNVrpq6gGZR4ArmncQ1cqt8hs1kPTbJs6nb0K+MmfQNfw7l3ybm1KBBwtnCjX/wTVNqlSQBCM+56GGdLQBCTWQHbJQGPSKmA5T4+RLnkjES+A4CKHa6D10BK1LCeWpsAKteLsS0mJDua1IrStuYGrJaQmyJMFTh1GxIIOBmGVW5d+3jh3+896i4VD0TuQ7hD8REF0Sg0sKxmIXBP4RyB9WUJQuXCqTR7qpOwxXV3tfaMdtlwGssgZ6Loe61EUrLtISTg2FIkCPm7BnASekWSJpp5RLheutOuYcjxhr9vkxi7QZwaKWjP9pncTQ1pAquppopXKve0elgJ/yvR5GyUZexzK5XJLQakyucpkBW2AwLQ+wJUZFGAipVv9lsNJcmUMM/0HuneNV5FJLH05tksbddKmfIpOXoE4Ne1ZjVxtDITeNlkhHJU5IlXWYL0SUpMKJeCMaIm8IG/RdYsFG89k+92InFis56Rj+oICGl2jTCbscZASc45SechIFlwOk1Z2SvFSifam2DeUrZ9b7yEDnTBHdzTTY7wcCPE2ee0GVXXHAIX2FdmtO1IuZF+pLSnkyU0ZBK6SyvMcuBGkW7IxDihKVfmaxD403uCyU5Irupclq/VQgLp9S8DJf7II4gyCHkxizCXy4pBQNEIa4OsT4xpscfGZoPyY5R14whMSJsmLEewAe/d9mvMIO18h+zTcQZvc5WliDbR/Fxjo2HynAZyDl/FGv//DUlQ6frpHq8REKgWAo/JIAKYgzBPBYXko+Jvb1l5qDYk5jaNbN541EkqOpCdNOM3MBdtkNJPJyLKkae2ch4HiZFfyJPyRxKOrg2cfPSNndsQMvwwC1nnjGHQTrFs2LsC2mDeHeFgQomrb06wtWJNMkf/NoBVlQTYCZ+amgx00zjXnvNnHfIvqENrGLiUMGKESCgQcIbOdN10EfC90Pe30otFXO6QG6C4amG8xUR7DfYctrD6jFqgNZbK297w8ipy8Ap2Rq8eb9NpRGM40b9PDjFyTMQnQA7w3k2GgouR+BebUFgzGe3aySS2KLjKg3owrxNL2iRwUybyFcNByFVitO6Fs5k65hKiWWbK93B+9r0BcbmhHsUXAMTmkdC9N98WaUXNbLqxAlTNQlNtVHjQF/QnbPoKcKHi5tXe46SJfUSQDK43axTpf3CzOIGHAGMX0GZ+1lKLilvOwlWENwBcEcEZkPfLej1+B4GwxfWYt9NhscTMYLALoIYCpteZMuLnmreCyNBw23e0bqxhS2vY22pp3M2dzsSEaVByg0HAZplZTm2lT4waFrmBqAXS64v7zdwoK712byomI91C8B0LtU+DcYZ0kk8maa2uDHlmNKm+geUArWIGJIp/jGCezHZxSnZmOv5v8zUFMH/TOz6+rDR04LsyxmN3QmaNXHX5i9aTi0fsiOOq3JD6TYJ5AV+u+O0KwHGP6ej3DRP/AqBMzA+xyk2p1gnYwZ+ctSutDc5txym9wXnR084yjTxQ0V3Hnls3ghrin3Fart+cgXeXBCX82IOwu41ROxvaPh5p0dTKp3l6/uAgD7afRol784DupaJmaxlsYZ4tMVLy2/ePp6LXGtNVggkpZh9SLuQxpd9wMYEwuqIiTp8xTxBf7/x2z7sy7O5w7MbHFjmJoSPBvuHl6plfTDn11bpNqlO7WMOiyPnR/Yf/yKAp1zsAUtxGTvSM9awwGjUbjmiMUfFyaLjEddyj+0eEYJPQaR4BiCR/gKBBNp89RwweSYH6my5wvVz4l8fFx3UKnq+pGsqFIf39TICk4++dKHXopsA9eICCW1W3DMJJPqiLN5wdRS3uYNxVVln2+3HL6w4n556809gF1oODYjpWsyXImA6NEC5DVEJ+Wxb94yWKxlOYSoqjVDHdl1PUJ52cvf37+2kdb+700bzal5vMHIez/8iJq/87U9jfAkmb/1zda600UvD58OfY/xCP1KkBFTZkAAAAASUVORK5CYII='
  };

  function esc(t) {
    return String(t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var css =
    '.gm-ab-btn{display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;width:36px;height:36px;' +
    'min-width:36px;padding:0;margin:0 0 0 6px;border-radius:50%;border:1px solid currentColor;background:transparent;' +
    'color:inherit;cursor:pointer;opacity:.85;font:inherit;line-height:1;-webkit-tap-highlight-color:transparent}' +
    '.gm-ab-btn:hover,.gm-ab-btn:focus-visible{opacity:1}' +
    '.gm-ab-btn svg{width:20px;height:20px;display:block;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}' +
    '.gm-ab-float{position:fixed;top:calc(8px + env(safe-area-inset-top,0px));right:8px;z-index:2147483000;margin:0;' +
    'background:rgba(244,243,239,.92);color:#0A2240;border-color:#0A2240}' +
    'body.vr .gm-ab-float{display:none}' +
    '.gm-ab-ov{position:fixed;inset:0;z-index:2147483600;background:rgba(10,34,64,.55);display:flex;align-items:center;' +
    'justify-content:center;padding:16px;overflow:auto;font-family:Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}' +
    '.gm-ab-box{background:#F4F3EF;color:#0A2240;border-radius:14px;width:100%;max-width:340px;padding:20px 18px;text-align:center;' +
    'box-shadow:0 10px 40px rgba(0,0,0,.35);max-height:100%;overflow:auto;box-sizing:border-box}' +
    '.gm-ab-box *{box-sizing:border-box}' +
    '.gm-ab-logo{width:76px;height:76px;border-radius:18px;background:#fff;border:1px solid #cfd3da;margin:0 auto 10px;' +
    'display:flex;align-items:center;justify-content:center}' +
    '.gm-ab-logo img{width:56px;height:53px;object-fit:contain;display:block}' +
    '.gm-ab-t{font-size:18px;font-weight:700;margin:0;color:#0A2240}' +
    '.gm-ab-v{display:inline-block;margin-top:6px;background:#D49A6A;color:#0A2240;font-size:12px;font-weight:600;padding:3px 10px;border-radius:20px}' +
    '.gm-ab-d{font-size:13px;line-height:1.5;color:#33415a;margin:12px 0 14px}' +
    '.gm-ab-rows{border-top:1px solid #cfd3da;padding-top:10px;text-align:left;font-size:13px}' +
    '.gm-ab-r{display:flex;justify-content:space-between;gap:12px;padding:5px 0}' +
    '.gm-ab-r span:first-child{color:#5a6577;flex:0 0 auto}' +
    '.gm-ab-r span:last-child{color:#0A2240;text-align:right;line-height:1.5;word-break:break-word}' +
    '.gm-ab-r a{color:#2C6B7E;text-decoration:none}' +
    '.gm-ab-x{margin-top:14px;width:100%;padding:10px;border-radius:8px;border:0;background:#0A2240;color:#F4F3EF;font:600 14px Inter,system-ui,sans-serif;cursor:pointer}' +
    '.gm-ab-c{margin-top:10px;font-size:11px;color:#7a8497}';

  function addStyle() {
    var st = document.createElement('style');
    st.setAttribute('data-gm-ab', '');
    st.textContent = css;
    (document.head || document.documentElement).appendChild(st);
  }

  var ICON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M12 11v5.5"/><path d="M12 7.6v.01"/></svg>';

  function abrir() {
    if (document.getElementById('gm-ab-ov')) return;
    var prevFocus = document.activeElement;
    var ov = document.createElement('div');
    ov.className = 'gm-ab-ov';
    ov.id = 'gm-ab-ov';
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-modal', 'true');
    ov.setAttribute('aria-label', 'Acerca de ' + C.app);
    ov.innerHTML =
      '<div class="gm-ab-box">' +
        '<div class="gm-ab-logo"><img src="' + C.logo + '" alt="Logo GEOMAV"></div>' +
        '<h2 class="gm-ab-t">' + esc(C.app) + '</h2>' +
        '<div class="gm-ab-v">Versión ' + esc(C.version) + '</div>' +
        (C.desc ? '<p class="gm-ab-d">' + esc(C.desc) + '</p>' : '<div style="height:12px"></div>') +
        '<div class="gm-ab-rows">' +
          '<div class="gm-ab-r"><span>Creador</span><span><b>' + esc(C.creador) + '</b></span></div>' +
          '<div class="gm-ab-r"><span>Perfil</span><span>' + C.perfil.map(esc).join('<br>') + '</span></div>' +
          '<div class="gm-ab-r"><span>Empresa</span><span><b>' + esc(C.empresa) + '</b></span></div>' +
          '<div class="gm-ab-r"><span>Web</span><span><a href="https://' + C.web + '/" target="_blank" rel="noopener">' + esc(C.web) + '</a></span></div>' +
          '<div class="gm-ab-r"><span>Teléfono</span><span><a href="' + C.telHref + '">' + esc(C.tel) + '</a></span></div>' +
          '<div class="gm-ab-r"><span>Correo</span><span><a href="mailto:' + C.mail + '">' + esc(C.mail) + '</a></span></div>' +
        '</div>' +
        '<button type="button" class="gm-ab-x" id="gm-ab-x">Cerrar</button>' +
        '<div class="gm-ab-c">© ' + new Date().getFullYear() + ' ' + esc(C.empresa) + ' · Talca, Chile</div>' +
      '</div>';
    document.body.appendChild(ov);
    var x = document.getElementById('gm-ab-x');
    function cerrar() {
      document.removeEventListener('keydown', onKey, true);
      if (ov.parentNode) ov.parentNode.removeChild(ov);
      if (prevFocus && prevFocus.focus) { try { prevFocus.focus(); } catch (e) {} }
    }
    function onKey(e) { if (e.key === 'Escape') { e.stopPropagation(); cerrar(); } }
    x.addEventListener('click', cerrar);
    ov.addEventListener('click', function (e) { if (e.target === ov) cerrar(); });
    document.addEventListener('keydown', onKey, true);
    x.focus();
  }

  function crearBoton(flotante) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = (C.clase && !flotante) ? C.clase : 'gm-ab-btn' + (flotante ? ' gm-ab-float' : '');
    b.setAttribute('data-gm-ab-btn', '');
    b.setAttribute('aria-label', 'Acerca de esta app');
    b.title = 'Acerca de';
    b.innerHTML = ICON;
    b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); abrir(); });
    return b;
  }

  function buscarHost() {
    var sels = C.host ? C.host.split(',') : [];
    for (var i = 0; i < sels.length; i++) {
      var el = null;
      try { el = document.querySelector(sels[i].trim()); } catch (e) {}
      if (el) return el;
    }
    return null;
  }

  function asegurar() {
    var host = buscarHost();
    var existente = document.querySelector('[data-gm-ab-btn]');
    if (host) {
      if (existente && existente.parentNode === host) return;
      if (existente) existente.parentNode.removeChild(existente);
      host.appendChild(crearBoton(false));
    } else if (!existente) {
      if (document.body) document.body.appendChild(crearBoton(true));
    }
  }

  function iniciar() {
    addStyle();
    asegurar();
    var t = null;
    try {
      new MutationObserver(function () {
        if (t) return;
        t = setTimeout(function () { t = null; asegurar(); }, 60);
      }).observe(document.body, { childList: true, subtree: true });
    } catch (e) {}
    setTimeout(asegurar, 1500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();

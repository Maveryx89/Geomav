/* Manual de uso. Para actualizarlo: editar MANUAL (secciones) y agregar una línea arriba en MANUAL_LOG. */
const MANUAL_VER='19 oct 2026';
const MANUAL_LOG=[
  ['19 oct 2026','Primera versión del manual y recorrido guiado. Incluye el historial de salud con adjuntos y el botón + del calendario.']
];
const MANUAL=[
 {id:'inicio',ic:'🚀',t:'Primeros pasos',h:`
  <p><b>Instalar la app</b></p>
  <ul><li><b>Android (Chrome):</b> menú ⋮ → «Instalar app» o «Agregar a pantalla de inicio».</li>
  <li><b>iPhone (Safari):</b> botón Compartir → «Agregar a inicio».</li></ul>
  <p><b>Ingresar</b></p>
  <ol><li>Escribe tu correo y toca «Enviar enlace».</li>
  <li>Te llega un correo con un <b>código de 8 dígitos</b> (vale 1 hora). Escríbelo en la app.</li>
  <li>Entras sin contraseña. La sesión queda abierta en ese celular.</li></ol>
  <p>Para entrar tienes que haber sido <b>invitado</b> con ese mismo correo. Si usas la app instalada, escribe el código: el enlace del correo se abre en el navegador, no en la app.</p>`},
 {id:'roles',ic:'🔐',t:'Roles y permisos',h:`
  <ul><li><b>Administrador:</b> todo. Además ve Salud, administra medicamentos, invita, cambia roles y vincula cuentas.</li>
  <li><b>Editor:</b> agrega y edita personas, citas, notas, tareas, escolar y eventos. No ve Salud ni administra medicamentos.</li>
  <li><b>Miembro:</b> solo lectura, pero puede marcar tareas y útiles. Si su cuenta está vinculada a una persona: edita su propio teléfono, contacto de emergencia y notas, ve su salud (lectura) y marca sus tomas de medicamentos.</li></ul>
  <p>Los permisos los aplica la base de datos: aunque alguien intente saltarse la pantalla, no puede hacer lo que su rol no permite.</p>`},
 {id:'mi',ic:'🙋',t:'Mi ficha',h:`
  <p>Es la primera pantalla cuando tu cuenta está vinculada a una persona. Muestra:</p>
  <ul><li><b>Dosis de hoy:</b> toca el círculo para marcar una toma.</li><li><b>Mis tareas</b> y <b>mis citas</b> próximas.</li><li><b>Eventos del colegio</b> que vienen.</li><li><b>Mis datos:</b> botón para editar tu teléfono, contacto de emergencia y notas.</li><li><b>Mi salud:</b> solo lectura.</li></ul>
  <p>Si no ves esta pantalla, pide a un administrador que vincule tu cuenta (Ajustes → Miembros → Persona).</p>`},
 {id:'familia',ic:'👪',t:'Familia (personas)',h:`
  <ul><li>Lista de personas con edad y próximo cumpleaños. Toca una para ver su ficha.</li>
  <li><b>Agregar o editar</b> (admin y editor): botón + abajo a la derecha, o «Editar» dentro de la ficha.</li>
  <li>Campos: nombre, parentesco, fecha de nacimiento, teléfono, contacto de emergencia y notas. La fecha de nacimiento alimenta los cumpleaños del calendario.</li></ul>`},
 {id:'cal',ic:'📅',t:'Calendario',h:`
  <ul><li><b>Rojo:</b> feriado de Chile (2026 y 2027, con traslados por ley). Debajo de cada día aparece el santo.</li>
  <li>Marcas por día: cumpleaños, citas médicas, tareas, eventos y actividades del colegio.</li>
  <li><b>Toca un día</b> para ver su detalle abajo; desde ahí puedes abrir y editar cada cosa (según tu rol).</li>
  <li><b>Botón +</b> (admin y editor): elige cita, evento, tarea o evento escolar. Ya viene con la fecha del día seleccionado. Si la información es más extensa, usa la sección propia.</li></ul>
  <p>Los feriados se cargan año a año; los de 2028 se agregarán antes de que termine 2027.</p>`},
 {id:'citas',ic:'🩺',t:'Citas médicas',h:`
  <ul><li>Horas de doctor de toda la familia, ordenadas por fecha.</li>
  <li>Campos: paciente, fecha y hora, doctor o especialidad, lugar, motivo y estado (pendiente, realizada o cancelada).</li>
  <li>Admin y editor las crean y editan; todos las ven. También salen en el calendario y en «Mi ficha».</li></ul>`},
 {id:'tareas',ic:'✅',t:'Tareas del hogar',h:`
  <ul><li>Cada tarea tiene título, descripción, persona asignada, fecha y repetición (ninguna, diaria, semanal o mensual).</li>
  <li><b>Todos</b> pueden marcarlas como hechas. Si se repite, al marcarla pasa sola a la siguiente fecha.</li>
  <li>Solo admin y editor crean, editan o eliminan tareas.</li></ul>`},
 {id:'meds',ic:'💊',t:'Medicamentos y horarios',h:`
  <ul><li>Solo el <b>administrador</b> los crea y edita. Cada persona ve únicamente los suyos.</li>
  <li><b>Horarios:</b> escribe las horas separadas por coma, en formato 24 h. Ejemplo: <code>08:00,20:00</code>.</li>
  <li>Se pueden indicar fecha de inicio y de término del tratamiento.</li>
  <li>Cada persona marca sus tomas del día en «Mi ficha» o en esta sección. Se guarda el registro de los últimos días.</li></ul>`},
 {id:'escolar',ic:'🎒',t:'Escolar',h:`
  <ul><li>Tres tipos de registro: <b>horario</b> (día y hora de clases), <b>evento</b> (prueba, reunión, acto; con fecha) y <b>útil</b> (lista con casillas).</li>
  <li>Admin y editor agregan y editan. Todos pueden marcar un útil como listo.</li>
  <li>Los eventos con fecha aparecen en el calendario y en «Mi ficha». Los pasados se ocultan de la lista.</li></ul>`},
 {id:'notas',ic:'📌',t:'Info útil',h:`
  <p>Notas con título, categoría y contenido: teléfonos de emergencia, seguros, patentes, datos del colegio, etc. Se agrupan por categoría. Las crean y editan admin y editor.</p>`},
 {id:'salud',ic:'🩺',t:'Salud e historial',r:'admin',h:`
  <p>Más → Salud → toca una persona. Arriba está su <b>ficha base</b> (RUT, previsión, grupo sanguíneo, alergias, medicamentos, condiciones, vacunas, médico) y debajo su <b>historial</b>.</p>
  <p><b>Agregar un registro:</b> botón + → elige el tipo (examen, diagnóstico, consulta/control, imagen, cirugía/hospital, vacuna, tratamiento u otro), fecha, título, profesional, lugar y detalle.</p>
  <p><b>Resultados de examen:</b> una línea por parámetro con el formato <code>Nombre | valor | unidad | referencia</code>. Ejemplo:</p>
  <p><code>Glicemia | 142 | mg/dl | 60 - 100</code></p>
  <ul><li>Una línea con solo el nombre sirve de subtítulo (ej. <code>HEMATOLOGÍA</code>).</li><li>La app marca ↑ o ↓ sola cuando el valor queda fuera del rango, y el registro muestra «⚠ n».</li><li>Puedes pegar filas desde Excel.</li><li>Si el mismo parámetro está en 2 o más exámenes, aparece en <b>Tendencias</b>.</li></ul>
  <p><b>Adjuntos:</b> en el mismo formulario puedes subir PDF o fotos (hasta 15 MB cada uno). Se guardan en un espacio privado; al tocar «📎» se abre con un enlace temporal de 5 minutos. Al eliminar un registro se borran sus adjuntos.</p>
  <p><b>Buscar y filtrar:</b> chips por tipo arriba y buscador por texto (examen, médico, parámetro…).</p>
  <p>Cada persona vinculada puede leer el suyo a nivel de base de datos; hoy la pantalla de lectura solo está disponible para administradores.</p>`},
 {id:'ajustes',ic:'⚙️',t:'Ajustes y administración',h:`
  <ul><li><b>Invitar familiar</b> (admin): correo + rol + persona a la que corresponde. El familiar debe ingresar con ese mismo correo.</li>
  <li><b>Rol:</b> cambia el rol de un miembro (administrador, editor o miembro).</li>
  <li><b>Persona:</b> vincula la cuenta con una persona de la familia para que tenga su «Mi ficha».</li>
  <li><b>Quitar:</b> elimina a un miembro. Las invitaciones pendientes se cancelan con la ✕.</li>
  <li><b>Exportar respaldo (JSON):</b> descarga los datos. <b>No incluye los PDF adjuntos</b>; guarda aparte una copia de los importantes.</li>
  <li><b>Ver recorrido guiado:</b> repite la presentación inicial.</li></ul>`},
 {id:'offline',ic:'📶',t:'Sin conexión y sincronización',h:`
  <ul><li>Los datos se sincronizan al abrir la app y después de cada cambio, en todos los celulares de la familia.</li>
  <li>Sin internet se muestra la última copia guardada, en <b>solo lectura</b>. No se pueden guardar cambios hasta volver a conectarse.</li>
  <li>Cuando publicamos mejoras, la app instalada se actualiza al abrirla; si no ves lo nuevo, ciérrala por completo y ábrela dos veces.</li></ul>`},
 {id:'faq',ic:'🛠️',t:'Problemas frecuentes',h:`
  <ul><li><b>No llega el correo con el código:</b> revisa spam o promociones, espera un minuto y vuelve a pedirlo. Verifica que el correo sea el mismo de la invitación.</li>
  <li><b>«Código incorrecto o vencido»:</b> pide uno nuevo y usa el último que llegó (vale 1 hora).</li>
  <li><b>«Email rate limit exceeded»:</b> se pidieron muchos códigos seguidos; espera unos minutos.</li>
  <li><b>No veo Salud o no puedo editar:</b> depende del rol. Pide a un administrador que lo cambie en Ajustes → Rol.</li>
  <li><b>No veo «Mi ficha» completa:</b> tu cuenta no está vinculada a una persona (Ajustes → Persona).</li>
  <li><b>La app no se actualiza:</b> ciérrala por completo y ábrela dos veces. Si sigue igual, quita la app y vuelve a instalarla.</li>
  <li><b>No puedo abrir un PDF:</b> el enlace dura 5 minutos; vuelve a tocar «📎». Permite ventanas emergentes si el navegador las bloquea.</li></ul>`},
 {id:'privacidad',ic:'🛡️',t:'Seguridad y privacidad',h:`
  <ul><li>Solo entran las personas invitadas por un administrador; no hay contraseñas que se puedan filtrar.</li>
  <li>La información de salud y los medicamentos solo la ve el administrador y la propia persona.</li>
  <li>Los archivos de salud no tienen enlace público.</li>
  <li>Los datos están en Supabase y la app se publica en geomav.me/familia.</li></ul>`}
];
function vManual(){
  const rol=s=>s.r==='admin'?' <span class="pill">Solo administradores</span>':'';
  return `<div class="card"><div class="t">Manual de uso</div><div class="m">Versión ${esc(MANUAL_VER)} · se actualiza con cada mejora</div><div class="btns" style="justify-content:flex-start"><button class="primary sm" data-intro>▶ Ver recorrido guiado</button></div></div>`
   +`<input id="mq" type="search" placeholder="Buscar en el manual…" style="margin:4px 0 10px">`
   +MANUAL.map(s=>`<details class="card msec" data-q="${esc((s.t+' '+s.h.replace(/<[^>]+>/g,' ')).toLowerCase())}"${S.mopen===s.id?' open':''}><summary><span class="hic">${s.ic}</span><div class="grow t">${esc(s.t)}${rol(s)}</div></summary><div class="mb">${s.h}</div></details>`).join('')
   +`<h2>Novedades del manual</h2>`+MANUAL_LOG.map(l=>`<div class="card"><div class="m">${esc(l[0])}</div><div>${esc(l[1])}</div></div>`).join('');
}
document.addEventListener('input',e=>{
  if(e.target.id!=='mq') return;
  const q=e.target.value.toLowerCase().trim();
  document.querySelectorAll('.msec').forEach(c=>{ const hit=!q||c.dataset.q.includes(q); c.hidden=!hit; c.open=!!q&&hit; });
});

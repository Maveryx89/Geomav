// ─────────────────────────────────────────────
// FORMULARIO DE CONTACTO (envío real vía Formspree, sin recargar la página)
// Solo se usa en index.html.
// ─────────────────────────────────────────────

const formularioContacto = document.getElementById('formularioContacto');
const formularioEstado = document.getElementById('formularioEstado');

formularioContacto.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  const textoOriginal = btn.textContent;
  const regionSeleccionada = document.getElementById('region');
  const regionTexto = regionSeleccionada.options[regionSeleccionada.selectedIndex].text;

  btn.textContent = 'Enviando...';
  btn.disabled = true;
  formularioEstado.className = 'formulario-estado';

  try {
    const datos = new FormData(formularioContacto);
    const respuesta = await fetch(formularioContacto.action, {
      method: 'POST',
      body: datos,
      headers: { 'Accept': 'application/json' }
    });

    if (respuesta.ok) {
      formularioEstado.textContent = `¡Gracias! Hemos recibido tu solicitud para la región de ${regionTexto}. Un consultor técnico de GEOMAV te contactará en menos de 24 horas.`;
      formularioEstado.classList.add('visible', 'exito');
      formularioContacto.reset();
    } else {
      throw new Error('Respuesta no exitosa del servidor');
    }
  } catch (error) {
    formularioEstado.textContent = 'No pudimos enviar tu solicitud automáticamente. Por favor escríbenos directo a mverdugoa89@gmail.com o al WhatsApp +569 84867813.';
    formularioEstado.classList.add('visible', 'error');
  } finally {
    btn.textContent = textoOriginal;
    btn.disabled = false;
  }
});

// ===== CONFIGURACIÓN: edita aquí vuestros datos =====
const CONFIG = {
  novio1: 'Cristina',
  novio2: 'Jesús',
  fecha: '2027-10-30T13:00:00+02:00', // hora de la ceremonia (horario de verano en España hasta el 31/10/2027)
  lugar: 'Hacienda Majaloba, Ctra. Sevilla-La Rinconada km 6, 41300 La Rinconada (Sevilla)',
  whatsapp: '',      // con prefijo y sin espacios, p. ej. '34600111222'
  email: '',         // p. ej. 'nosotros@ejemplo.com'
  iban: 'ES90 2100 9715 8302 0074 7765',
  // URL de la aplicación web de Google Apps Script (termina en /exec) que guarda
  // las confirmaciones en la hoja de Google. Ver google-apps-script/LEEME.md.
  // Si se deja vacío, el formulario abre WhatsApp (o el email) con la respuesta ya escrita.
  rsvpEndpoint: 'https://script.google.com/macros/s/AKfycbxz4-tHtNdDVXIvlO9hwZ4LYsnxW3Q87iZOitAoRdbHV2FrMV7T23wa1TyoxRDqv45H/exec',
};
// ====================================================

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

// Nombres, contacto e IBAN
$$('.js-novio1').forEach(el => (el.textContent = CONFIG.novio1));
$$('.js-novio2').forEach(el => (el.textContent = CONFIG.novio2));
$('.nav__logo').textContent = `${CONFIG.novio1[0]} & ${CONFIG.novio2[0]}`;
$('#iban').textContent = CONFIG.iban;
if (CONFIG.whatsapp) $('#whatsapp-link').href = `https://wa.me/${CONFIG.whatsapp}`;
if (CONFIG.email) $('#email-link').href = `mailto:${CONFIG.email}`;

// Navegación
const nav = $('#nav');
const links = $('.nav__links');
const toggle = $('.nav__toggle');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 60);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();
toggle.addEventListener('click', () => {
  const open = links.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open);
});
$$('a', links).forEach(a => a.addEventListener('click', () => {
  links.classList.remove('open');
  toggle.setAttribute('aria-expanded', 'false');
}));

// Cuenta atrás
const target = new Date(CONFIG.fecha).getTime();
const pad = n => String(n).padStart(2, '0');
function tick() {
  const diff = Math.max(0, target - Date.now());
  $('#cd-days').textContent = Math.floor(diff / 86400000);
  $('#cd-hours').textContent = pad(Math.floor(diff / 3600000) % 24);
  $('#cd-mins').textContent = pad(Math.floor(diff / 60000) % 60);
  $('#cd-secs').textContent = pad(Math.floor(diff / 1000) % 60);
}
tick();
setInterval(tick, 1000);

// Animaciones al hacer scroll
const io = new IntersectionObserver(entries => entries.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
}), { threshold: 0.15 });
$$('.reveal').forEach(el => io.observe(el));

// Añadir al calendario (.ics compatible con Google, Apple y Outlook)
$('#add-calendar').addEventListener('click', () => {
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Boda//ES', 'BEGIN:VEVENT',
    'UID:boda-20271030@majaloba',
    'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z',
    'DTSTART:20271030T110000Z',
    'DTEND:20271030T203000Z',
    `SUMMARY:Boda de ${CONFIG.novio1} y ${CONFIG.novio2}`,
    `LOCATION:${CONFIG.lugar.replace(/,/g, '\\,')}`,
    'DESCRIPTION:¡Nos casamos! Ceremonia a las 13:00.',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  a.download = 'boda-30-10-2027.ics';
  a.click();
  URL.revokeObjectURL(a.href);
});

// Copiar IBAN
$('#copy-iban').addEventListener('click', async e => {
  const iban = CONFIG.iban.replace(/\s/g, '');
  try {
    await navigator.clipboard.writeText(iban);
    e.target.textContent = '¡Copiado! ✓';
  } catch {
    // Alternativa para navegadores sin API de portapapeles
    const tmp = Object.assign(document.createElement('textarea'), { value: iban });
    document.body.append(tmp);
    tmp.select();
    const ok = document.execCommand('copy');
    tmp.remove();
    e.target.textContent = ok ? '¡Copiado! ✓' : 'Mantén pulsado el número para copiarlo';
  }
  setTimeout(() => (e.target.textContent = 'Copiar número de cuenta'), 2000);
});

// Alergias: "Ninguna" desmarca el resto y viceversa
const alergiaChecks = $$('input[name="alergia_opcion"]');
const alergiasDropdown = $('#alergias-dropdown');
function actualizarResumenAlergias() {
  const elegidas = alergiaChecks.filter(o => o.checked).map(o => o.value);
  $('#alergias-resumen').textContent = elegidas.join(', ') || 'Selecciona una o varias opciones';
}
alergiaChecks.forEach(cb => cb.addEventListener('change', () => {
  if (cb.checked) {
    alergiaChecks.forEach(o => {
      if (o !== cb && (cb.value === 'Ninguna' || o.value === 'Ninguna')) o.checked = false;
    });
    if (cb.value === 'Ninguna') alergiasDropdown.open = false;
  }
  actualizarResumenAlergias();
}));
// Cierra el desplegable al pulsar fuera
document.addEventListener('click', e => {
  if (alergiasDropdown.open && !alergiasDropdown.contains(e.target)) alergiasDropdown.open = false;
});

// RSVP
$('#rsvp-form').addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target;
  const status = $('#rsvp-status');
  const fd = new FormData(form);
  const data = Object.fromEntries(fd);
  // Las casillas de alergias se envían juntas en una sola columna, p. ej. "Celíaco / sin gluten, Sin lactosa (detalle)"
  const opciones = fd.getAll('alergia_opcion');
  const detalle = (data.alergias_detalle || '').trim();
  delete data.alergia_opcion;
  delete data.alergias_detalle;
  data.alergias = [opciones.join(', ') || (detalle ? 'Otra' : 'Ninguna'), detalle && `(${detalle})`].filter(Boolean).join(' ');

  if (CONFIG.rsvpEndpoint) {
    const button = $('button[type="submit"]', form);
    button.disabled = true;
    status.textContent = 'Enviando...';
    try {
      // Google Apps Script no permite leer la respuesta desde otra web (CORS),
      // así que se envía en modo "no-cors": si la petición sale, la fila se guarda.
      try {
        await fetch(CONFIG.rsvpEndpoint, {
          method: 'POST',
          mode: 'no-cors',
          body: new URLSearchParams(data),
        });
      } catch {
        // Si el navegador bloquea fetch, se envía como un formulario clásico a un iframe oculto
        await postViaIframe(CONFIG.rsvpEndpoint, data);
      }
      form.reset();
      actualizarResumenAlergias();
      status.textContent = '¡Gracias! Hemos recibido tu confirmación 💛';
    } catch {
      status.textContent = 'No se ha podido enviar. Revisa tu conexión e inténtalo de nuevo.';
    } finally {
      button.disabled = false;
    }
    return;
  }

  const text = [
    'Confirmación boda 30/10/2027',
    `Nombre: ${data.nombre}`,
    `Asistencia: ${data.asistencia}`,
    `Acompañantes: ${data.acompanantes}`,
    `Autobús: ${data.autobus}`,
    data.alergias && `Alergias: ${data.alergias}`,
    data.cancion && `Canción: ${data.cancion}`,
    data.mensaje && `Mensaje: ${data.mensaje}`,
  ].filter(Boolean).join('\n');

  if (CONFIG.whatsapp) {
    window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`, '_blank');
  } else if (CONFIG.email) {
    location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent('Confirmación boda')}&body=${encodeURIComponent(text)}`;
  } else {
    status.textContent = 'Falta configurar el WhatsApp o email de los novios en script.js';
    return;
  }
  status.textContent = '¡Gracias! Solo falta que envíes el mensaje 💛';
});

function postViaIframe(url, data) {
  return new Promise((resolve, reject) => {
    const name = 'rsvp-frame-' + Date.now();
    const iframe = Object.assign(document.createElement('iframe'), { name, hidden: true });
    const f = Object.assign(document.createElement('form'), { action: url, method: 'POST', target: name, hidden: true });
    Object.entries(data).forEach(([k, v]) => f.append(Object.assign(document.createElement('input'), { type: 'hidden', name: k, value: v })));
    const timer = setTimeout(() => { cleanup(); reject(new Error('timeout')); }, 15000);
    const cleanup = () => { clearTimeout(timer); setTimeout(() => { iframe.remove(); f.remove(); }, 1000); };
    iframe.addEventListener('load', () => { cleanup(); resolve(); });
    document.body.append(iframe, f);
    f.submit();
  });
}

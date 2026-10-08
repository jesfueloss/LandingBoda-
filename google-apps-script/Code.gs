// Guarda cada confirmación del formulario de la web en la pestaña "Confirmaciones"
// de la hoja "Confirmaciones boda Cristina y Jesús".
// La pestaña "Resumen" se calcula sola con fórmulas dentro de la hoja: no hace falta código.

function hojaConfirmaciones() {
  const ss = SpreadsheetApp.openById('1dTznEkunIY7e4LwJi13i29WhM0e-Gbnsxhj-uUVZDCI');
  return ss.getSheetByName('Confirmaciones') || ss.getSheets()[0];
}

// Al abrir la URL /exec en el navegador debe aparecer este mensaje.
function doGet() {
  const filas = hojaConfirmaciones().getLastRow() - 1;
  return ContentService.createTextOutput('Funciona ✅ Confirmaciones guardadas: ' + filas);
}

function doPost(e) {
  const p = (e && e.parameter) || {};
  if (!p.nombre) return respuesta({ ok: false, error: 'Falta el nombre' });

  const campos = ['nombre', 'asistencia', 'acompanantes', 'autobus', 'alergias', 'cancion', 'mensaje'];
  const fila = [new Date()].concat(campos.map(c => limpiar(p[c])));
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    hojaConfirmaciones().appendRow(fila);
  } finally {
    lock.releaseLock();
  }
  return respuesta({ ok: true });
}

// Evita que un texto que empiece por "=" se ejecute como fórmula en la hoja
function limpiar(valor) {
  const v = String(valor || '').slice(0, 500);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function respuesta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

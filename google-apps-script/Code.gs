// Guarda cada confirmación del formulario de la web en la hoja
// "Confirmaciones boda Cristina y Jesús" (pestaña "Confirmaciones", que debe ser la primera).
// La pestaña "Resumen" se calcula sola con fórmulas dentro de la hoja.
const SHEET_ID = '1dTznEkunIY7e4LwJi13i29WhM0e-Gbnsxhj-uUVZDCI';
const CAMPOS = ['nombre', 'asistencia', 'acompanantes', 'autobus', 'alergias', 'cancion', 'mensaje'];

// Al abrir la URL /exec en el navegador debe aparecer este mensaje.
// Si en su lugar pide iniciar sesión, el acceso no está en "Cualquier usuario".
function doGet() {
  const filas = SpreadsheetApp.openById(SHEET_ID).getSheets()[0].getLastRow() - 1;
  return ContentService.createTextOutput('Funciona ✅ Confirmaciones guardadas: ' + filas);
}

function doPost(e) {
  const p = (e && e.parameter) || {};
  if (!p.nombre) return respuesta({ ok: false, error: 'Falta el nombre' });

  const fila = [new Date()].concat(CAMPOS.map(c => limpiar(p[c])));
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    SpreadsheetApp.openById(SHEET_ID).getSheets()[0].appendRow(fila);
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

// Guarda cada confirmación del formulario de la web en la hoja
// "Confirmaciones boda Cristina y Jesús".
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

// Crea (o rehace) la pestaña "Resumen" con el total de comensales y las alergias.
// Ejecútala una sola vez desde el editor (▶ Ejecutar); las fórmulas se actualizan solas.
function crearResumen() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const datos = ss.getSheets()[0];
  const hoja = "'" + datos.getName().replace(/'/g, "''") + "'!";
  const B = hoja + 'B2:B', C = hoja + 'C2:C', D = hoja + 'D2:D', E = hoja + 'E2:E', F = hoja + 'F2:F';
  const SI = '"¡Sí*"';

  const resumen = ss.getSheetByName('Resumen') || ss.insertSheet('Resumen');
  resumen.clear();

  const alergias = ['Vegetariano', 'Vegano', 'Celíaco', 'Sin lactosa', 'Frutos secos', 'Marisco', 'Otra'];
  const filas = [
    ['RESUMEN DE CONFIRMACIONES', ''],
    ['Respuestas recibidas', `=COUNTA(${B})`],
    ['Invitados que vienen', `=COUNTIF(${C},${SI})`],
    ['Acompañantes', `=SUMIF(${C},${SI},${D})`],
    ['TOTAL COMENSALES', '=B3+B4'],
    ['No pueden venir', `=COUNTIF(${C},"No*")`],
    ['Personas en autobús', `=SUMIFS(${D},${C},${SI},${E},"Sí")+COUNTIFS(${C},${SI},${E},"Sí")`],
    ['', ''],
    ['ALERGIAS (respuestas de los que vienen)', 'Nº'],
    ...alergias.map(a => [a, `=COUNTIFS(${C},${SI},${F},"*${a}*")`]),
    ['Ninguna / sin indicar', `=COUNTIFS(${C},${SI},${F},"Ninguna")+COUNTIFS(${C},${SI},${F},"")`],
  ];
  resumen.getRange(1, 1, filas.length, 2).setValues(filas);

  resumen.getRange('D1').setValue('QUIÉN TIENE ALERGIAS');
  resumen.getRange('D2').setFormula(
    `=IFERROR(FILTER({${B},${F}},LEFT(${C},3)="¡Sí",${F}<>"",${F}<>"Ninguna"),"Nadie por ahora")`
  );

  resumen.getRangeList(['A1', 'A9:B9', 'D1']).setFontWeight('bold').setFontColor('#8c3b2a');
  resumen.getRange('A5:B5').setFontWeight('bold').setFontSize(13).setBackground('#f3e7da');
  resumen.setColumnWidth(1, 300);
  resumen.setColumnWidths(4, 2, 220);
  ss.setActiveSheet(resumen);
}

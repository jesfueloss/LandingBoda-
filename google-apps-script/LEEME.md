# Guardar las confirmaciones en Google Sheets

Las respuestas del formulario se guardan en la hoja
[Confirmaciones boda Cristina y Jesús](https://docs.google.com/spreadsheets/d/1dTznEkunIY7e4LwJi13i29WhM0e-Gbnsxhj-uUVZDCI/edit).

## Activarlo (una sola vez, mejor desde el ordenador)

1. Abre la hoja y ve a **Extensiones → Apps Script**.
2. Borra lo que haya en `Código.gs` y pega el contenido de [`Code.gs`](Code.gs). Pulsa 💾 Guardar.
3. Arriba a la derecha: **Implementar → Nueva implementación**.
4. En el engranaje ⚙️ elige **Aplicación web** y rellena:
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario**
5. Pulsa **Implementar** y **Autorizar acceso** con tu cuenta de Google.
   Si sale «Google no ha verificado esta aplicación», pulsa *Configuración avanzada →
   Ir a … (no seguro)*: es tu propio código y solo escribe en tu hoja.
6. Copia la **URL de la aplicación web** (termina en `/exec`) y pégala en `script.js`,
   en `rsvpEndpoint: '...'`.

Cada confirmación aparecerá como una fila nueva con la fecha, el nombre, la asistencia,
los acompañantes, el autobús, las alergias, la canción y el mensaje.

Si más adelante cambias `Code.gs`, usa **Implementar → Gestionar implementaciones →
✏️ Editar → Versión: Nueva versión** para que la URL siga siendo la misma.

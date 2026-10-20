// Registro de eventos del tablero: los 50 últimos, el más reciente arriba. Con ?diag=1 se ve en la
// columna derecha; el botón o un clic sobre él lo abre a pantalla completa, y otro clic lo cierra.
const MAXIMO = 50;

/** Devuelve la función log(texto). */
export function crearRegistro({ corto, completo, ventana, boton }) {
  const lineas = [];
  for (const el of [corto, boton]) el.addEventListener('click', () => ventana.classList.remove('oculto'));
  ventana.addEventListener('click', () => ventana.classList.add('oculto'));

  return function log(texto) {
    lineas.unshift(new Date().toLocaleTimeString() + '  ' + texto);
    if (lineas.length > MAXIMO) lineas.length = MAXIMO;
    for (const el of [corto, completo]) {
      el.textContent = '';
      for (const t of lineas) {
        const p = document.createElement('p');
        p.textContent = t;
        el.appendChild(p);
      }
    }
  };
}

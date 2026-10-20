// Datos guardados en el navegador (localStorage para lo que dura, sessionStorage para lo de esta pestaña).
// Todas las claves llevan el prefijo "mazmorra.": los juegos de la familia comparten el mismo origen
// (jmorecru.github.io). Todo va en try/catch: el navegador puede bloquear el almacenamiento.

const PREFIJO = 'mazmorra.';

export function leer(clave) {
  try { return localStorage.getItem(PREFIJO + clave); } catch (e) { return null; }
}
export function guardar(clave, valor) {
  try { localStorage.setItem(PREFIJO + clave, valor); } catch (e) { /* sin almacenamiento */ }
}
export function leerSesion(clave) {
  try { return sessionStorage.getItem(PREFIJO + clave); } catch (e) { return null; }
}
export function guardarSesion(clave, valor) {
  try { sessionStorage.setItem(PREFIJO + clave, valor); } catch (e) { /* sin almacenamiento */ }
}

// La prueba de humo guardaba estas claves sin prefijo. Se pasan una vez al nombre nuevo, para que el
// tablero conserve su código de sala y cada mando su nombre e identidad (su ficha y su color).
const CLAVES_ANTIGUAS = ['sala', 'nombre', 'jugadorId', 'ultimaSala'];
export function migrarClavesAntiguas() {
  for (const clave of CLAVES_ANTIGUAS) {
    try {
      const valor = localStorage.getItem(clave);
      if (valor === null) continue;
      if (localStorage.getItem(PREFIJO + clave) === null) localStorage.setItem(PREFIJO + clave, valor);
      localStorage.removeItem(clave);
    } catch (e) { /* sin almacenamiento */ }
  }
}

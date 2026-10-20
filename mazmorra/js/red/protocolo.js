// Protocolo entre el tablero y los mandos. La tabla de mensajes está en BRIEF_mazmorra.md.
// Los mandos solo envían intenciones; el tablero valida, resuelve y difunde el resultado.

/** Identificador de la sala en PeerJS: la sala ABCD es el peer "mazmorra-familia-ABCD". */
export const PREFIJO_PEER = 'mazmorra-familia-';

export const PING_MS = 2000;               // el mando envía un ping cada 2 s
export const SIN_RESPUESTA_MS = 8000;      // el mando da la conexión por perdida si el tablero no contesta en 8 s
export const SIN_NOTICIAS_MS = 30000;      // el tablero da por desconectado un mando que no envía nada en 30 s
export const REINTENTO_MS = 2500;          // espera del mando antes de volver a conectar
export const CONEXION_DIRECTA_MS = 10000;  // aviso si la conexión directa no se completa
export const REPETIR_HOLA_MS = 4000;       // el mando repite el saludo si no llega la bienvenida

const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';   // sin I ni O, que se confunden con 1 y 0
export function nuevoCodigo() {
  let c = '';
  for (let i = 0; i < 4; i++) c += LETRAS[Math.floor(Math.random() * LETRAS.length)];
  return c;
}
export function esCodigo(texto) {
  return /^[A-Z]{4}$/.test(texto);
}

/** Lo que llega en un saludo, recortado: no se confía en el contenido de un mensaje. */
export function leerHola(msg) {
  return { id: String(msg.id || '').slice(0, 64), nombre: String(msg.nombre || 'Jugador').slice(0, 16) };
}

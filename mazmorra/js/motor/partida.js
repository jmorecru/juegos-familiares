// Estado de la partida y reglas. Sin pantalla ni red: lo usa el tablero y, más adelante, la IA del
// Señor Oscuro, que enviará sus intenciones por aplicar() igual que un mando.
// Se prueba solo con pruebas/motor.html.

export const MAX_JUGADORES = 5;
export const COLORES = ['#D7263D', '#1B6CA8', '#E0A000', '#2E8B57', '#7B3FA0'];

/**
 * mapa: { nombre, filas: ['....', '.##.', …], salidas: [[x, y], …] }. En las filas, '#' es muro y '.' suelo.
 * Devuelve el estado de una partida nueva, sin jugadores.
 */
export function crearPartida(mapa) {
  const filas = mapa.filas;
  if (!filas.length || filas.some(f => f.length !== filas[0].length)) throw new Error('El mapa no es rectangular');
  return {
    mapa: { nombre: mapa.nombre, filas, ancho: filas[0].length, alto: filas.length, salidas: mapa.salidas },
    jugadores: new Map(),   // id -> { id, nombre, color, x, y }
  };
}

export function dentro(partida, x, y) {
  return x >= 0 && y >= 0 && x < partida.mapa.ancho && y < partida.mapa.alto;
}
export function esMuro(partida, x, y) {
  return partida.mapa.filas[y][x] === '#';
}
export function ocupada(partida, x, y, salvo) {
  for (const j of partida.jugadores.values()) if (j.id !== salvo && j.x === x && j.y === y) return true;
  return false;
}

/**
 * Un jugador entra o vuelve (mismo id: conserva ficha, color y posición).
 * Devuelve { jugador, nuevo } o { rechazo } con el motivo para mostrar en el mando.
 */
export function unir(partida, id, nombre) {
  let j = partida.jugadores.get(id);
  if (j) {
    j.nombre = nombre;
    return { jugador: j, nuevo: false };
  }
  if (partida.jugadores.size >= MAX_JUGADORES) return { rechazo: 'La sala está llena.' };
  const usados = new Set([...partida.jugadores.values()].map(p => p.color));
  const color = COLORES.find(c => !usados.has(c));
  const salida = partida.mapa.salidas.find(([x, y]) => !ocupada(partida, x, y)) || [0, 0];
  j = { id, nombre, color, x: salida[0], y: salida[1] };
  partida.jugadores.set(id, j);
  return { jugador: j, nuevo: true };
}

/**
 * Aplica una intención de un jugador. Devuelve { ok: true } si la partida cambia, o { ok: false, motivo }.
 * Intenciones: { tipo: 'mover', dx, dy } (un paso, un solo eje; si llegan los dos, cuenta el horizontal).
 */
export function aplicar(partida, id, intencion) {
  const j = partida.jugadores.get(id);
  if (!j) return { ok: false, motivo: 'jugador desconocido' };
  if (intencion.tipo === 'mover') {
    let dx = Math.sign(intencion.dx | 0), dy = Math.sign(intencion.dy | 0);
    if (dx && dy) dy = 0;
    if (!dx && !dy) return { ok: false, motivo: 'sin movimiento' };
    const nx = j.x + dx, ny = j.y + dy;
    if (!dentro(partida, nx, ny) || esMuro(partida, nx, ny) || ocupada(partida, nx, ny, id)) {
      return { ok: false, motivo: 'bloqueado' };
    }
    j.x = nx;
    j.y = ny;
    return { ok: true };
  }
  return { ok: false, motivo: 'intención desconocida' };
}

/** Lo que ve cada jugador en su mando: de momento, solo su posición y cuántos hay en la sala. */
export function vistaPara(partida, id) {
  const j = partida.jugadores.get(id);
  return j ? { x: j.x, y: j.y, total: partida.jugadores.size } : null;
}

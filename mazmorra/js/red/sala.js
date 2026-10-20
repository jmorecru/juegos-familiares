// Lado del tablero: abre la sala en PeerJS y lleva las conexiones de los mandos.
// No sabe nada de reglas: avisa con callbacks y envía lo que le piden. Usa el Peer global de PeerJS.
import { PREFIJO_PEER, SIN_NOTICIAS_MS, nuevoCodigo, leerHola } from './protocolo.js';
import { tipoConexion } from './ice.js';

/**
 * Callbacks:
 *   alAbrir(codigo)      la sala está lista con ese código
 *   alHola(id, nombre)   un mando quiere entrar: devuelve el motivo de rechazo, o null si puede
 *   alEntrar(id)         ha entrado (nuevo o de vuelta) y su conexión es la actual
 *   alMensaje(id, msg)   mensaje de juego de la conexión actual de ese jugador
 *   alCambio()           ha cambiado el estado de alguna conexión (para repintar)
 *   log(texto)           registro de eventos
 */
export class Sala {
  constructor(callbacks) {
    this.cb = callbacks;
    this.peer = null;
    this.codigo = null;
    this.conexiones = new Map();   // jugadorId -> { conn, nombre, via }
    setInterval(() => this.cerrarCalladas(), 5000);
  }

  conectado(id) {
    const c = this.conexiones.get(id);
    return !!(c && c.conn.open);
  }
  via(id) {
    const c = this.conexiones.get(id);
    return c ? c.via : null;
  }
  enviar(id, msg) {
    const c = this.conexiones.get(id);
    if (c && c.conn.open) c.conn.send(msg);
  }

  abrir(codigo, intentos = 0) {
    const peer = new Peer(PREFIJO_PEER + codigo, { debug: 1 });
    this.peer = peer;
    peer.on('open', () => {
      this.codigo = codigo;
      this.cb.log('Sala ' + codigo + ' abierta');
      this.cb.alAbrir(codigo);
    });
    peer.on('connection', conn => this.nuevaConexion(conn));
    peer.on('disconnected', () => {
      this.cb.log('Sin servidor de emparejamiento, reintentando');
      setTimeout(() => { if (!peer.destroyed) peer.reconnect(); }, 2000);
    });
    peer.on('error', err => {
      this.cb.log('Error: ' + err.type);
      if (err.type === 'unavailable-id') {
        // Tras recargar, el servidor puede tardar unos segundos en liberar el código anterior.
        peer.destroy();
        if (intentos < 4) setTimeout(() => this.abrir(codigo, intentos + 1), 3000);
        else this.abrir(nuevoCodigo());
      } else if (peer.destroyed) {
        setTimeout(() => this.abrir(codigo), 3000);
      }
    });
  }

  nuevaConexion(conn) {
    conn.ultimoMensaje = performance.now();
    // Diagnóstico: cada cambio de estado de la conexión directa queda en el registro.
    const pc = conn.peerConnection;
    if (pc) pc.addEventListener('iceconnectionstatechange', () => {
      const c = this.conexiones.get(conn.jugadorId);
      this.cb.log('ICE ' + (c ? c.nombre : 'nuevo') + ': ' + pc.iceConnectionState);
    });
    // this.recibir se busca en cada mensaje (no se fija aquí) para que las pruebas puedan sustituirlo.
    conn.on('data', msg => this.recibir(conn, msg));
    conn.on('close', () => this.perdida(conn));
    conn.on('error', () => this.perdida(conn));
  }

  recibir(conn, msg) {
    if (!msg || typeof msg !== 'object') return;
    conn.ultimoMensaje = performance.now();
    if (msg.tipo === 'ping') { conn.send({ tipo: 'pong', t: msg.t }); return; }
    if (msg.tipo === 'hola') { this.hola(conn, msg); return; }
    const c = this.conexiones.get(conn.jugadorId);
    if (!c || c.conn !== conn) return;   // solo manda la conexión actual del jugador
    this.cb.alMensaje(conn.jugadorId, msg);
  }

  hola(conn, msg) {
    const { id, nombre } = leerHola(msg);
    const motivo = this.cb.alHola(id, nombre);
    if (motivo) { conn.send({ tipo: 'rechazado', motivo }); return; }

    const anterior = this.conexiones.get(id);
    const vieja = anterior && anterior.conn !== conn ? anterior.conn : null;
    const actual = { conn, nombre, via: null };
    conn.jugadorId = id;
    this.conexiones.set(id, actual);   // antes de cerrar la vieja: su 'close' ya no cuenta como corte

    if (vieja && vieja.open) {
      // Misma identidad con la conexión anterior aparentemente abierta. Puede ser otra pestaña u otro
      // dispositivo, o la misma tablet que vuelve de suspenderse y dejó la anterior muerta sin cerrar.
      // Se avisa a la anterior para que, si sigue viva, deje de reconectar (si no, se quitarían el sitio sin parar).
      try { vieja.send({ tipo: 'sustituido' }); } catch (e) { /* ya cerrada */ }
      setTimeout(() => { try { vieja.close(); } catch (e) { /* ya cerrada */ } }, 500);
      this.cb.log(nombre + ': se cierra su conexión anterior, que seguía abierta');
    } else if (vieja) {
      try { vieja.close(); } catch (e) { /* ya cerrada */ }
    }

    setTimeout(() => tipoConexion(conn.peerConnection).then(t => {
      if (this.conexiones.get(id) !== actual) return;
      actual.via = t;
      this.cb.log(nombre + ': conexión ' + t);
      this.cb.alCambio();
    }), 1500);
    this.cb.alEntrar(id);
  }

  // Un mando que se suspende (por ejemplo, una Fire HD) puede dejar la conexión muerta sin cerrarla.
  // Los mandos envían un ping cada 2 s; si una conexión pasa 30 s sin dar señales, se cierra y la ficha
  // queda como desconectada. 30 s para que un bloqueo corto del móvil no cuente como corte.
  cerrarCalladas() {
    for (const c of this.conexiones.values()) {
      if (c.conn.open && performance.now() - (c.conn.ultimoMensaje || 0) > SIN_NOTICIAS_MS) {
        this.cb.log(c.nombre + ': 30 s sin noticias, se da por desconectado');
        try { c.conn.close(); } catch (e) { /* ya cerrada */ }   // PeerJS emite 'close' en el acto: perdida() lo registra
        this.cb.alCambio();
      }
    }
  }

  perdida(conn) {
    const c = this.conexiones.get(conn.jugadorId);
    if (!c || c.conn !== conn) return;
    const ice = conn.peerConnection ? conn.peerConnection.iceConnectionState : 'sin datos';
    this.cb.log(c.nombre + ' se ha desconectado (ICE ' + ice + ')');
    this.cb.alCambio();
  }
}

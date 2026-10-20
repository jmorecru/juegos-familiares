// Lado del mando: conecta con la sala y mantiene viva la conexión. Usa el Peer global de PeerJS.
// Cada medida responde a un fallo visto en casa durante la Fase 0 (detalle en BRIEF_mazmorra.md).
import {
  PREFIJO_PEER, PING_MS, SIN_RESPUESTA_MS, REINTENTO_MS, CONEXION_DIRECTA_MS, REPETIR_HOLA_MS,
} from './protocolo.js';
import { tipoConexion } from './ice.js';

/**
 * Callbacks:
 *   alEstado(texto)   frase para el jugador: conectando, sala no encontrada, reconectando…
 *   alMensaje(msg)    mensajes del tablero (bienvenida, estado, bloqueado, rechazado, sustituido)
 *   alCambio()        han cambiado los datos de diagnóstico (latencia, conexión, cortes)
 */
export class Cliente {
  constructor(jugadorId, callbacks) {
    this.jugadorId = jugadorId;
    this.cb = callbacks;
    this.peer = null;
    this.conn = null;
    this.sala = '';
    this.nombre = '';
    this.reintento = null;
    this.vigilante = null;
    this.rechazado = false;    // sala llena
    this.sustituido = false;   // este jugador se ha abierto en otra pestaña o dispositivo: deja de reconectar
    // Diagnóstico
    this.latencia = null;
    this.via = null;
    this.cortes = 0;
    this.ultimoCorte = '';
    this.ultimoPong = 0;
    this.ultimoTic = performance.now();
    setInterval(() => this.latido(), PING_MS);
    document.addEventListener('visibilitychange', () => this.alVolver());
  }

  get conectado() { return !!(this.conn && this.conn.open); }

  entrar(sala, nombre) {
    this.sala = sala;
    this.nombre = nombre;
    this.conectar();
  }

  enviar(msg) {
    if (this.conectado) this.conn.send(msg);
  }

  conectar() {
    clearTimeout(this.reintento);
    if (this.rechazado || this.sustituido) return;
    this.cb.alEstado('Conectando con la sala ' + this.sala + '…');
    if (!this.peer || this.peer.destroyed) {
      const peer = new Peer({ debug: 1 });
      this.peer = peer;
      // 'open' se repite cada vez que vuelve el servidor de emparejamiento: no tocar una conexión que funciona.
      peer.on('open', () => { if (!this.conectado) this.abrirConexion(); });
      peer.on('disconnected', () => { setTimeout(() => { if (!peer.destroyed) peer.reconnect(); }, 1500); });
      peer.on('error', err => {
        // Los errores del servidor de emparejamiento no afectan a una conexión ya abierta con el tablero.
        if (this.conectado) return;
        if (err.type === 'peer-unavailable') this.cb.alEstado('No encuentro la sala ' + this.sala + '. Comprueba el código en el tablero.');
        else this.cb.alEstado('Problema de conexión (' + err.type + '). Reintentando…');
        this.programarReintento();
      });
    } else if (this.peer.open) {
      this.abrirConexion();
    }
  }

  abrirConexion() {
    // Se suelta antes de cerrarla: PeerJS emite 'close' en el acto y, si siguiera siendo la actual,
    // contaría como corte y programaría otro reintento que volvería a cerrar la nueva (bucle de cortes).
    const vieja = this.conn;
    this.conn = null;
    if (vieja) { try { vieja.close(); } catch (e) { /* ya cerrada */ } }

    const esta = this.peer.connect(PREFIJO_PEER + this.sala, { reliable: true });
    this.conn = esta;
    // PeerJS borra peerConnection al cerrar: se guarda el último estado ICE para el diagnóstico.
    esta.ultimoIce = 'nuevo';
    const pc = esta.peerConnection;
    if (pc) pc.addEventListener('iceconnectionstatechange', () => { esta.ultimoIce = pc.iceConnectionState; });

    clearTimeout(this.vigilante);
    this.vigilante = setTimeout(() => {
      if (esta.open) return;
      this.cb.alEstado('La conexión directa no se completa. Comprueba que el móvil y el tablero están en la misma wifi (las redes de invitados suelen bloquearlo).');
      // La oferta no ha tenido respuesta. Puede que la conexión con el servidor de emparejamiento esté muerta
      // aunque parezca abierta (visto en Safari tras bloquear el iPhone): reintentar con el mismo Peer no
      // arreglaba nada y solo lo hacía una recarga. Se empieza con un Peer nuevo, como al recargar.
      this.renovarPeer();
      this.programarReintento();
    }, CONEXION_DIRECTA_MS);

    esta.on('open', () => {
      clearTimeout(this.vigilante);
      this.ultimoPong = performance.now();   // el plazo de "sin respuesta" cuenta desde que se abre
      esta.send({ tipo: 'hola', id: this.jugadorId, nombre: this.nombre });
      esta.holaEnviado = performance.now();
      setTimeout(() => tipoConexion(esta.peerConnection).then(t => {
        if (esta !== this.conn) return;
        this.via = t;
        this.cb.alCambio();
      }), 1500);
    });
    // Solo cuenta lo que llega por la conexión actual, no por una anterior que aún no se haya cerrado del todo.
    esta.on('data', msg => { if (esta === this.conn) this.recibir(msg); });
    esta.on('close', () => { if (esta === this.conn) this.perdida('cerrada, ICE ' + estadoIce(esta)); });
    esta.on('error', err => { if (esta === this.conn) this.perdida('error ' + (err && err.type) + ', ICE ' + estadoIce(esta)); });
  }

  recibir(msg) {
    if (!msg || typeof msg !== 'object') return;
    if (msg.tipo === 'pong') {
      this.latencia = Math.round(performance.now() - msg.t);
      this.ultimoPong = performance.now();
      this.cb.alCambio();
      return;
    }
    if (msg.tipo === 'bienvenida' && this.conn) this.conn.bienvenida = true;
    if (msg.tipo === 'rechazado') this.rechazado = true;
    if (msg.tipo === 'sustituido') { this.sustituido = true; clearTimeout(this.reintento); }
    this.cb.alMensaje(msg);
  }

  perdida(motivo) {
    if (this.rechazado || this.sustituido) return;
    this.cortes++;
    this.ultimoCorte = motivo;
    this.via = null;
    this.cb.alEstado('Se ha perdido la conexión. Reconectando…');
    this.cb.alCambio();
    this.programarReintento();
  }

  renovarPeer() {
    const peer = this.peer;
    this.peer = null;
    this.conn = null;   // se suelta antes: al destruir el Peer, su 'close' no debe contar como corte
    try { if (peer) peer.destroy(); } catch (e) { /* ya destruido */ }
  }

  programarReintento() {
    clearTimeout(this.reintento);
    this.reintento = setTimeout(() => { if (!this.conectado) this.conectar(); }, REINTENTO_MS);
  }

  // Cada 2 s: ping al tablero, y comprobaciones de que la conexión sigue viva de verdad.
  latido() {
    // Si este temporizador ha estado parado (página congelada al bloquear, aunque Safari no avise con
    // visibilitychange), el último pong es de antes de congelarse: se da margen en vez de culpar al tablero.
    const ahora = performance.now();
    if (ahora - this.ultimoTic > 2 * PING_MS) this.ultimoPong = ahora;
    this.ultimoTic = ahora;
    if (!this.conectado) return;
    // Si el tablero deja de contestar (por ejemplo, porque la tele se ha suspendido), la conexión puede seguir
    // pareciendo abierta sin funcionar: se da por perdida y se reconecta. Solo con la página visible.
    if (document.visibilityState === 'visible' && ahora - this.ultimoPong > SIN_RESPUESTA_MS) {
      const muerta = this.conn;
      this.conn = null;
      try { muerta.close(); } catch (e) { /* ya cerrada */ }
      this.perdida('sin respuesta del tablero');
      return;
    }
    // Si el saludo se perdió, el tablero contesta los pings pero no reconoce al jugador: se repite.
    if (!this.conn.bienvenida && this.conn.holaEnviado && ahora - this.conn.holaEnviado > REPETIR_HOLA_MS) {
      this.enviar({ tipo: 'hola', id: this.jugadorId, nombre: this.nombre });
      this.conn.holaEnviado = ahora;
    }
    this.enviar({ tipo: 'ping', t: ahora });
  }

  // Al volver de bloquear el móvil: margen para el plazo sin respuesta, y reconectar si hace falta.
  alVolver() {
    if (document.visibilityState !== 'visible') return;
    this.ultimoPong = performance.now();
    if (this.sala && !this.rechazado && !this.conectado) this.conectar();
  }
}

function estadoIce(c) {
  return c.peerConnection ? c.peerConnection.iceConnectionState : (c.ultimoIce || 'sin datos');
}

// Mando (mando.html): entrada en la sala, cruceta y lo que el tablero le cuenta a este jugador.
// Con ?diag=1 muestra además latencia, tipo de conexión, cortes y estado de la pantalla.
import { leer, guardar, leerSesion, guardarSesion, migrarClavesAntiguas } from '../comun/almacen.js';
import { PantallaEncendida } from '../comun/pantalla.js';
import '../comun/diagnostico.js';
import { esCodigo } from '../red/protocolo.js';
import { Cliente } from '../red/cliente.js';

const $ = id => document.getElementById(id);
function estado(texto) { $('estado').textContent = texto; }

migrarClavesAntiguas();
const jugadorId = leer('jugadorId') || (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2));
guardar('jugadorId', jugadorId);

let pos = null;   // última vista que ha enviado el tablero
const pantalla = new PantallaEncendida(() => { pintarAvisoPantalla(); pintarDatos(); });
const cliente = new Cliente(jugadorId, { alEstado: estado, alMensaje: recibir, alCambio: pintarDatos });
window.__mando = { cliente, pantalla };   // para las pruebas de red (pruebas/red.html)
pantalla.vigilar(() => !!cliente.sala);

/* ---------- entrada ---------- */

const params = new URLSearchParams(location.search);
$('codigo').value = (params.get('sala') || leer('ultimaSala') || '').toUpperCase();
$('nombre').value = leer('nombre') || '';

$('entrada').addEventListener('submit', e => {
  e.preventDefault();
  const nombre = $('nombre').value.trim();
  const sala = $('codigo').value.trim().toUpperCase();
  if (!nombre) { estado('Escribe tu nombre para entrar.'); return; }
  if (!esCodigo(sala)) { estado('El código de sala tiene 4 letras. Lo ves en el tablero.'); return; }
  guardar('nombre', nombre);
  guardar('ultimaSala', sala);
  pantalla.pedir();   // dentro del gesto de pulsar «Entrar»: Safari lo exige
  cliente.entrar(sala, nombre);
});

// Al recargar esta misma pestaña (por ejemplo, con el aviso de versión nueva) vuelve a entrar solo.
// Va en sessionStorage, que es de la pestaña: al abrir el QR en otra pestaña se sigue pidiendo el nombre.
if (leerSesion('salaActiva') && $('nombre').value) {
  $('codigo').value = leerSesion('salaActiva');
  const form = $('entrada');
  if (form.requestSubmit) form.requestSubmit();
  else form.dispatchEvent(new Event('submit', { cancelable: true }));
}

/* ---------- mensajes del tablero ---------- */

function recibir(msg) {
  switch (msg.tipo) {
    case 'bienvenida':
      document.documentElement.style.setProperty('--mio', msg.color);
      $('ficha').textContent = msg.nombre.charAt(0).toUpperCase();
      $('entrada').classList.add('oculto');
      $('cruceta').classList.remove('oculto');
      $('datos').classList.remove('oculto');
      estado('Conectado como ' + msg.nombre + '.');
      guardarSesion('salaActiva', cliente.sala);
      pantalla.pedir();
      pintarAvisoPantalla();
      break;
    case 'estado':
      pos = msg;
      pintarDatos();
      break;
    case 'bloqueado': {
      if (navigator.vibrate) navigator.vibrate(60);
      const cruceta = $('cruceta');
      cruceta.classList.add('choque');
      setTimeout(() => cruceta.classList.remove('choque'), 180);
      break;
    }
    case 'rechazado':
      estado(msg.motivo || 'No se puede entrar en la sala.');
      break;
    case 'sustituido':
      $('cruceta').classList.add('oculto');
      pintarAvisoPantalla();
      estado('Este jugador se ha abierto en otra pestaña o en otro móvil. Para usarlo aquí, recarga esta página.');
      break;
  }
}

/* ---------- pantalla ---------- */

// Mientras se juega sin la pantalla asegurada, aviso grande para que alguien toque una vez.
function pintarAvisoPantalla() {
  const jugando = !$('cruceta').classList.contains('oculto');
  $('avisoPantalla').classList.toggle('oculto', !(jugando && pantalla.disponible && !pantalla.activa));
}

function pintarDatos() {
  const partes = [];
  if (pos) partes.push('Casilla ' + (pos.x + 1) + ', ' + (pos.y + 1));
  if (cliente.latencia !== null) partes.push('Latencia ' + cliente.latencia + ' ms');
  if (pos) partes.push(pos.total + ' en la sala');
  const lineas = [partes.join('   ')];
  const callado = cliente.ultimoPong ? Math.round((performance.now() - cliente.ultimoPong) / 1000) : 0;
  if (callado >= 5) lineas.push('Sin respuesta del tablero desde hace ' + callado + ' s');
  lineas.push('Conexión: ' + (cliente.via || '…'));
  lineas.push('Cortes: ' + cliente.cortes + (cliente.ultimoCorte ? ' (último: ' + cliente.ultimoCorte + ')' : ''));
  lineas.push('Pantalla siempre encendida: ' + pantalla.estado);
  $('datos').textContent = lineas.join('\n');
}
setInterval(pintarDatos, 1000);

/* ---------- controles ---------- */

for (const boton of document.querySelectorAll('#cruceta button')) {
  boton.addEventListener('pointerdown', e => {
    e.preventDefault();
    pantalla.pedir();
    cliente.enviar({ tipo: 'mover', dx: +boton.dataset.dx, dy: +boton.dataset.dy });
  });
}
const TECLAS = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
document.addEventListener('keydown', e => {
  const d = TECLAS[e.key];
  if (d && document.activeElement.tagName !== 'INPUT') {
    e.preventDefault();
    cliente.enviar({ tipo: 'mover', dx: d[0], dy: d[1] });
  }
});

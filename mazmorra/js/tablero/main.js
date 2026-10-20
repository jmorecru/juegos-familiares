// Tablero (host.html): une la sala (red), la partida (motor) y el dibujo. Es la única fuente de verdad:
// recibe las intenciones de los mandos, las valida con el motor y envía a cada uno solo lo suyo.
// Usa los globales QRCode (qrcodejs) y VERSION (version.js).
import { DIAG } from '../comun/diagnostico.js';
import { leer, guardar, migrarClavesAntiguas } from '../comun/almacen.js';
import { PantallaEncendida } from '../comun/pantalla.js';
import { nuevoCodigo } from '../red/protocolo.js';
import { Sala } from '../red/sala.js';
import { crearPartida, unir, aplicar, vistaPara } from '../motor/partida.js';
import { Dibujo } from './dibujo.js';
import { crearRegistro } from './registro.js';

const $ = id => document.getElementById(id);
const MAPA = 'datos/mapas/prueba.json';

migrarClavesAntiguas();
const log = crearRegistro({ corto: $('log'), completo: $('logCompleto'), ventana: $('registro'), boton: $('verRegistro') });
const pantalla = new PantallaEncendida(pintarPantalla);
let partida, dibujo, sala;

cargarMapa(MAPA).then(arrancar).catch(e => {
  log('No se ha podido cargar el mapa: ' + e.message);
  $('ayudaQr').textContent = 'No se ha podido cargar el mapa. Recarga la página.';
});

async function cargarMapa(ruta) {
  // Con el número de versión en la dirección, para no usar un mapa guardado de otra versión.
  const v = typeof VERSION !== 'undefined' ? VERSION.numero : Date.now();
  const respuesta = await fetch(ruta + '?v=' + v);
  if (!respuesta.ok) throw new Error('HTTP ' + respuesta.status);
  return respuesta.json();
}

function arrancar(mapa) {
  partida = crearPartida(mapa);
  dibujo = new Dibujo($('zona'), $('tablero'), partida, texto => { $('medidas').textContent = texto; });
  sala = new Sala({ alAbrir, alHola, alEntrar, alMensaje, alCambio: refrescar, log });
  window.__tablero = { sala, partida, dibujo, log };   // para las pruebas de red (pruebas/red.html)
  pintarPantalla();
  pantalla.pedir();
  pantalla.vigilar();
  sala.abrir(leer('sala') || nuevoCodigo());
}

/* ---------- red → partida ---------- */

function alAbrir(codigo) {
  guardar('sala', codigo);
  $('codigo').textContent = codigo;
  const url = new URL('mando.html?sala=' + codigo, location.href).href;
  const qr = $('qr');
  qr.innerHTML = '';
  new QRCode(qr, { text: url, width: 180, height: 180, colorDark: '#1C2140', colorLight: '#F2E9D8', correctLevel: QRCode.CorrectLevel.M });
  $('url').textContent = url;
}

function alHola(id, nombre) {
  const r = unir(partida, id, nombre);
  if (r.rechazo) return r.rechazo;
  log(nombre + (r.nuevo ? ' se une' : ' ha vuelto'));
  return null;
}

function alEntrar(id) {
  const j = partida.jugadores.get(id);
  sala.enviar(id, { tipo: 'bienvenida', color: j.color, nombre: j.nombre });
  enviarEstado();
  refrescar();
}

function alMensaje(id, msg) {
  if (msg.tipo !== 'mover') return;
  const r = aplicar(partida, id, { tipo: 'mover', dx: msg.dx, dy: msg.dy });
  if (r.ok) { refrescar(); enviarEstado(); }
  else if (r.motivo === 'bloqueado') sala.enviar(id, { tipo: 'bloqueado' });
}

// Cada mando recibe solo su propia información (principio de información privada).
function enviarEstado() {
  for (const id of partida.jugadores.keys()) sala.enviar(id, { tipo: 'estado', ...vistaPara(partida, id) });
}

/* ---------- pantalla ---------- */

function refrescar() {
  for (const j of partida.jugadores.values()) dibujo.pintarFicha(j, sala.conectado(j.id));
  pintarLista();
}

function pintarLista() {
  const ul = $('lista');
  ul.innerHTML = '';
  for (const j of partida.jugadores.values()) {
    const li = document.createElement('li');
    li.innerHTML = '<span class="punto"></span><span class="nom"></span><span class="est"></span>';
    li.querySelector('.punto').style.background = j.color;
    li.querySelector('.nom').textContent = j.nombre;
    const conectado = sala.conectado(j.id);
    li.querySelector('.est').textContent = !conectado ? 'desconectado' : DIAG ? (sala.via(j.id) || 'conectado') : '';
    ul.appendChild(li);
  }
}

// Fuera del modo diagnóstico solo se ve si hay un problema (para saber que hay que tocar la pantalla).
function pintarPantalla() {
  const textos = { 'sí': 'sí.', 'comprobando': 'comprobando…', 'desactivada': 'desactivada.' };
  const texto = textos[pantalla.estado] ||
    (pantalla.estado.startsWith('no (') ? 'toca la pantalla para activarla.' : pantalla.estado + '.');
  $('pantalla').textContent = 'Pantalla siempre encendida: ' + texto;
  $('pantalla').classList.toggle('solo-diag', pantalla.estado === 'sí');
}

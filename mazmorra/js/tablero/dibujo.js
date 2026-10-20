// Dibujo del tablero: casillas y fichas. Se colocan en píxeles calculados aquí y se recolocan cuando cambia
// el espacio disponible. Dos fallos vistos en el Fire Stick lo explican: calc(var()) en transform no se
// recalculaba bien, y un padding en % se mide sobre el ancho del tablero, no sobre el de la ficha.
import { esMuro } from '../motor/partida.js';

export class Dibujo {
  /** alMedir(texto): medidas de pantalla y casilla, para el diagnóstico. */
  constructor(zona, tablero, partida, alMedir = () => {}) {
    this.zona = zona;
    this.tablero = tablero;
    this.alMedir = alMedir;
    this.ancho = partida.mapa.ancho;
    this.alto = partida.mapa.alto;
    this.celda = 0;
    this.casillas = [];        // { el, x, y }
    this.fichas = new Map();   // jugadorId -> { el, x, y }
    for (let y = 0; y < this.alto; y++) for (let x = 0; x < this.ancho; x++) {
      const el = document.createElement('div');
      el.className = 'casilla ' + (esMuro(partida, x, y) ? 'muro' : 'losa');
      tablero.appendChild(el);
      this.casillas.push({ el, x, y });
    }
    this.ajustar();
    window.addEventListener('resize', () => this.ajustar());
    // También cuando cambia el espacio sin que cambie la ventana (por ejemplo, al aparecer el QR).
    if (window.ResizeObserver) new ResizeObserver(() => this.ajustar()).observe(zona);
  }

  colocar(el, x, y) {
    el.style.width = el.style.height = this.celda + 'px';
    el.style.transform = 'translate(' + x * this.celda + 'px, ' + y * this.celda + 'px)';
  }

  ajustar() {
    const w = this.zona.clientWidth * 0.96, h = this.zona.clientHeight * 0.96;
    const celda = Math.max(8, Math.floor(Math.min(w / this.ancho, h / this.alto)));
    this.alMedir('Pantalla ' + innerWidth + '×' + innerHeight + ' · casilla ' + celda + ' px · escala ' + (devicePixelRatio || 1));
    if (celda === this.celda) return;
    this.celda = celda;
    document.documentElement.style.setProperty('--celda', celda + 'px');
    this.tablero.style.width = celda * this.ancho + 'px';
    this.tablero.style.height = celda * this.alto + 'px';
    for (const c of this.casillas) this.colocar(c.el, c.x, c.y);
    for (const f of this.fichas.values()) this.colocar(f.el, f.x, f.y);
  }

  /** j: jugador del motor ({ id, nombre, color, x, y }). Sin conexión, la ficha se ve semitransparente. */
  pintarFicha(j, conectado) {
    let f = this.fichas.get(j.id);
    if (!f) {
      const el = document.createElement('div');
      el.className = 'ficha';
      el.appendChild(document.createElement('div'));
      this.tablero.appendChild(el);
      f = { el };
      this.fichas.set(j.id, f);
    }
    f.x = j.x;
    f.y = j.y;
    const circulo = f.el.firstChild;
    circulo.style.background = j.color;
    circulo.textContent = (j.nombre || '?').charAt(0).toUpperCase();
    this.colocar(f.el, j.x, j.y);
    f.el.classList.toggle('ausente', !conectado);
  }
}

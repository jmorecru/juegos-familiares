// Pantalla siempre encendida (Wake Lock), para el tablero y para los mandos.
// Si un móvil o una tablet se bloquea solo, el navegador congela la página y el jugador se desconecta.
//  - Safari solo la concede justo después de un toque, y para el tacto cuenta al levantar el dedo
//    (pointerup/touchend/click), no al apoyarlo. Por eso vigilar() la vuelve a pedir con cualquier toque.
//  - El navegador la suelta al ocultarse la página: vigilar() la pide otra vez al volver.

export class PantallaEncendida {
  constructor(alCambiar = () => {}) {
    this.alCambiar = alCambiar;
    this.bloqueo = null;
    this.pidiendo = false;
    this.estado = this.disponible ? 'comprobando' : 'no disponible en este navegador';
  }

  get disponible() { return 'wakeLock' in navigator; }
  get activa() { return !!this.bloqueo; }

  async pedir() {
    if (!this.disponible || this.bloqueo || this.pidiendo || document.visibilityState !== 'visible') return;
    this.pidiendo = true;
    try {
      this.bloqueo = await navigator.wakeLock.request('screen');
      this.estado = 'sí';
      this.bloqueo.addEventListener('release', () => {
        this.bloqueo = null;
        this.estado = 'desactivada';
        this.alCambiar();
      });
    } catch (e) {
      this.estado = 'no (' + (e.name || 'error') + ')';
    } finally {
      this.pidiendo = false;
    }
    this.alCambiar();
  }

  /** Reintenta con cualquier toque y al volver a la página, mientras cuando() sea cierto. */
  vigilar(cuando = () => true) {
    for (const evento of ['pointerup', 'touchend', 'click']) {
      document.addEventListener(evento, () => { if (cuando()) this.pedir(); }, { passive: true });
    }
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && cuando()) this.pedir();
    });
  }
}

// Indicador de versión común a todas las páginas.
// La línea VERSION la reescribe .githooks/pre-commit en cada commit: no editarla a mano.
const VERSION = { numero: 19, fecha: '2026-10-20 11:58' };

(function () {
  // Dirección de este mismo fichero, para volver a pedirlo sin caché y comparar.
  const origen = document.currentScript && document.currentScript.src;

  const insignia = document.createElement('div');
  insignia.id = 'version';
  insignia.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:9999;padding:3px 8px;border-radius:6px;' +
    'font:12px/1.4 system-ui,sans-serif;background:rgba(0,0,0,.45);color:#fff;pointer-events:none;';
  insignia.textContent = 'v' + VERSION.numero + (VERSION.fecha ? ' · ' + VERSION.fecha : '');

  function avisar(nueva) {
    insignia.textContent = 'Hay una versión nueva (v' + nueva + '). Toca aquí para recargar.';
    insignia.style.background = '#E0A000';
    insignia.style.color = '#1C2140';
    insignia.style.fontSize = '14px';
    insignia.style.pointerEvents = 'auto';
    insignia.style.cursor = 'pointer';
    // Se abre la página con ?v= en la dirección para que el navegador no aproveche una copia guardada.
    insignia.onclick = () => {
      const url = new URL(location.href);
      url.searchParams.set('v', nueva);
      location.replace(url.href);
    };
  }

  async function comprobar() {
    if (!origen || !window.fetch) return;
    try {
      const r = await fetch(origen.split('?')[0] + '?t=' + Date.now(), { cache: 'no-store' });
      const m = /numero:\s*(\d+)/.exec(await r.text());
      if (m && +m[1] > VERSION.numero) avisar(m[1]);
    } catch (e) { /* sin red: se queda la versión cargada */ }
  }

  function montar() {
    document.body.appendChild(insignia);
    comprobar();
    // El tablero puede pasar horas abierto: vuelve a mirar cada 2 minutos y al volver a la pestaña.
    setInterval(comprobar, 120000);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') comprobar(); });
  }
  if (document.body) montar(); else document.addEventListener('DOMContentLoaded', montar);
})();

// Modo diagnóstico: con ?diag=1 en la dirección se ve la información técnica (latencia, tipo de conexión,
// cortes, medidas, registro de eventos). Sin él, tablero y mando quedan limpios para jugar.
// Los elementos con la clase "solo-diag" solo se ven en este modo (css/comun.css).

export const DIAG = new URLSearchParams(location.search).has('diag');
document.documentElement.classList.toggle('diag', DIAG);

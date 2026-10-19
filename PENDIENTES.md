# Pendientes

## Abiertas
- **Mazmorra – Fase 0: prueba de humo en casa** (la hace el usuario). Por qué: decide si el tablero va en el
  Fire Stick, en la tablet o en ambos, y si WebRTC funciona en la wifi de casa (si no, hace falta el plan B
  del servidor local). Lista en `mazmorra/README.md`; resultados en la sección «Resultados de la Fase 0»
  de `mazmorra/BRIEF_mazmorra.md`. Tablero: <https://jmorecru.github.io/juegos-familiares/mazmorra/host.html>.
- **Mazmorra – Fase 1: reorganizar en módulos ES** (plan propuesto, pendiente de confirmar tras la Fase 0).
  Por qué: separar red, motor de reglas y dibujo para poder probar las reglas solas y reutilizarlas con la IA.
  Incluye poner el prefijo `mazmorra.` a las claves de localStorage, que ahora comparte con los demás juegos.

## Ya comprobado
- La identidad de git del proyecto es el noreply de GitHub (se aplica sola a todo lo que cuelga de `C:\personal`).
- Primer juego decidido: Mazmorra, en la carpeta `mazmorra/`. La raíz es solo la selección de juego.
- Repositorio público `jmorecru/juegos-familiares` creado con `gh` (que solo tiene la cuenta personal) y
  GitHub Pages activado desde `main`, carpeta raíz. Las cinco páginas responden 200 en
  <https://jmorecru.github.io/juegos-familiares/>.
- Chrome de escritorio ejecuta los módulos ES del tablero («Módulos ES: sí»). Falta comprobarlo en Silk y en la tablet.
- Primera prueba en el Fire Stick (2026-10-19):
  - con un móvil, la conexión se establece pero se corta a ratos («Se ha perdido la conexión»);
  - las fichas se dibujaban desplazadas (padding en % medido sobre el tablero).
  - Corregido y comprobado en Chrome: las fichas caen en su casilla y el tablero se reajusta al estrecharse la pantalla.
  - Añadido el diagnóstico de conexión para averiguar el motivo de los cortes. Falta repetir en el Fire Stick.
- La portada y la de la mazmorra se ven bien a 390 px de ancho (móvil).
- Indicador de versión: el hook escribe el número y la fecha en cada commit (comprobado en local). Con un servidor
  que simula una versión publicada más nueva, la página muestra el aviso amarillo para recargar.
- Desde la red del trabajo, `curl` falla con `CRYPT_E_NO_REVOCATION_CHECK` al abrir github.io: es la red,
  no el sitio. Para comprobar desde ahí, `curl --ssl-no-revoke`.

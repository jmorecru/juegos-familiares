# Pendientes

## Abiertas
- **Mazmorra – Fase 2: reglas básicas.** Por qué: es la siguiente fase de la hoja de ruta (turnos, tirada de
  movimiento, combate, puntos de vida, fin de partida). Antes hay que decidir con la familia cuántos héroes, de
  qué tipo y qué reglas puede seguir un niño de 6 años; luego se propone el plan.
- **Mazmorra – Tablet como tablero** (opcional). Por qué: la Fase 0 ha validado el Fire Stick 4K; probar una
  tablet como tablero solo hace falta si se quiere jugar sin tele. El tablero ya se adapta a vertical.
- **Mazmorra – Tableros por aventura** (a futuro; encaja con las Fases 1 y 5). Por qué: cada aventura tiene
  su mapa, y quieres un tablero grande como el de los juegos de mazmorras clásicos.
  - **Formato**: un JSON por mapa en `mazmorra/datos/mapas/` (casillas, habitaciones, puertas, salidas);
    cada aventura indica el suyo.
  - **Primer mapa**: unas 26×19 casillas con habitaciones, pasillos y sala central, con distribución y nombres propios.
  - **Dibujado por código**, sin imágenes.
  - **No usar el tablero ni el arte de HeroQuest**, tampoco capturas como la de Reddit: está protegido, el
    repositorio es público y el brief exige diseño original.
  - **Tamaño en pantalla**: en el Fire Stick (960×540 CSS) cada casilla mediría unos 25 px, así que hará falta
    zoom sobre la zona activa o mostrar solo lo descubierto.

## Ya comprobado
- La identidad de git del proyecto es el noreply de GitHub (se aplica sola a todo lo que cuelga de `C:\personal`).
- Primer juego decidido: Mazmorra, en la carpeta `mazmorra/`. La raíz es solo la selección de juego.
- Repositorio público `jmorecru/juegos-familiares` creado con `gh` (que solo tiene la cuenta personal) y
  GitHub Pages activado desde `main`, carpeta raíz.
- **Fase 0 cerrada (2026-10-20, v16)**, con el Fire TV Stick 4K (Silk) como tablero y tres mandos: iPhone
  con Safari, Fire HD 8 y tablet Android.
  - WebRTC va directo por la wifi de casa, sin el plan B del servidor local.
  - Latencia entre 10 y 200 ms, normalmente por debajo de 100.
  - Silk ejecuta módulos ES y mantiene la pantalla encendida.
  - 15 minutos sin tocar los mandos: ninguno se bloquea ni se desconecta.

  Detalle y fallos corregidos por el camino en la sección «Resultados de la Fase 0» de `mazmorra/BRIEF_mazmorra.md`.
- **Fase 1 hecha y validada en casa (2026-10-20, v25)**: Fire Stick, iPhone, Fire HD 8 y tablet Android, con la
  lista de comprobación del `mazmorra/README.md` correcta. Construida en las v19–v23: la mazmorra está dividida en módulos ES (`mazmorra/js/`), con el mapa en
  JSON, el diagnóstico detrás de `?diag=1` y claves con prefijo `mazmorra.` (las antiguas se pasan solas).
  Comprobado en Chrome: `pruebas/motor.html` pasa sus 15 pruebas y `pruebas/red.html` sus escenarios (8 desde la v25).
  El navegador pide todos los módulos, estilos y el mapa con `?v=N`.
- El hook versiona `src`/`href` propios y los valores del mapa de importaciones, y no toca las claves del mapa ni
  las direcciones externas (probado en una copia del repositorio).
- Indicador de versión: el hook escribe el número y la fecha en cada commit, y `version.js?v=N` en las páginas.
  Con un servidor que simula una versión publicada más nueva, la página muestra el aviso amarillo para recargar.
- Las pruebas de red en Chrome sin interfaz necesitan tiempo real, no `--virtual-time-budget`, que impide
  que PeerJS conecte. El resultado se lee haciendo que la página pida `/resultado?…` al servidor local.
- La portada y la de la mazmorra se ven bien a 390 px de ancho (móvil).
- Desde la red del trabajo, `curl` falla con `CRYPT_E_NO_REVOCATION_CHECK` al abrir github.io: es la red,
  no el sitio. Para comprobar desde ahí, `curl --ssl-no-revoke`.

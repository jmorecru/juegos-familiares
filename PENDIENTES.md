# Pendientes

## Abiertas
- **Mazmorra – Fase 0: prueba de humo en casa** (la hace el usuario). Por qué: decide si el tablero va en el
  Fire Stick, en la tablet o en ambos, y si WebRTC funciona en la wifi de casa (si no, hace falta el plan B
  del servidor local). Lista en `mazmorra/README.md`; resultados en la sección «Resultados de la Fase 0»
  de `mazmorra/BRIEF_mazmorra.md`. Tablero: <https://jmorecru.github.io/juegos-familiares/mazmorra/host.html>.
- **Mazmorra – Fase 1: reorganizar en módulos ES** (plan propuesto, pendiente de confirmar tras la Fase 0).
  Por qué: separar red, motor de reglas y dibujo para poder probar las reglas solas y reutilizarlas con la IA.
  Incluye poner el prefijo `mazmorra.` a las claves de localStorage, que ahora comparte con los demás juegos.
- **Mazmorra – Tableros por aventura** (a futuro; encaja con las Fases 1 y 5). Por qué: cada aventura tiene
  su mapa, y quieres un tablero grande como el de los juegos de mazmorras clásicos.
  - **Formato**: un JSON por mapa en `mazmorra/datos/mapas/` (casillas, habitaciones, puertas, salidas);
    cada aventura indica el suyo.
  - **Primer mapa**: unas 26×19 casillas con habitaciones, pasillos y sala central, con distribución y nombres propios.
  - **Dibujado por código**, sin imágenes.
  - **No usar el tablero ni el arte de HeroQuest**, tampoco capturas como la de Reddit: está protegido, el
    repositorio es público y el brief exige diseño original.
  - **Tamaño en pantalla**: con 26×19 casillas, en el Fire Stick cada una mediría unos 25 px. Hay que decidir
    entre zoom sobre la zona activa, mostrar solo lo descubierto o la tablet como tablero (depende de la Fase 0).

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
  - Añadido el diagnóstico de conexión para averiguar el motivo de los cortes.
- Con la v7 en el Fire Stick y un móvil: tablero, casillas e indicador de jugador bien; conexión directa por la wifi
  y 0 cortes. Resultados en `mazmorra/BRIEF_mazmorra.md`.
- Con dos mandos (iPhone con Safari y tablet) han aparecido:
  - un bucle de cortes en el mando;
  - conexiones muertas tras suspenderse la tele.

  Corregido en la v9 y probado en Chrome con tres casos: dos pestañas con la misma identidad, reapertura
  forzada y tablero que deja de contestar 12 s. Falta confirmarlo en casa.
- Fire TV Stick 4K (Silk): «Pantalla siempre encendida: sí», «Módulos ES: sí», 960×540 CSS a escala 4.
  Prueba de 15 minutos con iPhone, Fire HD 8 y tablet Android: la Android, 0 cortes; el iPhone y la Fire HD 8,
  cortes al suspenderse. En la v14, el tablero cierra conexiones con 30 s sin mensajes y el mando no da falsas alarmas
  al descongelarse (probado en Chrome). Con la v13, a los 15 min, corte simultáneo de los tres mandos y recuperación
  automática (posible wifi del Fire Stick o router). Falta repetir con la v14 y, si se repite, mirar el registro completo.
- Bloquear y desbloquear el iPhone no corta la conexión. Latencia entre 10 y 200 ms, normalmente por debajo de 100.
- Las pruebas de red en Chrome sin interfaz necesitan tiempo real, no `--virtual-time-budget`, que impide
  que PeerJS conecte. El resultado se lee haciendo que la página pida `/resultado?…` al servidor local.
- La portada y la de la mazmorra se ven bien a 390 px de ancho (móvil).
- Indicador de versión: el hook escribe el número y la fecha en cada commit (comprobado en local). Con un servidor
  que simula una versión publicada más nueva, la página muestra el aviso amarillo para recargar.
- Desde la red del trabajo, `curl` falla con `CRYPT_E_NO_REVOCATION_CHECK` al abrir github.io: es la red,
  no el sitio. Para comprobar desde ahí, `curl --ssl-no-revoke`.

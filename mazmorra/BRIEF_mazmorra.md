# BRIEF – Mazmorra

Juego de mesa digital tipo dungeon crawler (inspirado en HeroQuest) para jugar en familia,
con una pantalla compartida como tablero y los móviles de cada jugador como mandos,
al estilo de los juegos de grupo de Amazon Luna o Jackbox.

Este documento resume lo decidido hasta ahora para que un agente pueda continuar el desarrollo.
Antes de escribir código, lee el brief completo y propón un plan para la fase que se pida.

---

## 1. Contexto

- Uso exclusivamente familiar: dos adultos y tres niños de 6, 8 y 10 años. No se va a publicar.
- Aun así, el juego debe ser original: no usar el nombre HeroQuest, ni sus personajes, textos o arte.
  Las mecánicas pueden inspirarse en el género, con nombres y aspecto propios.
- Jugadores: hasta 4 héroes y 1 Señor Oscuro (máximo 5 dispositivos conectados).
- La interfaz de los mandos debe ser usable por un niño de 6 años: botones grandes, poco texto,
  iconos y colores por jugador. Todo el texto visible en español.

## 2. Decisiones tomadas

### Infraestructura
- **Alojamiento**: GitHub Pages (solo ficheros estáticos, HTTPS). Sin backend propio.
- **Ubicación**: carpeta `mazmorra/` del repositorio `jmorecru/juegos-familiares`. La portada de la raíz
  es el selector de juegos de la familia. Tablero publicado en
  <https://jmorecru.github.io/juegos-familiares/mazmorra/host.html>.
- **Origen compartido**: todos los juegos se sirven desde `jmorecru.github.io`, así que comparten
  localStorage. Las claves de la mazmorra llevan el prefijo `mazmorra.` (`js/comun/almacen.js`); las de la
  prueba de humo (`sala`, `nombre`, `jugadorId`, `ultimaSala`) se pasan solas al nombre nuevo la primera vez.
- **El tablero es el servidor**: la página `host.html`, abierta en la pantalla compartida,
  guarda el estado de la partida y es la única fuente de verdad.
- **Conexión**: WebRTC con PeerJS. El servidor público de PeerJS solo se usa para el emparejamiento
  inicial; los datos de la partida viajan directamente entre dispositivos por la wifi de casa.
- **Unirse a la sala**: el tablero muestra un código de 4 letras y un QR que abre `mando.html?sala=XXXX`.
- **Pantalla compartida**: el Fire TV Stick 4K de la tele (navegador Silk), validado en la Fase 0. Una tablet
  como tablero queda como opción para jugar sin tele; el tablero ya se adapta a vertical.
- **Plan B** si WebRTC falla en casa: un pequeño servidor local (Node o Spring Boot) en un portátil,
  manteniendo el mismo protocolo de mensajes.

### Señor Oscuro
- Puede ser **humano** (desde su propia tablet, con el mapa completo en privado) o **automático**.
- La versión automática usa **IA clásica de juego** (búsqueda de caminos tipo A* y reglas simples),
  sin modelos de lenguaje ni APIs de pago. Debe funcionar sin internet una vez cargada la página.
- Ambos modos deben usar la misma interfaz interna: el motor no distingue si las órdenes del
  Señor Oscuro vienen de un mando o de la IA.
- Un LLM para narración queda como idea opcional futura, no como requisito.

### Principios de arquitectura
1. **Host autoritativo**: los mandos solo envían intenciones (`mover`, `atacar`, `buscar`…);
   el tablero valida, resuelve tiradas y difunde el resultado.
2. **Información privada**: cada mando recibe únicamente lo que su jugador puede ver.
   El tablero muestra solo lo descubierto por los héroes (niebla de guerra).
3. **Motor de reglas puro**: la lógica del juego no depende ni de la interfaz ni de la red,
   para poder probarla de forma aislada y reutilizarla con la IA.
4. **Datos fuera del código**: misiones, mapas, monstruos y objetos en ficheros JSON.

## 3. Estado actual: base técnica en módulos (Fase 1)

La prueba de humo (Fase 0) se validó en casa y se cerró el 2026-10-20 con la v16. En la Fase 1 (v19–v23) el
código se ha dividido en módulos ES, con el mismo comportamiento y el mismo protocolo. Todavía no hay reglas de
juego: fichas que se mueven por una sala de pruebas de 12×8.

| Pieza                    | Función                                                                    |
|--------------------------|----------------------------------------------------------------------------|
| `host.html`, `mando.html`| Solo HTML, mapa de importaciones y carga del módulo principal              |
| `js/red/`                | `sala.js` (tablero) y `cliente.js` (mando): conexión, reconexión y vigilancia; `protocolo.js` con plazos y limpieza de mensajes |
| `js/motor/partida.js`    | Estado y reglas sin pantalla ni red: `crearPartida`, `unir`, `aplicar`, `vistaPara` |
| `js/tablero/`, `js/mando/` | Interfaz: dibujo del tablero, registro de eventos, cruceta              |
| `js/comun/`              | Almacenamiento con prefijo, pantalla siempre encendida, modo `?diag=1`     |
| `datos/mapas/prueba.json`| La sala de pruebas                                                         |
| `pruebas/`               | `motor.html` (15 pruebas) y `red.html` (7 escenarios de la Fase 0, ~2 min) |

Detalle de la estructura, del modo diagnóstico y de cómo pasar las pruebas en el `README.md` de esta carpeta.

Dependencias por CDN con versión fija: `peerjs@1.5.4` (jsDelivr) y `qrcodejs 1.0.0` (cdnjs).
Tipografías de Google Fonts: Fredoka (interfaz) y Grenze Gotisch (título).

### Protocolo de mensajes actual

| Dirección       | `tipo`       | Campos                    | Notas                                            |
|-----------------|--------------|---------------------------|--------------------------------------------------|
| mando → tablero | `hola`       | `id`, `nombre`            | `id` persistente en localStorage para reconectar |
| mando → tablero | `mover`      | `dx`, `dy`                | Un paso, un solo eje; el tablero valida          |
| mando → tablero | `ping`       | `t`                       | Medición de latencia cada 2 s                    |
| tablero → mando | `bienvenida` | `color`, `nombre`         | Asigna color al jugador                          |
| tablero → mando | `estado`     | `x`, `y`, `total`         | Solo la información de ese jugador               |
| tablero → mando | `bloqueado`  | –                         | Movimiento no válido                             |
| tablero → mando | `rechazado`  | `motivo`                  | Sala llena (máx. 5)                              |
| tablero → mando | `pong`       | `t`                       | Eco del ping                                     |
| tablero → mando | `sustituido` | –                         | Ese `id` se ha conectado desde otra pestaña o dispositivo; este mando deja de reconectar |

### Comportamientos ya resueltos
- El tablero guarda su código de sala en localStorage: al recargar, conserva el código y los móviles
  se reconectan solos. Si el servidor de PeerJS aún no ha liberado el código, reintenta 4 veces y luego
  genera uno nuevo.
- Un jugador que vuelve con el mismo `id` recupera su ficha y su color.
- El estado de la partida **no** se persiste: al recargar el tablero, las fichas vuelven a la salida.
- Diagnóstico de la Fase 0:
  - el mando muestra el tipo de conexión (candidato ICE: wifi directa, router o servidor externo),
    los cortes y su motivo;
  - el tablero registra los cambios de estado ICE y muestra las medidas de pantalla y casilla.
- Los errores del servidor de emparejamiento no cierran una conexión ya abierta con el tablero.
- Casillas y fichas se colocan en píxeles calculados en JavaScript y se recolocan al cambiar el espacio
  (`ResizeObserver`). No usar `padding` en % dentro del tablero: se mide sobre el ancho del tablero, no de la ficha.
- El mando avisa si la conexión directa no se completa en 10 s (posible red de invitados o router
  que aísla dispositivos).
- Solo cuenta la conexión actual de cada jugador. El mando ignora los mensajes de conexiones anteriores,
  y el tablero ignora sus movimientos.
- Si llega un `hola` con un `id` cuya conexión anterior sigue abierta, el tablero envía `sustituido` a la
  anterior antes de cerrarla, para que dos pestañas con la misma identidad no se quiten el sitio sin parar.
- El mando suelta la conexión antes de cerrarla. PeerJS emite `close` en el acto, y si siguiera siendo la
  actual contaría como corte y programaría un reintento: era el bucle de cortes visto en iPhone.
  Al reaparecer el servidor de emparejamiento (`open`), no se toca una conexión abierta.
- Si el tablero no contesta los pings en 8 s (página visible), el mando da la conexión por perdida y reconecta.
  Cubre las conexiones muertas que parecen abiertas, por ejemplo al suspenderse la tele.
  Si tras abrir no llega `bienvenida` en 4 s, repite el `hola`.
- El mando no culpa al tablero si su propio temporizador ha estado parado más de 4 s (página congelada al bloquear
  sin que Safari avise con `visibilitychange`): da margen antes de aplicar los 8 s.
- El tablero da por desconectada una conexión que pasa 30 s sin mensajes (los mandos hacen ping cada 2 s).
  Lo hace la Fire HD 8 al suspenderse: deja la conexión muerta sin cerrarla. 30 s para que un bloqueo corto
  del móvil no cuente como corte.
- El registro del tablero guarda los 50 últimos eventos; se abre entero con el botón «Ver registro completo»
  o pulsando sobre él.
- El mando también pide mantener la pantalla encendida (Wake Lock): al entrar, al tocar la cruceta y al
  volver a la pestaña. Si no, durante la partida el móvil se bloquea solo y el jugador se desconecta.
  El mando muestra «Pantalla siempre encendida: sí/no».
  Safari (iPhone) solo la concede justo después de un toque, y al entrar solo tras recargar no lo hay
  (`NotAllowedError`). Por eso se reintenta con cualquier toque en la página (`pointerup`/`touchend`/`click`)
  y, mientras falte, el mando muestra el aviso «Toca la pantalla para que no se apague».
- Al recargar la misma pestaña, el mando vuelve a entrar solo: la sala va en sessionStorage.
  En una pestaña nueva se sigue pidiendo el nombre.

### Resultados de la Fase 0

Cerrada el 2026-10-20 con la v16. Lista completa en el `README.md` de esta carpeta.

| Comprobación                                   | Fire Stick (Silk)                         | Tablet ( modelo / navegador ) |
|------------------------------------------------|-------------------------------------------|-------------------------------|
| Un móvil: movimiento, casillas y ficha         | OK (2026-10-19, v7)                       |                               |
| Conexión y cortes                              | Directa por la wifi, 0 cortes (v7)        |                               |
| Dos mandos a la vez (iPhone + tablet)          | OK tras corregir los cortes (v8)          |                               |
| Tres móviles a la vez, movimiento fluido       |                                           |                               |
| Latencia que marcan los móviles (ms)           | 10–200, normalmente < 100                 |                               |
| Reconexión al bloquear y desbloquear un móvil  | OK (iPhone, no se perdió la conexión)     |                               |
| Reconexión al recargar el tablero              |                                           |                               |
| Pantalla encendida 15 minutos                  | Sí: «Pantalla siempre encendida: sí» y no se suspendió (v13, 3 mandos) |  |
| Tres mandos a la vez                           | OK (iPhone, Fire HD 8, tablet Android); un corte simultáneo de todos, recuperado solo (v13) | |
| 15 min sin tocar los mandos                    | OK (v16): ninguno se bloquea ni se desconecta | |
| «Módulos ES: sí»                               | Sí (v13)                                  |                               |
| Medidas                                        | 960×540 CSS, escala 4 (Fire TV Stick 4K), casilla 56 px |                 |
| Se ve bien desde la mesa / el sofá             | Tablero, casillas e indicador de jugador bien |                           |

Mandos usados (modelo y navegador):
- iPhone con Safari: conexión `host/prflx`, que sigue siendo directa por la wifi.
- Fire HD 8 con Silk.
- Tablet Android: 0 cortes en toda la prueba.
Conclusión: **el Fire TV Stick 4K vale como tablero**, con conexión directa por la wifi; el plan B no hace falta.
La tablet como tablero queda como comparación opcional, para jugar sin tele.
Incidencias (Fire Stick, 2026-10-19):
- Hasta la v5, las fichas se dibujaban desplazadas por un `padding` en % (medido sobre el tablero). Corregido.
- Hasta la v5, había cortes frecuentes («Se ha perdido la conexión»). Con la v7, 0 cortes y conexión directa por la wifi.
  Causa más probable: el mando cerraba la conexión con el tablero ante cualquier error del servidor de
  emparejamiento de PeerJS. Ahora lo ignora si la conexión está abierta. No está demostrado: confirmarlo con
  la prueba de tres móviles.
- WebRTC directo funciona en la wifi de casa: de momento no hace falta el plan B del servidor local.
- Con dos mandos y la v8, tras mucho rato, el iPhone mostraba cortes continuos («cerrada, ICE sin datos»),
  pero se podía mover. Causa: el bucle de cierre y reintento del mando (ver «Comportamientos ya resueltos»).
  Recargar lo cortaba. Corregido en la v9 y reproducido en Chrome.
- La tele entró en suspensión. Al volver, el tablero seguía abierto, pero:
  - el iPhone seguía con el bucle de cortes;
  - la tablet parecía conectada y no movía (conexión muerta sin cerrar).

  Corregido en la v9 con el plazo de 8 s sin respuesta y la repetición del `hola`; probado en Chrome
  con un tablero que deja de contestar 12 s. Falta revisar el salvapantallas del Fire TV, que no
  debería saltar con el tablero abierto.

Incidencias (Fire Stick, 2026-10-20, v13, iPhone + Fire HD 8 + tablet Android):
- La columna derecha no cabía en 960×540 y ocultaba los jugadores, el estado y el registro. Corregido en la v12
  con tamaños en vh; probado a 540, 480 y 420 px de alto.
- El aviso de versión nueva volvía tras recargar: Silk reutilizaba `version.js` guardado (`max-age=600`).
  Corregido en la v13 con `version.js?v=N`, que escribe el hook.
- iPhone: al bloquearse solo y pasar un rato, 2 cortes («sin respuesta del tablero»). El bloqueo manual corto
  no corta. Para evitar falsas alarmas al descongelarse, el mando da margen si su temporizador estuvo parado (v14).
- Fire HD 8: al suspenderse, el registro decía «abierto en otra pestaña o móvil», sin haber otra pestaña, y no
  movía hasta recargar. Causa probable: el tablero seguía dando por buena la conexión muerta de antes de
  suspenderse. Desde la v14, el tablero cierra las conexiones con 30 s sin mensajes y el registro dice
  «vuelve a entrar; se cierra su conexión anterior». Probado en Chrome con un mando congelado.
- Prueba de 15 minutos con la v13 y tres mandos. La tele siguió encendida. Hacia el final, **todos los mandos
  se cortaron a la vez** («error de conexión»; en el registro, `disconnected` para cada jugador) y **todos
  volvieron a entrar solos** y siguieron funcionando. Que caigan todos juntos apunta a algo común, como la
  wifi del Fire Stick (¿ahorro de energía tras un rato sin usar su mando?) o el router, no a cada dispositivo.
  Si se repite con la v14, abrir el registro completo y anotar la secuencia y la hora.
- Con la v15, sin tocar los mandos, se desconectaron los tres: primero el iPhone y minutos después las dos
  tablets. En el registro: «Eduardo: 30 s sin noticias, se da por desconectado». No es un fallo: se
  bloquearon o suspendieron solos y el tablero los dio por desconectados, conservando su ficha.
  Para la partida real es un problema, porque cada jugador pasa minutos sin tocar su móvil. Por eso, desde
  la v16 el mando pide mantener la pantalla encendida. Además, el registro no se podía desplazar y no
  había nada que indicara que se abre pulsando: desde la v16 hay un botón «Ver registro completo».

- Con la v16 y 15 minutos sin tocar los mandos: los tres aguantan sin bloquearse y sin desconectarse.
  En la prueba anterior (v15), al despertarlas, las dos tablets volvieron a entrar solas; el iPhone se recargó
  a mano, así que en él no se comprobó la vuelta automática.
- En la actualización a la v16, el registro mostró para un jugador «se une», un segundo después «se ha
  desconectado» y luego «ha vuelto». Causa probable: el mando con la versión anterior llegó a reconectar justo
  antes de recargarse a la v16. Si se ve en mitad de una partida sin recargar, investigarlo.

## 4. Restricciones técnicas

- Sin paso de compilación de momento: HTML, CSS y JavaScript que funcionen tal cual en GitHub Pages.
  Al crecer, dividir en módulos ES nativos (`<script type="module">`), sin bundler.
- Librerías solo por CDN, con versión exacta fijada. No añadir dependencias nuevas sin consultarlo.
- Todo acceso a localStorage envuelto en try/catch.
- Navegadores objetivo: Silk (Fire TV), Safari iOS, Chrome Android y una tablet (por confirmar).
  El Fire Stick es el dispositivo menos potente: evitar animaciones pesadas en el tablero.
- Sin secretos ni claves en el repositorio.

## 5. Hoja de ruta propuesta

**Fase 0 – Validar la prueba de humo.** Hecha (2026-10-20, v16): Fire TV Stick 4K como tablero, WebRTC
directo por la wifi y tres mandos estables. Resultados en la sección 3.

**Fase 1 – Reorganizar en módulos.** Hecha (2026-10-20). Estructura en la sección 3 y en el `README.md`.
Además de lo previsto:
- el diagnóstico queda detrás de `?diag=1`;
- las claves de localStorage llevan prefijo;
- un mapa de importaciones con `?v=N` evita mezclar módulos guardados de versiones distintas;
- los fallos de la Fase 0 son ahora pruebas automáticas (`pruebas/red.html`).

Falta repetir en casa la lista de comprobación del `README.md` con la versión en módulos.

**Fase 2 – Reglas básicas**: turnos, tirada de movimiento, combate cuerpo a cuerpo, puntos de vida,
fin de partida. Héroes con atributos y nombres originales.

**Fase 3 – Niebla de guerra y mando del Señor Oscuro humano**: el tablero revela habitaciones al
entrar; el Señor Oscuro ve el mapa completo en su dispositivo y activa monstruos y trampas.

**Fase 4 – Señor Oscuro automático**: monstruos con A* y reglas sencillas, con niveles de dificultad.

**Fase 5 – Misiones y persistencia**: misiones en JSON, guardar y reanudar partidas.
Cada aventura elige su mapa (`datos/mapas/*.json`). El mapa principal será un tablero grande, de unas 26×19
casillas, con habitaciones, pasillos y sala central, con diseño propio dibujado por código. No se usa el tablero
ni el arte de HeroQuest. Con ese tamaño, en el Fire Stick hará falta zoom sobre la zona activa o la tablet.

## 6. Preguntas abiertas

- Número y tipo de héroes, y nivel de complejidad de las reglas para que jueguen los niños.
- ¿Guardar el estado de la partida en el propio tablero (localStorage/IndexedDB) es suficiente?

## 7. Forma de trabajar

- El usuario prefiere **documentar y acordar los requisitos antes de implementar**.
  Para cada fase, presenta primero un plan breve y espera confirmación.
- Cambios pequeños y verificables, con commits descriptivos.
- Mantener actualizado este brief y el README cuando cambie una decisión o el protocolo.
- Para probar en local: servir la raíz del repositorio con `python -m http.server 8000` (sin npm) y abrir
  `localhost:8000/mazmorra/host.html?diag=1` y `localhost:8000/mazmorra/mando.html?diag=1` en dos pestañas
  (contexto seguro). Hace falta internet para el emparejamiento de PeerJS.
- Antes de publicar un cambio, pasar `pruebas/motor.html` y, si toca `js/red/`, `pruebas/red.html`. Cada fallo
  nuevo que aparezca en casa se convierte en un escenario de `pruebas/red.html`.
- Al añadir un módulo, añadirlo al mapa de importaciones de `host.html` y `mando.html`.

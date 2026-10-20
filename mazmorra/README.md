# Mazmorra

Aventura por turnos para jugar en familia. Una pantalla compartida hace de tablero y de «servidor» de la
partida (el Fire TV Stick 4K de la tele), y cada jugador usa su móvil o su tablet como mando. Se conectan
directamente por WebRTC a través de la wifi de casa.

Ahora mismo es la base técnica, sin reglas de juego: fichas que se mueven por una sala de pruebas.
Las decisiones, el protocolo y la hoja de ruta están en [`BRIEF_mazmorra.md`](BRIEF_mazmorra.md).

## Cómo se juega

1. En la tele, abre <https://jmorecru.github.io/juegos-familiares/mazmorra/host.html>. En el Fire Stick,
   guárdalo como favorito de Silk.
2. Cada jugador escanea el QR con su móvil, escribe su nombre y pulsa «Entrar en la sala».
3. Si el mando muestra «Toca la pantalla para que no se apague», basta con tocarla una vez.
4. Las fichas se mueven con la cruceta. Contra un muro o contra otra ficha, la cruceta parpadea en rojo
   (y el móvil vibra en Android).

Si se recarga el tablero, conserva el código de sala y los mandos vuelven a entrar solos. Las fichas vuelven a la
salida, porque el estado de la partida aún no se guarda.

### Modo diagnóstico

Añadiendo `?diag=1` a la dirección (`host.html?diag=1`, `mando.html?diag=1&sala=ABCD`) se ve la información técnica:

- **En el mando**: latencia, tipo de conexión, cortes y su motivo, y si la pantalla se mantiene encendida.
- **En el tablero**: tipo de conexión de cada jugador, medidas de pantalla y casilla, y el registro de eventos
  (botón «Ver registro completo»).

Sin `?diag=1`, el mando muestra solo la cruceta y el tablero solo el código, el QR y los jugadores.

## Cómo funciona por dentro

Sin compilación: HTML, CSS y módulos ES que el navegador carga tal cual. PeerJS 1.5.4 y qrcodejs 1.0.0 llegan por CDN.

```
host.html  mando.html  index.html   tablero, mando y portada del juego
css/        comun.css · tablero.css · mando.css
js/comun/   almacen.js (localStorage con prefijo «mazmorra.») · pantalla.js (pantalla siempre encendida)
            diagnostico.js (modo ?diag=1)
js/red/     protocolo.js (constantes y limpieza de mensajes) · ice.js (tipo de conexión)
            sala.js (lado del tablero) · cliente.js (lado del mando)
js/motor/   partida.js: estado y reglas, sin pantalla ni red
js/tablero/ main.js · dibujo.js · registro.js
js/mando/   main.js
datos/mapas/prueba.json   la sala de pruebas de 12×8
pruebas/    motor.html · red.html
```

- **El tablero manda.** Los mandos solo envían intenciones (`mover`). `js/tablero/main.js` las pasa al motor
  (`aplicar`), que las valida, y envía a cada mando solo lo suyo (`vistaPara`).
- **Motor sin pantalla ni red.** `js/motor/partida.js` se puede probar solo, y la IA del Señor Oscuro podrá usar
  las mismas funciones que los mandos.
- **La red mantiene viva la conexión.** `sala.js` y `cliente.js` recogen todo lo aprendido en la Fase 0:
  reconexión sin bucles, detección de conexiones muertas (8 s en el mando, 30 s en el tablero), el aviso a
  una pestaña duplicada y la vuelta automática al recargar. Para el plan B de un servidor local, solo
  cambiarían estos dos ficheros.
- **Versiones y caché.** GitHub Pages deja guardar los ficheros 10 minutos. Para que el navegador no mezcle
  ficheros de dos versiones, cada página carga sus módulos con un **mapa de importaciones** (`<script
  type="importmap">`) que añade `?v=N` a cada uno, y los `.css` y el mapa van también con `?v=N`. El número lo
  pone el hook de git en cada commit. **Al añadir un módulo, añádelo al mapa de `host.html` y de `mando.html`**;
  si falta, funciona igual, pero sin protección frente a la caché.

Con módulos, abrir los ficheros con `file://` ya no funciona: hace falta un servidor.

## Probarlo en el ordenador

Desde la raíz del repositorio, `python -m http.server 8000`, y en el navegador:

- `http://localhost:8000/mazmorra/host.html?diag=1` y `http://localhost:8000/mazmorra/mando.html?diag=1` en dos
  pestañas. Hace falta internet para el emparejamiento de PeerJS.
- **Pruebas del motor**: `http://localhost:8000/mazmorra/pruebas/motor.html`. Reglas y claves guardadas; tarda
  un instante.
- **Pruebas de red**: `http://localhost:8000/mazmorra/pruebas/red.html`. Abre un tablero y mandos de verdad y
  reproduce los fallos vistos en casa: bucle de cortes, recarga, pestaña duplicada, tablero que no contesta y
  mando congelado. Tarda unos 2 minutos y solo se ejecuta en `localhost`, porque borra los datos guardados.

Hay que pasarlas antes de publicar cualquier cambio en `js/red/`. El resultado aparece en la página y, además,
la página pide `/resultado?…` al servidor local, así que también se puede leer en su registro.

## Lista de comprobación en casa

Tras un cambio en la red o en el tablero, con el Fire Stick y al menos dos mandos:

- [ ] Todos entran y se mueven con fluidez; la latencia (`?diag=1`) está por debajo de ~100 ms.
- [ ] Bloquear y desbloquear un móvil: sigue dentro, o vuelve a entrar solo con su ficha y su color.
- [ ] Recargar el tablero: mismo código de sala y los mandos vuelven a entrar solos.
- [ ] 15 minutos sin tocar los mandos: ninguno se bloquea ni se desconecta.

Los resultados de la Fase 0 están en la sección «Resultados de la Fase 0» de [`BRIEF_mazmorra.md`](BRIEF_mazmorra.md).

## Si algo falla

- **«No encuentro la sala»**: revisa el código; si el tablero se acaba de recargar, espera unos segundos.
- **«La conexión directa no se completa»**: el móvil y el tablero deben estar en la misma wifi. Las redes
  de invitados y algunos routers aíslan los dispositivos entre sí.
- **El tablero no muestra código**: el servidor público de PeerJS (solo se usa para el emparejamiento
  inicial) puede no estar disponible. Recarga pasados unos minutos.
- **«Se ha perdido la conexión» o movimientos que van a ratos**: abre tablero y mandos con `?diag=1`.
  - Lo esperable en casa es «directa por la wifi». Con iPhone puede salir «(host/prflx)», que también es directa.
  - «Servidor externo» indica que la conexión directa no se consigue y los mensajes dan la vuelta por internet.
  - El último corte del mando y el registro completo del tablero dicen qué pasó.
- **«Este jugador se ha abierto en otra pestaña o en otro móvil»**: hay dos mandos con la misma identidad,
  por ejemplo dos pestañas del mismo navegador. Cierra la que sobra; para usar esta, recárgala.
- **La tele se suspende**: al volver, los mandos lo detectan en unos 8 s y vuelven a entrar solos. Para que no
  pase, desactiva el salvapantallas del Fire TV o pon su hora de inicio en «Nunca»
  (Configuración → Pantalla y sonido → Salvapantallas).
- **«Este navegador es demasiado antiguo»**: no admite módulos ES. Silk, Safari en iOS 16.4 o posterior y
  Chrome actual sí los admiten.

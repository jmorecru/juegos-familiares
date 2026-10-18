# Mazmorra – prueba de humo

Objetivo: comprobar que la arquitectura funciona en casa antes de escribir nada de juego.
Una pantalla hace de tablero (y de "servidor" de la partida) y los móviles hacen de mandos,
conectados directamente por WebRTC a través de la wifi de casa.

| Fichero      | Para qué sirve                                                     |
|--------------|--------------------------------------------------------------------|
| `index.html` | Portada con dos botones: abrir el tablero o unirse como jugador    |
| `host.html`  | Tablero: muestra el QR, guarda el estado y valida los movimientos  |
| `mando.html` | Mando del móvil: cruceta, latencia y reconexión automática         |

Dependencias (por CDN, sin instalar nada): PeerJS 1.5.4 y qrcodejs 1.0.0.

## Dónde está publicado

La mazmorra forma parte de Juegos Familiares y se publica con el resto del repositorio en GitHub Pages:

- Tablero: <https://jmorecru.github.io/juegos-familiares/mazmorra/host.html>
- Portada del juego: <https://jmorecru.github.io/juegos-familiares/mazmorra/>

GitHub Pages sirve por HTTPS, que es lo que necesitan WebRTC y la función de pantalla siempre encendida.
Abrir los ficheros en local con `file://` no sirve para probar con móviles.

Para probar en el ordenador, sirve la raíz del repositorio con `python -m http.server 8000` y abre
`http://localhost:8000/mazmorra/host.html` y `http://localhost:8000/mazmorra/mando.html` en dos pestañas
(`localhost` cuenta como contexto seguro). Hace falta internet para el emparejamiento de PeerJS.

## Cómo probar

1. Abre `host.html` en el tablero (Fire Stick con Silk, o la tablet). En el Fire Stick, guárdalo como favorito.
2. Escanea el QR con cada móvil, escribe un nombre y entra.
3. Mueve las fichas con la cruceta. Contra un muro o contra otra ficha, el móvil vibra (en Android) y la cruceta parpadea en rojo.

## Lista de comprobación

- [ ] Se conectan tres móviles a la vez y todos se mueven con fluidez.
- [ ] La latencia que muestra el móvil está por debajo de ~100 ms.
- [ ] Bloquear un móvil y desbloquearlo: vuelve a entrar solo, con su ficha y su color.
- [ ] Recargar el tablero: mantiene el mismo código de sala y los móviles se reconectan
      (las fichas vuelven a la casilla de salida; en esta prueba el estado no se guarda).
- [ ] La pantalla del tablero no se apaga durante 15 minutos.
- [ ] El tablero muestra «Módulos ES: sí» (la Fase 1 los necesita).
- [ ] Repetir todo con el Fire Stick y con la tablet, y anotar cuál va mejor.

Los resultados se apuntan en la sección «Resultados de la Fase 0» de [`BRIEF_mazmorra.md`](BRIEF_mazmorra.md).

## Si algo falla

- **"No encuentro la sala"**: revisa el código; si el tablero se acaba de recargar, espera unos segundos.
- **"La conexión directa no se completa"**: el móvil y el tablero deben estar en la misma wifi. Las redes
  de invitados y algunos routers aíslan los dispositivos entre sí.
- **El tablero no muestra código**: el servidor público de PeerJS (solo se usa para el emparejamiento
  inicial) puede no estar disponible. Recarga pasados unos minutos.
- **Sin consola de errores en el Fire Stick**: el tablero muestra los últimos eventos abajo a la derecha.

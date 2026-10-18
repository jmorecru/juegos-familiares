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
  localStorage. Las claves de la mazmorra deben llevar el prefijo `mazmorra.` (pendiente para la Fase 1;
  la prueba de humo aún usa `sala`, `nombre`, `jugadorId` y `ultimaSala`).
- **El tablero es el servidor**: la página `host.html`, abierta en la pantalla compartida,
  guarda el estado de la partida y es la única fuente de verdad.
- **Conexión**: WebRTC con PeerJS. El servidor público de PeerJS solo se usa para el emparejamiento
  inicial; los datos de la partida viajan directamente entre dispositivos por la wifi de casa.
- **Unirse a la sala**: el tablero muestra un código de 4 letras y un QR que abre `mando.html?sala=XXXX`.
- **Pantalla compartida**: Fire TV Stick (navegador Silk) o una tablet grande en el centro de la mesa.
  Pendiente de decidir según los resultados de la prueba de humo. El tablero debe adaptarse a ambas.
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

## 3. Estado actual: prueba de humo

Objetivo: validar la infraestructura en casa antes de programar juego. **Pendiente de probar.**

| Fichero      | Función                                                                       |
|--------------|-------------------------------------------------------------------------------|
| `index.html` | Portada con dos botones: abrir el tablero o unirse como jugador               |
| `host.html`  | Tablero 12×8 con muros, código de sala + QR, validación de movimientos, registro de eventos visible, Wake Lock, aviso de si el navegador ejecuta módulos ES |
| `mando.html` | Cruceta, latencia en ms, vibración al chocar, reconexión automática           |
| `README.md`  | Publicación en GitHub Pages y lista de comprobación de la prueba              |

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

### Comportamientos ya resueltos
- El tablero guarda su código de sala en localStorage: al recargar, conserva el código y los móviles
  se reconectan solos. Si el servidor de PeerJS aún no ha liberado el código, reintenta 4 veces y luego
  genera uno nuevo.
- Un jugador que vuelve con el mismo `id` recupera su ficha y su color.
- El estado de la partida **no** se persiste: al recargar el tablero, las fichas vuelven a la salida.
- El mando avisa si la conexión directa no se completa en 10 s (posible red de invitados o router
  que aísla dispositivos).

### Resultados de la Fase 0

Pendiente de rellenar tras la prueba en casa (lista completa en el `README.md` de esta carpeta).

| Comprobación                                   | Fire Stick (Silk) | Tablet ( modelo / navegador ) |
|------------------------------------------------|-------------------|-------------------------------|
| Tres móviles a la vez, movimiento fluido       |                   |                               |
| Latencia que marcan los móviles (ms)           |                   |                               |
| Reconexión al bloquear y desbloquear un móvil  |                   |                               |
| Reconexión al recargar el tablero              |                   |                               |
| Pantalla encendida 15 minutos                  |                   |                               |
| «Módulos ES: sí»                               |                   |                               |
| Se ve bien desde la mesa / el sofá             |                   |                               |

Móviles usados (modelo y navegador):
Conclusión (Fire Stick, tablet o ambos):
Incidencias:

## 4. Restricciones técnicas

- Sin paso de compilación de momento: HTML, CSS y JavaScript que funcionen tal cual en GitHub Pages.
  Al crecer, dividir en módulos ES nativos (`<script type="module">`), sin bundler.
- Librerías solo por CDN, con versión exacta fijada. No añadir dependencias nuevas sin consultarlo.
- Todo acceso a localStorage envuelto en try/catch.
- Navegadores objetivo: Silk (Fire TV), Safari iOS, Chrome Android y una tablet (por confirmar).
  El Fire Stick es el dispositivo menos potente: evitar animaciones pesadas en el tablero.
- Sin secretos ni claves en el repositorio.

## 5. Hoja de ruta propuesta

**Fase 0 – Validar la prueba de humo** (la hace el usuario en casa).
Resultado esperado: latencia, estabilidad con 3 móviles y comparativa Fire Stick frente a tablet.

**Fase 1 – Reorganizar en módulos.** Estructura orientativa, dentro de `mazmorra/`:

```
mazmorra/index.html
mazmorra/host.html
mazmorra/mando.html
mazmorra/js/red/        conexión PeerJS, sala, reconexión, protocolo
mazmorra/js/motor/      estado de partida y reglas puras (sin DOM)
mazmorra/js/tablero/    renderizado del tablero
mazmorra/js/mando/      interfaz del mando
mazmorra/datos/         misiones, monstruos y objetos en JSON
```

**Fase 2 – Reglas básicas**: turnos, tirada de movimiento, combate cuerpo a cuerpo, puntos de vida,
fin de partida. Héroes con atributos y nombres originales.

**Fase 3 – Niebla de guerra y mando del Señor Oscuro humano**: el tablero revela habitaciones al
entrar; el Señor Oscuro ve el mapa completo en su dispositivo y activa monstruos y trampas.

**Fase 4 – Señor Oscuro automático**: monstruos con A* y reglas sencillas, con niveles de dificultad.

**Fase 5 – Misiones y persistencia**: misiones en JSON, guardar y reanudar partidas.

## 6. Preguntas abiertas

- ¿Fire Stick, tablet o ambos como tablero? (depende de la Fase 0)
- Número y tipo de héroes, y nivel de complejidad de las reglas para que jueguen los niños.
- ¿Guardar el estado de la partida en el propio tablero (localStorage/IndexedDB) es suficiente?

## 7. Forma de trabajar

- El usuario prefiere **documentar y acordar los requisitos antes de implementar**.
  Para cada fase, presenta primero un plan breve y espera confirmación.
- Cambios pequeños y verificables, con commits descriptivos.
- Mantener actualizado este brief y el README cuando cambie una decisión o el protocolo.
- Para probar en local: servir la raíz del repositorio con `python -m http.server 8000` (sin npm) y abrir
  `localhost:8000/mazmorra/host.html` y `localhost:8000/mazmorra/mando.html` en dos pestañas
  (contexto seguro). Hace falta internet para el emparejamiento de PeerJS.

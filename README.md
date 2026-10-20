# Juegos Familiares

Juegos para jugar en familia desde el navegador (móvil, tablet, tele u ordenador).
Sin instalar nada: HTML, CSS y JavaScript que el navegador carga directamente.

Publicado en <https://jmorecru.github.io/juegos-familiares/>.

## Juegos

| Juego                         | Qué es                                                                   | Estado          |
|-------------------------------|--------------------------------------------------------------------------|-----------------|
| [Mazmorra](mazmorra/)         | Aventura por turnos: héroes contra el Señor Oscuro. La tele o una tablet hace de tablero y cada jugador usa su móvil como mando. | Prueba de humo  |

## Cómo está organizado

```
index.html     portada: selección de juego
styles.css     estilos de la portada
version.js     indicador de versión común a todas las páginas
.githooks/     hook de git que actualiza version.js en cada commit
mazmorra/      un juego por carpeta, con sus propias páginas, estilos, README y documentación
```

Cada juego es independiente: tiene su propio `README.md` con cómo funciona por dentro y cómo probarlo.

**Añadir un juego**: crear su carpeta con un `index.html` propio, añadir su tarjeta en el `<nav class="juegos">`
de `index.html` (con su clase de color en `styles.css`) y una fila en la tabla de arriba.

Todos los juegos se publican desde el mismo dominio y comparten `localStorage`: cada juego usa un prefijo
propio en sus claves (por ejemplo `mazmorra.`).

## Versión

Todas las páginas muestran abajo a la izquierda la versión cargada, por ejemplo `v7 · 2026-10-19 14:05`.

- **Número**: commits del repositorio + 1. **Fecha**: la del commit.
- La página vuelve a pedir `version.js` sin caché al abrirse, cada 2 minutos y al volver a la pestaña.
  Si hay una versión publicada más nueva, el indicador se pone amarillo y pide recargar; al tocarlo, recarga.
- La línea `const VERSION = …` de `version.js` la escribe `.githooks/pre-commit` en cada commit. No se edita a mano.
- El hook también pone el número en cada página que carga el indicador (`version.js?v=N`). GitHub Pages
  deja guardar los ficheros 10 minutos (`Cache-Control: max-age=600`) y, al recargar, el navegador puede
  reutilizar la copia vieja de `version.js` aunque la página sea nueva: con `?v=N` cada versión es una dirección distinta.
  Al tocar el aviso, la página se abre con `?v=N` por el mismo motivo.
- El hook solo mete en el commit esas líneas, no otros cambios sin preparar de esos ficheros.
- **En cada clon nuevo hay que activar el hook una vez**: `git config core.hooksPath .githooks`.
  Sin esto, los commits no actualizan la versión.
- Para cargar el indicador en una página nueva: `<script src="version.js"></script>` (o `../version.js`
  desde la carpeta de un juego) justo antes de `</body>`. El `?v=N` lo añade el hook en el siguiente commit.

## Ponerlo en marcha

- **En el ordenador**: desde la raíz del repositorio, `python -m http.server 8000` y abrir <http://localhost:8000/>.
- **Publicación**: GitHub Pages desde la rama `main`, carpeta raíz. Cada push a `main` se publica solo
  en un par de minutos.

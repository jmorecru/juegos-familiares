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
mazmorra/      un juego por carpeta, con sus propias páginas, estilos, README y documentación
```

Cada juego es independiente: tiene su propio `README.md` con cómo funciona por dentro y cómo probarlo.

**Añadir un juego**: crear su carpeta con un `index.html` propio, añadir su tarjeta en el `<nav class="juegos">`
de `index.html` (con su clase de color en `styles.css`) y una fila en la tabla de arriba.

Todos los juegos se publican desde el mismo dominio y comparten `localStorage`: cada juego usa un prefijo
propio en sus claves (por ejemplo `mazmorra.`).

## Ponerlo en marcha

- **En el ordenador**: desde la raíz del repositorio, `python -m http.server 8000` y abrir <http://localhost:8000/>.
- **Publicación**: GitHub Pages desde la rama `main`, carpeta raíz. Cada push a `main` se publica solo
  en un par de minutos.

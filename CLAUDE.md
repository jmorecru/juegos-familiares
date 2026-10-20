# Juegos Familiares

Proyecto personal: juegos para jugar en familia desde el navegador (móvil, tablet u ordenador).
Se publica en GitHub Pages desde la cuenta `jmorecru` (repositorio `jmorecru/juegos-familiares`).

## Estructura
- La raíz (`index.html` + `styles.css`) es solo la **selección de juego**.
- **Cada juego en su carpeta** (`mazmorra/`, …) con sus páginas, estilos, `README.md` y documentación propios.
  Lo que es de un juego no va en la raíz.
- Todos comparten origen (`jmorecru.github.io`): las claves de localStorage llevan el prefijo del juego.
- **Versión visible** en todas las páginas con `version.js`: cada página nueva lo carga antes de `</body>`.
  El número lo pone el hook `.githooks/pre-commit`. Comprueba que `git config core.hooksPath` devuelve
  `.githooks` antes de hacer commit.
- El hook pone `?v=N` en los `.js` y `.css` propios que cargan las páginas y en los valores del mapa de
  importaciones (`<script type="importmap">`), para que el navegador no mezcle ficheros guardados de versiones
  distintas. Al añadir un módulo ES, añádelo al mapa de importaciones de las páginas que lo usan.

## Cómo se trabaja aquí
- **Sin frameworks ni build**: HTML, CSS y JavaScript que el navegador carga directamente. Nada de npm, bundlers ni transpiladores salvo que se decida explícitamente y se apunte en `PENDIENTES.md`.
- Todo funciona con un servidor estático local (`python -m http.server 8000` desde la raíz). Los juegos con
  módulos ES (la mazmorra) no funcionan abriéndolos con `file://`.
- **Documentación en español**: `README.md` (qué hace, cómo funciona por dentro, cómo ponerlo en marcha) y `PENDIENTES.md` (tareas abiertas con su porqué y una sección "ya comprobado" para no repetir trabajo). Actualízalos al cerrar cada cambio.
- **Commits** en español, en imperativo, una línea y **sin acentos ni caracteres especiales** ("Anade marcador", no "Añade marcador").
- Rama `main`. Antes del primer push, comprueba `git config user.email`: tiene que salir el noreply de GitHub.
- No autorices apps de terceros sobre la cuenta de GitHub: para desplegar, GitHub Pages o un token propio del servicio.
- Verifica en el navegador lo que dependa de él (audio, táctil, pantalla completa) antes de darlo por hecho; en iPhone el audio necesita un gesto del usuario.
- Imágenes y sonidos: solo con licencia libre y anotados en `CREDITOS.md`.

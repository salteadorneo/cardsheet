# CardSheet

Maquetador web para imprimir cartas TCG en hojas A4. Sin build ni backend: abre `index.html` y listo.

## Qué hace

- Cuadrícula automática según el tamaño de carta (más cartas si son pequeñas).
- Presets de tamaños típicos: Estándar 63×88, Yu-Gi-Oh! 59×86, Bridge 56×87, American 57×89, Mini 44×63, Mini Europea 44×67, o tamaño personalizado.
- Arrastra imágenes (se acomodan solas) o haz clic en una casilla. Reordena arrastrando entre casillas/páginas.
- Añade páginas, vacía todo, imprime o descarga PDF.

## Uso

1. Descarga/clona el repo.
2. Abre `index.html` en el navegador.
3. Elige tamaño, arrastra imágenes, imprime o descarga PDF.

## Estructura

```
index.html   # UI (sidebar + área de páginas)
style.css    # estilos + impresión (margen 5 mm)
script.js    # lógica de cuadrícula, drag&drop, PDF
vendor/      # jsPDF
```

## Licencia

MIT. Ver [LICENSE](LICENSE).
# CardSheet

> Cartas TCG → A4

Aplicación web (HTML/CSS/JS puro, sin dependencias de build) para maquetar imágenes de cartas de juegos de cartas coleccionables (TCG) en hojas A4 e imprimirlas o exportarlas a PDF.

Pensada para imprimir proxies/collages de cartas: cada hoja A4 aloja una cuadrícula 3×3 de cartas, con tamaño de carta configurable (por defecto 63×88 mm, estándar de carta).

## Características

- Cuadrícula de 3×3 cartas por página A4 (9 cartas por hoja).
- Tamaño de carta configurable en milímetros (ancho/alto), con botón para volver al tamaño estándar 63×88 mm.
- Arrastrar y soltar imágenes desde el escritorio o el navegador; se acomodan automáticamente en las casillas vacías.
- Clic en una casilla para seleccionar archivos.
- Reordenar cartas arrastrándolas entre casillas (incluso entre páginas).
- Añadir/eliminar páginas; vaciar todo con confirmación.
- Imprimir directamente con estilos de impresión optimizados (sin márgenes, salto de página por hoja).
- Descargar como PDF (jsPDF), con recorte tipo "cover" para mantener la proporción de cada carta.
- Sin backend ni instalación: basta con abrir `index.html` en un navegador.

## Uso

1. Clona o descarga este repositorio.
2. Abre `index.html` en tu navegador (doble clic o sirve la carpeta con cualquier servidor estático).
3. Ajusta el tamaño de carta si lo necesitas y empieza a arrastrar imágenes.

No requiere Node, build ni dependencias externas más allá de `vendor/jspdf.umd.min.js` (incluido).

## Estructura del proyecto

```
print-a4/
├── index.html          # Estructura de la página y barra de herramientas
├── style.css           # Estilos de la interfaz y de impresión
├── script.js           # Lógica de la cuadrícula, arrastrar/soltar y exportación
├── vendor/
│   └── jspdf.umd.min.js  # jsPDF (UMD) para la exportación a PDF
├── README.md
└── LICENSE
```

## Tecnologías

- HTML5, CSS3, JavaScript (vanilla, ES2015+).
- [jsPDF](https://github.com/parallax/jsPDF) para la generación del PDF.

## Licencia

Este proyecto se distribuye bajo la licencia MIT. Consulta el archivo [LICENSE](LICENSE).

## Contribuir

Las contribuciones son bienvenidas. Abre un issue o un pull request con tu propuesta. Al contribuir, aceptas que tu código se publique bajo la misma licencia MIT.
let cols = 3;
let rows = 3;
let cellsPerPage = 9;
let pages = [ new Array(cellsPerPage).fill(null) ]; // pages[pageIndex][cellIndex] = { src } | null

const pagesContainer = document.getElementById('pagesContainer');
const fileInput = document.getElementById('fileInput');
const cardWidthInput = document.getElementById('cardWidth');
const cardHeightInput = document.getElementById('cardHeight');

let pendingTarget = null; // { pageIndex, cellIndex }
let cellElements = []; // cellElements[pageIndex][cellIndex] = DOM node, kept in sync with `pages`

function computeGrid(w, h) {
  cols = Math.max(1, Math.floor(210 / w));
  rows = Math.max(1, Math.floor(297 / h));
  return cols * rows;
}

function applySizeVars() {
  const w = parseFloat(cardWidthInput.value) || 63;
  const h = parseFloat(cardHeightInput.value) || 88;
  document.documentElement.style.setProperty('--cw', `${w}mm`);
  document.documentElement.style.setProperty('--ch', `${h}mm`);

  const newCells = computeGrid(w, h);
  if (newCells !== cellsPerPage) {
    // Reflow existing cards into the new grid size
    const allCards = pages.flat().filter(Boolean);
    cellsPerPage = newCells;
    pages = [];
    for (let i = 0; i < allCards.length; i += cellsPerPage) {
      const chunk = allCards.slice(i, i + cellsPerPage);
      while (chunk.length < cellsPerPage) chunk.push(null);
      pages.push(chunk);
    }
    if (pages.length === 0) pages = [ new Array(cellsPerPage).fill(null) ];
    buildPages();
  }
}

function buildPages() {
  pagesContainer.innerHTML = '';
  cellElements = [];
  pages.forEach((page, pageIndex) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'page-wrapper';

    const toolbar = document.createElement('div');
    toolbar.className = 'page-toolbar no-print';
    toolbar.innerHTML = `<span>Página ${pageIndex + 1}</span>`;
    if (pages.length > 1) {
      const removeBtn = document.createElement('button');
      removeBtn.textContent = 'Eliminar página';
      removeBtn.addEventListener('click', () => removePage(pageIndex));
      toolbar.appendChild(removeBtn);
    }
    wrapper.appendChild(toolbar);

    const pageEl = document.createElement('div');
    pageEl.className = 'page';

    const gridEl = document.createElement('div');
    gridEl.className = 'grid';
    gridEl.style.gridTemplateColumns = `repeat(${cols}, var(--cw))`;
    gridEl.style.gridTemplateRows = `repeat(${rows}, var(--ch))`;
    gridEl.addEventListener('dragover', (e) => e.preventDefault());

    cellElements[pageIndex] = [];
    for (let cellIndex = 0; cellIndex < cellsPerPage; cellIndex++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.page = pageIndex;
      cell.dataset.index = cellIndex;

      cell.addEventListener('dragover', onCellDragOver);
      cell.addEventListener('dragleave', onCellDragLeave);
      cell.addEventListener('drop', onCellDrop);
      cell.addEventListener('click', onCellClick);

      cellElements[pageIndex][cellIndex] = cell;
      gridEl.appendChild(cell);
      renderCell(pageIndex, cellIndex);
    }

    pageEl.appendChild(gridEl);
    wrapper.appendChild(pageEl);
    pagesContainer.appendChild(wrapper);
  });
}

function getCellEl(pageIndex, cellIndex) {
  return cellElements[pageIndex]?.[cellIndex];
}

function renderCell(pageIndex, cellIndex) {
  const cell = getCellEl(pageIndex, cellIndex);
  if (!cell) return;
  cell.innerHTML = '';
  const card = pages[pageIndex][cellIndex];

  if (!card) {
    const placeholder = document.createElement('div');
    placeholder.className = 'placeholder';
    placeholder.textContent = 'Arrastra o haz clic';
    cell.appendChild(placeholder);
    return;
  }

  const img = document.createElement('img');
  img.src = card.src;
  img.draggable = true;
  img.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', `${pageIndex}:${cellIndex}`);
    e.dataTransfer.effectAllowed = 'move';
  });
  cell.appendChild(img);

  const removeBtn = document.createElement('button');
  removeBtn.className = 'remove no-print';
  removeBtn.textContent = '✕';
  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    pages[pageIndex][cellIndex] = null;
    renderCell(pageIndex, cellIndex);
  });
  cell.appendChild(removeBtn);
}

function onCellDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add('dragover');
}

function onCellDragLeave(e) {
  e.currentTarget.classList.remove('dragover');
}

function onCellDrop(e) {
  e.preventDefault();
  const cell = e.currentTarget;
  cell.classList.remove('dragover');
  const targetPage = Number(cell.dataset.page);
  const targetIndex = Number(cell.dataset.index);

  // Reordering an existing card between cells (works across pages too)
  const sourceRaw = e.dataTransfer.getData('text/plain');
  if (sourceRaw && e.dataTransfer.files.length === 0) {
    const [sourcePageStr, sourceIndexStr] = sourceRaw.split(':');
    const sourcePage = Number(sourcePageStr);
    const sourceIndex = Number(sourceIndexStr);
    if (!Number.isNaN(sourcePage) && !Number.isNaN(sourceIndex) &&
        (sourcePage !== targetPage || sourceIndex !== targetIndex)) {
      const tmp = pages[targetPage][targetIndex];
      pages[targetPage][targetIndex] = pages[sourcePage][sourceIndex];
      pages[sourcePage][sourceIndex] = tmp;
      renderCell(sourcePage, sourceIndex);
      renderCell(targetPage, targetIndex);
    }
    return;
  }

  // Dropping one or more image files from the desktop/browser
  const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
  if (files.length === 0) return;

  placeFilesStartingAt(files, targetPage, targetIndex);
}

// Fills the targeted cell first, then spills into the next empty cells (creating pages as needed)
function placeFilesStartingAt(files, startPage, startIndex) {
  const slots = [];
  let fileIdx = 0;
  let pageIndex = startPage;
  let cellIndex = startIndex;

  while (fileIdx < files.length) {
    if (pageIndex >= pages.length) pages.push(new Array(cellsPerPage).fill(null));

    if (!pages[pageIndex][cellIndex] || (pageIndex === startPage && cellIndex === startIndex)) {
      slots.push({ pageIndex, cellIndex });
      fileIdx++;
    }

    cellIndex++;
    if (cellIndex >= cellsPerPage) {
      cellIndex = 0;
      pageIndex++;
    }
  }

  buildPages();

  slots.forEach(({ pageIndex, cellIndex }, i) => {
    readFileAsDataURL(files[i]).then(src => {
      pages[pageIndex][cellIndex] = { src };
      renderCell(pageIndex, cellIndex);
    });
  });
}

function onCellClick(e) {
  const cell = e.currentTarget;
  pendingTarget = { pageIndex: Number(cell.dataset.page), cellIndex: Number(cell.dataset.index) };
  fileInput.value = '';
  fileInput.click();
}

fileInput.addEventListener('change', () => {
  const files = Array.from(fileInput.files).filter(f => f.type.startsWith('image/'));
  if (files.length === 0 || !pendingTarget) return;
  placeFilesStartingAt(files, pendingTarget.pageIndex, pendingTarget.cellIndex);
});

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

document.getElementById('addPage').addEventListener('click', () => {
  pages.push(new Array(cellsPerPage).fill(null));
  buildPages();
});

function removePage(pageIndex) {
  if (pages.length <= 1) return;
  const hasCards = pages[pageIndex].some(c => c);
  if (hasCards && !confirm('Esta página tiene cartas. ¿Eliminarla de todas formas?')) return;
  pages.splice(pageIndex, 1);
  buildPages();
}

document.getElementById('clearAll').addEventListener('click', () => {
  if (!confirm('¿Vaciar todas las páginas?')) return;
  pages = [ new Array(cellsPerPage).fill(null) ];
  buildPages();
});

document.getElementById('printBtn').addEventListener('click', () => window.print());

cardWidthInput.addEventListener('input', applySizeVars);
cardHeightInput.addEventListener('input', applySizeVars);
document.getElementById('resetSize')?.addEventListener('click', () => {
  cardWidthInput.value = 63;
  cardHeightInput.value = 88;
  applySizeVars();
});

document.querySelectorAll('.preset').forEach(btn => {
  btn.addEventListener('click', () => {
    cardWidthInput.value = btn.dataset.w;
    cardHeightInput.value = btn.dataset.h;
    applySizeVars();
  });
});

// --- PDF export ---

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Crops/scales the source image to exactly cover the target box (like CSS object-fit: cover),
// so cards keep their proper proportion regardless of the original image size.
function coverCropToCanvas(img, targetWmm, targetHmm, pxPerMm) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(targetWmm * pxPerMm);
  canvas.height = Math.round(targetHmm * pxPerMm);
  const ctx = canvas.getContext('2d');

  // Fill white first: JPEG has no alpha, so transparent PNG areas would otherwise turn black
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const targetRatio = canvas.width / canvas.height;
  const srcRatio = img.width / img.height;

  let sx, sy, sw, sh;
  if (srcRatio > targetRatio) {
    sh = img.height;
    sw = sh * targetRatio;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / targetRatio;
    sx = 0;
    sy = (img.height - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return canvas;
}

async function generatePdf() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  const cardW = parseFloat(cardWidthInput.value) || 63;
  const cardH = parseFloat(cardHeightInput.value) || 88;
  const pageW = 210;
  const pageH = 297;
  const gridW = cardW * cols;
  const gridH = cardH * rows;
  const offsetX = Math.max(0, (pageW - gridW) / 2);
  const offsetY = Math.max(0, (pageH - gridH) / 2);
  const pxPerMm = 12; // resolution used for cropping, good enough for print quality

  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    if (pageIndex > 0) doc.addPage();

    for (let cellIndex = 0; cellIndex < cellsPerPage; cellIndex++) {
      const card = pages[pageIndex][cellIndex];
      if (!card) continue;

      const row = Math.floor(cellIndex / cols);
      const col = cellIndex % cols;
      const x = offsetX + col * cardW;
      const y = offsetY + row * cardH;

      const img = await loadImage(card.src);
      const canvas = coverCropToCanvas(img, cardW, cardH, pxPerMm);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      doc.addImage(dataUrl, 'JPEG', x, y, cardW, cardH);
    }
  }

  doc.save('cartas-a4.pdf');
}

document.getElementById('pdfBtn').addEventListener('click', () => {
  if (pages.every(page => page.every(c => !c))) {
    alert('Agrega al menos una imagen antes de descargar el PDF.');
    return;
  }
  generatePdf();
});

applySizeVars();
buildPages();

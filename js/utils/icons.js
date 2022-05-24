/**
   * Icons used in the projects
   * --------------------------
   **/


const eraser= `
<svg xmlns="http://www.w3.org/2000/svg" id="erase" class="icon icon-tabler icon-tabler-eraser" width="44" height="44" viewBox="0 0 24 24" stroke-width="1.5" stroke="#2c3e50" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
  <path d="M19 19h-11l-4 -4a1 1 0 0 1 0 -1.41l10 -10a1 1 0 0 1 1.41 0l5 5a1 1 0 0 1 0 1.41l-9 9" />
  <line x1="18" y1="12.3" x2="11.7" y2="6" />
</svg>`;

const remove= `
<svg xmlns="http://www.w3.org/2000/svg" id="remove" class="icon icon-tabler icon-tabler-square-x" width="44" height="44" viewBox="0 0 24 24" stroke-width="1.5" stroke="#2c3e50" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
  <rect x="4" y="4" width="16" height="16" rx="2" />
  <path d="M10 10l4 4m0 -4l-4 4" />
</svg>`;


const sheet= `
<svg xmlns="http://www.w3.org/2000/svg" id="sheet" class="icon icon-tabler icon-tabler-table" width="44" height="44" viewBox="0 0 24 24" stroke-width="1.5" stroke="#2c3e50" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
  <rect x="4" y="4" width="16" height="16" rx="2" />
  <line x1="4" y1="10" x2="20" y2="10" />
  <line x1="10" y1="4" x2="10" y2="20" />
</svg>`;


const run= `
<svg xmlns="http://www.w3.org/2000/svg" id="run" class="icon icon-tabler icon-tabler-run" width="44" height="44" viewBox="0 0 24 24" stroke-width="1.5" stroke="#000000" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
  <circle cx="13" cy="4" r="1" />
  <path d="M4 17l5 1l.75 -1.5" />
  <path d="M15 21l0 -4l-4 -3l1 -6" />
  <path d="M7 12l0 -3l5 -1l3 3l3 1" />
</svg>`;


const externalLink= `
<svg xmlns="http://www.w3.org/2000/svg" id="external-link" class="icon icon-tabler icon-tabler-external-link" width="44" height="44" viewBox="0 0 24 24" stroke-width="1.5" stroke="#000000" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
  <path d="M11 7h-5a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-5" />
  <line x1="10" y1="14" x2="20" y2="4" />
  <polyline points="15 4 20 4 20 9" />
</svg>`;

const sheetImport= `<svg xmlns="http://www.w3.org/2000/svg" id="sheet-import" class="icon icon-tabler icon-tabler-table-import" width="44" height="44" viewBox="0 0 24 24" stroke-width="1.5" stroke="#000000" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
  <path d="M4 13.5v-7.5a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-6m-8 -10h16m-10 -6v11.5m-8 3.5h7m-3 -3l3 3l-3 3" />
</svg>`;

const sheetExport= `<svg xmlns="http://www.w3.org/2000/svg" id="sheet-export" class="icon icon-tabler icon-tabler-table-export" width="44" height="44" viewBox="0 0 24 24" stroke-width="1.5" stroke="#000000" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
  <path d="M11.5 20h-5.5a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v7.5m-16 -3.5h16m-10 -6v16m4 -1h7m-3 -3l3 3l-3 3" />
</svg>`;

const trash = `<svg xmlns="http://www.w3.org/2000/svg" id="trash" class="icon icon-tabler icon-tabler-trash" width="44" height="44" viewBox="0 0 24 24" stroke-width="1.5" stroke="#000000" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
  <line x1="4" y1="7" x2="20" y2="7" />
  <line x1="10" y1="11" x2="10" y2="17" />
  <line x1="14" y1="11" x2="14" y2="17" />
  <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
  <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
</svg>`;

const link = `<svg xmlns="http://www.w3.org/2000/svg" id="link" class="icon icon-tabler icon-tabler-link" width="44" height="44" viewBox="0 0 24 24" stroke-width="1.5" stroke="#000000" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
  <path d="M10 14a3.5 3.5 0 0 0 5 0l4 -4a3.5 3.5 0 0 0 -5 -5l-.5 .5" />
  <path d="M14 10a3.5 3.5 0 0 0 -5 0l-4 4a3.5 3.5 0 0 0 5 5l.5 -.5" />
</svg>`;


const unlink = `<svg xmlns="http://www.w3.org/2000/svg" id="unlink" class="icon icon-tabler icon-tabler-unlink" width="44" height="44" viewBox="0 0 24 24" stroke-width="1.5" stroke="#000000" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
  <path d="M10 14a3.5 3.5 0 0 0 5 0l4 -4a3.5 3.5 0 0 0 -5 -5l-.5 .5" />
  <path d="M14 10a3.5 3.5 0 0 0 -5 0l-4 4a3.5 3.5 0 0 0 5 5l.5 -.5" />
  <line x1="16" y1="21" x2="16" y2="19" />
  <line x1="19" y1="16" x2="21" y2="16" />
  <line x1="3" y1="8" x2="5" y2="8" />
  <line x1="8" y1="3" x2="8" y2="5" />
</svg>`;

const icons = {
    eraser: eraser,
    remove: remove,
    sheet: sheet,
    run: run,
    externalLink: externalLink,
    sheetImport: sheetImport,
    sheetExport: sheetExport,
    trash: trash,
    link: link,
    unlink: unlink,
}


export{
    icons,
    icons as default
}

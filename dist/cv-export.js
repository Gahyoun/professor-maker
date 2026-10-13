import {renderCV} from './cv.js';

const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/** One offline document: frozen room pixels and a Korean font travel with the CV. */
export function buildCVExportDocument({model,css=''}){
  const html=renderCV(model),safeCSS=String(css).replace(/<\/style/gi,'<\\/style');
  return `<!doctype html><html lang="${model.locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'"><title>${escapeHTML(model.name)} · ${model.locale==='en'?'Curriculum Vitae':'연구자 CV'}</title><style>body{margin:0;padding:16px;background:#f3f4f5}@media print{body{padding:0;background:white}}${safeCSS}</style></head><body class="cv-standalone">${html}</body></html>`;
}

export async function loadCVExportStyles(fetchResource=fetch){
  const response=await fetchResource('./cv.css');
  if(!response.ok)throw new Error('CV stylesheet unavailable.');
  const css=await response.text();
  try{
    const font=await fetchResource('./assets/fonts/NotoSansKR.woff2');
    if(!font.ok)return css;
    const bytes=new Uint8Array(await font.arrayBuffer());let binary='';
    for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
    return `@font-face{font-family:'PM CV';font-style:normal;font-weight:100 900;src:url(data:font/woff2;base64,${btoa(binary)}) format('woff2')}${css}`;
  }catch{return css;}
}

import test from 'node:test';
import assert from 'node:assert/strict';
import {createState} from '../dist/engine.js';
import {buildEndingCV} from '../dist/cv.js';
import {buildCVExportDocument,loadCVExportStyles} from '../dist/cv-export.js';

test('offline CV export embeds the exact frozen room and separates the A4 CV from the screen report',()=>{
 const state=createState('김하늘',9);state.month=24;state.ending='bachelor';
 const {model}=buildEndingCV(state),before=structuredClone(model),doc=buildCVExportDocument({model,css:'@page{size:A4}'});
 assert.match(doc,/CURRICULUM VITAE/);assert.match(doc,/cv-print-form/);
 assert.equal((doc.match(/<img /g)||[]).length,1);
 assert.ok(doc.includes(model.labScene.image.replace(/[&"'<>]/g,c=>({'&':'&amp;','"':'&quot;',"'":'&#39;','<':'&lt;','>':'&gt;'}[c]))));
 assert.match(doc,/img-src data:; font-src data:/);assert.ok(!doc.includes('<script'));assert.deepEqual(model,before);
 assert.throws(()=>buildCVExportDocument({model:{name:'<script>'}}));
 assert.ok(!buildCVExportDocument({model,css:'</style><script>x</script>'}).includes('</style><script>'));
});
test('CV stylesheet packs its Korean font and falls back gracefully if the font cannot load',async()=>{
 const calls=[],fake=async url=>{calls.push(url);return url.endsWith('.css')?new Response('CV-CSS'):new Response(new Uint8Array([0,1,2,3]));};
 const css=await loadCVExportStyles(fake);assert.match(css,/data:font\/woff2;base64,AAECAw==/);assert.ok(css.endsWith('CV-CSS'));assert.deepEqual(calls,['./cv.css','./assets/fonts/NotoSansKR.woff2']);
 assert.equal(await loadCVExportStyles(async url=>url.endsWith('.css')?new Response('CV-CSS'):new Response('',{status:404})),'CV-CSS');
 await assert.rejects(()=>loadCVExportStyles(async()=>new Response('',{status:404})));
});

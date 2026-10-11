import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {editionStorageKey,campusEditionHref,currencyFormat} from '../dist/edition.js';
test('regional entry links, save keys and modeled dollar budgets remain separate',()=>{
 assert.equal(campusEditionHref('en'),'./en.html');assert.equal(campusEditionHref('ko'),'./index.html');
 for(const key of ['pm-save-v4','pm-letters-v3','pm-admission-v1','pm-letter-passages-v1','pm-fast']){assert.equal(editionStorageKey(key,'ko'),key);assert.equal(editionStorageKey(key,'en'),'pm-us-'+key.slice(3));}
 assert.equal(currencyFormat(60,'en'),'$15,000');assert.equal(currencyFormat(60,'ko'),'600만원');
});
test('English entry and offline navigation retain the U.S. edition and its own install identity',async()=>{
 const root=new URL('../dist/',import.meta.url),[html,worker,manifest]=await Promise.all(['en.html','sw.js','manifest-en.webmanifest'].map(file=>readFile(new URL(file,root),'utf8')));
 assert.match(html,/<html lang="en">/);assert.match(html,/us-campus\.css/);assert.match(html,/manifest-en\.webmanifest/);
 const install=JSON.parse(manifest);assert.equal(install.start_url,'./en.html');assert.equal(install.id,'./en.html');assert.equal(install.lang,'en-US');
 assert.match(worker,/pathname\.endsWith\('\/en\.html'\)\?'\.\/en\.html':'\.\/index\.html'/);
 for(const asset of ['en.html','us-campus.css','manifest-en.webmanifest','edition-storage.js','content-en.js','campus-calendar.js'])assert.ok(worker.includes("'./"+asset+"'"));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('the offline install includes every local module needed by the app and simulation worker',async()=>{
  const root=new URL('../dist/',import.meta.url);
  const worker=await readFile(new URL('sw.js',root),'utf8');
  const declaration=worker.match(/const ASSETS=(\[[^\n]+\]);/);
  assert.ok(declaration,'service-worker install list exists');
  const cached=new Set([...declaration[1].matchAll(/'([^']+)'/g)].map(match=>new URL(match[1],root).href));
  const seen=new Set(),pending=[new URL('app.js',root),new URL('simulation-worker.js',root)];
  while(pending.length){
    const file=pending.pop();if(seen.has(file.href))continue;seen.add(file.href);
    assert.ok(cached.has(file.href),`uncached offline dependency: ${file.pathname.split('/').at(-1)}`);
    const source=await readFile(file,'utf8');
    for(const match of source.matchAll(/\b(?:import|export)\s[^;]*?\bfrom\s*['"](\.[^'"]+\.js)['"]/g))pending.push(new URL(match[1],file));
  }
  assert.ok(seen.has(new URL('lab-season.js',root).href));
  assert.ok(seen.has(new URL('cv-lab-scene.js',root).href));
});

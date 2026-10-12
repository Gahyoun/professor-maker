import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const root=new URL('../dist/',import.meta.url);
const entry='physics-story-eb03f2f340a5fd8e128e2069b7b3119729f60a7aec5cef2a3f8062a34933037e.html';
test('the shared story is unlisted, search-excluded and isolated from game persistence',async()=>{
 const html=await readFile(new URL(entry,root),'utf8');assert.match(html,/name="robots" content="noindex,nofollow,noarchive"/);assert.match(html,/physics-story-viewer\.js/);
 for(const file of ['index.html','en.html','app.js','onboarding-ui.js','release-notes.js','manifest.webmanifest','manifest-en.webmanifest']){
  const source=await readFile(new URL(file,root),'utf8');assert.ok(!source.includes(entry),`${file} must not expose the shared page`);
 }
 const viewer=await readFile(new URL('physics-story-viewer.js',root),'utf8');
 assert.doesNotMatch(viewer,/\b(?:localStorage|sessionStorage|indexedDB|fetch|XMLHttpRequest|sendBeacon|Worker)\b|\.\/app\.js|\.\/engine\.js|\.\/analytics\.js|serviceWorker/);
});
test('the game service worker never intercepts isolated story reader pages or assets',async()=>{
 const source=await readFile(new URL('sw.js',root),'utf8'),listeners={};
 vm.runInNewContext(source,{URL,Request,self:{location:{origin:'https://example.test'},skipWaiting(){},addEventListener:(event,fn)=>{listeners[event]=fn;}}});
 const assets=source.match(/const ASSETS=(\[[^\n]+\]);/)[1];
 for(const file of [entry,'physics-story-viewer.js','physics-story-viewer.css','physics-story.js','physics-ending-record.js']){
  assert.ok(!assets.includes(file));let intercepted=false;
  listeners.fetch({request:{url:`https://example.test/${file}`,method:'GET'},respondWith(){intercepted=true;}});
  assert.equal(intercepted,false,file);
 }
});

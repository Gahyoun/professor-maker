import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {execFileSync} from 'node:child_process';
test('portable Worker preserves assets and security policy across cached responses and HEAD',async()=>{
 execFileSync(process.execPath,['scripts/build-hosted.mjs']);const {default:worker}=await import('../dist/server/index.js');
 const request=path=>new Request('https://example.test'+path);for(const path of ['/','/professor-maker/index.html','/admin.html','/appearance.js']){
 const response=await worker.fetch(request(path),{});assert.equal(response.status,200);assert.equal(response.headers.get('x-content-type-options'),'nosniff');assert.match(response.headers.get('content-security-policy'),/frame-ancestors 'none'/);assert.match(response.headers.get('content-security-policy'),/object-src 'none'/);const first=await response.text();assert.equal(await (await worker.fetch(request(path),{})).text(),first);
 }const head=await worker.fetch(new Request('https://example.test/',{method:'HEAD'}),{});assert.equal(await head.text(),'');assert.equal((await worker.fetch(request('/api/admin/summary'),{DB:{},ADMIN_KEY:'a'.repeat(64)})).status,401);
 assert.equal((await worker.fetch(new Request('https://example.test/',{method:'POST'}),{})).status,405);const index=await fs.readFile('dist/index.html','utf8');assert.match(index,/Content-Security-Policy/);assert.ok(!/<script(?![^>]*src=)[^>]*>\s*\S/.test(index));
});

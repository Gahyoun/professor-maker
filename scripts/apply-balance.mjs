import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {validBalance} from '../dist/balance.js';
const input=process.argv[2];if(!input)throw new Error('Provide the absolute path of the owner balance JSON.');
const value=JSON.parse(await fs.readFile(input,'utf8'));if(!validBalance(value))throw new Error('Invalid balance values; no game file changed.');
const file=fileURLToPath(new URL('../dist/balance.js',import.meta.url)),source=await fs.readFile(file,'utf8');await fs.writeFile(file,source.replace(/export const GAME_BALANCE = \{[\s\S]*?\};/,`export const GAME_BALANCE = ${JSON.stringify(value,null,2)};`));console.log('Balance updated. Run tests before committing and publishing.');

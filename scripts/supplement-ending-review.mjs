// Add real independently played endings to the review corpus, never to the 10k counts.
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {validateSave,canDefend} from '../dist/engine.js';
import {getDiscipline} from '../dist/disciplines.js';
const root=new URL('../',import.meta.url),file=p=>new URL(p,root),hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const reviewPath=file('docs/ending-audit-samples.json'),rawPath=file('docs/ending-audit-10000-samples.json');
const input=JSON.parse(await fs.readFile(reviewPath,'utf8'));
const raw=input.corpusKind==='review'?JSON.parse(await fs.readFile(rawPath,'utf8')):input;
const currentVersion=JSON.parse(await fs.readFile(file('package.json'),'utf8')).version;
if(!raw.samples.length||raw.engineVersion!==currentVersion)throw Error('Expected current real 10,000-policy samples');
await fs.writeFile(rawPath,JSON.stringify(raw,null,2)+'\n');
const engineTestBytes=await fs.readFile(file('tests/engine.test.mjs'));
// The exported actual-play fixture precedes test declarations; no state editing or mocks.
let policy=engineTestBytes.toString().split("test('version 4")[0];
policy=policy.replaceAll("'./play-support.mjs'",JSON.stringify(file('tests/play-support.mjs').href))
 .replace(/'\.\.\/dist\/([^']+)'/g,(_,p)=>JSON.stringify(file('dist/'+p).href))
 .replace("createState('Test student',seed,","createState(generateKoreanName(seed,'female'),seed,");
policy=`import {generateKoreanName} from ${JSON.stringify(file('dist/names.js').href)};\n`+policy;
const {play}=await import('data:text/javascript;base64,'+Buffer.from(policy).toString('base64'));
const extra=[];
for(const [goal,seed]of [['startup',63352],['true',2],['true',11],['true',13]]){
 const state=play(goal,seed),d=getDiscipline(state.professorProfile.fieldId);
 if(state.ending!==goal||!validateSave(state)||!canDefend(state))throw Error(`Actual ${goal} play failed at seed ${seed}`);
 extra.push({endingId:goal,run:`integration-${goal}-${seed}`,policy:goal==='true'?'integration-faculty':'integration-creative-RA',seed,field:{id:d.id,label:d.label},labMode:state.professorProfile.labMode,
  sourceEngineVersion:raw.engineVersion,sourceAudit:{kind:'independent-actual-play',policySource:'tests/engine.test.mjs',policySourceSha256:hash(engineTestBytes),name:'Seeded Korean name supplied at new-game creation'},state});
}
const focused=JSON.parse(await fs.readFile(file('docs/focused-faculty-sample.json'),'utf8'));
const focusedSample=focused.sample;
if(focused.sourceHashes['dist/engine.js']!==raw.sourceHashes['dist/engine.js']||!validateSave(focusedSample.state)||focusedSample.endingId!=='true')throw Error('Focused sample does not match the final audited engine');
extra.push({...focusedSample,run:`focused-${focusedSample.seed}`,policy:'focused-faculty',sourceEngineVersion:focused.engineVersion,sourceAudit:{kind:'independent-1000-policy-audit',path:'docs/focused-faculty-sample.json'}});
const historical=JSON.parse(await fs.readFile(file('docs/ending-audit-samples-4.13.0.json'),'utf8'));
const video=historical.samples.find(s=>s.endingId==='youtuber');
if(!video||!validateSave(video.state))throw Error('Missing valid historical actual video ending');
extra.push({...video,run:`historical-${video.run}`,sourceEngineVersion:historical.engineVersion,sourceAudit:{kind:'historical-actual-play',path:'docs/ending-audit-samples-4.13.0.json',sourceHashes:historical.sourceHashes}});
const corpus={...raw,corpusKind:'review',generatedAt:new Date().toISOString(),method:'Real current 10,000-policy samples, separate actual faculty/creative-RA/focused plays, and one explicitly historical video sample. Supplemental samples never enter the 10,000-run distribution.',sources:[{path:'docs/ending-audit-10000-samples.json',version:raw.engineVersion,count:raw.samples.length,kind:'main-10000-audit'},{kind:'independent-current-plays',version:raw.engineVersion,count:extra.filter(s=>s.sourceEngineVersion===raw.engineVersion).length},{path:'docs/ending-audit-samples-4.13.0.json',version:historical.engineVersion,count:1,kind:'historical-video'}],samples:[...raw.samples,...extra]};
await fs.writeFile(reviewPath,JSON.stringify(corpus,null,2)+'\n');
const reportPath=file('docs/ending-balance-audit.json'),report=JSON.parse(await fs.readFile(reportPath,'utf8'));
report.samples.path='docs/ending-audit-10000-samples.json';
report.reviewCorpus={path:'docs/ending-audit-samples.json',count:corpus.samples.length,mainAuditSamples:raw.samples.length,independentCurrentSamples:extra.filter(s=>s.sourceEngineVersion===raw.engineVersion).length,historicalSamples:1,excludedFromRunCounts:true};
report.supplementalCoverage={startup:{kind:'independent-actual-play',seed:63352,path:'docs/ending-audit-samples.json'},true:{kind:'independent-actual-play',seeds:[2,11,13,16]},youtuber:{kind:'historical-actual-play',version:historical.engineVersion,path:'docs/ending-audit-samples-4.13.0.json'},excludedFromRunCounts:true};
await fs.writeFile(reportPath,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({rawCount:raw.samples.length,reviewCount:corpus.samples.length,extra:extra.map(s=>({ending:s.endingId,seed:s.seed,version:s.sourceEngineVersion})),path:fileURLToPath(reviewPath)}));

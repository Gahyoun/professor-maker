// One additional allowed-action playthrough, excluded from the main 10,000-run percentages.
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createState,proposeSchedule,calendarMonth,ACTIVITIES,canDefend,validateSave} from '../dist/engine.js';
import {generateKoreanName} from '../dist/names.js';
import {getDiscipline} from '../dist/disciplines.js';
import {managedOptions,affordableEventChoice} from '../tests/play-support.mjs';
const seed=63352,gender='female';
let reply;globalThis.self={postMessage:r=>{reply=r;}};await import('../dist/simulation-worker.js');
const run=(type,state,more={})=>{reply=null;self.onmessage({data:{id:1,type,state,...more}});if(reply.error)throw Error(reply.error);return reply.state;};
const choices={'rest-request':'allow','lab-warning':'acknowledge','workshop-plan':'skip','monthly-issue':'acknowledge','failure-counsel':'review','conversation-topic':'daily','presentation-recovery':'rehearse',story:'encourage','academic-exam':'support','external-admission':'remain',route:'integrated',masters:'continue',qual:'exam',sabbatical:'home',defense:'defend',service:'consult','service-review':'consult'};
let s=createState(generateKoreanName(seed,gender),seed,{gender,age:38});
for(let month=0;month<96&&!s.ending;month++){
 const plan=proposeSchedule(s);
 if(![4,10].includes(calendarMonth(s.month))){plan[3]='industry';if(s.month>=24)plan[0]='industry';}
 if(!plan.every(id=>Object.hasOwn(ACTIVITIES,id)))throw Error('Unavailable activity');
 const options=managedOptions(s,month%4===0?'conversation':'routine'),previousMonth=s.month;
 s=run('month',s,{plan,options});
 if(s.month===previousMonth&&s.pending?.kind==='rest-request'){s=run('decision',s,{choice:'allow'});s=run('month',s,{plan:s.plan,options});}
 for(let guard=0;s.pending&&!s.ending;guard++){
  if(guard>=20)throw Error('Unterminated decision queue');const p=s.pending;
  const choice=p.kind==='event'?affordableEventChoice(s,p.id):p.kind==='conference-plan'?(p.scope==='domestic'?'together':'none'):choices[p.kind]??({draft:'outline',presentation:'present',questions:'answer',revision:'revise',verdict:'confirm'})[p.step];
  s=run('decision',s,{choice});
 }
}
if(s.ending!=='startup'||s.month!==96||!canDefend(s)||!validateSave(s))throw Error(`Expected actual startup ending: ${s.ending} at ${s.month}`);
const report=JSON.parse(await fs.readFile(new URL('../docs/ending-balance-audit.json',import.meta.url),'utf8'));
for(const [file,expected]of Object.entries(report.sourceHashes))if(createHash('sha256').update(await fs.readFile(new URL('../'+file,import.meta.url))).digest('hex')!==expected)throw Error('Main audit source changed: '+file);
const field=getDiscipline(s.professorProfile.fieldId),sample={endingId:'startup',run:null,policy:'focused-venture',seed,supplemental:true,field:{id:field.id,label:field.label},labMode:s.professorProfile.labMode,state:s};
const method='Additional actual simulation-worker playthrough: one RA week during undergraduate study and two during graduate study, protected conferences and a conversation every four months. No injected ability, funds, paper or award. Excluded from the 10,000-run ending percentages.';
const sourceHashes={...report.sourceHashes,'scripts/focused-startup-sample.mjs':createHash('sha256').update(await fs.readFile(new URL(import.meta.url))).digest('hex')};
await fs.writeFile(new URL('../docs/focused-startup-sample.json',import.meta.url),JSON.stringify({engineVersion:report.engineVersion,sourceHashes,method,sample},null,2)+'\n');
const samplesPath=new URL('../docs/ending-audit-samples.json',import.meta.url),samples=JSON.parse(await fs.readFile(samplesPath,'utf8'));
samples.samples=samples.samples.filter(x=>!x.supplemental);samples.samples.push(sample);samples.supplemental={path:'docs/focused-startup-sample.json',method};
await fs.writeFile(samplesPath,JSON.stringify(samples,null,2)+'\n');
report.samples.count=samples.samples.length;report.samples.endingIds=[...new Set(samples.samples.map(x=>x.endingId))];report.samples.fields=[...new Set(samples.samples.map(x=>x.field.id))];
report.supplementalCoverage={excludedFromRunPercentages:true,source:'docs/focused-startup-sample.json',observedCombined:report.majorEndingCoverage.seen.concat(report.majorEndingCoverage.missing.filter(id=>id==='startup')),method};
await fs.writeFile(new URL('../docs/ending-balance-audit.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
const mdPath=new URL('../docs/ending-balance-audit.md',import.meta.url),md=await fs.readFile(mdPath,'utf8');
if(!md.includes('## 별도 창업 경로 확인'))await fs.writeFile(mdPath,md+`\n## 별도 창업 경로 확인\n\n기본 10,000회 혼합의 주 1회 RA 전략에서는 창업이 미관측됐습니다. 학부 RA 1주·대학원 RA 2주를 배정하는 별도 실제 플레이(시드 63352)는 96개월에 창업 엔딩으로 종료했습니다. 이 1회는 위의 비율·분모에 넣지 않습니다. 주요 8종의 실제 종료 표본을 함께 수집해 퇴임식 검토 화면에 제공합니다.\n\n[창업 실제 상태](focused-startup-sample.json) · [적극 면담의 집중 임용 준비 1,000회](focused-faculty-audit.md). 재현: \`node scripts/focused-startup-sample.mjs\`.\n`);
console.log(JSON.stringify({seed,ending:s.ending,month:s.month,papers:s.career.papers,field:field.id,supplemental:true}));

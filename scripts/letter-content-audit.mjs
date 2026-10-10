// Audit authored letters from actual terminal states; never alter player saves.
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {reviewPages} from '../dist/ending-review.js';
import {endingLetterInsertions} from '../dist/stories.js';
const root=new URL('../',import.meta.url);
const data=JSON.parse(await readFile(new URL('dist/ending-review-data.json',root),'utf8'));
const pkg=JSON.parse(await readFile(new URL('package.json',root),'utf8'));
const baseline=process.env.LETTER_BASELINE_ROOT?await import(pathToFileURL(process.env.LETTER_BASELINE_ROOT+'/dist/stories.js')):null;
const zeroInsertionEndings=new Set(['leave','dropout','gameover','unfinished','youtuber','dismissed']);
function proseIssues(record,pages,notes){
 const text=pages.join('\n\n'),signedPages=pages.filter(page=>/[―—]\s*[^\n]+(?:드림|올림)?\s*$/.test(page));
 const incompleteClosings=signedPages.filter(page=>{const body=page.slice(0,page.search(/\n[―—]\s*[^\n]+(?:드림|올림)?\s*$/)).trimEnd();return !/[.?!。！？]$/.test(body);}).length;
 const nextPromises=text.split(/(?<=[.!?])\s+|\n+/u).filter(sentence=>/^다음에(?:는)?\s/.test(sentence.trim())).length;
 return {incompleteAddress:/교수님도\s*(?:\n\n|$)/.test(text),incompleteClosings,nextPromises,
  dryWetMemories:record.labMode==='dry'?notes.filter(note=>note.group==='memory'&&/장비|시료|배양/.test(note.text)).length:0,
  newcomerInsertions:['true','postdoc','institute','resident_researcher'].includes(record.ending)?notes.filter(note=>note.tags.includes('newcomer')).length:0,
  wrongCloseDistance:record.ending==='corporate'&&record.relationship==='close'&&/딱 알맞은 거리/.test(text),
  unrenderedInsertions:notes.filter(note=>!text.includes(note.text)).length};
}
const counts=new Map(),rows=[],scripts=[];
for(const record of data.records){
 const context={statistics:record.statistics,recommendation:record.evidence?.recommendation,fieldId:record.fieldId,labMode:record.labMode,passageIds:record.passageIds};
 const notes=endingLetterInsertions(record.ending,record.relationship,record.memories,context);
 const pages=reviewPages(record),text=pages.join('\n\n');
 for(const note of notes)counts.set(note.text,(counts.get(note.text)||0)+1);
 const old=baseline?.getEndingPages(record.ending,'ko',record.relationship,record.name,record.endingReason,record.memories,context).join('\n\n');
 const remembers=(text.match(/기억합니다/g)||[]).length;
 const row={id:record.id,ending:record.ending,name:record.name,relationship:record.relationship,passageIds:record.passageIds,insertions:notes.length,remembers,baselineRemembers:old===undefined?null:(old.match(/기억합니다/g)||[]).length,wrapper:/인계 기록에는.*라는 경험/.test(text),...proseIssues(record,pages,notes),texts:notes.map(n=>n.text)};
 const budget=zeroInsertionEndings.has(record.ending)||record.relationship==='distant'?0:record.relationship==='reserved'?1:2;
 const violations=[];
 if(row.insertions>budget)violations.push('insertion budget');
 if(row.remembers>1)violations.push('repeated 기억합니다');
 for(const key of ['wrapper','incompleteAddress','incompleteClosings','dryWetMemories','newcomerInsertions','wrongCloseDistance','unrenderedInsertions'])if(row[key])violations.push(key);
 if(row.nextPromises>1)violations.push('repeated 다음에 promises');
 if(violations.length)throw new Error(`Letter content contract failed: ${row.id}: ${violations.join(', ')}`);
 rows.push(row);
 scripts.push(`## ${record.name} · ${record.ending} · ${record.field} · ${record.relationship}\n\n${pages.map((page,i)=>`### 장면 ${i+1}\n\n${page}`).join('\n\n')}`);
}
const oldResult=await readFile(new URL('docs/letter-content-audit.json',root),'utf8').then(JSON.parse).catch(()=>null);
const sum=key=>rows.reduce((total,row)=>total+Number(row[key]),0);
const report={version:pkg.version,samples:rows.length,insertions:sum('insertions'),distinctPassageIds:data.seenPassageIds.length,maxRemembers:Math.max(...rows.map(r=>r.remembers)),baselineMaxRemembers:baseline?Math.max(...rows.map(r=>r.baselineRemembers)):oldResult?.baselineMaxRemembers??null,wrapperCount:sum('wrapper'),incompleteAddressCount:sum('incompleteAddress'),incompleteClosingCount:sum('incompleteClosings'),duplicatePromiseCount:rows.filter(row=>row.nextPromises>1).length,maxNextPromises:Math.max(...rows.map(row=>row.nextPromises)),dryWetMemoryCount:sum('dryWetMemories'),newcomerInsertionCount:sum('newcomerInsertions'),wrongCloseDistanceCount:sum('wrongCloseDistance'),unrenderedInsertionCount:sum('unrenderedInsertions'),zeroBudgetInsertionCount:rows.filter(row=>zeroInsertionEndings.has(row.ending)).reduce((total,row)=>total+row.insertions,0),repeatedInsertions:[...counts].filter(([,n])=>n>1).sort((a,b)=>b[1]-a[1]).map(([text,count])=>({text,count})),rows};
await writeFile(new URL('docs/letter-content-audit.json',root),JSON.stringify(report,null,2)+'\n');
await writeFile(new URL('docs/letter-content-audit.md',root),`# 편지 자동 삽입 검토\n\n게임 ${pkg.version} · 실제 종료 기록 ${report.samples}개\n\n원본 시뮬레이션 종료 상태는 수정하지 않고, 편지 생성과 수집 순서만 다시 적용했습니다. 합성 종료 상태를 섞지 않습니다.\n\n| 검사 | 결과 |\n|---|---:|\n| 자동 삽입 총수 | ${report.insertions} |\n| 사용한 서로 다른 문장 ID | ${report.distinctPassageIds} |\n| 편지 한 통의 ‘기억합니다’ 최대 | ${report.maxRemembers}${report.baselineMaxRemembers!==null?` (이전 ${report.baselineMaxRemembers})`:''} |\n| 인계 기록 회상 래퍼 | ${report.wrapperCount} |\n| 미완성 ‘교수님도’ / 맺음말 | ${report.incompleteAddressCount} / ${report.incompleteClosingCount} |\n| ‘다음에’ 약속 중복 편지 | ${report.duplicatePromiseCount} |\n| dry 회상에 wet 어휘 | ${report.dryWetMemoryCount} |\n| 고급 연구 경력에 newcomer 구문 | ${report.newcomerInsertionCount} |\n| close 기업 엔딩의 어긋난 거리 표현 | ${report.wrongCloseDistanceCount} |\n| 0개 예산 엔딩의 자동 삽입 | ${report.zeroBudgetInsertionCount} |\n| 선택됐으나 보이지 않는 삽입 | ${report.unrenderedInsertionCount} |\n| 동일 삽입 문장의 최대 반복 | ${Math.max(0,...report.repeatedInsertions.map(r=>r.count))} |\n\nclose 최대 2개, reserved 최대 1개, distant 및 휴학·중단·운영 종료·미완·유튜버·제적은 0개입니다. 회상과 스탯 구문이 같은 예산을 공유하며 요청 또는 다음 계획 앞에만 들어갑니다. true·postdoc·institute에서는 newcomer·recovery 태그를 제외하고, 교내 연구직에서도 newcomer를 제외합니다. dry 회상에는 ‘장비’, ‘시료’, ‘배양’을 넣지 않습니다.\n\n미노출 ID를 먼저 고르며 이미 선택한 ID는 편지에 고정합니다. 기존 보관함은 오래된 편지부터 이관하고, 읽은 ID는 편지 보관 한도와 별도로 유지합니다. 모든 후보를 읽으면 반복을 허용하므로 중복 자체를 영구적으로 없애는 규칙은 아닙니다.\n\n## 남은 삽입 중복\n\n${report.repeatedInsertions.map(r=>`- ${r.count}회: ${r.text}`).join('\n')}\n\n## 샘플별 검사\n\n| 엔딩 | 이름 | 관계 | 삽입 | 기억합니다 |\n|---|---|---|---:|---:|\n${rows.map(r=>`| ${r.ending} | ${r.name} | ${r.relationship} | ${r.insertions} | ${r.remembers} |`).join('\n')}\n\n[${report.samples}개 전체 텍스트](letter-content-samples.md) · [검사 데이터](letter-content-audit.json)\n\n재생성: \`node scripts/build-ending-review.mjs\`, \`node scripts/letter-content-audit.mjs\`. 이전 비교는 \`LETTER_BASELINE_ROOT\`에 v4.14.0 체크아웃을 지정한 경우만 계산합니다.\n`);
await writeFile(new URL('docs/letter-content-samples.md',root),`# 실제 종료 기록 ${report.samples}개 · 편지 전체 텍스트\n\n게임 ${pkg.version}. 플레이어 저장에 영향을 주지 않는 검토용 텍스트입니다.\n\n${scripts.join('\n\n---\n\n')}\n`);
console.log(JSON.stringify({samples:report.samples,insertions:report.insertions,distinctPassageIds:report.distinctPassageIds,maxRemembers:report.maxRemembers,baselineMaxRemembers:report.baselineMaxRemembers,maximumRepeat:Math.max(0,...report.repeatedInsertions.map(r=>r.count)),proseIssues:{incompleteAddress:report.incompleteAddressCount,incompleteClosing:report.incompleteClosingCount,duplicatePromise:report.duplicatePromiseCount,dryWetMemory:report.dryWetMemoryCount,newcomer:report.newcomerInsertionCount,wrongCloseDistance:report.wrongCloseDistanceCount,zeroBudgetInsertion:report.zeroBudgetInsertionCount,unrenderedInsertion:report.unrenderedInsertionCount}}));

import test from 'node:test';
import assert from 'node:assert/strict';
import {createState} from '../dist/engine.js';
import {DIALOGUES,DRY_LINES,studentLine} from '../dist/dialogue.js';
import {DISCIPLINES} from '../dist/disciplines.js';
import {RESEARCH_TOPICS} from '../dist/research-topics.js';
import {particle} from '../dist/korean.js';
import {examWindow,academicWeeks} from '../dist/academic-calendar.js';

const WET=/실험|장비|대조군|시료|배양|피펫|측정|재료|시약/;
const WET_EN=/experiment|equipment|instrument|controls|material|measurement/i;

test('A-01: every wet student line has a dry counterpart without bench vocabulary', () => {
  const all=new Set(Object.values(DIALOGUES).flat().map(l=>l.ko));
  for(const [from,to] of Object.entries(DRY_LINES)){
    assert.ok(all.has(from),`dry key must match an original line: ${from}`);
    assert.ok(!WET.test(to.ko),to.ko);assert.ok(to.en&&!WET_EN.test(to.en),to.en);
  }
  for(const line of all)if(WET.test(line))assert.ok(DRY_LINES[line],`missing dry line: ${line}`);
});

test('A-01: dry labs never hear wet vocabulary across fields, seeds and months', () => {
  const dry=DISCIPLINES.filter(d=>d.labModes.includes('dry'));assert.ok(dry.length>0);
  let checked=0;
  for(const d of dry)for(let seed=1;seed<=24;seed++){
    const s=createState('테스트',seed*7919,{fieldId:d.id,labMode:'dry'});assert.equal(s.professorProfile.labMode,'dry');
    for(const month of [0,1,7,13,26,40,55,70,90]){
      s.month=month;s.started=month>0;
      const r=(seed*31+month*17)%100;
      Object.assign(s.hidden,{rapport:r%3?40+r%50:5,stamina:r%4?700:400,social:r%2?40:-10,creativity:r%5?40:0,diligence:r%3?45:-40,autonomy:70,confidence:r%2?60:30,motivation:r%7?60:30,stress:r%6?30:70,manners:r%5?800:300,luck:r%2?50:-50,resilience:r%3?700:300});
      s.temperament={curiosity:r%2?70:40,caution:r%3?70:40,expression:r%2?50:30};
      s.lastReport={completion:r/100,progress:1,scienceFailures:r%2};
      const line=studentLine(s,'ko');checked++;
      assert.ok(!WET.test(line),`${d.id} seed ${seed} month ${month}: ${line}`);
    }
  }
  assert.ok(checked>500);
});

test('A-01: wet labs keep the original bench lines', () => {
  const wet=DISCIPLINES.find(d=>d.labModes.includes('wet'));
  const s=createState('테스트',11,{fieldId:wet.id,labMode:'wet'});let seen=false;
  for(let month=1;month<200&&!seen;month++){s.month=month;s.started=true;s.hidden.rapport=30;if(WET.test(studentLine(s,'ko')))seen=true;}
  assert.ok(seen);
});

test('A-02: exam-week autonomy request stops after coursework years', () => {
  const s=createState('테스트',5,{fieldId:'048',labMode:'dry'});s.started=true;s.hidden.rapport=80;s.route='integrated';
  let early=false,late=0;
  for(let month=1;month<120;month++){s.month=month;if(!academicWeeks(s).some((_,i)=>examWindow(s,i)))continue;
    const line=studentLine(s,'ko');if(month<48)early||=line.includes('시험 주');else{late++;assert.ok(!line.includes('시험 주'),`month ${month}: ${line}`);}}
  assert.ok(early);assert.ok(late>0);
});

test('A-21: social voice no longer assumes a newer student exists', () => {
  assert.ok(!DIALOGUES.social.some(l=>l.ko.includes('새로 온 학생')));
});

test('A-07: research topic titles carry no real institution or company names', () => {
  const real=/삼성|샤리테|Google|K-UAM|RAON|HIAF|ABCD Study|장보고기지|국민건강보험공단|대학교|대학병원|[가-힣]병원(?!체|성|균|인)|Samsung|\bLG\b|\bSK\b|Naver|Kakao|네이버|카카오/;
  for(const t of RESEARCH_TOPICS)assert.ok(!real.test(t.title),`${t.id}: ${t.title}`);
});

test('A-08: Hangul nouns with a final consonant take 으로 before 접근하는', () => {
  for(const t of RESEARCH_TOPICS)for(const m of t.title.matchAll(/([가-힣])로 접근하는/g))
    assert.equal(particle(m[1],'으로/로'),'로',`${t.id}: ${t.title}`);
  for(const t of RESEARCH_TOPICS)assert.ok(!/의 적용한|동역학를|미토콘드리아과/.test(t.title),`${t.id}: ${t.title}`);
});

test('A-24: discipline groups use one middle dot', () => {
  for(const d of DISCIPLINES)assert.ok(!d.group.includes('・'),d.group);
});

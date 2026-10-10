import {withParticle} from './korean.js';
export const MAIN_ENDINGS=['true','postdoc','institute','corporate','unrelated','startup','unemployed','resident_researcher'];
export function endingCollection(gallery){const seen=new Set(gallery.map(e=>e.ending));const count=MAIN_ENDINGS.filter(id=>seen.has(id)).length;return {count,total:MAIN_ENDINGS.length,unlocked:count>=5,complete:count===MAIN_ENDINGS.length};}
export function keepGallery(entries){const first=new Map();for(const e of entries)if(!first.has(e.ending))first.set(e.ending,e);const retained=entries.slice(0,40);for(const e of first.values())if(!retained.some(r=>r.id===e.id)){const index=retained.findLastIndex(r=>first.get(r.ending)?.id!==r.id);if(index>=0)retained.splice(index,1,e);}return retained;}
export function retirementScenes(gallery){
 if(!endingCollection(gallery).unlocked)return [];
 const get=id=>gallery.find(e=>e.ending===id)?.name;
 const scenes=['퇴임식 날, 강당의 조명이 켜졌다. 제자들이 하나둘 자리를 채웠다.'];
 if(get('true'))scenes.push(`${get('true')} 교수는 앞줄에서 축사를 준비하고 있었다. “질문을 끝까지 살피는 법을 배웠습니다.” 이번에는 지도교수가 객석에서 듣는다.`);
 if(get('postdoc'))scenes.push(`${get('postdoc')} 박사가 해외에서 들어와 앉았다. 이번에는 일주일 전에 연락했다. 다음 연구의 이야기는 식이 끝난 뒤 천천히 나누기로 했다.`);
 if(get('institute'))scenes.push(`${withParticle(get('institute'),'은/는')} 인사를 마치고 공동연구의 다음 회의 일정을 물었다. 교수는 수첩을 꺼내다 웃었다. “오늘은 밥부터 먹읍시다.”`);
 if(get('corporate'))scenes.push(gallery.find(e=>e.ending==='corporate')?.relationship==='distant'?`${withParticle(get('corporate'),'은/는')} 안내대에 꽃다발을 맡기고 짧게 인사를 나누었다. 준비해 온 축하 카드를 건넨 뒤 객석으로 돌아갔다.`:`${withParticle(get('corporate'),'은/는')} 회사 메일 대신 손에 든 꽃다발을 내밀었다. “오늘 커피는 제가 삽니다.” 옆자리의 제자가 식이 끝난 뒤 함께 가자고 했다.`);
 if(get('startup'))scenes.push(`${withParticle(get('startup'),'은/는')} 뒤늦게 들어와 조용히 빈자리를 찾았다. 식이 끝나면 들려주겠다며, 팀이 새로 고친 제품 사진을 휴대폰에 띄웠다.`);
 if(get('resident_researcher'))scenes.push(`${withParticle(get('resident_researcher'),'은/는')} 새로 들어온 연구원의 자리를 함께 찾아 주었다. 교수와 눈이 마주치자 고개를 끄덕이고 객석에 앉았다.`);
 if(get('unemployed'))scenes.push(`${withParticle(get('unemployed'),'은/는')} 옆자리 제자와 오랜만에 안부를 나누었다. 교수도 다가가 인사했다. 다음 지원 이야기는 먼저 꺼내지 않았다.`);
 if(get('youtuber'))scenes.push(`${get('youtuber')} 박사는 촬영 안내를 확인하고 카메라를 내려놓았다. 오늘은 영상보다 서로의 이야기를 듣는 시간을 남기기로 했다.`);
 if(get('unrelated'))scenes.push(`맨 뒷줄 빈자리에는 ${withParticle(get('unrelated'),'이/가')} 공개를 허락한 산 사진 엽서가 놓였다. “건강하세요.” 더 긴 연락을 요구하지는 않았다.`);
 scenes.push('마지막 인사를 준비하며 교수는 오래된 연구 노트를 펼쳤다. 수정한 문장 옆에 학생이 처음 적었던 질문이 남아 있었다. 강단에 올라 그 페이지를 화면에 띄우자, 객석 한쪽에서 작은 웃음이 났다.');
 if(endingCollection(gallery).complete)scenes.push('강당이 비어 가고, 연구실 문을 천천히 닫는다. 다음 질문을 이어 갈 사람들에게 자리를 남긴다.');
 return scenes;
}

import {weeklyAppearance,renderPortrait} from './appearance.js';
import {studentEmotion,reactionEffects} from './student-reaction.js';
import {getDiscipline} from './disciplines.js';

export const CONFERENCE_VENUES=Object.freeze([
 Object.freeze({id:'seminar',label:'연구학회 강의실'}),
 Object.freeze({id:'convention',label:'대형 컨벤션 홀'}),
 Object.freeze({id:'poster',label:'포스터 세션'}),
 Object.freeze({id:'hotel',label:'국제학회 호텔 홀'})
]);
export function conferenceVenue(value,fallback=0){
 const index=typeof value==='string'?CONFERENCE_VENUES.findIndex(v=>v.id===value):value;
 return Number.isInteger(index)&&index>=0&&index<CONFERENCE_VENUES.length?index:Math.abs(Number(fallback)||0)%CONFERENCE_VENUES.length;
}
const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const r=(x,y,w,h,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
const line=(d,c,w=2)=>`<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}"/>`;
const chairs=(count,x,y,gap,color)=>Array.from({length:count},(_,i)=>`<g class="conference-chair">${r(x+i*gap,y,32,27,color)}${r(x+i*gap+3,y+27,26,9,'#526876')}${r(x+i*gap+3,y+36,3,8,'#6c7b83')}${r(x+i*gap+26,y+36,3,8,'#6c7b83')}</g>`).join('');
const screen=(title,field,figure,{x=78,y=37,w=314}={})=>{
 const h=w*9/16,small=w<160;
 return `<g class="conference-screen">${r(x-6,y-6,w+12,h+12,'#8196a4')}<rect class="monitor-display" data-display-aspect="16:9" x="${x}" y="${y}" width="${w}" height="${h}" fill="#f7f8ef"/><text x="${x+w/2}" y="${y+(small?18:23)}" text-anchor="middle" fill="#3d687f" font-size="${small?7:12}">${title}</text><text x="${x+w/2}" y="${y+(small?34:42)}" text-anchor="middle" fill="#657c85" font-size="${small?7:9}">${field}</text><g transform="translate(${x-100} ${y-18})">${figure}</g></g>`;
};
const podium=()=>`<g class="conference-podium">${r(423,265,79,61,'#a1886e')}${r(417,260,90,9,'#c6af90')}${r(435,278,55,24,'#e6e8dc')}${line('M464 258v-18l8-8','#687b85',2)}</g>`;
const poster=(x,y,title,figure)=>`<g class="conference-poster">${r(x,y,109,157,'#94a6ac')}${r(x+5,y+5,99,144,'#faf9ef')}${r(x+8,y+8,93,20,'#d9e6df')}<text x="${x+54}" y="${y+22}" text-anchor="middle" font-size="8" fill="#4b6d7c">${title}</text><g transform="translate(${x-48} ${y+23}) scale(.4)">${figure}</g>${r(x+14,y+89,80,3,'#b3c2c1')}${r(x+14,y+99,68,3,'#c2ceca')}${r(x+14,y+109,79,3,'#c2ceca')}${r(x+14,y+119,55,3,'#c2ceca')}${line(`M${x+14} ${y+157}v41M${x+95} ${y+157}v41`,'#81969a',3)}</g>`;

// Venue selection is cosmetic. It neither reads storage nor consumes game RNG.
export function renderConferenceArt(state,result={},index=0,{venue=0,defense=false,figure='',student=true,appearance}={}){
 const chosen=conferenceVenue(venue),v=CONFERENCE_VENUES[chosen],expression=studentEmotion(state,result),field=escape(getDiscipline(state.professorProfile.fieldId).label);
 const title=defense?'THESIS DEFENSE':result.abroad?'INTERNATIONAL CONFERENCE':'RESEARCH CONFERENCE';
 const evidence=state.professorProfile.labMode==='wet'?'Experimental findings':'Models & evidence';
 let art='',stageY=255,portraitX=420,portraitY=154;
 if(chosen===0){
  art=r(0,0,600,255,'#e2e8e5')+r(0,255,600,105,'#c8bdab');
  for(const x of [18,552])art+=r(x,22,30,208,'#b6c4bf')+line(`M${x+10} 22v208M${x+20} 22v208`,'#cad4cd',2);
  art+=screen(title,`${field} · ${evidence}`,figure)+r(34,224,378,7,'#a5b4ae');
  art+=chairs(6,24,298,53,'#708a91')+chairs(5,52,269,58,'#849da0');
 }else if(chosen===1){
  art=r(0,0,600,360,'#ced9df')+r(0,253,600,107,'#7a8d99');
  art+=r(24,24,552,231,'#253e54')+r(47,44,506,187,'#829eb0');
  for(const x of [28,537])art+=r(x,25,35,213,'#63768b')+line(`M${x+8} 25v213M${x+19} 25v213`,'#8293a6',2);
  for(const x of [114,244,374])art+=line(`M${x} 5v22`,'#6e838f',2)+r(x-12,27,24,6,'#eff1da');
  art+=screen(title,`${field} · ${evidence}`,figure,{x:96,y:60,w:306,h:142})+r(62,244,484,13,'#bdc9cc');
  art+=chairs(8,13,306,73,'#4e667d');
 }else if(chosen===2){
  art=r(0,0,600,229,'#f0eadd')+r(0,229,600,131,'#c0c9c4');
  art+=r(36,20,528,24,'#cbdad5')+`<text x="300" y="36" text-anchor="middle" fill="#477486" font-size="12">${defense?'THESIS POSTER DISCUSSION':'POSTER SESSION'}</text>`;
  art+=poster(34,64,'QUESTION',figure)+poster(171,64,'METHOD',figure)+poster(308,64,'FINDINGS',figure);
  // A presentation screen at the side is separate from the printed posters.
  art+=screen(title,field,'',{x:459,y:76,w:104,h:87})+r(484,140.5,5,42,'#81949a')+r(467,179,44,4,'#81949a');
  art+=r(25,301,104,15,'#b7a288')+r(42,316,6,32,'#958775')+r(104,316,6,32,'#958775')+r(41,290,27,10,'#ede6d3');
  portraitX=431;portraitY=171;stageY=271;
 }else{
  art=r(0,0,600,252,'#e6dfd0')+r(0,252,600,108,'#aab5b3');
  for(const x of [22,482])art+=r(x,24,96,184,'#bba98f')+r(x+7,31,82,165,'#b8d9df')+r(x+10,143,76,53,'#bed0bd')+line(`M${x+48} 31v165M${x+7} 115h82`,'#f1ece1',5);
  art+=r(124,26,352,195,'#d1c3ad')+screen(title,`${field} · ${evidence}`,figure,{x:151,y:45,w:282,h:147});
  art+=line('M300 0v21','#9a8d73',2)+r(271,21,58,5,'#d7c9a3')+r(280,26,5,12,'#f1e8c4')+r(298,26,5,12,'#f1e8c4')+r(316,26,5,12,'#f1e8c4');
  for(const [x,y]of [[38,295],[160,307],[296,292]])art+=`<g class="conference-round-table"><ellipse cx="${x+40}" cy="${y}" rx="42" ry="15" fill="#ece5d4"/>${r(x+37,y,6,43,'#9c9c8d')}${chairs(2,x-3,y+20,56,'#778b88')}</g>`;
 }
 if(defense)for(const x of [34,91,148])art+=`<g class="defense-panel">${r(x,stageY-25,23,24,'#e0bea5')}${r(x-3,stageY-29,29,8,'#5c514c')}${r(x-7,stageY-1,37,29,'#667d88')}</g>`;
 if(student){const avatar=appearance??weeklyAppearance(state,index);art+=`<g class="conference-speaker"><g class="room-reaction" transform="translate(${portraitX+40} ${portraitY+24}) scale(.7)">${reactionEffects(expression,index)}</g>`+renderPortrait(avatar,'학술발표하는 학생',expression,'standing','front').replace('class="portrait"',`class="portrait conference-portrait" x="${portraitX}" y="${portraitY}" width="80" height="124"`)+`</g>`;}
 if(chosen!==2)art+=podium();
 return `<svg class="pixel-room-art conference-room-art" viewBox="0 0 600 360" role="img" aria-label="${escape(v.label)}${defense?' · 학위심사':''}" preserveAspectRatio="xMidYMid meet" data-venue="${v.id}" data-hall="${chosen}"><g shape-rendering="crispEdges">${art}</g></svg>`;
}

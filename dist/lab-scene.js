import {getDiscipline} from './disciplines.js';
import {weeklyAppearance,renderPortrait} from './appearance.js';
const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function researchText(text,state){return state?.professorProfile?.labMode==='dry'?String(text).replace(/예비 실험/g,'예비 계산').replace(/실험실/g,'연구실').replace(/실험 노트/g,'연구 노트').replace(/실험/g,'연구'):text;}
export function supplyLevel(state){if(state.lab.funds<40||state.lab.budget.environment===0)return 'sparse';if(state.lab.funds>=140&&state.lab.budget.environment>=3&&state.lab.equipment>=45)return 'rich';return 'balanced';}
const rect=(x,y,w,h,fill)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;
export function roomDecorations(state){const seed=state.creationSeed??state.seed,draw=i=>(Math.imul(seed^(i*7919),2654435761)>>>0)/4294967296;return {fridge:draw(1)>.25,kettle:draw(2)>.2,plush:draw(3)>.45,cot:draw(4)>.65,board:true,sofa:draw(6)>.5,server:state.professorProfile.labMode==='dry',palette:Math.floor(draw(5)*3)};}
function decorationArt(state){
 const d=roomDecorations(state),accent=['#bd967e','#86a7a2','#9a91b6'][d.palette];let art='';
 if(d.board)art+=rect(166,34,113,68,'#a68a6b')+rect(171,39,103,58,'#35584f')+`<path d="M180 52h68M180 62h43M180 72h57M180 84h27" stroke="#d0d7bd" stroke-width="2"/>`;
 if(d.sofa)art+='<path d="M299 193h79v4h-79" fill="#8c8579" opacity=".35"/>'+rect(304,176,73,19,'#7d93a8')+rect(307,162,65,23,'#a1b5c3')+rect(300,169,9,25,'#718ca1')+rect(367,169,10,25,'#718ca1');
 if(d.fridge)art+='<path d="M273 103l7-5h51v68l-7 5V103z" fill="#607987"/>'+rect(273,103,51,68,'#738997')+rect(278,108,41,28,'#e6edf0')+rect(278,140,41,28,'#e6edf0')+rect(282,114,4,12,'#8da3ad')+rect(282,146,4,12,'#8da3ad');
 if(d.kettle)art+=rect(209,153,24,18,accent)+rect(213,145,13,9,'#e7e8db')+`<path d="M229 154h8v10h-8M212 146h14" stroke="#698090" stroke-width="3" fill="none"/>`;
 if(d.plush)art+=rect(120,113,23,3,'#7e796c')+rect(118,90,24,24,accent)+rect(114,86,8,9,accent)+rect(137,86,8,9,accent)+rect(122,96,3,4,'#465569')+rect(133,96,3,4,'#465569')+rect(127,104,5,3,'#efdec7');
 if(d.cot)art+=rect(431,209,120,19,'#a2b3ae')+rect(434,210,28,15,'#eee6d2')+`<path d="M435 228v16M548 228v16M447 229l7 15M535 229l-7 15" stroke="#6d8390" stroke-width="4"/>`;
 return art;
}
export function conferenceHall(state){return (Math.imul((state.creationSeed??state.seed)^(state.month*7919),2654435761)>>>0)%4;}
export function figureType(state){const d=getDiscipline(state.professorProfile.fieldId),label=d.label;if(/수학|통계/.test(label))return 'equation';if(/컴퓨터|전산|정보|소프트/.test(label))return 'network';if(/생물|생명|바이오|의학|약학/.test(label))return 'bars';if(/화학|재료/.test(label))return 'spectrum';return 'curve';}
export function fieldFigure(state){const type=figureType(state);if(type==='equation')return '<text x="180" y="102" fill="#58788b" font-size="20">f(x) = Σ aₙxⁿ</text>';if(type==='bars')return [0,1,2,3,4].map(i=>rect(150+i*37,114-i*8,21,10+i*8,'#81a797')).join('');if(type==='network')return '<path d="M154 108L205 81 260 108 320 70M205 81L320 70M154 108L260 108" stroke="#849ab2" stroke-width="2"/>'+[ [154,108],[205,81],[260,108],[320,70] ].map(([x,y])=>rect(x-4,y-4,8,8,'#578a99')).join('');if(type==='spectrum')return '<path d="M140 114h32l9-42 10 42h26l7-19 8 19h25l11-54 12 54h66" fill="none" stroke="#8f83ad" stroke-width="3"/>';return '<path d="M140 111L172 91 205 104 240 75 275 88 310 64 345 83" fill="none" stroke="#81a797" stroke-width="4"/>';}
function fineRoomDetails(kind,state){
 const wet=kind==='wet';let art='<path d="M0 1H599V254H0z" fill="none" stroke="#aec3c4" stroke-width="2"/><path d="M0 165h600" stroke="#819d99" stroke-width="4"/>';
 // A shaded side wall and parquet perspective make this an inhabited miniature room.
 art+='<path d="M0 0H25V158L0 171z" fill="#aec5c2"/><path d="M25 0V158" stroke="#9fb8b3" stroke-width="2"/><path d="M25 158L0 171" stroke="#829e96" stroke-width="3"/>';
 for(let y=187;y<250;y+=20)for(let x=15;x<590;x+=74)art+=`<path d="M${x+(y%3)*7} ${y}h38" stroke="#c6aa86" stroke-width="1" opacity=".7"/>`;
 art+='<path d="M45 172L61 162H268L258 172z" fill="#ba9c7d"/><path d="M258 172l10-10v14l-10 11z" fill="#775f4b"/><path d="M244 187v50l6-5v-49z" fill="#7a604a"/>';
 // Window scenery, sill, light and small lived-in objects are original pixel shapes.
 art+='<path d="M35 98l16-14 17 11 13-19 15 20 16-11 29 13v10H35z" fill="#88aaa0"/><path d="M29 113h124v5H29zM148 30h4v83h-4z" fill="#d2c5a6"/><path d="M44 43h31v2H44zM46 48h17v1H46z" fill="#e1e7d5" opacity=".7"/>';
 art+=rect(287,81,18,22,'#ddd5c4')+rect(290,84,12,8,'#a6bfc1')+rect(290,95,10,1,'#899f9f');
 art+='<path d="M347 22h24l6 7h-36z" fill="#b99c73"/><path d="M354 29h10v4h-10z" fill="#f5e7b8"/><path d="M346 34h26l22 111h-73z" fill="#fff2bd" opacity=".09"/>';
 art+=rect(354,154,30,17,'#c69e7d')+rect(357,153,24,4,'#e6c3a4')+rect(362,149,4,6,'#6f9c86')+rect(368,145,5,10,'#83a792')+rect(375,150,4,5,'#6f9c86');
 // Books, a notebook, pen, pinned paper, clock and detailed research resources.
 for(let i=0;i<5;i++)art+=rect(469+i*14,128,10,22,['#7c92a6','#bd9481','#a1ad86','#9687a4','#89aaaa'][i])+rect(472+i*14,133,4,1,'#e8e1d0');
 art+=rect(54,156,32,12,'#6b879b')+rect(57,157,27,2,'#ece6d4')+rect(57,165,27,2,'#ece6d4')+rect(204,168,25,3,'#ece3c8')+rect(206,164,22,4,'#c7d5d6')+rect(222,160,2,9,'#536c84');
 art+=rect(311,39,29,36,'#ede9d3')+rect(320,37,10,4,'#c1ab87')+'<path d="M317 48h16M317 54h12M317 60h16M317 66h9" stroke="#b2b9b4" stroke-width="1"/>';
 art+=rect(370,35,27,27,'#8ea59d')+rect(373,38,21,21,'#f1edde')+'<path d="M383 41v9h7" stroke="#667b80" stroke-width="2"/>';
 if(wet){art+=rect(98,162,47,6,'#90adb0');for(let i=0;i<4;i++)art+=rect(103+i*9,150,4,13,['#acd7d4','#c2aad0','#a6c8bb','#b8cfdd'][i])+rect(102+i*9,148,6,3,'#758e9a');art+=rect(238,129,22,37,'#a3b7bb')+rect(241,133,16,24,'#dae4df')+rect(243,136,12,13,'#c1d4d2')+rect(245,160,4,2,'#6e9682');}
 else{art+='<path d="M166 156l17 13M166 156l21 7" stroke="#58758a" stroke-width="1"/>'+rect(104,165,49,4,'#b9c9cf')+rect(108,165,3,1,'#8095a3')+rect(119,165,3,1,'#8095a3')+rect(130,165,3,1,'#8095a3')+rect(167,167,7,4,'#d5dbd4');for(let i=0;i<4;i++)art+=rect(487,48+i*16,3,2,'#bdd6a5')+rect(514,48+i*16,20,1,'#566d7c');}
 return art;
}
function roomArt(kind,state,result={}){
 const hall=conferenceHall(state),wet=kind==='wet',conference=['conference','defense'].includes(kind),rest=kind==='rest',travel=kind==='travel';
 let art=rect(0,0,600,255,travel?'#b4d8d4':conference?['#dce0f0','#d1e2dc','#e9dfd2','#d5dde8'][hall]:'#d7e4e2')+`<path d="M0 165H600V255H0z" fill="${conference?'#939bb3':'#dfc7a2'}"/><path d="M0 182H600M0 212H600M60 165L20 255M180 165L160 255M420 165L450 255M540 165L590 255" stroke="${conference?'#858da6':'#c9ae88'}" stroke-width="2"/>`;
 if(travel){art+=`<path d="M0 175L105 60 225 172 340 83 490 170 600 120V190H0z" fill="#76a99d"/><path d="M230 255L310 165H358L395 255" fill="#f0dec1"/>`+rect(63,115,12,75,'#8b6f54')+rect(37,90,65,60,'#659887')+rect(430,198,44,36,'#547f99')+rect(440,190,23,8,'#385d76');}
 else if(conference){if(hall===1)art+=rect(18,10,30,145,'#789790')+rect(548,10,30,145,'#789790');if(hall===2)art+=rect(15,18,44,132,'#baa58e')+rect(538,18,44,132,'#baa58e');if(hall===3)art+=rect(24,12,32,140,'#5c708d')+rect(538,12,32,140,'#5c708d');art+=rect(95,20,310,119,'#647f9c')+rect(103,28,294,103,'#f7f6ed')+`<text x="250" y="62" text-anchor="middle" fill="#47768b" font-size="13" font-family="sans-serif">${kind==='defense'?'THESIS DEFENSE':result.abroad?'INTERNATIONAL CONFERENCE':'RESEARCH CONFERENCE'}</text>${fieldFigure(state)}`+rect(405,162,90,48,'#b39779')+rect(400,154,100,10,'#806850');for(let i=0;i<(hall===2?6:5);i++)art+=rect(55+i*(hall===2?65:75),212,40,32,['#657c97','#688b80','#9b816e','#5c6b8c'][hall]);if(kind==='defense')for(let i=0;i<3;i++)art+=rect(85+i*65,149,22,22,'#e0b799')+rect(82+i*65,145,28,7,'#48434c')+rect(78+i*65,171,38,30,'#566b88');}
 else {art+=rect(28,30,120,85,'#faf4dd')+rect(35,37,106,71,'#a5c8d1')+rect(85,37,6,71,'#faf4dd')+rect(460,24,99,136,'#a18368')+rect(466,30,87,124,'#e6d6bb')+rect(466,76,87,7,'#a18368')+rect(466,120,87,7,'#a18368');
 if(rest)art+=rect(44,175,186,54,'#758eaa')+rect(52,160,170,40,'#a7bfd0')+rect(65,167,35,28,'#f6edda')+rect(185,174,24,25,'#e7c0a4')+rect(464,107,75,48,'#7ba289');
 else {art+=rect(45,172,213,15,'#987a60')+rect(60,187,13,50,'#987a60')+rect(231,187,13,50,'#987a60');if(wet){const count=({sparse:1,balanced:4,rich:8})[supplyLevel(state)];for(let i=0;i<count;i++)art+=rect(474+(i%4)*19,48+Math.floor(i/4)*45,11,21,['#91bcc9','#c999ad','#9dbc90'][i%3])+rect(476+(i%4)*19,44+Math.floor(i/4)*45,7,4,'#789697');art+=rect(105,144,32,28,'#edf0e6')+rect(126,112,12,38,'#6f8999')+rect(127,108,37,11,'#5e7384')+rect(160,157,18,15,'#bfd8c4');}
 else {art+=rect(92,106,105,57,'#4d687f')+rect(99,113,91,43,'#bddbd3')+rect(137,163,15,10,'#4d687f')+`<path d="M110 127H166M110 136H151M110 145H175" stroke="#689d93" stroke-width="3"/>`+rect(476,38,68,75,'#5b6e80');for(let i=0;i<4;i++)art+=rect(483,44+i*16,55,10,'#8ea7b5');}}
 art+=rect(412,197,26,24,'#c39c7d')+`<path d="M425 200V167M424 189L411 173M425 180L442 163" stroke="#6e9981" stroke-width="9"/>`;}
 if(['wet','dry'].includes(kind))art+=fineRoomDetails(kind,state)+decorationArt(state);
 return `<svg class="pixel-room-art" viewBox="0 0 600 255" aria-hidden="true" preserveAspectRatio="xMidYMid slice"><g shape-rendering="crispEdges">${art}</g></svg>`;
}
export function sceneKind(state,result={actual:'idle'}){if(state.pending?.kind==='thesis'&&result.actual==='idle')return 'defense';if(result.actual==='conference'||result.abroad)return 'conference';if(result.actual==='rest')return 'rest';if(result.actual==='travel')return 'travel';return state.professorProfile.labMode;}
export function roomScene(state,result={actual:'idle'},index=0,{idle=false}={}){
 const kind=sceneKind(state,result),stock=kind==='wet'?supplyLevel(state):null,label=({wet:'Wet lab · 연구실',dry:'Dry lab · 계산·분석 공간',rest:'잠시 쉬어 가는 방',travel:'연구실 밖의 하루',conference:result.abroad?'해외학회장':'학술대회장',defense:'학위심사실'})[kind];
 const fx=result.performed===false||result.successRate===0?'muted':result.outcome==='presented'?'applause':result.successRate>=.9?'burst':result.successRate>=.7?'orbit':result.actual==='coursework'||result.actual==='study'?'insight':'glimmer';
 return `<div class="pixel-room effect-${fx} scene-${kind} ${idle?'scene-idle':'scene-active'}" data-scene="${kind}" data-hall="${conferenceHall(state)}" data-figure="${figureType(state)}" data-props="${['wet','dry'].includes(kind)?Object.entries(roomDecorations(state)).filter(([k,v])=>k!=='palette'&&v).map(([k])=>k).join(' '):''}"${stock?` data-supply="${stock}"`:''}>${roomArt(kind,state,result)}<span class="room-label">${escape(label)}${stock?' · '+({rich:'자재가 넉넉하다',balanced:'필요한 자재를 갖췄다',sparse:'자재를 아껴 쓰는 중'})[stock]:''}</span><div class="pixel-student action-${escape(result.actual)}">${renderPortrait(weeklyAppearance(state,index))}</div>${kind==='defense'?`<span class="defense-step">${({draft:'초안 준비',presentation:'공개 발표',questions:'질의응답',revision:'수정·보완',verdict:'최종 판정'})[state.pending.step]}</span>`:''}<span class="pixel-spark" aria-hidden="true">${idle?'':result.performed!==false&&(!Number.isFinite(result.successRate)||result.successRate>=.4)?({burst:'✦ ✧ ✦',orbit:'✧ · ✧',insight:'✧',applause:'✶ ✶ ✶',glimmer:'· ✧ ·'})[fx]:'…'}</span></div>`;
}
export function idleLabScene(state){return `<div class="lab-scene-heading"><strong>${escape(state.name)}의 하루</strong><span>${state.pending?.kind==='thesis'?'중요 일정 · 학위심사':'이번 달의 연구실'}</span></div>${roomScene(state,{actual:'idle'},0,{idle:true})}<div class="live-scene-status" aria-live="polite">${state.pending?.kind==='thesis'?'지금까지의 연구를 설명하고 질문에 답할 시간입니다.':'주별 계획을 합의하면 학생의 한 달이 여기에서 이어집니다.'}</div>`;}

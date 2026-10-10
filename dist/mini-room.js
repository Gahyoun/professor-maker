import {studentEmotion,reactionEffects} from './student-reaction.js';
import {weeklyAppearance,renderPortrait} from './appearance.js';
import {activityProps,monitorMotion} from './activity-motion.js';
import {equipmentProfile,roomEquipment} from './lab-equipment.js';
import {labSeason,seasonalWindow} from './lab-season.js';
// One shared axonometric projection for walls, floor, furniture and props.
// Seeded cosmetics never consume simulation RNG or affect research outcomes.
export const WALLPAPERS=['#faf8f2','#f3efe5','#eee5d7','#f7f4ec','#e8dfd0'];
export const FLOOR_TILES=[['#d5d7d6','#c9cdcd','#aeb5b5'],['#e1d3bc','#d6c6ac','#bcad94'],['#e9e3d6','#ded6c5','#c5bba8'],['#c8cbc9','#bfc4c1','#a5ada8']];
const shade=(hex,amount)=>'#'+hex.slice(1).match(/../g).map(c=>Math.max(0,Math.min(255,parseInt(c,16)+amount)).toString(16).padStart(2,'0')).join('');
export function projectRoom(u,v,z=0){return [300+(u-v)*9,96+(u+v)*4.5-z];}
const polygon=(points,fill,stroke)=>`<polygon points="${points.map(p=>p.join(',')).join(' ')}" fill="${fill}"${stroke?` stroke="${stroke}" stroke-width=".8" stroke-linejoin="miter"`:''}/>`;
const plane=(points,fill,stroke)=>polygon(points.map(p=>projectRoom(...p)),fill,stroke);
function box(u,v,w,d,h,color,z=0){return plane([[u,v,z+h],[u+w,v,z+h],[u+w,v+d,z+h],[u,v+d,z+h]],shade(color,17),shade(color,-22))+plane([[u,v+d,z],[u+w,v+d,z],[u+w,v+d,z+h],[u,v+d,z+h]],color,shade(color,-22))+plane([[u+w,v,z],[u+w,v+d,z],[u+w,v+d,z+h],[u+w,v,z+h]],shade(color,-18),shade(color,-22));}
const line=(a,b,color,width=1)=>{const [x,y]=projectRoom(...a),[xx,yy]=projectRoom(...b);return `<path d="M${x} ${y}L${xx} ${yy}" stroke="${color}" stroke-width="${width}" fill="none"/>`;};
const front=(u,v,z,w,h,color)=>plane([[u,v,z],[u+w,v,z],[u+w,v,z+h],[u,v,z+h]],color);
const left=(u,v,z,d,h,color)=>plane([[u,v,z],[u,v+d,z],[u,v+d,z+h],[u,v,z+h]],color);
const isLecturing=(result,idle)=>!idle&&result.actual==='teach'&&result.performed===true&&result.outcome!=='training';
export const ROOM_ANCHORS=Object.freeze({standing:Object.freeze([23,14]),deskSeat:Object.freeze([13.5,23.5]),plant:Object.freeze([24,19])});
function lectureDiagram(type,ink){
 const stroke=points=>`<path class="ta-board-stroke" pathLength="1" d="${points.map((p,i)=>`${i?'L':'M'}${projectRoom(...p).join(' ')}`).join('')}" fill="none" stroke="${ink}" stroke-width="1.3"/>`;
 return `<g class="ta-board-annotation" data-board-kind="${type}" aria-label="강의 개념 도표">`+
 stroke([[17.5,.26,47],[19.2,.26,47],[19.2,.26,40],[17.5,.26,40],[17.5,.26,47]])+
 stroke([[19.5,.26,43.5],[21.4,.26,43.5],[20.9,.26,45],[21.4,.26,43.5],[20.9,.26,42]])+
 stroke([[21.8,.26,47],[23.5,.26,47],[23.5,.26,40],[21.8,.26,40],[21.8,.26,47]])+
 stroke([[17.9,.26,43.5],[18.4,.26,43.5],[18.4,.26,45]])+
 stroke([[22.2,.26,43],[22.6,.26,42],[23.1,.26,45]])+'</g>';
}
export function roomDecorations(state){const seed=state.creationSeed??state.seed,draw=i=>(Math.imul(seed^(i*7919),2654435761)>>>0)/4294967296;return {fridge:draw(1)>.25,kettle:draw(2)>.2,plush:draw(3)>.45,cot:draw(4)>.65,board:true,boardType:Math.floor(draw(12)*4),chairType:Math.floor(draw(13)*4),restType:Math.floor(draw(14)*4),sofa:draw(6)>.5,server:state.professorProfile.labMode==='dry',palette:Math.floor(draw(5)*3),wallpaper:Math.floor(draw(7)*WALLPAPERS.length),floor:Math.floor(draw(8)*FLOOR_TILES.length),printer:draw(9)>.25,plant:true,plantType:Math.floor(draw(15)*4),windowPlants:1+Math.floor(draw(16)*3),shelfPlant:draw(17)>.4,bag:draw(10)>.35,deskLamp:true,clock:true,noticeboard:draw(11)>.3};}
function desk(u,v,w,d,color='#c5ab8e'){let art='';for(const [a,b] of [[u+.5,v+.5],[u+w-1,v+.5],[u+.5,v+d-1],[u+w-1,v+d-1]])art+=box(a,b,.65,.65,23,'#a58c73');art+=box(u,v,w,d,3,color,23);return art;}
function workstationDesk(u,v,w,d,color){
 const legs=[[u+.5,v+.5],[u+w-1,v+.5],[u+.5,v+d-1],[u+w-1,v+d-1]];
 const leg=([a,b])=>box(a,b,.65,.65,23,'#a58c73');
 // The top stays behind the hands. Only the near slab edges and their two
 // supports can occlude knees; repainting the whole desk would cover the face.
 return {back:legs.slice(0,2).map(leg).join('')+plane([[u,v,26],[u+w,v,26],[u+w,v+d,26],[u,v+d,26]],shade(color,17),shade(color,-22)),
  front:`<g class="desk-foreground" data-room-part="near-desk">${legs.slice(2).map(leg).join('')}${plane([[u,v+d,23],[u+w,v+d,23],[u+w,v+d,26],[u,v+d,26]],color,shade(color,-22))}${plane([[u+w,v,23],[u+w,v+d,23],[u+w,v+d,26],[u+w,v,26]],shade(color,-18),shade(color,-22))}</g>`};
}
export function chairGeometry(u,v,type=0){
 const center=[u+1.5,v+1.5],seat={u:u+.4,v:v+.4,w:2.2,d:2.2,bottom:17,top:20};
 const casters=type>=2?Array.from({length:5},(_,i)=>{const angle=-Math.PI/2+i*Math.PI*2/5;return [center[0]+Math.cos(angle)*1.85,center[1]+Math.sin(angle)*1.85];}):[];
 return {center,seat,casters};
}
function chairParts(u,v,color,type=0,facing='front'){
 const labels=['목재 의자','플라스틱 의자','사무용 의자','고급 등받이 의자'];
 const {center:[cu,cv],seat,casters}=chairGeometry(u,v,type),near=facing==='monitor';
 const backV=near?seat.v+seat.d-.35:seat.v;
 const backrest=`<g data-chair-part="near-backrest">${box(seat.u+.1,backV,2,.35,type===3?26:type===2?22:17,shade(color,9),seat.top)}</g>`;
 let base=`<g class="chair-floor-shadow" opacity=".18">${plane([[cu-1.8,cv-1.8,0],[cu+1.8,cv-1.8,0],[cu+1.8,cv+1.8,0],[cu-1.8,cv+1.8,0]],'#727c78')}</g>`,farArm='',nearArm='';
 if(type>=2){
  // Each wheel touches z=0 and connects to the same hub. A taller, narrower
  // seat leaves the support pole visible below the front edge in this projection.
  base+='<g class="chair-wheelbase">';
  for(const [a,b] of [...casters].sort((a,b)=>a[0]+a[1]-b[0]-b[1]))base+=`<g class="chair-spoke" data-floor="${a},${b}">`+line([cu,cv,3],[a,b,2],'#586873',2.8)+line([cu,cv,3.6],[a,b,2.6],'#9aadb1',1)+box(a-.22,b-.2,.44,.4,2,'#52606b')+'</g>';
  base+='</g>'+`<g class="chair-support-pole">${box(cu-.2,cv-.2,.4,.4,seat.bottom-3,'#84979f',3)}${box(cu-.3,cv-.3,.6,.6,3,'#586873',2)}</g>`;
  for(const [i,a] of [seat.u,seat.u+seat.w-.25].entries()){
   const arm=`<g class="chair-armrest" data-chair-part="${i?'near':'far'}-armrest">`+box(a,seat.v+.8,.25,.25,9,'#71838c',seat.top)+box(a,seat.v+.6,.3,1.3,1,color,seat.top+9)+'</g>';
   if(i)nearArm=arm;else farArm=arm;
  }
 }else for(const[a,b]of [[seat.u+.15,seat.v+.15],[seat.u+seat.w-.4,seat.v+.15],[seat.u+.15,seat.v+seat.d-.4],[seat.u+seat.w-.4,seat.v+seat.d-.4]])base+=box(a,b,.25,.25,seat.bottom,'#92958b');
 base+=box(seat.u,seat.v,seat.w,seat.d,3,color,seat.bottom);
 return {base:`<g data-chair="${type}" data-chair-facing="${facing}" aria-label="${labels[type]}">${base}${near?farArm:backrest+farArm+nearArm}</g>`,front:near?`<g class="chair-foreground" aria-hidden="true">${backrest}${nearArm}</g>`:''};
}
function chair(...args){const parts=chairParts(...args);return parts.base+parts.front;}
function restFurniture(u,v,type){if(type===0)return `<g data-rest="sofa">${sofa(u,v)}</g>`;if(type===1)return `<g data-rest="cot">${cot(u,v)}</g>`;if(type===2)return `<g data-rest="beanbag">${box(u+.4,v+.4,4,4,6,'#c3b49b')+box(u+1,v+1,3,3,6,'#d7c8af',6)+box(u+1.6,v+.3,2,2,13,'#cabbab',6)}</g>`;return `<g data-rest="camp-chair">${chair(u,v,'#a2b4a9',1)+line([u,v,0],[u+3,v+3,14],'#798e86',2)+line([u+3,v,0],[u,v+3,14],'#798e86',2)}</g>`;}
export const PLANT_SPECIES=Object.freeze(['몬스테라','고무나무','스킨답서스','산세베리아']);
function pixelLeaf(x,y,size,color,flip=false,split=false){
 const cut=split?'M3 3h3v2H3zM7 7h3v2H7z':'';
 return `<g transform="translate(${Math.round(x)} ${Math.round(y)}) scale(${flip?-size:size} ${size})"><path d="M0 0h4v1h3v2h2v2h2v4H9v2H5V9H3V7H1V4H0z${cut}" fill="${shade(color,-17)}" fill-rule="evenodd"/><path d="M2 1h3v1h2v2h1v2H6V5H4V3H2z" fill="${shade(color,20)}"/><path d="M1 1l7 7" stroke="${color}" stroke-width=".7"/></g>`;
}
function plant(u,v,type=0,{z=0,small=false}={}){
 const w=small?.85:2,potH=small?5:10,cu=u+w/2,cv=v+w/2,base=z+potH;
 const colors=['#b6977e','#a2aaa0','#c6b391','#a7b7ba'];
 let art=z===0?plane([[u-.15,v-.15,0],[u+w+.25,v-.15,0],[u+w+.25,v+w+.25,0],[u-.15,v+w+.25,0]],'#adb5a5'):'';
 art+=box(u,v,w,w,potH,colors[type],z)+box(u+.08,v+.08,w-.16,w-.16,1.5,shade(colors[type],11),base-.5)+plane([[u+.15,v+.15,base+1],[u+w-.15,v+.15,base+1],[u+w-.15,v+w-.15,base+1],[u+.15,v+w-.15,base+1]],'#626e53');
 const scale=small?.48:1;
 if(type===3){
  for(const [i,offset] of [-.45,0,.5].entries()){
   const [x,y]=projectRoom(cu+offset*scale,cv,base),h=(small?14:25)+i*3;
   art+=`<path d="M${Math.round(x)-2} ${Math.round(y)}v-${h-5}h1v-5h2v5h1v${h-5}z" fill="${['#557460','#6e8c61','#4d735a'][i]}"/><path d="M${Math.round(x)} ${Math.round(y)-1}v-${h-7}" stroke="#a4b27b" stroke-width="1"/>`;
  }
 }else{
  const h=(type===1?32:type===0?27:20)*scale;
  art+=line([cu,cv,base],[cu,cv,base+h],'#698368',small?1:1.5);
  const leaves=type===1?[[0,-.8,h],[-.65,.3,h*.82],[.8,.25,h*.65],[-.5,.7,h*.42]]:type===0?[[0,-.9,h],[-.8,.1,h*.7],[.75,.1,h*.65],[-.3,.9,h*.4]]:[[0,-.6,h],[-.65,.1,h*.75],[.65,.1,h*.6],[-.15,.8,h*.4]];
  for(const [a,b,level] of leaves){
   const end=[cu+a*scale,cv+b*scale,base+level];art+=line([cu,cv,base+level*.65],end,'#6d876a',small?.8:1.2);
   const [x,y]=projectRoom(...end);art+=pixelLeaf(x,y,(type===0?1.1:type===1?.9:.8)*scale,['#6f946c','#6e8b67','#80986b'][type],a<0,type===0);
  }
  if(type===2){
   const [x,y]=projectRoom(cu,cv+w/2,base);art+=`<path d="M${x} ${y}v8h-3v6h2v5" fill="none" stroke="#718764" stroke-width="1"/>`;
   art+=pixelLeaf(x-3,y+7,.5*scale,'#8da373',true)+pixelLeaf(x-1,y+14,.45*scale,'#769464');
  }
 }
 return `<g data-plant-species="${type}" aria-label="${PLANT_SPECIES[type]} 화분">${art}</g>`;
}
function bookshelf(u,v,wet,stock){let art=box(u,v,5.5,2,60,'#c6b296');for(const z of [6,23,40]){art+=front(u+.4,v+2.02,z,4.7,14,'#ebe1d0');art+=front(u+.3,v+2.1,z-1,4.9,2,'#b69c80');}
 for(let i=0;i<6;i++)art+=front(u+.55+i*.7,v+2.12,7,.5,10,['#95a5b6','#bca18a','#b5baa3','#b4a6bd','#9badb1','#c7b98f'][i]);
 const bottles=wet?({sparse:1,balanced:4,rich:8})[stock]:0;
 for(let i=0;i<bottles;i++){const a=u+.6+(i%4)*1.1,z=i<4?41:24;art+=box(a,v+1.3,.65,.55,7,['#a7c5c9','#c8b2c2','#b6c9a6'][i%3],z)+box(a+.1,v+1.4,.4,.35,2,'#879a99',z+7);}
 if(!wet)for(let i=0;i<3;i++)art+=front(u+.55+i*1.3,v+2.12,25,1,10,['#cab897','#b7adb9','#aebfa8'][i]);return art;}
function fridge(u,v){return box(u,v,3.5,3,45,'#d3d9d5')+front(u+.25,v+3.03,2,3,24,'#e7eae3')+front(u+.25,v+3.03,28,3,15,'#e7eae3')+front(u+.55,v+3.1,18,.25,5,'#96a4a1')+front(u+.55,v+3.1,33,.25,5,'#96a4a1')+front(u+2,v+3.1,36,.6,2,'#c6b6a0');}
function server(u,v){let art=box(u,v,3,2.6,48,'#7d8994');for(let i=0;i<4;i++){art+=front(u+.25,v+2.63,4+i*10,2.5,7,'#9ca9b3')+front(u+.5,v+2.65,6+i*10,.25,1.2,'#c6d8a7');for(let j=0;j<3;j++)art+=front(u+1+j*.35,v+2.65,7+i*10,.15,2,'#637582');}return art;}
function sofa(u,v){return box(u,v,4,8,9,'#a5b1bf')+box(u+.3,v+.7,3.4,6.6,8,'#c0cbd1',9)+box(u,v,1,8,27,'#b3c0c9')+box(u+3,v,.9,8,20,'#9caebb')+box(u,v,4,.8,20,'#afbcc7')+box(u,v+7.2,4,.8,20,'#afbcc7')+box(u+1.3,v+1.3,1.5,1.7,6,'#e0c9b4',16);}
function cot(u,v){let art=box(u,v,.5,.5,12,'#829594')+box(u+6.5,v+2.4,.5,.5,12,'#829594')+box(u,v,7,3,3,'#a9b7b3',12)+box(u+.2,v+.2,6.6,2.6,4,'#dbe1d8',15)+box(u+.4,v+.4,1.4,2.2,3,'#f7f0df',19)+box(u+2.4,v+.3,4,2.4,2,'#b8c9bf',19);return art;}
function printer(u,v,z=0){return box(u,v,2.6,2,8,'#bac5c6',z)+box(u+.3,v+.1,2,1.4,2,'#dee2db',z+8)+front(u+.4,v+2.04,z+2,1.9,1.3,'#71868d')+box(u+.5,v-.1,1.8,.8,1,'#f8f4e8',z+10);}
function kettle(u,v,z=0){return box(u,v,1.2,1.2,1,'#8a9b9c',z)+box(u+.2,v+.2,.8,.8,8,'#e9e3d3',z+1)+box(u+.3,v+.3,.6,.6,1,'#96a4a3',z+9)+line([u+1,v+.5,z+3],[u+1.6,v+.5,z+4],'#829996',2)+line([u+1.6,v+.5,z+4],[u+1.6,v+.5,z+8],'#829996',2);}
function plush(u,v,z){const [x,y]=projectRoom(u,v,z);return `<g fill="#c6a281"><path d="M${x-7} ${y-16}h3v-3h4v2h5v-2h4v3h3v10h-3v7h-13v-7h-3z"/><path d="M${x-6} ${y-6}h12v5h-12z" fill="#e7d5b7"/><path d="M${x-4} ${y-12}h1v2h-1zm8 0h1v2h-1z" fill="#696060"/><path d="M${x-1} ${y-8}h3v1h-3z" fill="#a57c69"/></g>`;}
function monitor(u,v,z,active=false){return box(u+1.5,v,.4,.6,7,'#7e909c',z)+box(u+.7,v-.2,2.2,1,1,'#9daeb1',z)+front(u,v+.3,z+7,4.7,21,'#788f9c')+front(u+.35,v+.32,z+8.5,4,17.7,'#d9e6de')+line([u+.7,v+.35,z+22],[u+3.7,v+.35,z+22],'#9cb9ac',1.4)+line([u+.7,v+.35,z+17],[u+3.3,v+.35,z+17],'#9cb9ac',1.4)+line([u+.7,v+.35,z+12],[u+2.4,v+.35,z+12],'#9cb9ac',1.4)+(active?monitorMotion(projectRoom,u,v,z):'');}
function microscope(u,v,z){return box(u,v,2.3,2,2,'#d9dfd5',z)+box(u+1.5,v+.2,.55,.8,17,'#9eafb5',z+2)+box(u+.7,v+.2,1.8,.7,3,'#8e9fa8',z+19)+box(u+.6,v+.3,.4,.4,6,'#8395a0',z+13)+box(u+.4,v+.3,1.4,1.2,1,'#bdcbd0',z+7);}
function actor(state,result,index,u,v,idle,lift=0,facing='front'){
 const [x,y]=projectRoom(u,v,lift),w=62.4,h=96.72,activity=String(result.actual),wet=state.professorProfile.labMode==='wet';
 const executing=!idle&&result.performed!==false&&!['idle','training','unfinished'].includes(activity),relaxing=!idle&&['rest','coffee'].includes(activity);
 const pose=isLecturing(result,idle)?'lecturing':relaxing||!idle&&['study','coursework','analysis','language','paper'].includes(activity)||!idle&&activity==='experiment'&&!wet?'seated':!idle&&['experiment','research'].includes(activity)&&wet?'experiment':'standing';
 const expression=studentEmotion(state,result,{idle}),appearance={...weeklyAppearance({...state,visualMonth:idle?state.month:Math.max(0,state.month-1)},index),...(pose==='experiment'?{outfit:0}:{})};
 const portraitTop=y-h+(pose==='seated'?7:2),headCenter=portraitTop+(pose==='seated'?152:120)*h/496;
 const portrait=renderPortrait(appearance,'학생 도트 초상화',expression,pose,facing).replace('class="portrait"',`class="portrait room-portrait" x="${x-w/2}" y="${portraitTop}" width="${w}" height="${h}" style="width:${w}px;height:${h}px"`);
 const props=executing||relaxing?`<g transform="translate(${x} ${y}) scale(.8)">${activityProps(activity,{wet,index,kind:equipmentProfile(state),facing})}</g>`:'';
 return (pose==='seated'?'':plane([[u-1.3,v-.4,0],[u-.4,v-1.3,0],[u+1.3,v+.4,0],[u+.4,v+1.3,0]],'#b9b4a4'))+`<g class="mini-student pose-${pose} expression-${expression} ${idle?'mini-idle':'mini-working'} action-${activity.replace(/[^a-z_-]/g,'')}" data-floor="${u},${v}"><g class="room-reaction" transform="translate(${x} ${headCenter}) scale(.7)">${reactionEffects(expression,index)}</g>${portrait}${props}</g>`;
}
export function miniRoomArt(state,kind,result,index,{idle=false,stock='balanced',student=true}={}){
 const d=roomDecorations(state),wall=WALLPAPERS[d.wallpaper],[tile,tileAlt,grout]=FLOOR_TILES[d.floor],wet=state.professorProfile.labMode==='wet';
 let art=plane([[0,0,0],[28,0,0],[28,28,0],[0,28,0]],tile);
 for(let u=0;u<28;u+=4)for(let v=0;v<28;v+=4)art+=plane([[u,v,0],[u+4,v,0],[u+4,v+4,0],[u,v+4,0]],(u/4+v/4)%2?tileAlt:tile,grout);
 art+=plane([[0,0,0],[0,28,0],[0,28,90],[0,0,90]],shade(wall,-11),'#cbc5b8')+plane([[0,0,0],[28,0,0],[28,0,90],[0,0,90]],wall,'#cbc5b8');
 art+=left(.08,0,0,28,4,'#c5baa7')+front(0,.08,0,28,4,'#d0c5b1');
 // Window, writing board and pinned papers sit on their respective wall planes.
 art+=left(.15,8,33,11,47,'#d0c5af')+seasonalWindow(state,projectRoom,{idle})+left(.24,13.2,36,.45,40,'#f4f0e4')+left(.24,8.6,54,9.8,.8,'#f4f0e4');
 art+=`<g class="window-plant-shelf" aria-label="창가 화분 선반">${box(.3,8.2,1.2,10.6,1.5,'#c7b49a',34)}`;
 for(let i=0;i<d.windowPlants;i++)art+=plant(.45,9.4+i*3.4,(d.plantType+i+1)%4,{z:35.5,small:true});
 art+='</g>';
 const lecturing=isLecturing(result,idle),boardColors=['#526762','#faf8ee','#d7e5e0','#293e50'],boardInk=['#e4e6d6','#738781','#78948e','#afd5db'];art+=`<g data-board="${d.boardType}" aria-label="${['블랙보드','화이트보드','유리 벽면','전자칠판'][d.boardType]}">`+front(16,.15,33,9,39,d.boardType===2?'#b9cbc6':'#c6b194')+front(16.5,.2,36,8,33,boardColors[d.boardType]);for(let i=0;i<(lecturing?2:4);i++)art+=line([17.2,.24,63-i*6],[23-(i%2)*2,.24,63-i*6],boardInk[d.boardType],1.3);if(lecturing)art+=lectureDiagram(d.boardType,boardInk[d.boardType]);art+='</g>';
 // The game emblem doubles as the lab's wall sign.
 art+='<g class="lab-logo-plaque" aria-label="연구실 로고">'+left(.2,2,55,4,20,'#f6f1e6');for(const [a,b]of [[[.28,2.8,61],[.28,5,70]],[[.28,5,70],[.28,5.4,60]],[[.28,2.8,61],[.28,5.4,60]]])art+=line(a,b,'#9ab7c8',1.5);for(const [v,z,color]of [[2.8,61,'#19384b'],[5,70,'#00a3d2']]){const[x,y]=projectRoom(.3,v,z);art+=`<circle cx="${x}" cy="${y}" r="3.5" fill="${color}"/>`;}art+='</g>';
 for(let i=0;i<Math.min(3,state.career.awards);i++){const u=6+i*2.1;art+=`<g class="award-certificate" aria-label="우수연구·발표상 상장">`+front(u,.2,66,1.8,14,'#b7a47a')+front(u+.15,.24,67,1.5,12,'#faf5e5')+line([u+.4,.28,76],[u+1.4,.28,76],'#8e9287',.8)+line([u+.4,.28,73],[u+1.3,.28,73],'#b5b3a3',.6);const[x,y]=projectRoom(u+.9,.3,70);art+=`<circle cx="${x}" cy="${y}" r="1.5" fill="#c8ae67"/></g>`;}
 if(d.clock){art+=front(12,.2,63,2.8,16,'#b7b7a7')+front(12.3,.22,65,2.2,12,'#f9f4e7')+line([13.3,.24,71],[13.3,.24,76],'#82918d',1.4)+line([13.3,.24,71],[14,.24,70],'#82918d',1.4);}
 if(d.noticeboard){art+=left(.2,21,39,4.5,24,'#cdb597')+left(.25,21.4,42,1.5,15,'#f7efda')+left(.25,23.4,46,1.3,13,'#e6d6c8');}
 const objects=[],add=(u,v,w,depth,art)=>objects.push({depth:u+v+w+depth,art});
 add(4,1,5.5,2,bookshelf(4,1,wet,stock)+(d.plush?plush(5.5,2.3,60):'')+(d.shelfPlant?`<g class="bookshelf-plant">${plant(8,1.5,(d.plantType+2)%4,{z:60,small:true})}</g>`:''));
 if(d.server)add(10,1,3,2.6,server(10,1));
 if(d.fridge)add(1,5,3.5,3,fridge(1,5));
 let tea=desk(1.5,21,3.8,3);if(d.kettle)tea+=kettle(2.2,22,26);tea+=box(3.5,22.5,.6,.6,4,'#c9ad92',26);add(1.5,21,3.8,3,tea);
 const resting=!idle&&(kind==='rest'||result.actual==='coffee')&&result.outcome!=='training';
 // Keep each seat and its occupant together. Sorting by the chair's far
 // corner alone used to paint the backrest over the student's face.
 const restSeats=[[24.3,8.5,5],[26,6.5,7],[24.1,7.5,1],[23.5,6.5,2]];
 const seat=restSeats[d.restType],restActor=resting&&student?actor(state,result,index,seat[0],seat[1],false,seat[2]):'';
 add(22,5,4,8,`<g class="rest-seat-layer" data-seat-type="${d.restType}">${restFurniture(22,5,d.restType)}${restActor}</g>`);
 if(d.cot&&d.restType!==1)add(19,24,7,3,cot(19,24));
 if(d.printer)add(15,1,3.5,3,desk(15,1,3.5,3)+printer(15.5,1.7,26));
 const working=!idle&&['study','coursework','analysis','language','experiment','paper'].includes(result.actual),deskWorking=working&&!(result.actual==='experiment'&&wet)&&result.outcome!=='training';
 const equipment=roomEquipment(state,{box,front,line,desk,microscope,monitor,project:projectRoom},!idle&&result.performed===true&&['analysis','experiment','industry','startup','video','paper'].includes(result.actual));
 add(3.5,10,6.2,3.5,equipment.bench);
 const deskLayers=workstationDesk(9,16,10,6,wet?'#bac9c5':'#c5ab8e');
 let work=deskLayers.back;work+=(wet&&deskWorking?`<g class="desk-monitor" data-floor="14.2,18.3">${monitor(14.2,18.3,26,result.performed===true&&result.actual==='analysis')}</g>`:equipment.primary)+equipment.accessories;
 // Notebook, pencil, keyboard, task lamp and cups share the desk's top plane.
 work+=box(10.1,19.8,1.6,1.7,.6,'#f2ecdd',26)+line([10.6,19.8,27],[11.1,21.2,27],'#82949b',1.2)+`<g class="desk-keyboard" data-floor="13.5,21.3">`+box(13.5,21.3,2.4,.55,.5,'#d4ddda',26)+line([13.7,21.45,26.7],[15.6,21.45,26.7],'#9db0b1',.7)+'</g>';
 work+=box(17.6,16.8,1,1,1,'#abb9b1',26)+box(17.9,17,.25,.25,15,'#91a39e',27)+box(17.2,16.7,1.4,1.3,2,'#b7c4b3',42);
 if(wet){const count=({sparse:1,balanced:3,rich:5})[stock];for(let i=0;i<count;i++)work+=box(14+i*.5,17.5,.25,.4,5,'#b5cecb',26)+box(14+i*.5,17.5,.25,.4,1,'#899ca3',31);if(stock==='rich')work+=box(17,18.2,1.3,1.2,7,'#c8d2cc',26);}
 add(9,16,10,6,work+deskLayers.front);
 add(...ROOM_ANCHORS.plant,2,2,`<g class="room-plant" data-floor="${ROOM_ANCHORS.plant.join(',')}">${plant(...ROOM_ANCHORS.plant,d.plantType)}</g>`);
 if(d.bag)add(6,23,2.2,1.7,box(6,23,2.2,1.7,9,'#b49a8c')+line([6.4,23.2,10],[7.7,23.2,10],'#85786d',2));
 const deskSeat=chairParts(12,22,['#b5b9b0','#a1b7bf','#879ba8','#777f99'][d.chairType],d.chairType,'monitor');
 // The occupant sits between the seat and the near backrest/armrests. Painting
 // the whole chair first made the taller student's body pass through the chair.
 // The desk is already complete behind the occupant. Its near geometry only
 // occludes the lower body: an unclipped replay would stripe the upper torso.
 const hipY=projectRoom(...ROOM_ANCHORS.deskSeat,20)[1],lowerDesk=deskWorking?`<svg class="desk-lower-occlusion" x="0" y="${hipY}" width="600" height="${360-hipY}" viewBox="0 ${hipY} 600 ${360-hipY}" overflow="hidden" aria-hidden="true">${deskLayers.front}</svg>`:'';
 objects.push({depth:44,art:`<g class="desk-seat-layer" data-layer-order="chair-rear student chair-front desk-front">${deskSeat.base}${student&&deskWorking?actor(state,result,index,...ROOM_ANCHORS.deskSeat,false,0,'monitor'):''}${deskSeat.front}${lowerDesk}</g>`});
 const pos=lecturing?[24,3]:result.actual==='presentation'&&!idle?[24,4]:working?[17,15]:ROOM_ANCHORS.standing;if(student&&result.outcome!=='training'&&!resting&&!deskWorking)add(...pos,1,1,actor(state,result,index,...pos,idle));
 objects.sort((a,b)=>a.depth-b.depth);art+=objects.map(o=>o.art).join('');
 // Front rim has the same two floor axes as the tiles, never an unrelated angle.
 art+=plane([[0,28,0],[28,28,0],[28,28,-3],[0,28,-3]],shade(tile,-18))+plane([[28,0,0],[28,28,0],[28,28,-3],[28,0,-3]],shade(tile,-28));
 return `<svg class="pixel-room-art mini-room-art" viewBox="0 0 600 360" role="img" aria-label="도트로 표현한 작은 ${wet?'Wet':'Dry'} lab 연구실" preserveAspectRatio="xMidYMid meet" data-wallpaper="${d.wallpaper}" data-floor-tile="${d.floor}" data-equipment-profile="${equipment.kind}" data-field-kit="${equipment.specialty}" data-season="${labSeason(state,{idle})}"><g shape-rendering="crispEdges">${art}</g></svg>`;
}

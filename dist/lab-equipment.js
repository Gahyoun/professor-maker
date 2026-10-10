import {getDiscipline} from './disciplines.js';
// The same room-plane helpers draw every instrument, counter and supporting leg.
export function equipmentProfile(state){
 const label=getDiscipline(state.professorProfile.fieldId).label;
 if(state.professorProfile.labMode==='dry')return /건축|토목|주거|조경|도시/.test(label)?'design':'computing';
 if(/생물|생명|바이오|작물|식품|의학|약학|수의|동물|원예|농학/.test(label))return 'biology';
 if(/화학|재료|소재|고분자|섬유|의류|피부/.test(label))return 'analytical';
 return 'measurement';
}
export function roomEquipment(state,{box,front,line,desk,microscope,monitor,project},active=false){
 const kind=equipmentProfile(state),variant=(Math.imul((state.creationSeed??state.seed)^8179,2654435761)>>>0)%3;
 const mark=(type,name,art)=>`<g data-equipment="${type}" aria-label="${name}">${art}</g>`;
 const balance=(u,v,z)=>mark('balance','정밀 저울',box(u,v,2.7,2,3,'#d5dcd8',z)+box(u+.2,v+.2,2.3,1.6,1,'#aebcc0',z+3)+box(u+.4,v+.4,1.8,1.2,1,'#dce5df',z+4)+box(u+.15,v,.2,2,9,'#9dacae',z+4)+box(u+2.35,v,.2,2,9,'#9dacae',z+4)+box(u+.15,v,2.4,.15,1,'#c6d9d7',z+12)+front(u+.4,v+2.04,z+.7,1.2,1.2,'#77998c'));
 const scope=(u,v,z)=>{
  let art=box(u,v,4,2.2,12,'#cad5d5',z)+front(u+.3,v+2.23,z+2,2.5,8,'#455d6b')+front(u+.45,v+2.25,z+2.6,2.2,6.7,'#c2d8cf');
  art+=line([u+.6,v+2.27,z+5],[u+1,v+2.27,z+7],'#608793',.9)+line([u+1,v+2.27,z+7],[u+1.5,v+2.27,z+4],'#608793',.9)+line([u+1.5,v+2.27,z+4],[u+2.4,v+2.27,z+7],'#608793',.9);
  for(let i=0;i<3;i++)art+=front(u+3,v+2.25,z+3+i*2,.45,.7,'#7e9298');
  return mark('oscilloscope','오실로스코프 · 측정 신호',art+line([u+3.3,v+2.3,z+2],[u+4.1,v+3.1,z],'#7c929a',1));
 };
 const tubes=(u,v,z)=>{
  let art=box(u,v,2.7,1.6,1.5,'#a8c3bd',z);
  for(let i=0;i<5;i++)art+=box(u+.25+i*.45,v+.5,.2,.4,5,'#d8e9e3',z+1.5)+box(u+.25+i*.45,v+.5,.2,.4,1,'#8fafb2',z+6.5);
  return mark('tube-rack','시험관 랙',art);
 };
 const centrifuge=(u,v,z)=>mark('centrifuge','탁상 원심분리기',box(u,v,3.4,2.4,7,'#d4dfd9',z)+box(u+.3,v+.25,2.8,1.8,1.5,'#a7b9b6',z+7)+box(u+.75,v+.5,1.9,1.2,1,'#e6eee6',z+8.5)+front(u+.4,v+2.43,z+2,1.6,1.6,'#829f9c')+front(u+2.4,v+2.44,z+2.5,.4,.5,'#bdad7e'));
 const spectrometer=(u,v,z)=>mark('spectrometer','분광 분석 장비',box(u,v,4.2,2.4,12,'#b9cbcf',z)+box(u+.2,v+.2,2.1,2,1,'#dae3df',z+12)+box(u+2.6,v+.4,1.2,1.2,1,'#889eac',z+12)+front(u+.3,v+2.44,z+4,2.7,4,'#637e89')+front(u+.5,v+2.46,z+4.8,2.2,2.6,'#bcd2c8')+front(u+3.4,v+2.46,z+3.8,.4,.8,'#b1a279'));
 const counter=(color='#becac6')=>{
  let art=desk(3.5,10,6.2,3.5,color);
  art+=box(3.8,10.3,5.6,2.8,1,'#dbe2da',26);
  art+=box(3.8,10.3,2.6,2.8,18,'#c1ccc5',5);
  for(const z of [10,17])art+=front(4,13.12,z,2.2,.5,'#9baaa6')+front(4.8,13.15,z+2,.7,.6,'#7d9295');
  return mark('lab-counter','수납형 랩 테이블',art);
 };
 let primary='',bench='',accessories='';
 if(kind==='biology'){
  primary=mark('microscope','광학 현미경',microscope(11,17,26));
  bench=counter()+centrifuge(4.3,10.7,27)+tubes(8,11.3,27);
  accessories=tubes(14.1,18,26.5);
 }else if(kind==='analytical'){
  primary=balance(11,17,26);bench=counter()+spectrometer(4.1,10.6,27);
  accessories=mark('hotplate','가열 교반기',box(14,17.7,2,1.8,3,'#b1c2c4',26)+box(14.1,17.8,1.8,1.6,.8,'#dbe3da',29)+box(14.7,18.2,.6,.6,6,'#cbded9',30));
 }else if(kind==='measurement'){
  primary=scope(10.7,17,26);
  bench=counter('#b3c1c3')+mark('optical-bench','계측용 정반과 센서 지지대',box(4,10.6,5.2,2.4,2,'#778d98',27)+box(4.4,11.3,.4,.5,10,'#9eafb0',29)+box(6,11.3,.4,.5,14,'#9eafb0',29)+box(8.2,11.3,.4,.5,8,'#9eafb0',29)+box(5.6,11,1.2,.8,2,'#d0dcd4',43));
  accessories=mark('sensor','측정 프로브와 연결 케이블',box(16,18.8,1,1,3,'#9fb9bb',26)+line([16.5,19.3,29],[17.5,20.5,27],'#7a8d95',1));
 }else if(kind==='design'){
  primary=`<g class="desk-monitor" data-floor="14.2,18.3">${monitor(14.2,18.3,26,active)}</g>`;
  bench=desk(3.5,10,6.2,3.5)+mark('scale-model','설계 도면과 축척 모형',box(4,10.6,5.1,2.4,.5,'#ebeadf',26)+box(4.5,11.1,1.7,1.1,9,'#d6d6c5',26.5)+box(6.5,11.5,1.4,.8,6,'#b4c5bb',26.5)+line([4.2,10.8,27],[8.5,10.8,27],'#91aab0',.8));
 }else{
  primary=`<g class="desk-monitor" data-floor="14.2,18.3">${monitor(14.2,18.3,26,active)}</g>`;
  bench=desk(3.5,10,6.2,3.5)+mark('workstation','보조 워크스테이션과 자료집',monitor(4.4,10.7,26,false)+box(4.8,13,2.6,.5,.5,'#b9c9c7',26)+box(8,11.5,.7,1.4,3,'#b3afbe',26));
 }
 if(variant===1)bench+=mark('measurement-log','계측 기록 바인더',box(8.3,12.3,.9,1.1,1.5,'#c2af97',27));
 if(variant===2)bench+=mark('instrument-case','기구 보관 케이스',box(8,12,1.4,1.2,3,'#9aaab1',27));
 return {kind,primary,bench,accessories};
}

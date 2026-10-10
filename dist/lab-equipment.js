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
 const fieldId=getDiscipline(state.professorProfile.fieldId).id,wet=state.professorProfile.labMode==='wet';
 const specialty=['057','077'].includes(fieldId)?'environment':['072','073'].includes(fieldId)?'architecture':fieldId==='075'?'civil':'general';
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
 const soilCores=(u,v,z)=>{
  let art=box(u,v,1.6,1.1,1,'#afc0b7',z);
  for(let i=0;i<3;i++){
   const a=u+.15+i*.45;
   art+=box(a,v+.3,.3,.4,10,'#c8dcd5',z+1);
   for(const [level,color] of [[1.5,'#8d7560'],[4,'#b39a76'],[6.5,'#c8b98f']])art+=front(a+.03,v+.72,z+level,.24,2.1,color);
   art+=box(a,v+.3,.3,.4,.7,'#809996',z+11);
  }
  return mark('soil-core-rack','층위가 보이는 토양 코어 시료',art);
 };
 const soilAnalyzer=(u,v,z)=>mark('soil-analyzer','토양·수질 시료 분석기',
  box(u,v,3.5,2.1,12,'#b6c6c9',z)+box(u+.15,v+.15,1.5,1.7,.8,'#dce3df',z+12)+
  box(u+2.1,v+.5,.85,.85,1,'#758e92',z+12)+box(u+2.24,v+.64,.55,.55,4,'#c9d8cf',z+13)+
  front(u+.3,v+2.14,z+4,1.8,4,'#587983')+front(u+.45,v+2.16,z+4.8,1.5,2.5,'#c3d8cb')+
  line([u+.65,v+2.18,z+5.5],[u+1.7,v+2.18,z+6.6],'#789b8c',.8)+front(u+2.6,v+2.16,z+3,.45,.7,'#b5a47c'));
 const probe=(u,v,z)=>mark('water-probe','수질 측정기와 전극',box(u,v,2.3,1.6,8,'#b1c5c3',z)+
  front(u+.3,v+1.63,z+3,1.2,3,'#d1e3d7')+front(u+1.7,v+1.64,z+2,.25,.7,'#7c9797')+
  box(u+3,v+.5,.7,.7,6,'#d3e3dc',z)+box(u+3.1,v+.6,.5,.5,1.4,'#90b6b5',z+1)+
  line([u+3.3,v+.85,z+2],[u+3.3,v+.85,z+9],'#738d93',1.2)+line([u+1.9,v+1.66,z+6],[u+3.3,v+.85,z+9],'#8da3a3',1));
 const concrete=(u,v,z)=>mark('concrete-specimens','양생한 콘크리트 시험체',
  box(u,v,2.6,1.4,.7,'#d1d7ce',z)+box(u+.2,v+.2,.8,.8,5,'#a9ada6',z+.7)+box(u+1.4,v+.25,.8,.8,5,'#b3b7af',z+.7)+
  front(u+.35,v+1.03,z+2,.15,.7,'#939c96')+front(u+1.65,v+1.08,z+3,.15,.5,'#9aa49d'));
 const compression=(u,v,z)=>mark('compression-frame','하중 재하 프레임과 재료 시험체',
  box(u,v,3,2,2,'#879da2',z)+box(u+.25,v+.35,.3,.4,24,'#a1b6b8',z+2)+box(u+2.45,v+.35,.3,.4,24,'#a1b6b8',z+2)+
  box(u+.25,v+.35,2.5,.55,2,'#819ba1',z+26)+box(u+1.25,v+.4,.5,.55,10,'#a0b4b8',z+16)+
  box(u+1,v+.45,1,.8,1,'#748d94',z+15)+box(u+1.1,v+.5,.8,.8,7,'#b3b5ac',z+2)+
  box(u+.8,v+.4,1.4,1.1,1,'#7d969c',z+2));
 const controller=(u,v,z)=>mark('strain-controller','하중·변형률 계측기',box(u,v,3.1,1.8,9,'#b7c9ca',z)+
  front(u+.3,v+1.83,z+3,1.9,4,'#5d7985')+line([u+.5,v+1.85,z+3.8],[u+1.6,v+1.85,z+6.2],'#a9cabd',.9)+
  front(u+2.6,v+1.85,z+2.5,.25,.8,'#c5b781')+line([u+2.8,v+1.9,z+1],[u+4,v+2.4,z],'#829ca2',1));
 const terrain=(u,v,z)=>mark('terrain-model','지형·유역 모형과 관측 지도',
  box(u,v,5.1,2.4,.7,'#e3e2d1',z)+box(u+.3,v+.3,2,1.6,1.5,'#b4c6a4',z+.7)+
  box(u+.6,v+.5,1.3,1,1.3,'#91ad8f',z+2.2)+box(u+3,v+.3,1.4,1.4,1,'#b8c8a5',z+.7)+
  line([u+2.3,v+.2,z+1.5],[u+2.8,v+1.1,z+1.5],'#89afb7',1.5)+line([u+2.8,v+1.1,z+1.5],[u+2.5,v+2.2,z+1.5],'#89afb7',1.5));
 const architectureModel=()=>mark('scale-model','건축 도면과 층별 축척 모형',
  box(4,10.6,5.1,2.4,.5,'#ecebdf',26)+box(4.5,11.1,1.7,1.1,9,'#d6d6c5',26.5)+
  box(4.4,11,1.9,1.3,.7,'#edf0e5',35.5)+box(6.5,11.5,1.4,.8,6,'#b4c5bb',26.5)+
  front(4.65,12.22,28,.25,2.5,'#a2b7b9')+front(5.2,12.22,28,.25,2.5,'#a2b7b9')+front(5.75,12.22,28,.25,2.5,'#a2b7b9')+
  line([4.2,10.8,27],[8.5,10.8,27],'#91aab0',.8)+line([8,11,27],[8,12.7,27],'#91aab0',.8));
 const bridgeModel=()=>mark('bridge-model','교량 상부구조·교각 축척 모형',
  box(4,10.6,5.1,2.4,.6,'#e5e3d5',26)+box(4.8,11.25,.5,.7,6,'#a7b3ab',26.6)+box(7.4,11.25,.5,.7,6,'#a7b3ab',26.6)+
  box(4.4,11.1,4.1,1,1,'#a5bec0',32.6)+line([4.5,12.12,33.8],[6.4,12.12,38],'#859da3',1.2)+
  line([6.4,12.12,38],[8.4,12.12,33.8],'#859da3',1.2)+line([6.4,12.12,38],[6.4,12.12,33.8],'#859da3',.9));
 let primary='',bench='',accessories='';
 if(specialty==='environment'){
  if(wet){primary=probe(10.7,17,26);bench=counter()+soilAnalyzer(4.1,10.6,27)+soilCores(8,11,27);accessories=mark('soil-sample-tray','토양 시료 트레이',box(14.1,18,2.4,1.4,1.2,'#b9c6bd',26)+box(14.25,18.15,2.1,1.1,.7,'#a28d6d',27.2));}
  else {primary=`<g class="desk-monitor" data-floor="14.2,18.3">${monitor(14.2,18.3,26,active)}</g>`;bench=desk(3.5,10,6.2,3.5)+terrain(4,10.6,26);}
 }else if(['architecture','civil'].includes(specialty)&&wet){
  primary=controller(10.7,17,26);bench=counter('#b7c3bf')+compression(4.2,10.6,27)+(specialty==='civil'?soilCores(8,11,27):concrete(7.1,11.2,27));
  accessories=specialty==='civil'?soilCores(14.1,18,26):concrete(14.1,18,26);
 }else if(kind==='biology'){
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
  bench=desk(3.5,10,6.2,3.5)+(specialty==='civil'?bridgeModel():architectureModel());
 }else{
  primary=`<g class="desk-monitor" data-floor="14.2,18.3">${monitor(14.2,18.3,26,active)}</g>`;
  bench=desk(3.5,10,6.2,3.5)+mark('workstation','보조 워크스테이션과 자료집',monitor(4.4,10.7,26,false)+box(4.8,13,2.6,.5,.5,'#b9c9c7',26)+box(8,11.5,.7,1.4,3,'#b3afbe',26));
 }
 if(specialty==='general'&&variant===1)bench+=mark('measurement-log','계측 기록 바인더',box(8.3,12.3,.9,1.1,1.5,'#c2af97',27));
 if(specialty==='general'&&variant===2)bench+=mark('instrument-case','기구 보관 케이스',box(8,12,1.4,1.2,3,'#9aaab1',27));
 return {kind,specialty,primary,bench,accessories};
}

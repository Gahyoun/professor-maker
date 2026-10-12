// Authored fictional, self-described journeys. These are not demographic data.
// This module receives a cosmetic seed only: no engine, names, race labels,
// nationality inference, immigration status, hidden traits or outcome weights.
export const STUDENT_BACKGROUND_VERSION=1;
export const STUDENT_JOURNEYS=Object.freeze([
 Object.freeze({id:'local-school',label:'Grew up and studied locally',body:'I grew up and went to school in this area. A class project made me want to explore research beyond the classroom.'}),
 Object.freeze({id:'international-study',label:'International study experience',body:'I studied in another country before joining this program. I am looking forward to exchanging research questions with people here.'}),
 Object.freeze({id:'immigrant-family',label:'Immigrant-family background',body:'My family moved to the United States, and I grew up with more than one place in our family story. I want to find a research question of my own.'}),
 Object.freeze({id:'regional-move',label:'A move for college',body:'I moved from another part of the United States for college. I am finding new places to spend time and new questions to ask.'}),
 Object.freeze({id:'transfer',label:'Community-college transfer',body:'I began at a community college before transferring here. A class project made me curious about joining a research lab.'}),
 Object.freeze({id:'time-between',label:'A different route to college',body:'I took time between school and college to try other interests. Now I would like to explore a research project alongside my classes.'})
]);
// Authored story weights, not population estimates. Local upbringing and
// schooling are an ordinary path, while the other paths can also be domestic.
export const STUDENT_JOURNEY_WEIGHTS=Object.freeze([5,1,1,1,1,1]);
export const STUDENT_INTERESTS=Object.freeze([
 'Outside class, I enjoy tending houseplants.',
 'I like sharing playlists with friends.',
 'I enjoy cooking with friends when our schedules line up.',
 'I make time for walks and noticing birds around campus.',
 'I like reading novels that friends recommend.',
 'I enjoy sketching places I visit.',
 'I like playing casual games with friends.',
 'I enjoy taking photographs on walks.',
 'I like finding a quiet corner to read.',
 'I enjoy learning a song on an instrument.'
]);
function draw(seed,namespace){
 let value=2166136261;for(const character of `${Number(seed)>>>0}:student-background-v1:${namespace}`)value=Math.imul(value^character.charCodeAt(0),16777619);
 value^=value>>>16;value=Math.imul(value,0x7feb352d);value^=value>>>15;value=Math.imul(value,0x846ca68b);value^=value>>>16;return(value>>>0)/4294967296;
}
function selectedJourney(seed){
 const total=STUDENT_JOURNEY_WEIGHTS.reduce((sum,weight)=>sum+weight,0);
 let choice=draw(seed,'journey')*total;
 for(let index=0;index<STUDENT_JOURNEYS.length;index++){
  choice-=STUDENT_JOURNEY_WEIGHTS[index];
  if(choice<0)return STUDENT_JOURNEYS[index];
 }
 return STUDENT_JOURNEYS.at(-1);
}
export function studentBackground(seed,locale='en',namingVersion=3){
 if(locale!=='en'||namingVersion!==3)return null;
 const journey=selectedJourney(seed),firstGeneration=draw(seed,'college-generation')<.25,interestIndex=Math.floor(draw(seed,'everyday-interest')*STUDENT_INTERESTS.length);
 const education=firstGeneration?'I am the first in my family to attend college, and I want to share what I learn with them.':'';
 return Object.freeze({version:STUDENT_BACKGROUND_VERSION,journeyId:journey.id,label:journey.label,firstGeneration,interestIndex,body:[journey.body,education,STUDENT_INTERESTS[interestIndex]].filter(Boolean).join(' ')});
}
export function studentBackgroundForState(state){return state.locale==='en'&&state.admission?.namingVersion===3?studentBackground(state.creationSeed??state.seed,'en',3):null;}

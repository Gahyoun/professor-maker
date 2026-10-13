import {openingMeeting} from './opening-meeting.js';
import {getChapter,getThesisScene,THESIS_STEPS} from './main-story.js';
import {getEndingStory} from './stories.js';
import {physicsEndingContext,physicsEndingRecord,physicsEndingPages} from './physics-ending-record.js';

// Read the authored story in a fixed order. These illustrative dates and scene
// labels do not run the simulation, select event options or change a saved game.
const chapters=Object.freeze([
 ['contact',0],['firstyear',12],['graduate',24],['uncertainty',36],
 ['independence',60],['lastyear',84]
]);
const thesisMonths=Object.freeze([90,92,92,93,93]);
const academicTime=(month,locale)=>{
 const year=Math.floor(month/12)+1,calendar=((locale==='en'?8:2)+month)%12;
 if(locale==='en')return `Year ${year} · ${['January','February','March','April','May','June','July','August','September','October','November','December'][calendar]}`;
 return `${year}년차 ${calendar+1}월`;
};
const scene=value=>Object.freeze({...value,paragraphs:Object.freeze(value.paragraphs)});

export function getPhysicsStoryScenes(locale='ko'){
 const language=locale==='en'?'en':'ko',name=physicsEndingRecord.name;
 const meeting=openingMeeting(name,language),ending=getEndingStory('true',physicsEndingContext);
 const result=[scene({
  id:'opening',phase:'opening',title:meeting.heading,
  time:academicTime(0,language),month:0,visual:'room',
  paragraphs:[meeting.professorLine,meeting.studentLine,meeting.body]
 })];
 for(const [id,month] of chapters){
  const chapter=getChapter(id,language);
  result.push(scene({id:`chapter-${id}`,phase:'main',title:chapter.title,
   time:academicTime(month,language),month,visual:'room',paragraphs:[chapter.body]}));
 }
 for(const [index,id] of THESIS_STEPS.entries()){
  const thesis=getThesisScene(id,language),month=thesisMonths[index];
  result.push(scene({id:`thesis-${id}`,phase:'thesis',title:thesis.title,
   time:academicTime(month,language),month,visual:'room',paragraphs:[thesis.body]}));
 }
 for(const [index,body] of physicsEndingPages(language).entries()){
  result.push(scene({id:`ending-${index+1}`,phase:'ending',title:ending.title[language],
   time:ending.time[language],month:96,
   visual:index===2||index===3?'letter':index===0||index>=6?'conference':'memory',
   paragraphs:body.split('\n\n')}));
 }
 return Object.freeze(result);
}

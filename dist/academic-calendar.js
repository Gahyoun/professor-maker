import {campusMonth,campusPolicy} from './campus-calendar.js';
// Fictional academic dates use real seven-day weeks, anchored to the first
// Monday of the edition's academic year (March in Korean, September in U.S.).
const DAY=86400000;
export function academicWeeks(state){
 const startYear=2027+Math.floor(state.month/12),startMonth=campusPolicy(state).startMonth-1,actual=campusMonth(state.month,state)-1,year=startYear+(actual<startMonth?1:0);
 const start=new Date(Date.UTC(startYear,startMonth,1));start.setUTCDate(start.getUTCDate()+(8-start.getUTCDay())%7);
 const end=new Date(Date.UTC(startYear+1,startMonth,1)),weeks=[];
 for(let stamp=start.getTime(),number=1;stamp<end.getTime();stamp+=7*DAY,number++){
  const date=new Date(stamp);if(date.getUTCMonth()===actual&&date.getUTCFullYear()===year)weeks.push({number,start:date.toISOString().slice(0,10),end:new Date(Math.min(stamp+6*DAY,end.getTime()-DAY)).toISOString().slice(0,10)});
 }
 return weeks;
}
export function weekContext(state,index,count=academicWeeks(state).length){
 const policy=campusPolicy(state),month=campusMonth(state.month,state),conference=policy.conferenceMonths.includes(month)&&index===2;
 const midterm=policy.midtermMonths.includes(month),exam=(midterm&&index===count-1)||(policy.finalMonths.includes(month)&&index===Math.min(2,count-1));
 // Saved exam codes remain canonical across editions; the UI translates them.
 return {conference,exam,examType:midterm?'중간고사':'기말고사',important:exam&&state.month<24};
}
export function availableActivities(state,index,count){const context=weekContext(state,index,count);return {conference:state.month>=24||context.conference};}

export function examWindow(state,index,count=academicWeeks(state).length){return weekContext(state,index,count).exam||index+1<count&&weekContext(state,index+1,count).exam;}

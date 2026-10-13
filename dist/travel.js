import {campusMonth,campusPolicy} from './campus-calendar.js';
export const initialTravel=()=>({status:'none',submittedAt:null,decidedAt:null,conferenceMonth:null,projectId:null});
export function validTravel(t,month){
  if(t?.tier!==undefined&&!['regular','selective','flagship'].includes(t.tier))return false;
  if(!t||!['none','review','accepted','rejected','attended','expired'].includes(t.status))return false;
  const times=['submittedAt','decidedAt','conferenceMonth'];
  if(!times.every(k=>t[k]===null||Number.isInteger(t[k])&&t[k]>=0&&t[k]<=98))return false;
  if(t.status==='none')return times.every(k=>t[k]===null)&&t.projectId===null;
  if(!Number.isInteger(t.projectId)||t.projectId<1||t.projectId>1000||t.submittedAt===null||t.submittedAt>month||t.conferenceMonth!==t.submittedAt+2)return false;
  return t.status==='review'?t.decidedAt===null:t.decidedAt===t.submittedAt+1&&t.decidedAt<=month;
}
export function abstractAcceptance(s,prepared,threshold){const readiness=Math.max(0,Math.min(1,prepared/threshold)),performance=s.hidden.research/999,luck=(s.hidden.luck+100)/200;return Math.max(.12,Math.min(.95,.18+.5*readiness+.18*performance+.12*luck));}
export const canTravel=s=>s.travel?.status==='accepted'&&s.travel.conferenceMonth===s.month+1;

export const ATTENDANCE_LABELS={none:'안 가기',professor:'교수 혼자 가기',together:'학생과 가기',student:'학생만 가기'};
export const studentAttends=mode=>['together','student'].includes(mode);
export const professorAbroad=s=>s.sabbatical?.active===true&&s.sabbatical.mode==='away'&&s.month<s.sabbatical.until;
export const domesticAttendanceChoices=s=>professorAbroad(s)?['none','student']:['none','professor','together','student'];
export const normalizedDomesticAttendance=(s,mode)=>professorAbroad(s)?({professor:'none',together:'student'})[mode]??mode:mode;
export const attendanceCost=(mode,abroad=false)=>({none:0,professor:1,together:2,student:1}[mode]??0)*(abroad?40:2);
export function conferenceCosts(s,plan=s.plan,attendance=s.attendance??{domestic:'together',overseas:'none'},action=s.facultyAction){
 const month=campusMonth(s.month,s),festival=campusPolicy(s).conferenceMonths.includes(month);
 const overseas=({abroad_student:'student',abroad_together:'together',abroad_shared:'together'})[action]??attendance.overseas;
 const domesticPlan=studentAttends(overseas)?plan.slice(0,-1):plan,count=Math.max(festival?1:0,domesticPlan.filter(a=>a==='conference').length);
 return {domestic:count*attendanceCost(normalizedDomesticAttendance(s,attendance.domestic)),overseas:attendanceCost(overseas,true)};
}

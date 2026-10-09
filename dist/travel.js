export const initialTravel=()=>({status:'none',submittedAt:null,decidedAt:null,conferenceMonth:null,projectId:null});
export function validTravel(t,month){
  if(!t||!['none','review','accepted','rejected','attended','expired'].includes(t.status))return false;
  const times=['submittedAt','decidedAt','conferenceMonth'];
  if(!times.every(k=>t[k]===null||Number.isInteger(t[k])&&t[k]>=0&&t[k]<=98))return false;
  if(t.status==='none')return times.every(k=>t[k]===null)&&t.projectId===null;
  if(!Number.isInteger(t.projectId)||t.projectId<1||t.projectId>1000||t.submittedAt===null||t.submittedAt>month||t.conferenceMonth!==t.submittedAt+2)return false;
  return t.status==='review'?t.decidedAt===null:t.decidedAt===t.submittedAt+1&&t.decidedAt<=month;
}
export function abstractAcceptance(s,prepared,threshold){const readiness=Math.max(0,Math.min(1,prepared/threshold)),performance=s.hidden.research/999,luck=(s.hidden.luck+100)/200;return Math.max(.12,Math.min(.95,.18+.5*readiness+.18*performance+.12*luck));}
export const canTravel=s=>s.travel?.status==='accepted'&&s.travel.conferenceMonth===s.month+1;

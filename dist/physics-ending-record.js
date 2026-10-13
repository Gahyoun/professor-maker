import {getEndingPages} from './stories.js';

// A representative fictional record for isolated readers. It never reads a save.
function deepFreeze(value){
 for(const child of Object.values(value))if(child&&typeof child==='object')deepFreeze(child);
 return Object.freeze(value);
}
export const physicsEndingContext=Object.freeze({fieldId:'050',field:'물리학',labMode:'dry'});
export const physicsEndingRecord=deepFreeze({"name":"이지현","relationship":"close","memories":[{"kind":"event","id":"counsel-independent","choice":0,"month":57},{"kind":"event","id":"press","choice":0,"month":62},{"kind":"event","id":"counsel-daily-life","choice":0,"month":63},{"kind":"event","id":"stipend-delay","choice":0,"month":67},{"kind":"event","id":"monthly-workload","choice":0,"month":68},{"kind":"event","id":"counsel-phd-career","choice":0,"month":69},{"kind":"event","id":"monthly-workload","choice":0,"month":74},{"kind":"event","id":"counsel-daily-life","choice":0,"month":75},{"kind":"event","id":"monthly-resources","choice":0,"month":79},{"kind":"event","id":"monthly-validation","choice":0,"month":80},{"kind":"event","id":"counsel-results","choice":0,"month":81},{"kind":"event","id":"poster-travel","choice":0,"month":86},{"kind":"event","id":"counsel-phd-career","choice":0,"month":87},{"kind":"event","id":"monthly-resources","choice":0,"month":91},{"kind":"event","id":"monthly-workload","choice":0,"month":92},{"kind":"event","id":"counsel-daily-life","choice":0,"month":93}],"statistics":{"student":{"learning":858.732107205446,"research":858.2659308121099,"language":744.3868875280788,"social":56.27426389915132,"stamina":246.15743932620606,"resilience":954.2675776229578,"manners":615.8375540498782,"creativity":16.62223588398375,"diligence":84.04795761466454,"rapport":96.47505967583064,"luck":21.808141171709906,"motivation":98.10000000000002,"stress":7.108659708206504,"autonomy":82.62556020236306,"teaching":65.11618369644846,"industry":0,"enterprise":0,"outreach":3,"intuition":82.44594776373019,"confidence":100},"temperament":{"curiosity":46.83041714648448,"caution":53.58796674117887,"expression":44.02903536925024},"faculty":{"research":94.78709999999984,"teaching":45.518700000000145,"admin":51.76030000000005,"mentoring":100},"professorEnergy":100},"recommendation":"strong","passageIds":["memory.counsel-results.0","voice.learning.tradeoffs.v1"],"appearance":{"hairLength":2,"hair":"#675046","skin":"#d5ad90","shirt":"#ba8659","glasses":true,"eyes":1,"face":1,"outfit":5,"fringe":11,"brows":0,"glassesShape":1,"curly":true,"labMode":"dry","hairStyle":"loose"}});
export function physicsEndingPages(locale='ko'){
 const r=physicsEndingRecord;
 return getEndingPages('true',locale,r.relationship,r.name,null,r.memories,{
  ...physicsEndingContext,statistics:r.statistics,
  recommendation:r.recommendation,passageIds:r.passageIds
 });
}
